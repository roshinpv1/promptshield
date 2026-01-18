"""
Database models
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Float
from sqlalchemy.sql import func
from app.db.database import Base


class LLMConfig(Base):
    """LLM API Configuration"""
    __tablename__ = "llm_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    endpoint_url = Column(String, nullable=False)
    method = Column(String, default="POST")
    headers = Column(JSON, default={})
    payload_template = Column(Text)
    timeout = Column(Integer, default=30)
    max_retries = Column(Integer, default=3)
    environment = Column(String, default="default")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Pipeline(Base):
    """Validation Pipeline"""
    __tablename__ = "pipelines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    libraries = Column(JSON, nullable=False)  # List of library names
    test_categories = Column(JSON, nullable=False)  # List of test categories
    severity_thresholds = Column(JSON, default={})
    llm_config_id = Column(Integer, nullable=False)
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Execution(Base):
    """Validation Execution"""
    __tablename__ = "executions"
    
    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, nullable=False, index=True)
    llm_config_id = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)


class Result(Base):
    """Normalized Validation Result"""
    __tablename__ = "results"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, nullable=False, index=True)
    library = Column(String, nullable=False)
    test_category = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # critical, high, medium, low, info
    risk_type = Column(String, nullable=False)
    evidence_prompt = Column(Text)
    evidence_response = Column(Text)
    confidence_score = Column(Float, nullable=True)
    extra_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

