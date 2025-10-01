#!/usr/bin/env python3
"""
RAG Chatbot System - Main Entry Point
====================================
Entry point for the RAG chatbot system.
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.interfaces.terminal.main import main

if __name__ == "__main__":
    main()
