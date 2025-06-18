from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import Dict, List
import os
from github import Github
from dotenv import load_dotenv
import time
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class IdeaChecker:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            logger.error("GITHUB_TOKEN not set")
            raise ValueError("GITHUB_TOKEN environment variable is required")
        self.g = Github(github_token)

    def check_idea(self, idea_summary: str, repo_name: str) -> Dict:
        if not idea_summary.strip() or idea_summary == "No project description available.":
            logger.info(f"No valid idea summary for {repo_name}")
            return {"idea_similarity_score": 0.0, "verdict": "Unique", "similar_projects": []}

        keywords = ' '.join(idea_summary.split()[:5]).replace("system", "").replace("project", "").strip()
        if not keywords:
            keywords = repo_name.replace("_", " ").replace("-", " ").strip()

        search_terms = [keywords, repo_name.replace("_", " ").replace("-", " ").strip()]
        repo_descriptions = []
        repo_names = []
        repo_urls = []
        
        try:
            for term in search_terms:
                query = f"{term} language:python -in:name {repo_name}"
                repos = self.g.search_repositories(query=query, sort="stars", order="desc")
                
                # Get up to 10 repositories
                count = 0
                for repo in repos:
                    if count >= 10:
                        break
                        
                    description = repo.description or repo.name
                    if description and repo.full_name.lower() != repo_name.lower() and repo.full_name not in repo_names:
                        repo_descriptions.append(description)
                        repo_names.append(repo.full_name)
                        repo_urls.append(repo.html_url)
                        count += 1
                    time.sleep(0.1)
                    
                if len(repo_names) >= 10:
                    break
        except Exception as e:
            logger.error(f"Error searching GitHub: {str(e)}")
            return {"idea_similarity_score": 0.0, "verdict": "Unique", "similar_projects": []}

        if not repo_descriptions:
            logger.info(f"No similar repos found for {repo_name}")
            return {"idea_similarity_score": 0.0, "verdict": "Unique", "similar_projects": []}

        try:
            # Encode the idea summary
            idea_emb = self.model.encode(idea_summary, convert_to_numpy=True).reshape(1, -1)
            
            # Encode all repository descriptions
            repo_embs = self.model.encode(repo_descriptions, convert_to_numpy=True)
            
            # Create FAISS index
            index = faiss.IndexFlatL2(idea_emb.shape[1])
            index.add(repo_embs)
            
            # Find closest repositories
            k = min(5, len(repo_descriptions))  # Get top 5 or all if less than 5
            distances, indices = index.search(idea_emb, k)
            
            # Calculate similarity score (convert distance to similarity)
            # L2 distance to similarity conversion
            similarity = 1.0 - min(1.0, distances[0][0] / 4.0)
            
            # Create more detailed verdict with reasoning
            if similarity < 0.2:
                verdict = "Unique - The project idea appears to be highly original"
            elif similarity < 0.4:
                verdict = "Somewhat Unique - The project idea has some similarities to existing projects"
            elif similarity < 0.6:
                verdict = "Inspired - The project idea shows inspiration from existing projects"
            elif similarity < 0.8:
                verdict = "Common - The project idea is common with several similar existing projects"
            else:
                verdict = "Very Common - The project idea is highly similar to many existing projects"
                
            # Get top 5 similar projects with URLs
            similar_projects = []
            for i in indices[0]:
                if i < len(repo_names):
                    similar_projects.append({
                        "name": repo_names[i],
                        "url": repo_urls[i]
                    })
                    
            # Extract just the names for backward compatibility
            similar_project_names = [p["name"] for p in similar_projects]

        except Exception as e:
            logger.error(f"Error comparing embeddings: {str(e)}")
            return {"idea_similarity_score": 0.0, "verdict": "Unique", "similar_projects": []}

        result = {
            "idea_similarity_score": float(similarity),
            "verdict": verdict,
            "similar_projects": similar_project_names,
            "similar_project_details": similar_projects  # Add detailed project info
        }
        logger.info(f"Idea check result for {repo_name}: {result}")
        return result