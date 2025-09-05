"""
Enhanced RAG System with LangChain (Based on Reference Architecture)
===================================================================
Handles Excel file ingestion, embedding generation, storage, and semantic retrieval.
Uses the same framework and tools as the reference project.
Enhanced with query optimization, validation, and quality improvements.
"""

import os
import json
import asyncio
import pickle
import re
import time
from typing import List, Dict, Optional, Tuple, Any
from pathlib import Path
import shutil
from dataclasses import dataclass
import threading
from collections import OrderedDict

# Import LlamaParse with fallback
try:
    from llama_parse import LlamaParse
    LLAMA_PARSE_AVAILABLE = True
except ImportError:
    LLAMA_PARSE_AVAILABLE = False
    print("⚠️ LlamaParse not available. Install with: pip install llama-parse")

# Import Sentence Transformers with fallback
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("⚠️ Sentence Transformers not available. Install with: pip install sentence-transformers")

# Import Anthropic with fallback
try:
    from langchain_anthropic import ChatAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    print("⚠️ Anthropic not available. Install with: pip install langchain-anthropic")

# Import Google with fallback
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    print("⚠️ Google GenAI not available. Install with: pip install langchain-google-genai")

# Import Pinecone with fallback
try:
    from langchain_pinecone import PineconeVectorStore
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    print("⚠️ Pinecone not available. Install with: pip install langchain-pinecone")

# Import Redis with fallback
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️ Redis not available. Install with: pip install redis")

# Import Unstructured with fallback
try:
    from langchain_community.document_loaders import UnstructuredFileLoader
    UNSTRUCTURED_AVAILABLE = True
except ImportError:
    UNSTRUCTURED_AVAILABLE = False
    print("⚠️ Unstructured not available. Install with: pip install unstructured")

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.schema import HumanMessage, SystemMessage

from dotenv import load_dotenv

# Optional: Langfuse telemetry
try:
    from src.core.utils.langfuse_client import log_interaction
    LANGFUSE_INTEGRATION_AVAILABLE = True
except Exception:
    LANGFUSE_INTEGRATION_AVAILABLE = False

@dataclass
class QueryAnalysis:
    """Query analysis result for quality enhancement"""
    original_query: str
    enhanced_query: str
    keywords: List[str]
    intent: str
    language: str
    confidence: float
    suggestions: List[str]

@dataclass
class RetrievalMetrics:
    """Retrieval performance metrics"""
    query_time: float
    retrieval_time: float
    generation_time: float
    total_tokens: int
    source_count: int
    relevance_score: float
    confidence_score: float

# Optional web search
try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False

load_dotenv()

