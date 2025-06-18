from typing import Dict
import logging
import numpy as np

logger = logging.getLogger(__name__)

class Scorer:
    def calculate_originality(self, analysis: Dict) -> Dict:
        try:
            # Get the code similarity score (0-1 range)
            code_sim_score = analysis.get("code_similarity", {}).get("similarity_score", 0.0)
            
            # Map code similarity to originality (100% - similarity%)
            # Higher similarity means lower originality
            code_score = (1.0 - code_sim_score) * 100
        except Exception as e:
            logger.warning(f"Error in code_similarity: {str(e)}")
            code_score = 80.0
            
        try:
            # Get idea similarity score (0-1 range)
            idea_sim_score = analysis.get("idea_check", {}).get("idea_similarity_score", 0.0)
            
            # Map idea similarity to originality score
            idea_score = (1.0 - idea_sim_score) * 100
        except Exception as e:
            logger.warning(f"Error in idea_check: {str(e)}")
            idea_score = 80.0
            
        try:
            # Get contribution credibility score (0-100 range)
            contrib_score = analysis.get("contribution_credibility", {}).get("credibility_score", 80.0)
        except Exception as e:
            logger.warning(f"Error in contribution_credibility: {str(e)}")
            contrib_score = 80.0

        # Calculate weighted originality score
        # Increase weight of code similarity since it's more objective
        originality = (code_score * 0.5 + idea_score * 0.3 + contrib_score * 0.2)
        
        # Clamp score to reasonable range
        originality = max(0.0, min(100.0, originality))
        
        # Provide more nuanced verdict with descriptive text
        if originality >= 90:
            verdict = "Highly Original - The project shows exceptional originality across code, concept, and execution"
        elif originality >= 80:
            verdict = "Original - The project demonstrates significant originality with minor similarities to existing work"
        elif originality >= 70:
            verdict = "Mostly Original - The project contains original elements but shows influence from existing work"
        elif originality >= 60:
            verdict = "Partially Original - The project has some original aspects but borrows heavily from existing work"
        elif originality >= 45:
            verdict = "Inspired - The project is heavily inspired by existing work with some modifications"
        else:
            verdict = "Derivative - The project closely resembles existing work with minimal original contribution"
        
        logger.info(f"code_score={code_score:.2f}, idea_score={idea_score:.2f}, contrib_score={contrib_score:.2f}, originality={originality:.2f}")
        return {"originality_score": float(originality), "verdict": verdict}