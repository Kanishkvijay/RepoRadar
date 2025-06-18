from .repo_fetcher import RepoFetcher
from .code_parser import CodeParser
from .code_similarity import CodeSimilarity
from .doc_analyzer import DocAnalyzer
from .idea_checker import IdeaChecker
from .contrib_analyzer import ContribAnalyzer
from .scorer import Scorer
from .report_generator import ReportGenerator
from typing import Dict
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_full_analysis(repo_url: str) -> Dict:
    fetcher = RepoFetcher()
    parser = CodeParser()
    similarity = CodeSimilarity()
    doc_analyzer = DocAnalyzer()
    idea_checker = IdeaChecker()
    contrib_analyzer = ContribAnalyzer()
    scorer = Scorer()
    report_generator = ReportGenerator()

    try:
        metadata = fetcher.fetch_repo(repo_url)
    except Exception as e:
        logger.error(f"Failed to fetch repo {repo_url}: {str(e)}")
        metadata = {"name": "Unknown", "url": repo_url, "files": [], "readme": ""}

    code_blocks = []
    try:
        for file in metadata.get("files", []):
            blocks = parser.parse_code(file.get("content", ""), file_name=file.get("name", ""))
            code_blocks.extend(blocks)
    except Exception as e:
        logger.warning(f"Error parsing files: {str(e)}")

    code_sim = {"similarity_score": 0.0, "copied_blocks": [], "similar_repos": []}
    if code_blocks:
        try:
            parser.store_embeddings(
                [b["embedding"] for b in code_blocks if "embedding" in b],
                [b["block"] for b in code_blocks if "block" in b],
                metadata.get("name", "Unknown")
            )
            code_sim = similarity.compare(code_blocks, metadata.get("name", "Unknown"))
        except Exception as e:
            logger.error(f"Error in code similarity: {str(e)}")

    try:
        idea_summary = doc_analyzer.summarize_idea(metadata.get("readme", "") or "")
    except Exception as e:
        logger.error(f"Error summarizing idea: {str(e)}")
        idea_summary = "No project description available."

    try:
        idea_check = idea_checker.check_idea(idea_summary, metadata.get("name", "Unknown"))
    except Exception as e:
        logger.error(f"Error checking idea: {str(e)}")
        idea_check = {"idea_similarity_score": 0.0, "verdict": "Unique", "similar_projects": []}

    try:
        contrib_score = contrib_analyzer.analyze_contributions(repo_url)
    except Exception as e:
        logger.error(f"Error analyzing contributions: {str(e)}")
        contrib_score = {"credibility_score": 80.0}

    analysis = {
        "metadata": metadata,
        "code_similarity": code_sim,
        "idea_summary": idea_summary,
        "idea_check": idea_check,
        "contribution_credibility": contrib_score,
    }
    logger.info(f"Analysis dict: {analysis}")

    try:
        originality = scorer.calculate_originality(analysis)
    except Exception as e:
        logger.error(f"Error calculating originality: {str(e)}")
        originality = {"originality_score": 80.0, "verdict": "Original"}

    analysis["originality"] = originality
    try:
        report_url = report_generator.generate_report(analysis)
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        report_url = "http://localhost:8000/static/report.txt"

    # Extract the top 5 similar projects from combined sources
    similar_projects = []
    
    # Add projects from idea check
    if "similar_projects" in idea_check:
        similar_projects.extend(idea_check["similar_projects"][:3])
        
    # Add projects from code similarity
    if "similar_repos" in code_sim:
        for repo in code_sim["similar_repos"][:7]:  # Take up to 7 from code similarity
            if repo["name"] not in similar_projects:
                similar_projects.append(repo["name"])
                
    # Limit to top 10
    similar_projects = similar_projects[:10]

    result = {
        "originality_score": originality.get("originality_score", 80.0),
        "verdict": originality.get("verdict", "Original"),
        "similar_projects": similar_projects,
        "copied_blocks": code_sim.get("copied_blocks", []),
        "idea_summary": idea_summary,
        "report_url": report_url,
    }
    logger.info(f"Final result: {result}")
    return result