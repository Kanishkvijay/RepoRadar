import os

class LLMConfig:
    """Configuration for language model settings."""
    MODEL_NAME = "llama-3.3-70b-versatile"
    API_KEY = os.getenv("GROQ_API_KEY")
    MAX_TOKENS = 200
    TEMPERATURE = 0.7

    @classmethod
    def validate(cls):
        if not cls.API_KEY:
            raise ValueError("GROQ_API_KEY environment variable is required")