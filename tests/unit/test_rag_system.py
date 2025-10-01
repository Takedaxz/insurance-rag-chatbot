"""
Unit tests for RAG System
========================
"""

import pytest
from unittest.mock import Mock, patch
from src.core.rag_system import RAGSystem, QueryAnalysis, RetrievalMetrics


class TestRAGSystem:
    """Test cases for RAG System"""
    
    def test_rag_system_initialization(self, test_data_dir):
        """Test RAG system initialization"""
        rag = RAGSystem(base_storage_dir=str(test_data_dir))
        
        assert rag.base_storage_dir == test_data_dir
        assert rag.chunk_size == 500
        assert rag.chunk_overlap == 50
        assert rag.max_retrieval_results == 3
        assert not rag._initialized
    
    def test_ensure_initialized(self, rag_system):
        """Test initialization of OpenAI components"""
        # Should initialize embeddings and LLM
        rag_system._ensure_initialized()
        
        assert rag_system._initialized
        assert rag_system.embeddings is not None
        assert rag_system.llm is not None
    
    def test_validate_query_valid(self, rag_system):
        """Test query validation with valid queries"""
        valid_queries = [
            "What are the benefits of insurance?",
            "วิธีจัดการคำคัดค้านเรื่องราคาประกัน",
            "How to handle objections?",
            "ผลิตภัณฑ์ประกันไหนดีที่สุด"
        ]
        
        for query in valid_queries:
            is_valid, errors = rag_system.validate_query(query)
            assert is_valid
            assert len(errors) == 0
    
    def test_validate_query_invalid(self, rag_system):
        """Test query validation with invalid queries"""
        invalid_cases = [
            ("", ["Query too short"]),
            ("ab", ["Query too short"]),
            ("x" * 1001, ["Query too long"]),
            ("test <script>alert('xss')</script>", ["Query contains invalid special characters"]),
            ("word " * 10, ["Query contains excessive whitespace"])
        ]
        
        for query, expected_errors in invalid_cases:
            is_valid, errors = rag_system.validate_query(query)
            assert not is_valid
            assert any(expected in str(errors) for expected in expected_errors)
    
    def test_sanitize_query(self, rag_system):
        """Test query sanitization"""
        test_cases = [
            ("  extra   spaces  ", "extra spaces"),
            ("test<script>", "test"),
            ("normal query", "normal query"),
            ("query\nwith\nnewlines", "query with newlines")
        ]
        
        for input_query, expected in test_cases:
            result = rag_system.sanitize_query(input_query)
            assert result == expected
    
    def test_detect_language_thai(self, rag_system):
        """Test Thai language detection"""
        thai_queries = [
            "วิธีจัดการคำคัดค้านเรื่องราคาประกัน",
            "ผลิตภัณฑ์ประกันไหนเหมาะกับลูกค้าวัยทำงาน",
            "เทคนิคการขายประกันชีวิต"
        ]
        
        for query in thai_queries:
            language = rag_system._detect_language(query)
            assert language == "thai"
    
    def test_detect_language_english(self, rag_system):
        """Test English language detection"""
        english_queries = [
            "How to handle price objections?",
            "What insurance products are best?",
            "Life insurance sales techniques"
        ]
        
        for query in english_queries:
            language = rag_system._detect_language(query)
            assert language == "english"
    
    def test_extract_keywords_thai(self, rag_system):
        """Test keyword extraction for Thai queries"""
        query = "วิธีจัดการคำคัดค้านเรื่องราคาประกัน"
        keywords = rag_system._extract_keywords(query, "thai")
        
        assert len(keywords) > 0
        assert all(len(keyword) > 1 for keyword in keywords)
        assert "จัดการ" in keywords or "คำคัดค้าน" in keywords
    
    def test_extract_keywords_english(self, rag_system):
        """Test keyword extraction for English queries"""
        query = "How to handle price objections in insurance sales?"
        keywords = rag_system._extract_keywords(query, "english")
        
        assert len(keywords) > 0
        assert all(len(keyword) > 2 for keyword in keywords)
        assert "handle" in keywords or "objections" in keywords
    
    def test_determine_intent(self, rag_system):
        """Test intent determination"""
        test_cases = [
            ("fact finding questions", "fact_finding"),
            ("product knowledge questions", "product_knowledge"),
            ("compliance regulations", "compliance"),
            ("sales process steps", "sales_process"),
            ("training exercises", "training"),
            ("protection needs analysis", "needs_analysis")
        ]
        
        for query, expected_intent in test_cases:
            intent = rag_system._determine_intent(query)
            assert intent == expected_intent
    
    def test_calculate_confidence(self, rag_system):
        """Test confidence calculation"""
        # Short query should have low confidence
        short_query = "test"
        short_keywords = ["test"]
        confidence = rag_system._calculate_confidence(short_query, short_keywords)
        assert confidence < 0.5
        
        # Longer query with keywords should have higher confidence
        long_query = "This is a detailed question about insurance products and their benefits"
        long_keywords = ["detailed", "question", "insurance", "products", "benefits"]
        confidence = rag_system._calculate_confidence(long_query, long_keywords)
        assert confidence > 0.5
    
    def test_get_stats_no_index(self, rag_system):
        """Test stats when no index exists"""
        stats = rag_system.get_stats()
        
        assert stats["status"] == "no_index"
        assert stats["total_vectors"] == 0
        assert stats["index_size_mb"] == 0
    
    @patch('src.core.rag_system.FAISS')
    def test_load_index_success(self, mock_faiss, rag_system, test_data_dir):
        """Test successful index loading"""
        # Mock FAISS index
        mock_vectorstore = Mock()
        mock_vectorstore.index.ntotal = 100
        mock_faiss.load_local.return_value = mock_vectorstore
        
        # Create mock index files
        index_path = test_data_dir / "faiss_index"
        index_path.mkdir(parents=True, exist_ok=True)
        (index_path / "index.faiss").touch()
        (index_path / "index.pkl").touch()
        
        rag_system.base_storage_dir = test_data_dir
        result = rag_system.load_index()
        
        assert result is not None
        mock_faiss.load_local.assert_called_once()
    
    def test_load_index_not_found(self, rag_system, test_data_dir):
        """Test index loading when index doesn't exist"""
        rag_system.base_storage_dir = test_data_dir
        result = rag_system.load_index()
        
        assert result is None
    
    def test_reset_system(self, rag_system, test_data_dir):
        """Test system reset"""
        # Create mock index directory
        index_path = test_data_dir / "faiss_index"
        index_path.mkdir(parents=True, exist_ok=True)
        (index_path / "test_file").touch()
        
        rag_system.base_storage_dir = test_data_dir
        rag_system.reset()
        
        # Index directory should be removed
        assert not index_path.exists()


