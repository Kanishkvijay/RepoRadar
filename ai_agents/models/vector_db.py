import faiss
import os
import numpy as np
from typing import List

class VectorDB:
    """Manage FAISS vector database for code embeddings."""
    def __init__(self, index_path: str = "faiss_index"):
        self.index_path = index_path
        os.makedirs(index_path, exist_ok=True)

    def store_embeddings(self, embeddings: List[np.ndarray], repo_name: str):
        if not embeddings:
            print(f"No embeddings to store for {repo_name}")
            return
        index = faiss.IndexFlatL2(embeddings[0].shape[1])
        index.add(np.vstack(embeddings))
        faiss_file = os.path.join(self.index_path, f"{repo_name}_code.faiss")
        faiss.write_index(index, faiss_file)
        print(f"Saved embeddings to {faiss_file}")

    def load_index(self, repo_name: str) -> faiss.IndexFlatL2:
        faiss_file = os.path.join(self.index_path, f"{repo_name}_code.faiss")
        if os.path.exists(faiss_file):
            try:
                return faiss.read_index(faiss_file)
            except Exception as e:
                print(f"Failed to load FAISS index {faiss_file}: {str(e)}")
        dimension = 768  # Default for CodeBERT
        return faiss.IndexFlatL2(dimension)