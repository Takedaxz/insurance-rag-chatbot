"""
Semantic-Aware Text Splitter
============================
Custom text splitter that preserves document structure and semantic boundaries.
Designed to keep lists, sections, and related content together.
"""

import re
from typing import List, Dict, Any, Optional
from langchain_text_splitters import TextSplitter
from langchain_core.documents import Document


class SemanticTextSplitter(TextSplitter):
    """
    Custom text splitter that preserves semantic structure
    """
    
    def __init__(self, 
                 chunk_size: int = 1000,
                 chunk_overlap: int = 200,
                 preserve_structure: bool = True,
                 length_function=len):
        super().__init__(
            chunk_size=chunk_size, 
            chunk_overlap=chunk_overlap,
            length_function=length_function
        )
        self.length_function = length_function
        self.preserve_structure = preserve_structure
        self._last_chunk_titles = []
        
        # Define semantic boundaries for Thai and English content
        self.structure_patterns = {
            'headers': r'^#{1,6}\s+',  # Markdown headers
            'section_headers': r'^##\s+',  # Section headers (common in your docs)
            'numbered_lists': r'^\d+\.\s+',  # Numbered lists (like ethics)
            'bullet_points': r'^[-*]\s+',  # Bullet points
            'paragraphs': r'\n\n+',  # Paragraph breaks
            'thai_ethics': r'^\d+\.\s+[\u0E00-\u0E7F]',  # Thai numbered items
        }
    
    def split_text(self, text: str) -> List[str]:
        """Split text while preserving semantic structure"""
        if not self.preserve_structure:
            return super().split_text(text)
        
        # First, identify semantic blocks
        semantic_blocks = self._extract_semantic_blocks(text)
        
        # Then create chunks that respect these boundaries
        chunks = self._create_semantic_chunks(semantic_blocks)
        
        return chunks
    
    def _extract_semantic_blocks(self, text: str) -> List[Dict[str, Any]]:
        """Extract semantic blocks from text"""
        blocks = []
        lines = text.split('\n')
        current_block = []
        current_type = 'paragraph'
        
        for line_num, line in enumerate(lines):
            # Detect block type
            # Check section headers before generic headers to avoid early match
            if re.match(self.structure_patterns['section_headers'], line):
                # Save previous block
                if current_block:
                    blocks.append({
                        'type': current_type,
                        'content': '\n'.join(current_block).strip(),
                        'start_line': line_num - len(current_block),
                        'end_line': line_num - 1
                    })
                
                # Start new section block
                current_block = [line]
                current_type = 'section'
            elif re.match(self.structure_patterns['headers'], line):
                # Save previous block
                if current_block:
                    blocks.append({
                        'type': current_type,
                        'content': '\n'.join(current_block).strip(),
                        'start_line': line_num - len(current_block),
                        'end_line': line_num - 1
                    })
                
                # Start new header block
                current_block = [line]
                current_type = 'header'
                
            elif re.match(self.structure_patterns['numbered_lists'], line) or re.match(self.structure_patterns['thai_ethics'], line):
                # Save previous block if not a list
                if current_block and current_type != 'list':
                    blocks.append({
                        'type': current_type,
                        'content': '\n'.join(current_block).strip(),
                        'start_line': line_num - len(current_block),
                        'end_line': line_num - 1
                    })
                    current_block = []
                
                current_block.append(line)
                current_type = 'list'
                
            elif re.match(self.structure_patterns['bullet_points'], line):
                # Save previous block if not a bullet list
                if current_block and current_type != 'bullet_list':
                    blocks.append({
                        'type': current_type,
                        'content': '\n'.join(current_block).strip(),
                        'start_line': line_num - len(current_block),
                        'end_line': line_num - 1
                    })
                    current_block = []
                
                current_block.append(line)
                current_type = 'bullet_list'
                
            elif line.strip() == '':
                # Empty line - end current block if it has content
                if current_block:
                    blocks.append({
                        'type': current_type,
                        'content': '\n'.join(current_block).strip(),
                        'start_line': line_num - len(current_block),
                        'end_line': line_num - 1
                    })
                    current_block = []
                    current_type = 'paragraph'
            else:
                current_block.append(line)
        
        # Add final block
        if current_block:
            blocks.append({
                'type': current_type,
                'content': '\n'.join(current_block).strip(),
                'start_line': len(lines) - len(current_block),
                'end_line': len(lines) - 1
            })
        
        # Filter out empty blocks
        blocks = [block for block in blocks if block['content'].strip()]
        
        return blocks
    
    def _extract_title_from_header(self, header_text: str) -> str:
        """Extract clean title text from a markdown header line"""
        # Remove leading hashes and whitespace
        title = re.sub(r'^#{1,6}\s*', '', header_text).strip()
        return title

    def _create_semantic_chunks(self, blocks: List[Dict[str, Any]]) -> List[str]:
        """Create chunks that preserve semantic structure"""
        chunks = []
        chunk_titles: List[Optional[str]] = []
        current_chunk = ""
        current_title: Optional[str] = None
        current_header_line: Optional[str] = None

        i = 0
        while i < len(blocks):
            block = blocks[i]
            block_content = block['content']
            block_type = block['type']

            # If we hit a header/section, atomically group it with following content until next header
            if block_type in ['header', 'section']:
                # Flush any existing chunk first
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                    chunk_titles.append(current_title)
                    current_chunk = ""

                # Update current section title
                current_title = self._extract_title_from_header(block_content)
                current_header_line = block_content.split("\n", 1)[0]

                # Build an atomic group: header + subsequent non-header blocks
                group_text = block_content
                j = i + 1
                max_group_size = int(self._chunk_size * 3 // 2)  # allow 1.5x growth for atomic groups

                while j < len(blocks) and blocks[j]['type'] not in ['header', 'section']:
                    candidate = ("\n\n" + blocks[j]['content']) if blocks[j]['content'] else ''
                    # Prefer to keep lists together even if slightly over limit
                    if len(group_text) + len(candidate) <= self._chunk_size or (blocks[j]['type'] in ['list', 'bullet_list'] and len(group_text) + len(candidate) <= max_group_size):
                        group_text += "\n\n" + blocks[j]['content']
                        j += 1
                    else:
                        break

                chunks.append(group_text.strip())
                chunk_titles.append(current_title)
                i = j
                continue

            # Non-header blocks
            if len(current_chunk) + len(block_content) > self._chunk_size:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                    chunk_titles.append(current_title)

                # Start new chunk with overlap
                if chunks and self._chunk_overlap > 0:
                    overlap_text = self._get_overlap_text(chunks[-1])
                    # Repeat header line to keep context on overflow chunks
                    if current_header_line:
                        prefix = current_header_line + "\n\n"
                    else:
                        prefix = ""
                    current_chunk = prefix + (overlap_text + "\n\n" + block_content if overlap_text else block_content)
                else:
                    if current_header_line:
                        current_chunk = current_header_line + "\n\n" + block_content
                    else:
                        current_chunk = block_content
            else:
                if current_chunk.strip():
                    current_chunk += "\n\n" + block_content
                else:
                    current_chunk = block_content

            i += 1

        # Add final chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
            chunk_titles.append(current_title)

        # Persist titles for use in split_documents metadata
        self._last_chunk_titles = chunk_titles
        return chunks
    
    def _get_overlap_text(self, previous_chunk: str) -> str:
        """Get overlap text from previous chunk"""
        if len(previous_chunk) <= self._chunk_overlap:
            return previous_chunk
        
        # Get last part of previous chunk for overlap
        return previous_chunk[-self._chunk_overlap:]
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks while preserving metadata"""
        chunks = []
        
        for doc in documents:
            text_chunks = self.split_text(doc.page_content)
            
            for i, chunk_text in enumerate(text_chunks):
                # Preserve original metadata and add chunk information
                chunk_metadata = doc.metadata.copy()
                chunk_metadata.update({
                    'chunk_index': i,
                    'total_chunks': len(text_chunks),
                    'chunking_method': 'semantic',
                    'section_title': self._last_chunk_titles[i] if i < len(self._last_chunk_titles) else None
                })
                
                chunk_doc = Document(
                    page_content=chunk_text,
                    metadata=chunk_metadata
                )
                chunks.append(chunk_doc)
        
        return chunks


class SmartChunkingStrategy:
    """
    Intelligent chunking strategy that chooses the best approach based on content
    """
    
    def __init__(self, 
                 semantic_chunk_size: int = 1000,
                 semantic_overlap: int = 200,
                 fallback_chunk_size: int = 500,
                 fallback_overlap: int = 50):
        
        self.semantic_splitter = SemanticTextSplitter(
            chunk_size=semantic_chunk_size,
            chunk_overlap=semantic_overlap,
            preserve_structure=True
        )
        
        # Fallback to standard splitter for non-structured content
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        self.fallback_splitter = RecursiveCharacterTextSplitter(
            chunk_size=fallback_chunk_size,
            chunk_overlap=fallback_overlap,
            length_function=len,
        )
    
    def should_use_semantic_chunking(self, content: str) -> bool:
        """Determine if content should use semantic chunking"""
        # Check for structured content patterns
        structured_indicators = [
            r'^\d+\.\s+',      # Numbered lists
            r'^#{1,6}\s+',     # Headers
            r'^##\s+',         # Section headers
            r'จรรยาบรรณ',      # Specific to ethics content
            r'ขั้นตอนการ',     # Process steps
            r'^[-*]\s+',       # Bullet points
        ]
        
        for pattern in structured_indicators:
            if re.search(pattern, content, re.MULTILINE):
                return True
        
        return False
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents using the best strategy for each"""
        all_chunks = []
        
        for doc in documents:
            if self.should_use_semantic_chunking(doc.page_content):
                print(f"🔍 Using semantic chunking for structured content")
                chunks = self.semantic_splitter.split_documents([doc])
                # Add metadata to indicate semantic chunking was used
                for chunk in chunks:
                    chunk.metadata['chunking_method'] = 'semantic'
            else:
                print(f"📄 Using standard chunking for unstructured content")
                chunks = self.fallback_splitter.split_documents([doc])
                # Add metadata to indicate standard chunking was used
                for chunk in chunks:
                    chunk.metadata['chunking_method'] = 'standard'
            
            all_chunks.extend(chunks)
        
        return all_chunks
