import os
from typing import Optional
from fastapi import Depends
import git
import faiss
from transformers import AutoTokenizer, AutoModel
import torch
from sentence_transformers import SentenceTransformer
from github import Github
import pandas as pd
from jinja2 import Environment, FileSystemLoader
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load .env file
load_dotenv()

class AgentManager:
    def __init__(self):
        self.agents = {}
        self.temp_dir = "temp_repos"
        self.faiss_index_path = "faiss_index"
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.faiss_index_path, exist_ok=True)
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            logger.error("GITHUB_TOKEN not found in environment")
            raise ValueError("GITHUB_TOKEN environment variable is required")
        self.g = Github(github_token)
        logger.info("AgentManager initialized")

    async def analyze(self, github_link: str):
        from ai_agents.agents import run_full_analysis
        from ai_agents.utils.github_api import validate_github_link

        if not validate_github_link(github_link):
            raise ValueError("Invalid GitHub repository URL")

        try:
            analysis = run_full_analysis(github_link)
            logger.info(f"Analysis completed for {github_link}: {analysis}")
            return {
                "originality_score": analysis.get("originality_score", 85.0),
                "verdict": analysis.get("verdict", "Original"),
                "similar_projects": analysis.get("similar_projects", []),
                "copied_blocks": [
                    {
                        "target_block": block.get("target_block", ""),
                        "distance": block.get("distance", 1.0),
                        "similar_to": block.get("similar_to", "Unknown")
                    } for block in analysis.get("copied_blocks", [])
                ],
                "idea_summary": analysis.get("idea_summary", "No summary available"),
                "report_url": analysis.get("report_url", "http://localhost:8000/static/report.txt")
            }
        except Exception as e:
            logger.error(f"Analysis failed for {github_link}: {str(e)}")
            raise

def get_agent_manager():
    return AgentManager()