class TestQueryAnalysis:
    """Test cases for QueryAnalysis dataclass"""
    
    def test_query_analysis_creation(self):
        """Test QueryAnalysis dataclass creation"""
        analysis = QueryAnalysis(
            original_query="test query",
            enhanced_query="enhanced test query",
            keywords=["test", "query"],
            intent="general",
            language="english",
            confidence=0.8,
            suggestions=["suggestion1", "suggestion2"]
        )
        
        assert analysis.original_query == "test query"
        assert analysis.enhanced_query == "enhanced test query"
        assert analysis.keywords == ["test", "query"]
        assert analysis.intent == "general"
        assert analysis.language == "english"
        assert analysis.confidence == 0.8
        assert analysis.suggestions == ["suggestion1", "suggestion2"]


class TestRetrievalMetrics:
    """Test cases for RetrievalMetrics dataclass"""
    
    def test_retrieval_metrics_creation(self):
        """Test RetrievalMetrics dataclass creation"""
        metrics = RetrievalMetrics(
            query_time=1.5,
            retrieval_time=0.8,
            generation_time=2.1,
            total_tokens=150,
            source_count=3,
            relevance_score=0.85,
            confidence_score=0.9
        )
        
        assert metrics.query_time == 1.5
        assert metrics.retrieval_time == 0.8
        assert metrics.generation_time == 2.1
        assert metrics.total_tokens == 150
        assert metrics.source_count == 3
        assert metrics.relevance_score == 0.85
        assert metrics.confidence_score == 0.9
