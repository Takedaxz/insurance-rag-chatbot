# 🤖 RAG Chatbot System

A comprehensive **Retrieval-Augmented Generation (RAG)** system with multiple interfaces for querying Excel and PDF documents using natural language. Built with LangChain, OpenAI, and advanced document processing capabilities.

## 🌟 Features

### 🔧 Core RAG System
- **Multi-format Document Support**: Excel (.xlsx, .xls) and PDF files
- **Advanced Document Processing**: LlamaParse for enhanced Excel parsing with pandas fallback
- **Vector Storage**: FAISS for efficient semantic search
- **Embeddings**: OpenAI text-embedding-3-small for high-quality vector representations
- **LLM Integration**: OpenAI GPT-5-mini with fallback support (Anthropic Claude, Google Gemini)
- **Multi-language Support**: Thai and English with automatic language detection
- **Quality Enhancement**: Query analysis, validation, and performance metrics

### 🚀 Multiple Interfaces
- **Terminal Interface**: Rich CLI with interactive commands
- **Web Interface**: Modern Flask-based web application
- **Discord Bot**: Full-featured Discord integration with slash commands

### 🔄 Smart Features
- **Auto File Monitoring**: Automatically ingests new files dropped in the data directory
- **Caching System**: In-memory and Redis caching for improved performance
- **Fallback Systems**: Multiple LLM and embedding providers for reliability
- **Performance Optimization**: Optimized chunk sizes, token limits, and retrieval parameters

## 📋 Prerequisites

- Python 3.8+
- OpenAI API key
- Optional: Anthropic API key, Google API key, LlamaCloud API key

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd rag-chatbot
```

### 2. Install Dependencies

**For all interfaces:**
```bash
pip install -r requirements.txt
```

**For Discord bot only:**
```bash
pip install -r requirements/discord.txt
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
RAG_DISCORD_TOKEN=your_discord_bot_token_here
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
# Optional if self-hosting Langfuse
# LANGFUSE_HOST=https://cloud.langfuse.com
```

## 🚀 Quick Start

### Terminal Interface
```bash
python main.py
```

**Available Commands:**
- `upload <file>` - Upload Excel/PDF files
- `ask <question>` - Ask questions about your data
- `ask_web <question>` - Ask with web search augmentation
- `stats` - View system statistics
- `list` - List uploaded files
- `reset` - Clear all data
- `monitor` - Start/stop file monitoring
- `scan` - Scan for new files
- `help` - Show help
- `quit` - Exit

### Web Interface
```bash
python web_app.py
```
Then open http://localhost:5500 in your browser.

**Features:**
- Modern chat interface
- File upload via drag & drop
- Real-time responses
- Source document display
- Quality metrics
- Thumbs up/down feedback (sends correctness scores to Langfuse when configured)

### Discord Bot
```bash
python discord_bot.py
```

**Available Commands:**
- `/ask <question>` - Ask questions about your data
- `/upload` - Upload files via Discord
- `/stats` - View system statistics
- `/help` - Show help

## 📁 Project Structure

```
rag-chatbot/
├── src/                           # Active source code
│   ├── core/                      # Core RAG system
│   │   ├── rag_system.py          # Main RAG system
│   │   ├── file_monitor.py        # Auto file monitoring
│   │   └── utils/                 # Utility functions
│   ├── interfaces/                # User interfaces (active)
│   │   ├── terminal/              # Terminal interface
│   │   │   └── main.py
│   │   ├── web/                   # Web interface
│   │   │   ├── app.py
│   │   │   └── templates/
│   │   └── discord/               # Discord bot
│   │       └── discord_bot.py
│   └── config/                    # Configuration
├── legacy/                        # Deprecated/legacy code (isolated)
├── experiments/                   # Experimental/prototype code (isolated)
├── docs/                          # Documentation
│   └── STRUCTURE.md               # Repo organization guidelines
├── data/                          # Data storage
│   ├── documents/                 # Uploaded documents
│   ├── indexes/                   # FAISS indexes
│   └── cache/                     # Cache files
├── tests/                         # Test files
├── requirements/                  # Dependency management
│   ├── base.txt                   # Core dependencies
│   ├── web.txt                    # Web dependencies
│   └── discord.txt                # Discord dependencies
├── main.py                        # Terminal interface entry point
├── web_app.py                     # Web interface entry point
├── discord_bot.py                 # Discord bot entry point
├── requirements.txt               # All dependencies
└── .env                           # Environment variables
```

## 🔧 Configuration

### Performance Settings
The system is optimized for speed and accuracy:
- **Chunk Size**: 250 characters (precise retrieval)
- **Chunk Overlap**: 100 characters (better context)
- **Max Retrieval**: 5 documents (faster retrieval)
- **Max Tokens**: 2000 (comprehensive responses)
- **Request Timeout**: 30 seconds

### Language Support
- **Thai**: Full support with Thai language detection and processing
- **English**: Native support
- **Automatic Detection**: System detects query language automatically

## 📊 Usage Examples

### Terminal Interface
```bash
# Start the system
python main.py

# Upload a file
upload data/products.xlsx

# Ask a question
ask "What are the benefits of Royal Gold?"

# Ask with web search
ask_web "Latest information about bird's nest products"
```

### Web Interface
1. Open http://localhost:5500
2. Upload Excel/PDF files via the interface
3. Ask questions in the chat
4. View sources and quality metrics
5. Click 👍/👎 on bot answers to log correctness in Langfuse

See `docs/LANGFUSE.md` for how to view and interpret scores.

### Discord Bot
```
/ask What are the main products in the catalog?
/upload [attach Excel file]
/stats
```

## 🔍 Advanced Features

### Query Enhancement
- **Intent Detection**: Automatically detects question intent (definition, benefits, comparison, etc.)
- **Keyword Extraction**: Extracts relevant keywords for better retrieval
- **Query Validation**: Validates and sanitizes queries
- **Confidence Scoring**: Provides confidence scores for responses

### Quality Metrics
- **Query Time**: Response time measurement
- **Relevance Score**: How relevant the retrieved documents are
- **Confidence Score**: Query confidence level
- **Source Count**: Number of documents used
- **Token Usage**: Token consumption tracking

### Fallback Systems
- **LLM Fallbacks**: Anthropic Claude, Google Gemini
- **Embedding Fallbacks**: Sentence Transformers
- **Cache Fallbacks**: Redis caching
- **Document Processing Fallbacks**: Multiple parsing strategies

## 🐛 Troubleshooting

### Common Issues

**1. "No answer generated"**
- Check if documents contain relevant information
- Try rephrasing your question
- Verify document language matches query language

**2. Import Errors**
- Ensure all dependencies are installed
- Check Python version (3.8+)
- Verify environment variables are set

**3. Port Conflicts**
- Web interface: Change port in `web_app.py`
- Discord bot: Check Discord token and permissions

**4. File Processing Issues**
- Ensure files are in supported formats (.xlsx, .xls, .pdf)
- Check file permissions
- Verify file is not corrupted

### Performance Tips
- Use smaller files for faster processing
- Clear cache periodically with `reset` command
- Monitor system resources during large file processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **LangChain**: RAG framework and tools
- **OpenAI**: Embeddings and LLM services
- **LlamaParse**: Enhanced document parsing
- **FAISS**: Vector similarity search
- **Flask**: Web framework
- **Discord.py**: Discord bot framework
