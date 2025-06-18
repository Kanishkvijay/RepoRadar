# backend/app/models.py
from pydantic import BaseModel
from typing import List

class GitHubLink(BaseModel):
    github_link: str

    class Config:
        json_schema_extra = {
            "example": {
                "github_link": "https://github.com/user/repo"
            }
        }

class CopiedBlock(BaseModel):
    target_block: str
    distance: float
    similar_to: str

class AnalysisResult(BaseModel):
    originality_score: float
    verdict: str
    similar_projects: List[str]
    copied_blocks: List[CopiedBlock]
    idea_summary: str
    report_url: str

    class Config:
        json_schema_extra = {
            "example": {
                "originality_score": 89.0,
                "verdict": "Original",
                "similar_projects": ["Project A", "Project B"],
                "copied_blocks": [
                    {
                        "target_block": "def example(): pass",
                        "distance": 0.1,
                        "similar_to": "External code"
                    }
                ],
                "idea_summary": "AI chatbot for students",
                "report_url": "http://localhost:8000/static/report.pdf"
            }
        }