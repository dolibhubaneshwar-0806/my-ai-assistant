"""Simple in-memory PDF RAG system for context-aware search"""

from typing import List, Dict, Any, Tuple
import re

class PDFVectorStore:
    def __init__(self, chunk_size: int = 500, overlap: int = 100):
        self.chunk_size = chunk_size
        self.overlap = overlap
        # stores document chunks: {doc_id: [chunk1, chunk2, ...]}
        self.documents: Dict[str, List[str]] = {}

    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks of rough length."""
        text = re.sub(r'\s+', ' ', text).strip()
        words = text.split(' ')
        chunks = []
        
        i = 0
        while i < len(words):
            chunk_words = words[i:i + self.chunk_size]
            chunks.append(" ".join(chunk_words))
            if i + self.chunk_size >= len(words):
                break
            i += (self.chunk_size - self.overlap)
            
        return chunks

    def add_document(self, doc_id: str, text: str):
        """Chunk and index document text."""
        chunks = self._split_text(text)
        self.documents[doc_id] = chunks
        return len(chunks)

    def _score_chunk(self, chunk: str, query: str) -> float:
        """Score a chunk based on simple term-matching (TF-IDF alternative)."""
        query_terms = set(re.findall(r'\w+', query.lower()))
        if not query_terms:
            return 0.0
            
        chunk_words = re.findall(r'\w+', chunk.lower())
        score = 0.0
        
        for term in query_terms:
            count = chunk_words.count(term)
            if count > 0:
                score += (1.0 + re.sub(rf'[^\w\s]', '', term) in chunk.lower()) * count
                
        return score / (len(chunk_words) + 1)

    def search(self, query: str, doc_id: str = None, top_k: int = 3) -> List[Tuple[str, float]]:
        """Search across chunks for the top_k best matching entries."""
        results: List[Tuple[str, float]] = []
        
        target_docs = [doc_id] if doc_id else list(self.documents.keys())
        
        for d_id in target_docs:
            if d_id in self.documents:
                for chunk in self.documents[d_id]:
                    score = self._score_chunk(chunk, query)
                    if score > 0.0:
                        results.append((chunk, score))
                        
        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def get_context(self, query: str, doc_id: str = None, top_k: int = 3) -> str:
        """Retrieve relevant context as a single combined string."""
        matches = self.search(query, doc_id, top_k)
        if not matches:
            return ""
        return "\n---\n".join([item[0] for item in matches])


# Singleton vector store instance
pdf_store = PDFVectorStore()
