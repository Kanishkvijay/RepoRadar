import os
from typing import Dict

def format_report_data(analysis: Dict) -> Dict:
    """Format analysis data for report generation."""
    return {
        "project_name": analysis["metadata"]["name"],
        "originality_score": f"{analysis['originality']['originality_score']:.2f}",
        "verdict": analysis["originality"]["verdict"],
        "idea_summary": analysis["idea_summary"],
        "similar_projects": ", ".join(analysis["idea_check"]["similar_projects"]),
        "code_similarity": f"{analysis['code_similarity']['similarity_score']:.2f}",
        "copied_blocks_count": len(analysis["code_similarity"]["copied_blocks"]),
        "credibility_score": f"{analysis['contribution_credibility']['credibility_score']:.2f}"
    }