from github import Github
import pandas as pd
from typing import Dict
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class ContribAnalyzer:
    def __init__(self):
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
        self.g = Github(github_token)

    def analyze_contributions(self, repo_url: str) -> Dict:
        try:
            repo_name = "/".join(repo_url.split("/")[-2:]).replace(".git", "")
            repo = self.g.get_repo(repo_name)
            commits = list(repo.get_commits())
            dates = [commit.commit.author.date for commit in commits]
            df = pd.DataFrame(dates, columns=['date'])
            df['day'] = df['date'].dt.date
            daily_commits = df['day'].value_counts().sort_index()
            spikes = (daily_commits > 10).sum()
            credibility = max(0, 100 - spikes * 5 - max(0, 10 - len(commits)) * 2)
            return {"credibility_score": float(credibility)}
        except Exception as e:
            print(f"Error analyzing contributions: {str(e)}")
            return {"credibility_score": 0.0}