from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .models import GitHubLink, AnalysisResult
from .dependencies import get_agent_manager, AgentManager
from fastapi import Depends
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Project Uniqueness Checker API", description="API to analyze GitHub projects for originality")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../../static")), name="static")

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_project(github_link: GitHubLink, agent_manager: AgentManager = Depends(get_agent_manager)):
    logger.info(f"Received request to analyze: {github_link.github_link}")
    try:
        result = await agent_manager.analyze(github_link.github_link)
        logger.info(f"Analysis result: {result}")
        return AnalysisResult(**result)
    except Exception as e:
        logger.error(f"Error analyzing project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing project: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000, reload=True)
    