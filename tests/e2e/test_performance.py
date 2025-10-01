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
    
    @pytest.mark.slow
    @pytest.mark.e2e
    def test_rag_system_initialization_performance(self, rag_system):
        """Test RAG system initialization performance"""
        start_time = time.time()
        rag_system._ensure_initialized()
        init_time = time.time() - start_time
        
        # Should initialize within reasonable time (less than 10 seconds)
        assert init_time < 10.0
        print(f"✅ RAG system initialized in {init_time:.2f} seconds")
    
    @pytest.mark.slow
    @pytest.mark.e2e
    @patch('src.core.rag_system.FAISS')
    def test_query_performance_with_mock_data(self, mock_faiss, rag_system, sample_questions):
        """Test query performance with mock data"""
        # Mock FAISS vectorstore
        mock_vectorstore = Mock()
        mock_vectorstore.index.ntotal = 100
        mock_doc = Mock()
        mock_doc.page_content = "Sample insurance content"
        mock_doc.metadata = {"filename": "test.txt"}
        mock_vectorstore.as_retriever.return_value.search.return_value = [mock_doc]
        mock_faiss.from_documents.return_value = mock_vectorstore
        
        # Mock LLM response
        with patch.object(rag_system, 'llm') as mock_llm:
            mock_llm.invoke.return_value = Mock(content="Test response")
            
            total_time = 0
            query_count = len(sample_questions)
            
            for question in sample_questions:
                start_time = time.time()
                result = rag_system.query(question)
                query_time = time.time() - start_time
                total_time += query_time
                
                assert result["status"] == "success"
                assert "answer" in result
                assert query_time < 30.0  # Each query should complete within 30 seconds
            
            avg_time = total_time / query_count
            print(f"📊 Average query time: {avg_time:.2f} seconds")
            print(f"📊 Total test time: {total_time:.2f} seconds")
            
            # Performance assertions
            assert avg_time < 5.0, f"Average query time {avg_time:.2f}s exceeds 5s threshold"
            assert total_time < 30.0, f"Total test time {total_time:.2f}s exceeds 30s threshold"
    
    @pytest.mark.slow
    @pytest.mark.e2e
    def test_concurrent_queries_performance(self, rag_system, sample_questions):
        """Test performance under concurrent query load"""
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def run_query(question, results_queue):
            """Run a single query and put result in queue"""
            start_time = time.time()
            try:
                result = rag_system.query(question)
                query_time = time.time() - start_time
                results_queue.put({
                    'success': True,
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
        
        # Run concurrent queries
        threads = []
        for question in sample_questions[:3]:  # Limit to 3 concurrent queries
            thread = threading.Thread(target=run_query, args=(question, results_queue))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join(timeout=60)  # 60 second timeout
        
        # Collect results
        results = []
        while not results_queue.empty():
            results.append(results_queue.get())
        
        # Analyze results
        successful_queries = [r for r in results if r['success']]
        failed_queries = [r for r in results if not r['success']]
        
        print(f"📊 Concurrent queries: {len(results)} total, {len(successful_queries)} successful, {len(failed_queries)} failed")
        
        if successful_queries:
            avg_time = sum(r['query_time'] for r in successful_queries) / len(successful_queries)
            max_time = max(r['query_time'] for r in successful_queries)
            print(f"📊 Average concurrent query time: {avg_time:.2f} seconds")
            print(f"📊 Max concurrent query time: {max_time:.2f} seconds")
            
            # Performance assertions
            assert avg_time < 10.0, f"Average concurrent query time {avg_time:.2f}s exceeds 10s threshold"
            assert max_time < 30.0, f"Max concurrent query time {max_time:.2f}s exceeds 30s threshold"
        
        # Should have at least some successful queries
        assert len(successful_queries) > 0, "No successful concurrent queries"
    
    @pytest.mark.slow
    @pytest.mark.e2e
    def test_memory_usage_performance(self, rag_system, sample_questions):
        """Test memory usage during operations"""
        import psutil
        import gc
        
        # Get initial memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"📊 Initial memory usage: {initial_memory:.2f} MB")
        
        # Run multiple queries
        for i, question in enumerate(sample_questions):
            result = rag_system.query(question)
            assert result["status"] == "success"
            
            # Check memory every few queries
            if i % 2 == 0:
                current_memory = process.memory_info().rss / 1024 / 1024  # MB
                memory_increase = current_memory - initial_memory
                print(f"📊 Memory after {i+1} queries: {current_memory:.2f} MB (+{memory_increase:.2f} MB)")
                
                # Memory should not increase excessively (less than 100MB increase)
                assert memory_increase < 100, f"Memory increase {memory_increase:.2f}MB exceeds 100MB threshold"
        
        # Final memory check
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_increase = final_memory - initial_memory
        print(f"📊 Final memory usage: {final_memory:.2f} MB (+{total_increase:.2f} MB)")
        
        # Force garbage collection
        gc.collect()
        gc_memory = process.memory_info().rss / 1024 / 1024  # MB
        print(f"📊 Memory after GC: {gc_memory:.2f} MB")
        
        # Final assertion
        assert total_increase < 150, f"Total memory increase {total_increase:.2f}MB exceeds 150MB threshold"
    
    @pytest.mark.slow
    @pytest.mark.e2e
    def test_caching_performance(self, rag_system):
        """Test caching performance improvements"""
        test_question = "What are the benefits of insurance?"
        
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
        assert result2.get("cached", False)
        
        print(f"📊 First query time: {first_query_time:.2f} seconds")
        print(f"📊 Second query time: {second_query_time:.2f} seconds")
        print(f"📊 Cache speedup: {first_query_time/second_query_time:.1f}x")
        
        # Cached query should be significantly faster
        assert second_query_time < first_query_time, "Cached query should be faster"
        assert first_query_time / second_query_time > 1.5, "Cache should provide at least 1.5x speedup"
    
    @pytest.mark.slow
    @pytest.mark.e2e
    def test_language_detection_performance(self, sample_questions):
        """Test language detection performance"""
        from src.interfaces.web.app import detect_coaching_type, create_coaching_prompt
        
        start_time = time.time()
        
        for question in sample_questions:
            # Test coaching type detection
            coaching_type = detect_coaching_type(question)
            assert coaching_type in ['general', 'competitive', 'objection_handling', 'communication', 'product_knowledge', 'sales_process']
            
            # Test prompt generation
            prompt = create_coaching_prompt(question, coaching_type, '', '', {})
            assert len(prompt) > 0
            assert question in prompt or question[:50] in prompt
        
        total_time = time.time() - start_time
        avg_time = total_time / len(sample_questions)
        
        print(f"📊 Language detection total time: {total_time:.3f} seconds")
        print(f"📊 Language detection average time: {avg_time:.3f} seconds")
        
        # Language detection should be very fast (less than 1 second total for all queries)
        assert total_time < 1.0, f"Language detection {total_time:.3f}s exceeds 1s threshold"
        assert avg_time < 0.1, f"Average language detection {avg_time:.3f}s exceeds 0.1s threshold"
