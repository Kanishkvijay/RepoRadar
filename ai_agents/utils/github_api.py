import os
import re
from git import Repo
from typing import Optional

def validate_github_link(github_link: str) -> bool:
    """Validate if the provided link is a GitHub repository URL."""
    pattern = r'https?://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?$'
    return bool(re.match(pattern, github_link))

def clone_repo(github_link: str, destination_path: str) -> str:
    """Clone a GitHub repository to the specified destination."""
    try:
        Repo.clone_from(github_link, destination_path)
        return destination_path
    except Exception as e:
        raise Exception(f"Failed to clone repository: {str(e)}")