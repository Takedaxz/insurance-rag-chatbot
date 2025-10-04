"""
Integration tests for API endpoints
==================================
"""

import pytest
import json
import io
from unittest.mock import patch, Mock, PropertyMock


class TestAPIEndpoints:
    """Test cases for Flask API endpoints"""
    
    def test_homepage(self, web_app):
        """Test homepage endpoint"""
        response = web_app.get('/')
        assert response.status_code == 200
        assert b'UOB RM AI Assistant' in response.data
    
    def test_knowledge_mode_page(self, web_app):
        """Test knowledge mode page"""
        response = web_app.get('/knowledge')
        assert response.status_code == 200
        assert b'Knowledge' in response.data or 'ความรู้'.encode('utf-8') in response.data
    
    def test_coaching_mode_page(self, web_app):
        """Test coaching mode page"""
        response = web_app.get('/coaching')
        assert response.status_code == 200
        assert b'Coaching' in response.data or 'โค้ช'.encode('utf-8') in response.data
    
    def test_simulation_mode_page(self, web_app):
        """Test simulation mode page"""
        response = web_app.get('/simulation')
        assert response.status_code == 200
        assert b'Simulation' in response.data or 'จำลอง'.encode('utf-8') in response.data
    
    @patch('src.interfaces.web.app.rag_system')
    def test_ask_question_success(self, mock_rag_system, web_app):
        """Test successful question asking"""
        # Mock RAG system response
        mock_rag_system.query.return_value = {
            "status": "success",
            "answer": "Test answer",
            "sources": [{"content": "Source content", "metadata": {"filename": "test.txt"}}],
            "quality_metrics": {"query_time": 1.5, "source_count": 1}
        }
        
        response = web_app.post('/api/ask', 
                              json={'question': 'What are the benefits?'},
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert data['answer'] == 'Test answer'
        assert len(data['sources']) == 1
    
    def test_ask_question_missing_question(self, web_app):
        """Test asking question without providing question"""
        response = web_app.post('/api/ask', 
                              json={},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'required' in data['message'].lower()
    
    @patch('src.interfaces.web.app.rag_system')
    def test_ask_question_rag_error(self, mock_rag_system, web_app):
        """Test question asking when RAG system returns error"""
        mock_rag_system.query.return_value = {
            "status": "error",
            "error": "Test error message"
        }
        
        response = web_app.post('/api/ask', 
                              json={'question': 'Test question'},
                              content_type='application/json')
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert data['message'] == 'Test error message'
    
    @patch('src.interfaces.web.app.rag_system')
    def test_file_upload_success(self, mock_rag_system, web_app):
        """Test successful file upload"""
        # Mock RAG system response
        mock_rag_system.ingest_file.return_value = {
            "status": "success",
            "filename": "test.txt",
            "chunks_created": 5,
            "total_characters": 1000
        }
        
        # Create test file
        test_file_content = b"This is a test document content."
        
        response = web_app.post('/api/upload',
                              data={'file': (io.BytesIO(test_file_content), 'test.txt')},
                              content_type='multipart/form-data')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert data['filename'] == 'test.txt'
        assert data['chunks_created'] == 5
    
    def test_file_upload_no_file(self, web_app):
        """Test file upload without providing file"""
        response = web_app.post('/api/upload')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'no file provided' in data['message'].lower()
    
    @patch('src.interfaces.web.app.rag_system')
    def test_get_stats_success(self, mock_rag_system, web_app):
        """Test successful stats retrieval"""
        # Mock RAG system response
        mock_rag_system.get_stats.return_value = {
            "status": "active",
            "total_vectors": 100,
            "index_size_mb": 5.2
        }
        
        # Mock vectorstore for file count
        mock_vectorstore = Mock()
        mock_vectorstore.index.ntotal = 100
        mock_doc = Mock()
        mock_doc.metadata = {"filename": "test.txt"}
        mock_vectorstore.docstore._dict = {"doc1": mock_doc}
        mock_rag_system.load_index.return_value = mock_vectorstore
        
        # Mock file monitor
        with patch('src.interfaces.web.app.file_monitor') as mock_monitor:
            mock_monitor.get_processed_files.return_value = ["test.txt"]
            
            response = web_app.get('/api/stats')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['status'] == 'success'
            assert 'stats' in data
            assert data['stats']['total_files'] == 1
            assert data['stats']['total_chunks'] == 100
    
    @patch('src.interfaces.web.app.rag_system')
    def test_list_files_success(self, mock_rag_system, web_app):
        """Test successful file listing"""
        # Mock vectorstore
        mock_vectorstore = Mock()
        mock_doc1 = Mock()
        mock_doc1.metadata = {"filename": "test1.txt"}
        mock_doc2 = Mock()
        mock_doc2.metadata = {"filename": "test2.txt"}
        mock_vectorstore.docstore._dict = {"doc1": mock_doc1, "doc2": mock_doc2}
        mock_rag_system.load_index.return_value = mock_vectorstore
        
        # Mock file monitor
        with patch('src.interfaces.web.app.file_monitor') as mock_monitor:
            mock_monitor.get_processed_files.return_value = ["test1.txt", "test2.txt"]
            
            response = web_app.get('/api/files')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['status'] == 'success'
            assert len(data['files']) == 2
            assert any(f['filename'] == 'test1.txt' for f in data['files'])
            assert any(f['filename'] == 'test2.txt' for f in data['files'])
    
    @patch('src.interfaces.web.app.rag_system')
    def test_delete_file_success(self, mock_rag_system, web_app):
        """Test successful file deletion"""
        # Mock vectorstore
        mock_vectorstore = Mock()
        type(mock_vectorstore.index).ntotal = PropertyMock(side_effect=[50, 45])  # Before and after deletion
        mock_doc = Mock()
        mock_doc.metadata = {"filename": "test.txt"}
        mock_vectorstore.docstore._dict = {"doc1": mock_doc}
        mock_rag_system.load_index.return_value = mock_vectorstore

        response = web_app.post('/api/files/delete',
                              json={'filename': 'test.txt'},
                              content_type='application/json')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert data['filename'] == 'test.txt'
        assert data['chunks_removed'] > 0
    
    def test_delete_file_missing_filename(self, web_app):
        """Test file deletion without providing filename"""
        response = web_app.post('/api/files/delete',
                              json={},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'filename is required' in data['message'].lower()


class TestCoachingAPI:
    """Test cases for coaching API endpoints"""
    
    @patch('src.interfaces.web.app.rag_system')
    def test_coaching_session_success(self, mock_rag_system, web_app):
        """Test successful coaching session"""
        # Mock RAG system response
        mock_rag_system.query.return_value = {
            "status": "success",
            "answer": "Coaching advice here",
            "sources": [],
            "quality_metrics": {"query_time": 1.0}
        }
        
        response = web_app.post('/api/coaching',
                              json={
                                  'question': 'How to handle objections?',
                                  'type': 'objection_handling',
                                  'product': 'life_insurance',
                                  'customer_type': 'young_professional'
                              },
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'answer' in data
        assert 'coaching_type' in data
        assert 'insights' in data
        assert 'practice_suggestions' in data
    
    def test_coaching_session_missing_question(self, web_app):
        """Test coaching session without question"""
        response = web_app.post('/api/coaching',
                              json={'type': 'general'},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'question is required' in data['message'].lower()


class TestSimulationAPI:
    """Test cases for simulation API endpoints"""
    
    def test_simulation_start(self, web_app):
        """Test starting a simulation"""
        response = web_app.post('/api/simulation',
                              json={
                                  'action': 'start',
                                  'scenario': 'new_customer'
                              },
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'scenario_data' in data
        assert 'customer_name' in data['scenario_data']
        assert 'initial_message' in data['scenario_data']
    
    def test_simulation_invalid_action(self, web_app):
        """Test simulation with invalid action"""
        response = web_app.post('/api/simulation',
                              json={'action': 'invalid_action'},
                              content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'invalid simulation action' in data['message'].lower()
