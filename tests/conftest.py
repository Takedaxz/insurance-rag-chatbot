"""
Pytest configuration and shared fixtures
========================================
"""

import os
import sys
import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

@pytest.fixture(scope="session")
def test_data_dir():
    """Create temporary directory for test data"""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture(scope="session")
def sample_documents_dir(test_data_dir):
    """Create sample documents directory"""
    docs_dir = test_data_dir / "documents"
    docs_dir.mkdir(exist_ok=True)
    
    # Create sample text files
    sample_texts = {
        "basic.txt": "This is a basic test document with insurance information.",
        "ethics.txt": "Ethical guidelines for insurance agents and relationship managers.",
        "workflow.txt": "Standard workflow procedures for insurance sales."
    }
    
    for filename, content in sample_texts.items():
        (docs_dir / filename).write_text(content)
    
    return docs_dir

@pytest.fixture(scope="session")
def sample_index_dir(test_data_dir):
    """Create sample index directory"""
    index_dir = test_data_dir / "indexes" / "faiss_index"
    index_dir.mkdir(parents=True, exist_ok=True)
    return index_dir

@pytest.fixture(autouse=True)
def mock_openai_api():
    """Mock OpenAI API calls to avoid real API usage in tests"""
    with patch('openai.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client

        # Mock embeddings response to be dict-like
        mock_embedding = MagicMock()
        mock_embedding.embedding = [0.1] * 1536
        mock_embedding_data = MagicMock()
        mock_embedding_data.data = [mock_embedding]
        mock_client.embeddings.create.return_value = mock_embedding_data

        # Mock chat completion response to be dict-like
        mock_choice = MagicMock()
        mock_choice.message.content = "Test response"
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_completion
        
        yield mock_client

@pytest.fixture(autouse=True)
def mock_langfuse():
    """Mock Langfuse client to avoid real telemetry in tests"""
    with patch('src.core.utils.langfuse_client.log_interaction') as mock_log:
        mock_log.return_value = "test-trace-id"
        yield mock_log

@pytest.fixture
def rag_system():
    """Create RAG system instance for testing"""
    from src.core.rag_system import RAGSystem
    
    # Use temporary directory for testing
    temp_dir = tempfile.mkdtemp()
    rag = RAGSystem(base_storage_dir=temp_dir)
    
    yield rag
    
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture
def web_app():
    """Create Flask app instance for testing"""
    from src.interfaces.web.app import app
    
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_file_monitor():
    """Mock file monitor for testing"""
    with patch('src.core.file_monitor.get_file_monitor') as mock_monitor:
        mock_instance = Mock()
        mock_instance.is_monitoring = False
        mock_instance.get_processed_files.return_value = []
        mock_monitor.return_value = mock_instance
        yield mock_instance

@pytest.fixture(autouse=True)
def set_test_env():
    """Set test environment variables"""
    test_env = {
        'OPENAI_API_KEY': 'test-key',
        'LLAMA_CLOUD_API_KEY': 'test-llama-key',
        'TAVILY_API_KEY': 'test-tavily-key',
        'FLASK_ENV': 'testing',
        'PYTHONPATH': os.path.join(os.path.dirname(__file__), '..', 'src')
    }
    
    with patch.dict(os.environ, test_env):
        yield test_env

@pytest.fixture
def sample_questions():
    """Sample questions for testing"""
    return [
        "What are the benefits of insurance?",
        "วิธีจัดการคำคัดค้านเรื่องราคาประกัน",
        "How to handle price objections?",
        "ผลิตภัณฑ์ประกันไหนเหมาะกับลูกค้าวัยทำงาน"
    ]

@pytest.fixture
def sample_coaching_scenarios():
    """Sample coaching scenarios for testing"""
    return [
        {
            "type": "competitive",
            "question": "How do we compare to competitors?",
            "expected_elements": ["competitive", "advantage", "differentiation"]
        },
        {
            "type": "objection_handling",
            "question": "Customer says it's too expensive",
            "expected_elements": ["objection", "concern", "price"]
        },
        {
            "type": "communication",
            "question": "What keywords should I use?",
            "expected_elements": ["keywords", "language", "communication"]
        }
    ]

@pytest.fixture
def sample_simulation_scenarios():
    """Sample simulation scenarios for testing"""
    return [
        {
            "type": "new_customer",
            "expected_fields": ["customer_name", "age", "occupation", "initial_message"]
        },
        {
            "type": "objection_handling",
            "expected_fields": ["customer_name", "personality", "initial_message", "concerns"]
        },
        {
            "type": "high_net_worth",
            "expected_fields": ["customer_name", "background", "goals", "triggers"]
        }
    ]

# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "e2e: marks tests as end-to-end tests"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers"""
    for item in items:
        # Add markers based on test location
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)
        
        # Add slow marker to performance tests
        if "performance" in item.name.lower():
            item.add_marker(pytest.mark.slow)
