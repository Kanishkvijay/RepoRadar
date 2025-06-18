import os
from typing import List

def filter_code_files(directory: str) -> List[str]:
    """Filter files with code extensions in a directory."""
    code_extensions = (".py", ".java", ".cpp")
    code_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(code_extensions):
                code_files.append(os.path.join(root, file))
    return code_files

def read_file_content(file_path: str) -> str:
    """Read file content with error handling."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        print(f"Skipping file {file_path}: Unicode decode error")
        return ""
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
        return ""