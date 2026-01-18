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
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

