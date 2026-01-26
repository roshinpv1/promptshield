"""
Database models
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Float, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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


class Baseline(Base):
    """Baseline Execution for Drift Detection"""
    __tablename__ = "baselines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    llm_config_id = Column(Integer, ForeignKey("llm_configs.id"), nullable=False)
    baseline_tag = Column(String, nullable=True, index=True)  # For "golden run" tagging
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=True)  # Optional user identifier
    
    # Relationships
    execution = relationship("Execution", foreign_keys=[execution_id])
    pipeline = relationship("Pipeline", foreign_keys=[pipeline_id])
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])
    
    __table_args__ = (
        Index('idx_baseline_execution', 'execution_id'),
        Index('idx_baseline_tag', 'baseline_tag'),
    )


class Embedding(Base):
    """Embedding Vectors for Result Responses"""
    __tablename__ = "embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("results.id"), nullable=False, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False, index=True)
    embedding_vector = Column(JSON, nullable=False)  # Array of floats
    model_name = Column(String, nullable=False, default="all-MiniLM-L6-v2")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    result = relationship("Result", foreign_keys=[result_id])
    execution = relationship("Execution", foreign_keys=[execution_id])
    
    __table_args__ = (
        Index('idx_embedding_result', 'result_id'),
        Index('idx_embedding_execution', 'execution_id'),
    )


class DriftResult(Base):
    """Drift Detection Results"""
    __tablename__ = "drift_results"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False, index=True)
    baseline_execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False, index=True)
    drift_type = Column(String, nullable=False)  # output, safety, distribution, embedding, agent_tool
    metric = Column(String, nullable=False)  # e.g., "cosine_similarity", "ks_test", "safety_score_delta"
    value = Column(Float, nullable=False)  # The drift value
    threshold = Column(Float, nullable=False)  # Configured threshold
    severity = Column(String, nullable=False)  # critical, high, medium, low
    confidence = Column(Float, nullable=True)  # 0-1
    details = Column(JSON, default={})  # Additional context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    execution = relationship("Execution", foreign_keys=[execution_id])
    baseline_execution = relationship("Execution", foreign_keys=[baseline_execution_id])
    
    __table_args__ = (
        Index('idx_drift_execution', 'execution_id'),
        Index('idx_drift_baseline', 'baseline_execution_id'),
        Index('idx_drift_type', 'drift_type'),
    )


class AgentTrace(Base):
    """Agent Execution Traces for Tool/Behavior Drift Detection"""
    __tablename__ = "agent_traces"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False, index=True)
    result_id = Column(Integer, ForeignKey("results.id"), nullable=True)  # Optional link to result
    step = Column(Integer, nullable=False)  # Sequence number
    action_type = Column(String, nullable=False)  # tool_call, llm_call, decision
    tool_name = Column(String, nullable=True)  # Name of tool if action_type is tool_call
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    trace_metadata = Column(JSON, default={})  # Additional trace data (renamed from 'metadata' to avoid SQLAlchemy conflict)
    
    # Relationships
    execution = relationship("Execution", foreign_keys=[execution_id])
    result = relationship("Result", foreign_keys=[result_id])
    
    __table_args__ = (
        Index('idx_trace_execution', 'execution_id'),
        Index('idx_trace_step', 'step'),
    )

