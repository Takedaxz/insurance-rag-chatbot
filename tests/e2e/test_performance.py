"""
End-to-end performance tests
===========================
"""

import pytest
import time
import sys
import os
from unittest.mock import patch, Mock

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))


class TestPerformance:
    """Performance test cases"""

    def setup_test_index(self, rag_system):
        """Helper to create a dummy index for testing by mocking the embedding creation."""
        with patch('langchain_openai.OpenAIEmbeddings.embed_documents') as mock_embed:
            mock_embed.return_value = [[0.1] * 1536]  # Match the expected embedding dimension

            dummy_file_path = rag_system.base_storage_dir / "dummy_doc.txt"
            with open(dummy_file_path, "w", encoding="utf-8") as f:
                f.write("This is a test document about the benefits of insurance.")

            result = rag_system.ingest_file(str(dummy_file_path))
            if result["status"] != "success":
                pytest.fail(f"Failed to create dummy index for test: {result.get('error')}")

    @pytest.mark.slow
    @pytest.mark.e2e
    def test_rag_system_initialization_performance(self, rag_system):
        """Test RAG system initialization performance"""
        start_time = time.time()
        rag_system._ensure_initialized()
        init_time = time.time() - start_time
        
        assert init_time < 10.0
        print(f"✅ RAG system initialized in {init_time:.2f} seconds")

    @pytest.mark.slow
    @pytest.mark.e2e
    def test_query_performance(self, rag_system, sample_questions):
        """Test query performance with a real index."""
        self.setup_test_index(rag_system)
        
        # By patching the chain's invoke method, we avoid all LLM and Pydantic issues.
        with patch('langchain.chains.RetrievalQA.invoke') as mock_invoke:
            mock_invoke.return_value = {"result": "Mocked LLM response", "source_documents": []}
            
            total_time = 0
            query_count = len(sample_questions)
            
            for question in sample_questions:
                start_time = time.time()
                result = rag_system.query(question)
                query_time = time.time() - start_time
                total_time += query_time
                
                assert result["status"] == "success", f"Query failed for question: {question} with error: {result.get('error')}"
                assert "answer" in result
                assert query_time < 30.0
            
            avg_time = total_time / query_count
            print(f"📊 Average query time: {avg_time:.2f} seconds")
            assert avg_time < 5.0

    @pytest.mark.slow
    @pytest.mark.e2e
    def test_concurrent_queries_performance(self, rag_system, sample_questions):
        """Test performance under concurrent query load"""
        self.setup_test_index(rag_system)
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def run_query(question, results_queue):
            """Run a single query and put result in queue"""
            start_time = time.time()
            try:
                with patch('langchain.chains.RetrievalQA.invoke') as mock_invoke:
                    mock_invoke.return_value = {"result": "Mocked LLM response", "source_documents": []}
                    result = rag_system.query(question)
                query_time = time.time() - start_time
                results_queue.put({
                    'success': result['status'] == 'success',
                    'query_time': query_time,
                    'result': result
                })
            except Exception as e:
                query_time = time.time() - start_time
                results_queue.put({
                    'success': False,
                    'query_time': query_time,
                    'error': str(e)
                })
        
        threads = []
        for question in sample_questions[:3]:
            thread = threading.Thread(target=run_query, args=(question, results_queue))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join(timeout=60)
        
        results = []
        while not results_queue.empty():
            results.append(results_queue.get())
        
        successful_queries = [r for r in results if r['success']]
        assert len(successful_queries) == len(threads), "Not all concurrent queries were successful"
        
        avg_time = sum(r['query_time'] for r in successful_queries) / len(successful_queries)
        assert avg_time < 10.0

    @pytest.mark.slow
    @pytest.mark.e2e
    def test_memory_usage_performance(self, rag_system, sample_questions):
        """Test memory usage during operations"""
        self.setup_test_index(rag_system)
        import psutil
        import gc
        
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024
        
        with patch('langchain.chains.RetrievalQA.invoke') as mock_invoke:
            mock_invoke.return_value = {"result": "Mocked LLM response", "source_documents": []}
            for i, question in enumerate(sample_questions):
                result = rag_system.query(question)
                assert result["status"] == "success"
        
        final_memory = process.memory_info().rss / 1024 / 1024
        total_increase = final_memory - initial_memory
        print(f"📊 Memory increase: {total_increase:.2f} MB")
        
        gc.collect()
        assert total_increase < 200

    @pytest.mark.slow
    @pytest.mark.e2e
    def test_caching_performance(self, rag_system):
        """Test caching performance improvements"""
        self.setup_test_index(rag_system)
        test_question = "What are the benefits of insurance?"
        
        with patch('langchain.chains.RetrievalQA.invoke') as mock_invoke:
            mock_invoke.return_value = {"result": "Mocked LLM response", "source_documents": []}

            # First query (should be slower - no cache)
            start_time = time.time()
            result1 = rag_system.query(test_question)
            first_query_time = time.time() - start_time
            assert result1["status"] == "success"
            assert not result1.get("cached", False)

            # Second query (should be faster - cached)
            start_time = time.time()
            result2 = rag_system.query(test_question)
            second_query_time = time.time() - start_time
            assert result2["status"] == "success"
            assert result2.get("cached", True)
        
        print(f"📊 Cache speedup: {first_query_time/second_query_time:.1f}x")
        assert second_query_time < first_query_time
        assert first_query_time / second_query_time > 1.2

    @pytest.mark.slow
    @pytest.mark.e2e
    def test_language_detection_performance(self, sample_questions):
        """Test language detection performance"""
        from src.interfaces.web.app import detect_coaching_type, create_coaching_prompt
        
        start_time = time.time()
        for question in sample_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type in ['general', 'competitive', 'objection_handling', 'communication', 'product_knowledge', 'sales_process']
            prompt = create_coaching_prompt(question, coaching_type, '', '', {})
            assert len(prompt) > 0
        
        total_time = time.time() - start_time
        assert total_time < 1.0