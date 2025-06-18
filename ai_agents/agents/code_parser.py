# ai_agents/agents/code_parser.py
from transformers import AutoTokenizer, AutoModel
import torch
import ast
import faiss
import re
from typing import List, Dict, Any
import numpy as np
import os
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

class CodeParser:
    def __init__(self):
        huggingface_token = os.getenv("HUGGINGFACE_TOKEN")
        self.tokenizer = AutoTokenizer.from_pretrained(
            'microsoft/codebert-base',
            token=huggingface_token if huggingface_token else None
        )
        self.model = AutoModel.from_pretrained(
            'microsoft/codebert-base',
            token=huggingface_token if huggingface_token else None
        )
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        
        # Regex patterns for different languages
        self.patterns = {
            # JavaScript/JSX function patterns
            'js': [
                r'(function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\})', # named functions
                r'(const|let|var)\s+(\w+)\s*=\s*(?:function\s*)?\([^)]*\)\s*(?:=>)?\s*\{[\s\S]*?\}', # function expressions
                r'(class\s+\w+(?:\s+extends\s+\w+)?\s*\{[\s\S]*?\})' # classes
            ],
            # Java patterns
            'java': [
                r'((?:public|protected|private|static|final)?\s+(?:\w+\s+)*\w+\s+\w+\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{[\s\S]*?\})', # methods
                r'((?:public|protected|private)?\s+(?:abstract|final|static)?\s*class\s+\w+(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{[\s\S]*?\})' # classes
            ],
            # C/C++ patterns
            'c': [
                r'((?:\w+\s+)+\w+\s*\([^)]*\)\s*\{[\s\S]*?\})', # functions
                r'(typedef\s+struct\s*\{[\s\S]*?\}\s*\w+\s*;)', # structs
                r'(class\s+\w+(?:\s*:\s*(?:public|private|protected)\s+\w+)?\s*\{[\s\S]*?\}\s*;?)' # C++ classes
            ]
        }

    def _get_file_type(self, file_name: str) -> str:
        """Determine file type based on extension"""
        extension = file_name.split('.')[-1].lower()
        if extension in ['js', 'jsx']:
            return 'js'
        elif extension == 'java':
            return 'java'
        elif extension in ['c', 'cpp', 'cc', 'h', 'hpp']:
            return 'c'
        return 'python'

    def _generic_parse(self, code: str, file_type: str) -> List[str]:
        """Parse code using regex patterns based on file type"""
        blocks = []
        
        if file_type not in self.patterns:
            logger.warning(f"No patterns defined for file type: {file_type}")
            return blocks
        
        for pattern in self.patterns[file_type]:
            matches = re.finditer(pattern, code)
            for match in matches:
                blocks.append(match.group(0))
        
        return blocks

    def parse_code(self, code: str, file_name: str = "unknown") -> List[Dict[str, Any]]:
        if not code.strip():
            logger.info(f"Empty file {file_name}")
            return []
        
        file_type = self._get_file_type(file_name)
        blocks = []
        
        try:
            # For Python files, use AST
            if file_type == 'python':
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                        try:
                            code_block = ast.unparse(node)
                            blocks.append(code_block)
                        except Exception as e:
                            logger.warning(f"Skipping Python block in {file_name}: {str(e)}")
                            continue
            # For other file types, use regex patterns
            else:
                blocks = self._generic_parse(code, file_type)
            
            # Process blocks to get embeddings
            result_blocks = []
            for code_block in blocks:
                if not code_block.strip():
                    continue
                    
                try:
                    inputs = self.tokenizer(
                        code_block,
                        return_tensors="pt",
                        padding=True,
                        truncation=True,
                        max_length=512
                    )
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                    with torch.no_grad():
                        outputs = self.model(**inputs)
                        embedding = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
                    if not isinstance(embedding, np.ndarray):
                        logger.warning(f"Invalid embedding for block in {file_name}")
                        continue
                    result_blocks.append({"block": code_block, "embedding": embedding})
                except Exception as e:
                    logger.warning(f"Error embedding block in {file_name}: {str(e)}")
                    continue
                    
            return result_blocks
                
        except SyntaxError as e:
            logger.warning(f"Syntax error parsing file {file_name}: {str(e)}")
            # For Python files with syntax errors, try fallback to generic parsing
            if file_type == 'python':
                logger.info(f"Attempting fallback parsing for {file_name}")
                blocks = self._generic_parse(code, 'js')  # Using JS patterns as fallback
        except Exception as e:
            logger.error(f"Error parsing file {file_name}: {str(e)}")
            
        return blocks

    def store_embeddings(self, embeddings: List[np.ndarray], code_blocks: List[str], repo_name: str):
        if not embeddings or not code_blocks:
            logger.info(f"No embeddings or code blocks to store for {repo_name}")
            return
        valid_embeddings = []
        valid_blocks = []
        for emb, block in zip(embeddings, code_blocks):
            if isinstance(emb, np.ndarray) and emb.size > 0:
                valid_embeddings.append(emb)
                valid_blocks.append(block)
            else:
                logger.warning(f"Skipping invalid embedding for block in {repo_name}")
        if not valid_embeddings:
            logger.info(f"No valid embeddings to store for {repo_name}")
            return
        index = faiss.IndexFlatL2(valid_embeddings[0].shape[1])
        index.add(np.vstack(valid_embeddings))
        os.makedirs("faiss_index", exist_ok=True)
        faiss_file = os.path.join("faiss_index", f"{repo_name}_code.faiss")
        faiss.write_index(index, faiss_file)
        code_file = os.path.join("faiss_index", f"{repo_name}_code.txt")
        with open(code_file, "w", encoding="utf-8") as f:
            for i, block in enumerate(valid_blocks):
                f.write(f"Block {i}:\n{block}\n{'='*50}\n")
        logger.info(f"Saved embeddings to {faiss_file} and code to {code_file}")