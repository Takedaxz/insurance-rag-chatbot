"""
Web Chatbot for RAG System
==========================
Flask web application providing a web interface for the RAG system.
"""

from flask import Flask, render_template, request, jsonify
from pathlib import Path
import os
import traceback
from werkzeug.utils import secure_filename

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.core.rag_system import get_rag_system
from src.core.file_monitor import get_file_monitor

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global instances
rag_system = None
file_monitor = None

def initialize_rag():
    """Initialize RAG system and file monitor"""
    global rag_system, file_monitor
    
    try:
        rag_system = get_rag_system()
        file_monitor = get_file_monitor()
        file_monitor.start_monitoring()
        print("✅ RAG system initialized for web interface")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize RAG system: {e}")
        return False

# Initialize RAG system when module is imported
initialize_rag()

@app.route('/')
def index():
    """Main chat interface"""
    return render_template('chat.html')

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """API endpoint for asking questions"""
    try:
        data = request.get_json()
        question = data.get('question', '').strip()
        use_web_search = data.get('use_web_search', False)
        
        if not question:
            return jsonify({
                'status': 'error',
                'message': 'Question is required'
            }), 400
        
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Process the question
        result = rag_system.query(question, use_web_search=use_web_search)
        
        if result["status"] == "success":
            return jsonify({
                'status': 'success',
                'answer': result['answer'],
                'sources': result.get('sources', []),
                'quality_metrics': result.get('quality_metrics', {})
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result.get('error', 'Unknown error occurred')
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API endpoint for file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = Path("./data/documents") / filename
        file_path.parent.mkdir(exist_ok=True)
        file.save(str(file_path))
        
        # Ingest the file
        result = rag_system.ingest_file(str(file_path))
        
        if result["status"] == "success":
            return jsonify({
                'status': 'success',
                'filename': result['filename'],
                'chunks_created': result['chunks_created'],
                'total_characters': result['total_characters']
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result.get('error', 'Upload failed')
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Upload error: {str(e)}'
        }), 500

@app.route('/api/stats')
def get_stats():
    """API endpoint for system statistics"""
    try:
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Translate core stats to the fields expected by the UI
        core_stats = rag_system.get_stats()

        # Load index for file and chunk breakdowns
        vectorstore = rag_system.load_index()
        total_chunks = 0
        total_files = 0
        if vectorstore:
            total_chunks = vectorstore.index.ntotal
            filenames = set()
            for doc in vectorstore.docstore._dict.values():
                metadata = getattr(doc, 'metadata', {}) or {}
                name = metadata.get('filename')
                if name:
                    filenames.add(name)
            total_files = len(filenames)

        # Format index size consistently with UI (e.g., "12.3 MB")
        index_size_mb = core_stats.get('index_size_mb', 0)
        stats = {
            'total_files': total_files,
            'total_chunks': total_chunks,
            'index_size': f"{round(index_size_mb, 2)} MB"
        }

        return jsonify({
            'status': 'success',
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error getting stats: {str(e)}'
        }), 500

@app.route('/api/files')
def list_files():
    """API endpoint for listing uploaded files"""
    try:
        if not file_monitor:
            return jsonify({
                'status': 'error',
                'message': 'File monitor not initialized'
            }), 500
        
        # Build file list with chunk counts from the current index
        files_with_stats = []
        try:
            if not rag_system:
                raise RuntimeError('RAG system not initialized')

            vectorstore = rag_system.load_index()
            if vectorstore is None:
                # No index yet; fall back to filenames known by the file monitor
                filenames = file_monitor.get_processed_files() or []
                files_with_stats = [{
                    'filename': name,
                    'chunks': 0
                } for name in sorted(filenames)]
            else:
                # Aggregate chunk counts by filename from document metadata
                filename_to_chunks = {}
                for doc in vectorstore.docstore._dict.values():
                    metadata = getattr(doc, 'metadata', {}) or {}
                    name = metadata.get('filename')
                    if not name:
                        continue
                    filename_to_chunks[name] = filename_to_chunks.get(name, 0) + 1

                # Ensure files known by the monitor are also represented
                for name in file_monitor.get_processed_files() or []:
                    filename_to_chunks.setdefault(name, 0)

                files_with_stats = [
                    {
                        'filename': name,
                        'chunks': count
                    }
                    for name, count in sorted(filename_to_chunks.items())
                ]
        except Exception:
            # If anything goes wrong, don't fail the request; provide best-effort data
            filenames = file_monitor.get_processed_files() or []
            files_with_stats = [{
                'filename': name,
                'chunks': 0
            } for name in sorted(filenames)]

        return jsonify({
            'status': 'success',
            'files': files_with_stats
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error listing files: {str(e)}'
        }), 500

@app.route('/api/files/delete', methods=['POST'])
def delete_file():
    """Delete a file's vectors from the index by filename"""
    try:
        data = request.get_json() or {}
        filename = (data.get('filename') or '').strip()
        if not filename:
            return jsonify({'status': 'error', 'message': 'Filename is required'}), 400

        if not rag_system:
            return jsonify({'status': 'error', 'message': 'RAG system not initialized'}), 500

        vectorstore = rag_system.load_index()
        if vectorstore is None:
            return jsonify({'status': 'error', 'message': 'No index found'}), 404

        # Find docstore IDs matching the filename
        ids_to_delete = [
            doc_id for doc_id, doc in vectorstore.docstore._dict.items()
            if getattr(doc, 'metadata', {}).get('filename') == filename
        ]

        if not ids_to_delete:
            return jsonify({'status': 'error', 'message': 'File not found in index'}), 404

        before = vectorstore.index.ntotal
        vectorstore.delete(ids_to_delete)
        rag_system.save_index(vectorstore)
        after = vectorstore.index.ntotal

        # Remove from file monitor cache if present
        try:
            if file_monitor and file_monitor.handler:
                if filename in file_monitor.handler.processed_files:
                    file_monitor.handler.processed_files.remove(filename)
        except Exception:
            pass

        # Also remove the physical file from data/documents if present
        try:
            doc_dir = Path("./data/documents")
            file_path = doc_dir / filename
            if file_path.is_file():
                file_path.unlink()
        except Exception:
            # Do not fail the request if filesystem deletion fails
            pass

        return jsonify({
            'status': 'success',
            'filename': filename,
            'chunks_removed': max(before - after, 0)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error deleting file: {str(e)}'}), 500

if __name__ == '__main__':
    # Initialize RAG system
    if not initialize_rag():
        print("❌ Failed to initialize RAG system. Exiting.")
        exit(1)
    
    # Run the Flask app
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5500)



