#!/usr/bin/env python3
"""
RAG Chatbot System - Web Interface Entry Point
============================================
Entry point for the web interface.
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.interfaces.web.app import app

if __name__ == "__main__":
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5500)
