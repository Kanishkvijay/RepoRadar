# ai_agents/agents/repo_fetcher.py
import git
import os
import shutil
import time
import psutil
from pathlib import Path
from typing import Dict, List

class RepoFetcher:
    def __init__(self, temp_dir: str = "temp_repos"):
        self.temp_dir = temp_dir
        os.makedirs(temp_dir, exist_ok=True)

    def terminate_git_processes(self):
        """Terminate any running git processes to release file locks."""
        for proc in psutil.process_iter(['name']):
            if proc.info['name'].lower() == 'git.exe':
                try:
                    proc.terminate()
                    proc.wait(timeout=3)
                    print(f"Terminated git process {proc.pid}")
                except Exception as e:
                    print(f"Failed to terminate git process {proc.pid}: {str(e)}")

    def fetch_repo(self, repo_url: str) -> Dict:
        repo_name = repo_url.split("/")[-1].replace(".git", "")
        repo_path = os.path.join(self.temp_dir, repo_name)

        try:
            # Clean up existing directory
            if os.path.exists(repo_path):
                for attempt in range(3):
                    try:
                        self.terminate_git_processes()
                        shutil.rmtree(repo_path, ignore_errors=False)
                        break
                    except (PermissionError, OSError) as e:
                        print(f"Attempt {attempt + 1} failed to delete {repo_path}: {str(e)}")
                        time.sleep(2)
                else:
                    print(f"Failed to delete {repo_path} after retries")
                    repo_path = os.path.join(self.temp_dir, f"{repo_name}_{int(time.time())}")
                    os.makedirs(repo_path, exist_ok=True)

            repo = git.Repo.clone_from(repo_url, repo_path)
            metadata = {
                "name": repo_name,
                "url": repo_url,
                "commit_hash": repo.head.object.hexsha if repo.head.is_valid() else "unknown",
                "files": [],
                "readme": None,
                "license": None
            }

            for root, _, files in os.walk(repo_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        if file.endswith((".py", ".java", ".cpp", ".c", ".js", ".jsx")):
                            with open(file_path, "r", encoding="utf-8") as f:
                                content = f.read()
                            metadata["files"].append({"name": file, "content": content})
                        elif file.lower() == "readme.md":
                            with open(file_path, "r", encoding="utf-8") as f:
                                metadata["readme"] = f.read()
                        elif file.lower() == "license":
                            with open(file_path, "r", encoding="utf-8") as f:
                                metadata["license"] = f.read()
                    except UnicodeDecodeError:
                        print(f"Skipping file {file_path}: Unicode decode error")
                    except Exception as e:
                        print(f"Error reading file {file_path}: {str(e)}")

            return metadata

        except Exception as e:
            raise Exception(f"Failed to fetch repo: {str(e)}")

    def store_in_faiss(self, metadata: Dict):
        import numpy as np
        from faiss import write_index, IndexFlatL2

        if not metadata["files"]:
            print(f"No files to store in FAISS for {metadata['name']}")
            return
        embeddings = np.random.rand(len(metadata["files"]), 768).astype(np.float32)
        index = IndexFlatL2(768)
        index.add(embeddings)
        os.makedirs("faiss_index", exist_ok=True)
        write_index(index, os.path.join("faiss_index", f"{metadata['name']}.faiss"))