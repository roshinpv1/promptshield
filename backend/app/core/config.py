"""
Application configuration
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PromptShield"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./promptshield.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Execution
    MAX_CONCURRENT_EXECUTIONS: int = 10
    DEFAULT_TIMEOUT: int = 300  # seconds
    MAX_RETRIES: int = 3
    
    # Storage
    RESULTS_DIR: str = "./results"
    REPORTS_DIR: str = "./reports"
    
    # Drift Detection
    DRIFT_THRESHOLDS: dict = {
        "output": 0.2,
        "safety": 0.15,
        "distribution": 0.2,
        "embedding": 0.3,
        "agent_tool": 0.25,
    }
    EMBEDDING_SERVICE_URL: str = "http://127.0.0.1:1234/v1/embeddings"  # Embedding service endpoint URL
    EMBEDDING_MODEL_NAME: str = "text-embedding-nomic-embed-text-v1.5"  # Model name identifier (for tracking purposes)
    ENABLE_AGENT_TRACES: bool = True  # Set to True to enable agent trace extraction
    DRIFT_COMPARISON_TIMEOUT: int = 600  # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