class RAGSystem:
    def __init__(self, 
                 base_storage_dir: str = "./data/indexes",
                 chunk_size: int = 250,  # Optimized for performance
                 chunk_overlap: int = 100,  # Optimized for performance
                 max_retrieval_results: int = 5):  # Optimized for performance
        
        self.base_storage_dir = Path(base_storage_dir)
        self.base_storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize OpenAI components once
        self.embeddings = None
        self.llm = None
        
        # Text splitter for chunking - optimized for performance
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,  # Larger chunks for better context and fewer API calls
            chunk_overlap=50,  # Reduced overlap for performance
            length_function=len,
        )
        
        self.max_retrieval_results = 3  # Reduced from 5 for faster retrieval
        
        # Initialize Tavily if available
        self.tavily_client = None
        if TAVILY_AVAILABLE and os.getenv("TAVILY_API_KEY"):
            try:
                self.tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
            except Exception as e:
                print(f"Warning: Could not initialize Tavily: {e}")
        
        # Cache for loaded indexes to avoid repeated file I/O
        self._index_cache = None  # Single cached index instead of dict
        self._index_cache_time = 0
        self._initialized = False
        
        self._query_lru_cache = OrderedDict()
        self._max_cache_size = 100  # Limit cache size to prevent memory leaks
        
        # Disable LlamaParse for performance optimization
        self.llama_parser = None
        self.llama_parse_enabled = False
        self._llama_lock = threading.Lock()
        
        # Quality enhancement components
        self.performance_metrics = []
        self.quality_thresholds = {
            "min_confidence": 0.3,
            "min_relevance": 0.5,
            "max_response_time": 10.0
        }
        
        # Fallback components
        self.llm_fallbacks = []
        self.embedding_fallbacks = []
        self.vectorstore_fallbacks = []
        self.cache_fallbacks = []
        self.current_llm_index = 0
        self.current_embedding_index = 0
        self.current_vectorstore_index = 0
        self.current_cache_index = 0
        

    
    def _ensure_initialized(self):
        """Ensure OpenAI components are initialized"""
        if self._initialized:
            return
        
        try:
            # Initialize OpenAI embeddings
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",
                show_progress_bar=False,
                max_retries=2,  # Reduced retries for faster failure
                request_timeout=30,  # Add timeout
            )
            print("🔗 Using OpenAI embeddings (text-embedding-3-small)")
            
            # Initialize primary LLM with optimized settings
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",  # Fast and efficient model
                temperature=0.1,
                max_retries=1,  # Single retry for speed
                max_tokens=1000,  # Reduced tokens for faster response
                request_timeout=20,  # Shorter timeout
            )
            
            # Skip fallback initialization for performance
            print("ℹ️ LLM fallbacks disabled for performance optimization")
            
            # LlamaParse disabled for performance optimization
            print("ℹ️ LlamaParse disabled for performance optimization")
            # Skip fallback initializations for performance optimization
            print("ℹ️ All fallbacks disabled for performance optimization")
            
            self._initialized = True
            print("✅ RAG system optimized for performance!")
            print(f"⚡ Performance optimizations enabled: Faster chunking, reduced retrieval, simplified processing")
            
        except Exception as e:
            print(f"❌ Failed to initialize OpenAI components: {e}")
            raise
    
    def _llama_parse_safe(self, file_path: str):
        """Thread-safe wrapper around LlamaParse.load_data with re-init on loop errors."""
        if not self.llama_parser:
            return None
        with self._llama_lock:
            try:
                return self.llama_parser.load_data(file_path)
            except Exception as e:
                msg = str(e)
                if any(err in msg for err in [
                    "Event loop is closed",
                    "bound to a different event loop",
                    "attached to a different loop"
                ]):
                    try:
                        llama_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
                        if llama_api_key:
                            self.llama_parser = LlamaParse(
                                api_key=llama_api_key,
                                result_type="markdown",
                                verbose=True,
                                num_workers=4,
                                check_interval=1
                            )
                            return self.llama_parser.load_data(file_path)
                    except Exception:
                        pass
                raise

    def _initialize_llm_fallbacks(self):
        """Initialize LLM fallbacks"""
        try:
            # Fallback 1: Anthropic Claude Sonnet-4
            if ANTHROPIC_AVAILABLE and os.getenv("ANTHROPIC_API_KEY"):
                try:
                    anthropic_llm = ChatAnthropic(
                        model="claude-sonnet-4-20250514",
                        temperature=0.1,
                        max_tokens=2000
                    )
                    self.llm_fallbacks.append({
                        "name": "Anthropic Claude Sonnet-4",
                        "llm": anthropic_llm,
                        "priority": 1
                    })
                    print("✅ Anthropic Claude Sonnet-4 fallback initialized")
                except Exception as e:
                    print(f"⚠️ Anthropic fallback failed: {e}")
            
            # Fallback 2: Google Gemini Pro
            if GOOGLE_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
                try:
                    google_llm = ChatGoogleGenerativeAI(
                        model="gemini-2.0-flash",
                        temperature=0.1,
                        max_output_tokens=2000
                    )
                    self.llm_fallbacks.append({
                        "name": "Google Gemini Pro",
                        "llm": google_llm,
                        "priority": 2
                    })
                    print("✅ Google Gemini Pro fallback initialized")
                except Exception as e:
                    print(f"⚠️ Google fallback failed: {e}")
                    
        except Exception as e:
            print(f"⚠️ LLM fallback initialization failed: {e}")
    
    def _initialize_embedding_fallbacks(self):
        """Initialize embedding fallbacks"""
        try:
            # Fallback 1: Sentence Transformers
            if SENTENCE_TRANSFORMERS_AVAILABLE:
                try:
                    sentence_embeddings = HuggingFaceEmbeddings(
                        model_name="sentence-transformers/all-MiniLM-L6-v2",
                        model_kwargs={'device': 'cpu'}
                    )
                    self.embedding_fallbacks.append({
                        "name": "Sentence Transformers (all-MiniLM-L6-v2)",
                        "embeddings": sentence_embeddings,
                        "priority": 1
                    })
                    print("✅ Sentence Transformers fallback initialized")
                except Exception as e:
                    print(f"⚠️ Sentence Transformers fallback failed: {e}")
                    
        except Exception as e:
            print(f"⚠️ Embedding fallback initialization failed: {e}")
    
    def _initialize_vectorstore_fallbacks(self):
        """Initialize vectorstore fallbacks"""
        try:
            # Fallback 1: Pinecone (if API key available)
            if PINECONE_AVAILABLE and os.getenv("PINECONE_API_KEY"):
                try:
                    # Note: Pinecone requires index name and environment
                    # This is a placeholder - actual implementation would need index setup
                    self.vectorstore_fallbacks.append({
                        "name": "Pinecone",
                        "type": "pinecone",
                        "priority": 1
                    })
                    print("✅ Pinecone fallback configured (requires index setup)")
                except Exception as e:
                    print(f"⚠️ Pinecone fallback failed: {e}")
                    
        except Exception as e:
            print(f"⚠️ Vectorstore fallback initialization failed: {e}")
    
    def _initialize_cache_fallbacks(self):
        """Initialize cache fallbacks"""
        try:
            # Temporarily disable Redis cache usage
            print("ℹ️ Redis cache disabled for now")
                    
        except Exception as e:
            print(f"⚠️ Cache fallback initialization failed: {e}")
    
    def get_fallback_llm(self):
        """Get next available LLM fallback"""
        if not self.llm_fallbacks:
            return None
        
        # Try current fallback
        if self.current_llm_index < len(self.llm_fallbacks):
            fallback = self.llm_fallbacks[self.current_llm_index]
            print(f"🔄 Using LLM fallback: {fallback['name']}")
            return fallback['llm']
        
        # Reset to first fallback
        self.current_llm_index = 0
        if self.llm_fallbacks:
            fallback = self.llm_fallbacks[0]
            print(f"🔄 Using LLM fallback: {fallback['name']}")
            return fallback['llm']
        
        return None
    
    def get_fallback_embeddings(self):
        """Get next available embedding fallback"""
        if not self.embedding_fallbacks:
            return None
        
        # Try current fallback
        if self.current_embedding_index < len(self.embedding_fallbacks):
            fallback = self.embedding_fallbacks[self.current_embedding_index]
            print(f"🔄 Using embedding fallback: {fallback['name']}")
            return fallback['embeddings']
        
        # Reset to first fallback
        self.current_embedding_index = 0
        if self.embedding_fallbacks:
            fallback = self.embedding_fallbacks[0]
            print(f"🔄 Using embedding fallback: {fallback['name']}")
            return fallback['embeddings']
        
        return None
    
    def get_fallback_cache(self, key: str):
        """Get value from fallback cache"""
        if not self.cache_fallbacks:
            return None
        
        for fallback in self.cache_fallbacks:
            try:
                if fallback['name'] == 'Redis':
                    value = fallback['client'].get(key)
                    if value:
                        return json.loads(value)
            except Exception as e:
                print(f"⚠️ Cache fallback error: {e}")
                continue
        
        return None
    
    def set_fallback_cache(self, key: str, value: Any, ttl: int = 3600):
        """Set value in fallback cache"""
        if not self.cache_fallbacks:
            return False
        
        for fallback in self.cache_fallbacks:
            try:
                if fallback['name'] == 'Redis':
                    fallback['client'].setex(key, ttl, json.dumps(value))
                    return True
            except Exception as e:
                print(f"⚠️ Cache fallback error: {e}")
                continue
        
        return False
    
    def _get_from_lru_cache(self, key: str) -> Optional[Dict]:
        """Get item from LRU cache, moving it to end if found"""
        if key in self._query_lru_cache:
            value = self._query_lru_cache.pop(key)
            self._query_lru_cache[key] = value
            return value
        return None
    
    def _set_in_lru_cache(self, key: str, value: Dict):
        """Set item in LRU cache, evicting oldest if necessary"""
        if key in self._query_lru_cache:
            self._query_lru_cache.pop(key)
        elif len(self._query_lru_cache) >= self._max_cache_size:
            self._query_lru_cache.popitem(last=False)
        
        self._query_lru_cache[key] = value
    
    def get_storage_path(self) -> Path:
        """Get storage directory path"""
        return self.base_storage_dir
    
    def load_index(self) -> Optional[FAISS]:
        """
        Load FAISS index
        
        Returns:
            FAISS vectorstore or None if doesn't exist
        """
        index_path = self.base_storage_dir / "faiss_index"
        
        print(f"🔍 Checking if index path exists: {index_path}")
        if not index_path.exists():
            print(f"❌ Index path does not exist: {index_path}")
            return None
        
        print(f"🔍 Index path exists, checking contents...")
        index_files = list(index_path.glob("*"))
        print(f"🔍 Found {len(index_files)} files in index directory: {[f.name for f in index_files]}")
        
        # Check for required FAISS files
        faiss_index_file = index_path / "index.faiss"
        faiss_pkl_file = index_path / "index.pkl"
        
        print(f"🔍 Checking for FAISS index file: {faiss_index_file}")
        if not faiss_index_file.exists():
            print(f"❌ FAISS index file not found: {faiss_index_file}")
            return None
            
        print(f"🔍 Checking for FAISS pickle file: {faiss_pkl_file}")
        if not faiss_pkl_file.exists():
            print(f"❌ FAISS pickle file not found: {faiss_pkl_file}")
            return None
        
        print(f"🔍 Both FAISS files exist. Checking file sizes...")
        index_size = faiss_index_file.stat().st_size
        pkl_size = faiss_pkl_file.stat().st_size
        print(f"🔍 index.faiss size: {index_size} bytes")
        print(f"🔍 index.pkl size: {pkl_size} bytes")
        
        try:
            print(f"� Initializing embeddings for loading...")
            # Ensure embeddings are initialized
            if not self.embeddings:
                print(f"🔄 Embeddings not initialized, calling _ensure_initialized()...")
                self._ensure_initialized()
                print(f"🔄 _ensure_initialized() completed")
            
            if not self.embeddings:
                print(f"❌ Embeddings still not initialized after _ensure_initialized()!")
                return None
            print(f"✅ Embeddings ready")
            
            print(f"📁 Attempting to load FAISS index...")
            start_time = time.time()
            
            vectorstore = FAISS.load_local(
                str(index_path),
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            
            load_time = time.time() - start_time
            print(f"✅ Successfully loaded FAISS index in {load_time:.2f} seconds")
            print(f"✅ Loaded FAISS index with {vectorstore.index.ntotal} vectors")
            return vectorstore
            
        except Exception as e:
            print(f"❌ Failed to load FAISS index: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            return None
    
    def save_index(self, vectorstore: FAISS):
        """
        Save FAISS index and update cache
        
        Args:
            vectorstore: FAISS vectorstore to save
        """
        index_path = self.base_storage_dir / "faiss_index"
        
        try:
            print(f"💾 Saving FAISS index...")
            vectorstore.save_local(str(index_path))
            
            # Update cache
            self._index_cache = vectorstore
            self._index_cache_time = time.time()
            
            print(f"✅ Saved FAISS index to {index_path}")
        except Exception as e:
            print(f"❌ Failed to save FAISS index: {e}")
            raise
    
    def ingest_file(self, file_path: str, metadata: Optional[Dict] = None) -> Dict:
        """
        Ingest a file into the RAG system
        
        Args:
            file_path: Path to the file to ingest
            metadata: Optional metadata to add to documents
            
        Returns:
            Dict with ingestion results
        """
        try:
            self._ensure_initialized()
            
            print(f"📄 Processing file: {file_path}")
            
            # Determine file type
            file_extension = Path(file_path).suffix.lower()

            if file_extension in ['.xlsx', '.xls']:
                documents = self._process_excel_file(file_path)
            elif file_extension == '.pdf':
                documents = self._process_pdf_file(file_path)
            elif file_extension == '.txt':
                documents = self._process_txt_file(file_path)
            else:
                raise Exception(f"Unsupported file type: {file_extension}")
            
            if not documents:
                raise Exception(f"No content found in {file_extension} file")
            
            # Prepare metadata
            doc_metadata = {
                "filename": os.path.basename(file_path),
                "file_path": file_path,
                "file_size": os.path.getsize(file_path),
                "file_type": file_extension,
                **(metadata or {})
            }
            
            # Update metadata for all documents
            for doc in documents:
                doc.metadata.update(doc_metadata)
            
            # Split documents into chunks
            texts = self.text_splitter.split_documents(documents)
            print(f"✂️ Created {len(texts)} chunks")
            
            # Load existing index or create new one
            existing_vectorstore = self.load_index()
            
            if existing_vectorstore is None:
                # Create new vectorstore
                print(f"🆕 Creating new vectorstore")
                vectorstore = FAISS.from_documents(texts, self.embeddings)
            else:
                # Add to existing vectorstore
                print(f"📚 Adding to existing vectorstore")
                vectorstore = existing_vectorstore
                vectorstore.add_documents(texts)
            
            # Save the updated vectorstore
            self.save_index(vectorstore)
            
            # Calculate total characters
            total_chars = sum(len(doc.page_content) for doc in documents)
            
            result = {
                "status": "success",
                "filename": doc_metadata["filename"],
                "chunks_created": len(texts),
                "total_characters": total_chars,
                "pages_processed": len(documents),
                "metadata": doc_metadata
            }
            
            print(f"✅ Successfully ingested {doc_metadata['filename']}")
            return result
            
        except Exception as e:
            error_result = {
                "status": "error",
                "error": str(e),
                "filename": os.path.basename(file_path) if file_path else "unknown"
            }
            print(f"❌ Ingestion failed: {e}")
            return error_result
    
    def _process_excel_file(self, file_path: str) -> List[Document]:
        """Process Excel file using LlamaParse with pandas fallback"""
        print(f"📊 Processing Excel file: {file_path}")
        
        # Direct pandas processing for better performance
        print(f"📊 Using pandas fallback for Excel processing: {file_path}")
        
        try:
            import pandas as pd
            
            # Read Excel file with pandas
            xls = pd.ExcelFile(file_path, engine='openpyxl')
            print(f"📋 Excel sheets found: {xls.sheet_names}")
            
            documents = []
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl')
                print(f"📋 Processing sheet: {sheet_name} with {len(df)} rows and {len(df.columns)} columns")
                
                # Convert DataFrame to text representation
                sheet_text = f"Sheet: {sheet_name}\n"
                sheet_text += f"Columns: {', '.join(df.columns)}\n"
                sheet_text += f"Total rows: {len(df)}\n\n"
                
                # Add sample data (first 10 rows)
                sample_rows = df.head(10)
                for i, (_, row) in enumerate(sample_rows.iterrows()):
                    row_text = f"Row {i+1}: "
                    row_data = []
                    for col in df.columns:
                        if pd.notna(row[col]) and str(row[col]).strip():
                            cell_text = str(row[col]).strip()
                            if len(cell_text) > 100:
                                cell_text = cell_text[:100] + "..."
                            row_data.append(f"{col}: {cell_text}")
                    row_text += " | ".join(row_data)
                    sheet_text += row_text + "\n"
                
                # Create document
                metadata = {
                    "sheet_name": sheet_name,
                    "row_count": len(df),
                    "column_count": len(df.columns),
                    "extraction_method": "pandas"
                }
                
                documents.append(Document(page_content=sheet_text.strip(), metadata=metadata))
            
            print(f"📊 Pandas fallback created {len(documents)} documents")
            return documents
            
        except Exception as pandas_error:
            print(f"⚠️ Pandas fallback failed, trying Unstructured: {pandas_error}")
        
        # Fallback 3: Try Unstructured (general purpose)
        if UNSTRUCTURED_AVAILABLE:
            try:
                print(f"📊 Using Unstructured fallback for Excel processing: {file_path}")
                
                loader = UnstructuredFileLoader(file_path)
                documents = loader.load()
                
                # Add processing method metadata
                for doc in documents:
                    if hasattr(doc, 'metadata'):
                        doc.metadata["processing_method"] = "unstructured"
                    else:
                        doc.metadata = {"processing_method": "unstructured"}
                
                if documents:
                    print(f"📊 Unstructured processed {len(documents)} documents from Excel")
                    return documents
                    
            except Exception as unstructured_error:
                print(f"⚠️ Unstructured fallback failed: {unstructured_error}")
        
        # If all methods fail, raise exception
        raise Exception(f"Failed to process Excel file with all methods (LlamaParse, pandas, Unstructured)")
    
    def _process_pdf_file(self, file_path: str) -> List[Document]:
        """Process PDF file using LlamaParse or PyPDFLoader"""
        print(f"📄 Processing PDF file: {file_path}")
        
        # Direct PyPDFLoader processing for better performance
        try:
            from langchain_community.document_loaders import PyPDFLoader
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # Add processing method metadata
            for doc in documents:
                if hasattr(doc, 'metadata'):
                    doc.metadata["processing_method"] = "pypdf"
                else:
                    doc.metadata = {"processing_method": "pypdf"}
            
            if documents:
                print(f"📄 PyPDFLoader processed {len(documents)} pages from PDF")
                return documents
                
        except Exception as pypdf_error:
            print(f"⚠️ PyPDFLoader failed, trying Unstructured: {pypdf_error}")
        
        # Fallback 3: Try Unstructured (general purpose)
        if UNSTRUCTURED_AVAILABLE:
            try:
                print(f"📄 Using Unstructured fallback for PDF processing: {file_path}")
                
                loader = UnstructuredFileLoader(file_path)
                documents = loader.load()
                
                # Add processing method metadata
                for doc in documents:
                    if hasattr(doc, 'metadata'):
                        doc.metadata["processing_method"] = "unstructured"
                    else:
                        doc.metadata = {"processing_method": "unstructured"}
                
                if documents:
                    print(f"📄 Unstructured processed {len(documents)} documents from PDF")
                    return documents
                    
            except Exception as unstructured_error:
                print(f"⚠️ Unstructured fallback failed: {unstructured_error}")
        
        # If all methods fail, raise exception
        raise Exception(f"Failed to process PDF file with all methods (LlamaParse, PyPDFLoader, Unstructured)")

    def _process_txt_file(self, file_path: str) -> List[Document]:
        """Process plain text file"""
        print(f"📝 Processing TXT file: {file_path}")
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if not content or not content.strip():
                raise Exception("Empty text file")

            # Optionally split long text into chunks using existing splitter
            base_doc = Document(page_content=content.strip(), metadata={"processing_method": "text"})
            chunks = self.text_splitter.split_documents([base_doc])
            print(f"📝 TXT processing created {len(chunks)} chunks")
            return chunks if chunks else [base_doc]
        except Exception as e:
            raise Exception(f"Failed to process TXT file: {e}")
    
    def query(self, question: str, use_web_search: bool = False, max_results: Optional[int] = None, client_tag: Optional[str] = None) -> Dict:
        """
        Query the RAG system with quality enhancements
        
        Args:
            question: User's question
            use_web_search: Whether to augment with web search
            max_results: Maximum number of chunks to retrieve
        
        Returns:
            Dict with query results and quality metrics
        """
        start_time = time.time()
        
        try:
            self._ensure_initialized()
            
            # Validate and sanitize query
            is_valid, errors = self.validate_query(question)
            if not is_valid:
                return {
                    "status": "error",
                    "question": question,
                    "error": f"Query validation failed: {'; '.join(errors)}",
                    "sources": [],
                    "web_results": None,
                    "quality_metrics": None
                }
            
            # Sanitize query
            sanitized_question = self.sanitize_query(question)
            
            # Check LRU cache first
            cache_key = f"{sanitized_question}_{max_results}"
            
            # Check LRU cache only for performance
            cached_result = self._get_from_lru_cache(cache_key)
            if cached_result:
                cached_result["cached"] = True
                return cached_result
            
            print(f"❓ Processing query: {sanitized_question[:100]}...")
            
            # Use original question directly for better performance
            enhanced_question = sanitized_question
            
            # Load the QA chain
            print(f"🔍 About to create QA chain...")
            qa_chain = self.create_or_get_qa_chain(max_results)
            if not qa_chain:
                print(f"❌ QA chain creation failed - no vectorstore available")
                return {
                    "status": "error",
                    "question": sanitized_question,
                    "error": "No documents found. Please upload files first!",
                    "sources": [],
                    "web_results": None,
                    "quality_metrics": None
                }
            print(f"✅ QA chain created successfully")
            
            # Web search disabled for performance optimization
            web_results = None
            
            # Generate answer directly with primary LLM
            retrieval_start = time.time()
            result = qa_chain.invoke({"query": enhanced_question})
            retrieval_time = time.time() - retrieval_start
            
            # Extract answer with better error handling
            answer = result.get("result", "")
            if not answer:
                answer = result.get("answer", "")
            if not answer:
                answer = result.get("output", "")
            if not answer:
                answer = "No answer generated - please try rephrasing your question"
            
            # Debug: Check what the LLM actually returned
            print(f"🔍 LLM raw result: {result}")
            print(f"🔍 LLM result type: {type(result)}")
            if hasattr(result, 'content'):
                print(f"🔍 LLM content: {result.content}")
            
            print(f"🔍 Raw result keys: {list(result.keys())}")
            print(f"🔍 Answer length: {len(answer)}")
            print(f"🔍 Answer preview: {answer[:100]}...")
            
            # Get sources
            sources = []
            if "source_documents" in result:
                for doc in result["source_documents"]:
                    source_info = {
                        "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                        "metadata": doc.metadata
                    }
                    sources.append(source_info)
            
            # Calculate basic metrics for performance monitoring
            total_time = time.time() - start_time
            
            # Simple quality scoring
            relevance_score = 0.8 if sources else 0.3  # Simple heuristic
            confidence_score = 0.7  # Default confidence
            
            result_dict = {
                "status": "success",
                "question": sanitized_question,
                "answer": answer,
                "sources": sources,
                "web_results": web_results,
                "quality_metrics": {
                    "query_time": round(total_time, 3),
                    "source_count": len(sources),
                    "relevance_score": round(relevance_score, 3),
                    "confidence_score": round(confidence_score, 3)
                },
                "cached": False
            }
            
            # Simple caching (LRU cache only, no fallback cache)
            self._set_in_lru_cache(cache_key, result_dict)
            
            # Telemetry disabled for performance optimization

            return result_dict
            
        except Exception as e:
            total_time = time.time() - start_time
            error_result = {
                "status": "error",
                "question": question,
                "error": str(e),
                "sources": [],
                "web_results": None,
                "quality_metrics": {
                    "query_time": round(total_time, 3),
                    "error": True
                }
            }

            # Telemetry disabled for performance optimization

            return error_result
    
    def create_or_get_qa_chain(self, max_results: Optional[int] = None) -> Optional[RetrievalQA]:
        """Create or get QA chain for the current index"""
        vectorstore = self.load_index()
        if not vectorstore:
            return None
        
        # Use optimized retrieval count
        retrieval_count = max_results if max_results else self.max_retrieval_results
        retriever = vectorstore.as_retriever(search_kwargs={"k": retrieval_count})
        
        # Simplified prompt for better performance
        from langchain.prompts import PromptTemplate
        
        template = """You are an AI assistant for UOB Relationship Managers. Use the context to answer the question concisely and accurately.

Context: {context}

Question: {question}

Answer:"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": prompt}
        )
        
        return qa_chain
    
    def get_stats(self) -> Dict:
        """Get system statistics"""
        self._ensure_initialized()  # Ensure components are initialized
        vectorstore = self.load_index()
        
        if not vectorstore:
            return {
                "status": "no_index",
                "total_vectors": 0,
                "index_size_mb": 0
            }
        
        # Calculate index size
        index_path = self.base_storage_dir / "faiss_index"
        index_size_mb = 0
        if index_path.exists():
            index_size_mb = sum(f.stat().st_size for f in index_path.rglob('*') if f.is_file()) / (1024 * 1024)
        
        return {
            "status": "active",
            "total_vectors": vectorstore.index.ntotal,
            "index_size_mb": round(index_size_mb, 2)
        }
    
    def reset(self):
        """Reset the RAG system (clear all data)"""
        self._ensure_initialized()  # Ensure components are initialized
        
        try:
            index_path = self.base_storage_dir / "faiss_index"
            if index_path.exists():
                shutil.rmtree(index_path)
                print("✅ RAG system reset successfully")
            else:
                print("ℹ️ No existing index to reset")
        except Exception as e:
            print(f"❌ Failed to reset RAG system: {e}")
    
    # ==================== QUALITY ENHANCEMENT METHODS ====================
    
    def analyze_query(self, query: str) -> QueryAnalysis:
        """Analyze and enhance query for better retrieval"""
        # Basic preprocessing
        query = query.strip()
        
        # Detect language
        language = self._detect_language(query)
        
        # Extract keywords
        keywords = self._extract_keywords(query, language)
        
        # Determine intent
        intent = self._determine_intent(query)
        
        # Generate enhanced query
        enhanced_query = self._enhance_query(query, keywords, intent, language)
        
        # Calculate confidence
        confidence = self._calculate_confidence(query, keywords)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(query, intent, language)
        
        return QueryAnalysis(
            original_query=query,
            enhanced_query=enhanced_query,
            keywords=keywords,
            intent=intent,
            language=language,
            confidence=confidence,
            suggestions=suggestions
        )
    
    def _detect_language(self, query: str) -> str:
        """Detect query language"""
        thai_pattern = re.compile(r'[\u0E00-\u0E7F]')
        if thai_pattern.search(query):
            return "thai"
        return "english"
    
    def _extract_keywords(self, query: str, language: str) -> List[str]:
        """Extract important keywords from query"""
        if language == "thai":
            # For Thai, use a different approach - split by spaces and filter
            stop_words = {"คือ", "อะไร", "อย่างไร", "ของ", "ใน", "ที่", "และ", "หรือ", "แต่", "กับ", "โดย", "มี", "เป็น", "จะ", "ได้", "ให้", "กับ", "จาก", "ถึง", "ที่", "นี้", "นั้น", "ไหน", "ใคร", "เมื่อ", "ทำไม", "อย่างไร", "เท่าไร", "กี่", "หลาย", "มาก", "น้อย", "ดี", "ไม่", "ใช่", "ใช่ไหม", "หรือไม่"}
            
            # Split by spaces and filter
            words = query.split()
            keywords = []
            for word in words:
                # Clean the word
                clean_word = re.sub(r'[^\u0E00-\u0E7F\u0E80-\u0EFFa-zA-Z0-9]', '', word)
                if clean_word and len(clean_word) > 1 and clean_word not in stop_words:
                    keywords.append(clean_word)
        else:
            # For English, use word boundaries
            stop_words = {"what", "is", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "are", "you", "your", "this", "that", "these", "those", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "can", "may", "might", "must"}
            
            words = re.findall(r'\b[a-zA-Z]+\b', query.lower())
            keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Limit to top 5 most relevant keywords
        return keywords[:5]
    
    def _determine_intent(self, query: str) -> str:
        """Determine query intent for RM assistant"""
        query_lower = query.lower()
        
        # RM-specific intents
        if any(word in query_lower for word in ["fact finding", "สอบถามลูกค้า", "ความต้องการลูกค้า", "ถามลูกค้า"]):
            return "fact_finding"
        elif any(word in query_lower for word in ["product", "ผลิตภัณฑ์", "ประกัน", "กรมธรรม์", "เบี้ย", "coverage"]):
            return "product_knowledge"
        elif any(word in query_lower for word in ["compliance", "กฎระเบียบ", "จรรยาบรรณ", "คปภ", "oic", "กฎ"]):
            return "compliance"
        elif any(word in query_lower for word in ["sales", "ขาย", "ปิดการขาย", "objection", "ข้อโต้แย้ง", "เจรจา"]):
            return "sales_process"
        elif any(word in query_lower for word in ["training", "ฝึก", "practice", "ซ้อม", "จำลอง"]):
            return "training"
        elif any(word in query_lower for word in ["protect", "build", "enhance", "ป้องกัน", "สร้าง", "เพิ่ม"]):
            return "needs_analysis"
        
        # General intents
        elif any(word in query_lower for word in ["what", "คือ", "อะไร", "definition"]):
            return "definition"
        elif any(word in query_lower for word in ["how", "อย่างไร", "วิธี", "how to"]):
            return "how_to"
        elif any(word in query_lower for word in ["benefit", "ประโยชน์", "ดี", "advantage"]):
            return "benefits"
        elif any(word in query_lower for word in ["compare", "เปรียบเทียบ", "ต่าง", "vs"]):
            return "comparison"
        elif any(word in query_lower for word in ["price", "ราคา", "cost", "premium"]):
            return "pricing"
        else:
            return "general"
    
    def _enhance_query(self, query: str, keywords: List[str], intent: str, language: str) -> str:
        """Enhance query for better retrieval with rule-based fallback"""
        # For now, skip LLM enhancement to avoid complexity issues
        # return self._rule_based_enhance_query(query, keywords, intent, language)
        
        # Just return the original query for now
        return query
    
    def _llm_enhance_query(self, query: str, keywords: List[str], intent: str, language: str) -> str:
        """Enhance query using LLM"""
        try:
            # Use primary LLM for enhancement
            prompt = f"""
            Enhance this query for better document retrieval:
            Original query: {query}
            Intent: {intent}
            Language: {language}
            Keywords: {', '.join(keywords) if keywords else 'None'}
            
            Return only the enhanced query, no explanations.
            """
            
            if not self.llm:
                return query
            response = self.llm.invoke(prompt)
            enhanced = response.content.strip()
            
            # Validate enhanced query
            if len(enhanced) > 10 and enhanced != query:
                return enhanced
            else:
                return query
                
        except Exception as e:
            print(f"⚠️ LLM enhancement failed: {e}")
            return query
    
    def _rule_based_enhance_query(self, query: str, keywords: List[str], intent: str, language: str) -> str:
        """Rule-based query enhancement fallback - simplified"""
        # For now, just return the original query to avoid complexity
        # The LLM works better with simple, direct queries
        return query
        
        # Uncomment below for minimal enhancement if needed
        # enhanced_parts = []
        # 
        # # Add only essential context
        # if intent == "definition":
        #     enhanced_parts.append("definition")
        # elif intent == "benefits":
        #     enhanced_parts.append("benefits")
        # 
        # # Add only the most important keywords (max 2)
        # filtered_keywords = [kw for kw in keywords if len(kw) > 2][:2]
        # enhanced_parts.extend(filtered_keywords)
        # 
        # # Combine with original query
        # enhanced_query = f"{query} {' '.join(enhanced_parts)}"
        # 
        # return enhanced_query
    
    def _calculate_confidence(self, query: str, keywords: List[str]) -> float:
        """Calculate query confidence score"""
        base_confidence = min(len(query) / 50, 1.0)
        keyword_bonus = min(len(keywords) / 5, 0.3)
        
        return min(base_confidence + keyword_bonus, 1.0)
    
    def _generate_suggestions(self, query: str, intent: str, language: str) -> List[str]:
        """Generate RM-specific query suggestions"""
        suggestions = []
        
        if intent == "fact_finding":
            if language == "thai":
                suggestions.append("เทคนิคการถามลูกค้าเพื่อเข้าใจความต้องการ")
                suggestions.append("วิธีจัดกลุ่มความต้องการลูกค้า (Protect/Build/Enhance)")
                suggestions.append("คำถามที่ควรใช้ในการ fact finding")
            else:
                suggestions.append("Effective fact-finding questions for customer needs")
                suggestions.append("How to categorize customer needs (Protect/Build/Enhance)")
                suggestions.append("Best practices for customer discovery")
        
        elif intent == "product_knowledge":
            if language == "thai":
                suggestions.append("รายละเอียดผลิตภัณฑ์ประกันที่เหมาะสม")
                suggestions.append("ข้อแตกต่างระหว่างประกันแต่ละประเภท")
                suggestions.append("วิธีอธิบายผลิตภัณฑ์ให้ลูกค้าเข้าใจ")
            else:
                suggestions.append("Product details and recommendations")
                suggestions.append("Comparing different insurance types")
                suggestions.append("How to explain products to customers")
        
        elif intent == "compliance":
            if language == "thai":
                suggestions.append("กฎระเบียบที่สำคัญในการขายประกัน")
                suggestions.append("จรรยาบรรณ 10 ข้อสำหรับตัวแทนประกัน")
                suggestions.append("วิธีปฏิบัติตามกฎของ คปภ.")
            else:
                suggestions.append("Important compliance regulations")
                suggestions.append("Insurance agent code of ethics")
                suggestions.append("OIC regulatory requirements")
        
        elif intent == "sales_process":
            if language == "thai":
                suggestions.append("วิธีการปิดการขายประกัน")
                suggestions.append("การจัดการข้อโต้แย้งจากลูกค้า")
                suggestions.append("เทคนิคการเจรจาและการขาย")
            else:
                suggestions.append("Closing techniques for insurance sales")
                suggestions.append("Handling customer objections")
                suggestions.append("Sales process best practices")
        
        elif intent == "training":
            if language == "thai":
                suggestions.append("การฝึกซ้อมการสนทนากับลูกค้า")
                suggestions.append("จำลองสถานการณ์การขาย")
                suggestions.append("การพัฒนาทักษะการขาย")
            else:
                suggestions.append("Practice customer conversations")
                suggestions.append("Role-playing sales scenarios")
                suggestions.append("Sales skill development")
        
        elif intent == "needs_analysis":
            if language == "thai":
                suggestions.append("วิเคราะห์ความต้องการในการป้องกัน")
                suggestions.append("วางแผนการสร้างความมั่งคั่ง")
                suggestions.append("เพิ่มพอร์ตการลงทุน")
            else:
                suggestions.append("Protection needs analysis")
                suggestions.append("Wealth building strategies")
                suggestions.append("Investment portfolio enhancement")
        
        # General fallbacks
        elif intent == "definition":
            if language == "thai":
                suggestions.append(f"ข้อมูลเพิ่มเติมเกี่ยวกับ {query}")
                suggestions.append(f"รายละเอียดของ {query}")
            else:
                suggestions.append(f"More details about {query}")
                suggestions.append(f"Complete information on {query}")
        
        elif intent == "benefits":
            if language == "thai":
                suggestions.append(f"ประโยชน์อื่นๆ ของ {query}")
                suggestions.append(f"ข้อดีของ {query}")
            else:
                suggestions.append(f"Other benefits of {query}")
                suggestions.append(f"Advantages of {query}")
        
        return suggestions[:3]
    
    def validate_query(self, query: str) -> Tuple[bool, List[str]]:
        """Validate query quality"""
        errors = []
        
        # Check length
        if len(query.strip()) < 3:
            errors.append("Query too short (minimum 3 characters)")
        
        if len(query) > 500:
            errors.append("Query too long (maximum 500 characters)")
        
        # Check for special characters
        if re.search(r'[<>{}[\]\\]', query):
            errors.append("Query contains invalid special characters")
        
        # Check for excessive whitespace
        if re.search(r'\s{3,}', query):
            errors.append("Query contains excessive whitespace")
        
        # Check for repetitive words
        words = query.lower().split()
        if len(words) > 2:
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
                if word_counts[word] > 3:
                    errors.append("Query contains repetitive words")
                    break
        
        return len(errors) == 0, errors
    
    def sanitize_query(self, query: str) -> str:
        """Sanitize query for safe processing"""
        query = re.sub(r'\s+', ' ', query.strip())
        query = re.sub(r'[<>{}[\]\\]', '', query)
        return query
    
    def calculate_relevance_score(self, query: str, sources: List[Dict]) -> float:
        """Calculate relevance score for retrieved sources"""
        if not sources:
            return 0.0
        
        total_score = 0.0
        query_lower = query.lower()
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        
        for source in sources:
            content = source.get("content", "").lower()
            content_words = set(re.findall(r'\b\w+\b', content))
            
            # Calculate word overlap
            overlap = len(query_words.intersection(content_words))
            if len(query_words) > 0:
                score = overlap / len(query_words)
                total_score += score
        
        return total_score / len(sources)
    
    def get_quality_metrics(self) -> Dict:
        """Get quality metrics for the system"""
        if not self.performance_metrics:
            return {"status": "no_data"}
        
        recent_metrics = self.performance_metrics[-10:]  # Last 10 queries
        
        avg_query_time = sum(m.query_time for m in recent_metrics) / len(recent_metrics)
        avg_confidence = sum(m.confidence_score for m in recent_metrics) / len(recent_metrics)
        avg_relevance = sum(m.relevance_score for m in recent_metrics) / len(recent_metrics)
        
        return {
            "avg_query_time": round(avg_query_time, 3),
            "avg_confidence": round(avg_confidence, 3),
            "avg_relevance": round(avg_relevance, 3),
            "total_queries": len(self.performance_metrics),
            "cache_hit_rate": len(self._query_lru_cache) / max(len(self.performance_metrics), 1)
        }
    
    def get_cache_stats(self) -> Dict:
        """Get cache performance statistics"""
        return {
            "lru_cache_size": len(self._query_lru_cache),
            "lru_cache_max_size": self._max_cache_size,
            "lru_cache_usage": len(self._query_lru_cache) / self._max_cache_size,
            "fallback_caches_available": len(self.cache_fallbacks)
        }

# Global RAG system instance
_rag_system = None

def get_rag_system() -> RAGSystem:
    """Get or create global RAG system instance"""
    global _rag_system
    if _rag_system is None:
        _rag_system = RAGSystem()
    return _rag_system
