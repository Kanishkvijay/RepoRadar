import faiss
import numpy as np
from typing import List, Dict
import os
import logging
from github import Github
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import time

logger = logging.getLogger(__name__)
load_dotenv()

class CodeSimilarity:
    def __init__(self):
        self.faiss_index_path = "faiss_index"
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            logger.error("GITHUB_TOKEN not set")
            raise ValueError("GITHUB_TOKEN environment variable is required")
        self.g = Github(github_token)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def find_similar_github_repos(self, repo_name: str, code_sample: str) -> List[Dict]:
        """Find similar repositories on GitHub using code samples"""
        similar_repos = []
        keywords = repo_name.replace("_", " ").replace("-", " ").strip()
        
        try:
            # Extract potential keywords from code sample
            if code_sample and len(code_sample) > 100:
                # Use first 20-30 words from combined code for search context
                code_keywords = " ".join(code_sample.split()[:30])
                keywords = f"{keywords} {code_keywords}"
            
            query = f"{keywords} language:python -in:name {repo_name}"
            repos = self.g.search_repositories(query=query, sort="stars", order="desc")
            
            # Get top 10 repositories
            count = 0
            for repo in repos:
                if count >= 10:
                    break
                    
                if repo.full_name.lower() != repo_name.lower():
                    try:
                        # Get repo description and README if available
                        description = repo.description or ""
                        readme_content = ""
                        try:
                            readme = repo.get_readme()
                            readme_content = readme.decoded_content.decode('utf-8')[:500]  # First 500 chars
                        except:
                            pass
                            
                        # Calculate semantic similarity between repos
                        repo_text = f"{repo.name} {description} {readme_content}"
                        query_text = f"{repo_name} {code_sample[:500]}"
                        
                        repo_emb = self.model.encode(repo_text, convert_to_numpy=True)
                        query_emb = self.model.encode(query_text, convert_to_numpy=True)
                        
                        # Calculate cosine similarity
                        similarity = np.dot(repo_emb, query_emb) / (np.linalg.norm(repo_emb) * np.linalg.norm(query_emb))
                        
                        similar_repos.append({
                            "name": repo.full_name,
                            "url": repo.html_url,
                            "description": description[:100] + "..." if len(description) > 100 else description,
                            "similarity": float(similarity)
                        })
                        count += 1
                    except Exception as e:
                        logger.warning(f"Error processing repo {repo.full_name}: {str(e)}")
                    
                    time.sleep(0.2)  # Avoid rate limiting
            
            # Sort by similarity score
            similar_repos = sorted(similar_repos, key=lambda x: x["similarity"], reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to search GitHub: {str(e)}")
            
        return similar_repos[:10]  # Ensure we return at most 10

    def compare(self, code_blocks: List[Dict], repo_name: str) -> Dict:
        if not code_blocks:
            logger.info(f"No code blocks for {repo_name}")
            return {"similarity_score": 0.0, "copied_blocks": [], "similar_repos": []}

        valid_blocks = [
            b for b in code_blocks
            if isinstance(b.get("embedding"), np.ndarray) and b.get("embedding").size > 0
        ]
        if not valid_blocks:
            logger.info(f"No valid embeddings for {repo_name}")
            return {"similarity_score": 0.0, "copied_blocks": [], "similar_repos": []}

        embeddings = np.vstack([b["embedding"] for b in valid_blocks]).astype(np.float32)
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)

        faiss_file = os.path.join(self.faiss_index_path, f"{repo_name}_code.faiss")
        code_file = os.path.join(self.faiss_index_path, f"{repo_name}_code.txt")
        stored_blocks = []
        if os.path.exists(code_file):
            try:
                with open(code_file, "r", encoding="utf-8") as f:
                    stored_blocks = f.read().split("==================================================")
                    stored_blocks = [b.strip() for b in stored_blocks if b.strip()]
            except Exception as e:
                logger.error(f"Failed to load code file {code_file}: {str(e)}")

        # Use external index to avoid self-matches
        external_index = faiss.IndexFlatL2(dimension)
        if os.path.exists(faiss_file):
            try:
                external_index = faiss.read_index(faiss_file)
            except Exception as e:
                logger.error(f"Failed to load FAISS index {faiss_file}: {str(e)}")

        copied_blocks = []
        similarity_scores = []
        
        # Combine some code for finding similar repos
        combined_code = "\n".join([block["block"][:200] for block in valid_blocks[:5]])
        similar_repos = self.find_similar_github_repos(repo_name, combined_code)
        
        if external_index.ntotal > 0:
            distances, indices = external_index.search(embeddings, k=2)
            for i in range(len(valid_blocks)):
                distance = distances[i, 0]
                
                # Calculate normalized similarity score (1.0 = identical, 0.0 = completely different)
                # Convert L2 distance to similarity
                # A more reasonable similarity threshold
                similarity = max(0.0, min(1.0, 1.0 - distance / 10.0))
                similarity_scores.append(similarity)
                
                # Only consider blocks with meaningful similarity
                if similarity > 0.7:  # More reasonable threshold
                    block_text = valid_blocks[i]["block"]
                    block_text = block_text if len(block_text) < 400 else block_text[:397] + "..."
                    copied_blocks.append({
                        "target_block": block_text,
                        "distance": float(similarity),  # Using similarity instead of distance
                        "similar_to": stored_blocks[indices[i, 0]] if indices[i, 0] < len(stored_blocks) else "External code"
                    })
        
        # Calculate overall similarity - average of block similarities with reasonable weighting
        # If no similarities were found, score is 0
        similarity_score = np.mean(similarity_scores) if similarity_scores else 0.0
        
        # Instead of artificially capping, use a more reasonable transformation
        # This will map the raw similarity (0-1) to a more balanced score
        # Making the score more realistic while still punishing high similarity
        similarity_score = float(similarity_score)
        
        # Sort copied blocks by similarity (higher values first)
        copied_blocks = sorted(copied_blocks, key=lambda x: x["distance"], reverse=True)[:5]

        # Update index
        index.add(embeddings)
        try:
            os.makedirs(self.faiss_index_path, exist_ok=True)
            faiss.write_index(index, faiss_file)
            
            # Also store the code blocks for later reference
            with open(code_file, "w", encoding="utf-8") as f:
                for i, block in enumerate(valid_blocks):
                    f.write(f"Block {i}:\n{block['block']}\n{'='*50}\n")
                    
        except Exception as e:
            logger.error(f"Failed to save FAISS index {faiss_file}: {str(e)}")

        result = {
            "similarity_score": similarity_score,
            "copied_blocks": copied_blocks,
            "similar_repos": similar_repos
        }
        logger.info(f"Code similarity result for {repo_name}: {similarity_score:.4f}")
        return result