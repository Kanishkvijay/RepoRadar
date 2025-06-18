from groq import Groq
from typing import Dict
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class DocAnalyzer:
    def __init__(self):
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            logger.error("GROQ_API_KEY not set")
            raise ValueError("GROQ_API_KEY environment variable is required")
        self.client = Groq(api_key=groq_api_key)

    def summarize_idea(self, text: str) -> str:
        if not text.strip():
            logger.info("No README content")
            return "No project description available."
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": (
                            "Summarize the core idea of this project in one sentence (max 15 words), "
                            "focusing on unique functionality, excluding tools or languages: "
                            f"{text[:1000]}"
                        )
                    }
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=20
            )
            summary = response.choices[0].message.content.strip()
            summary = ' '.join(summary.split()[:15])
            logger.info(f"Idea summary: {summary}")
            return summary
        except Exception as e:
            logger.error(f"Error summarizing idea: {str(e)}")
            return "Failed to summarize project idea."