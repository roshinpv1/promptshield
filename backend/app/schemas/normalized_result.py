"""
Pydantic models for normalized validation results
"""

from typing import Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, validator


class NormalizedResult(BaseModel):
    """
    Normalized validation result schema with runtime validation
    
    This model ensures all normalized results conform to a consistent schema
    and provides type safety and validation.
    """
    execution_id: int = Field(..., description="Execution ID this result belongs to")
    library: str = Field(..., description="Library that generated this result")
    test_category: str = Field(..., description="Test category (e.g., prompt_injection, bias)")
    severity: Literal["critical", "high", "medium", "low", "info"] = Field(
        ..., 
        description="Severity level of the finding"
    )
    risk_type: str = Field(..., description="Type of risk detected")
    evidence_prompt: Optional[str] = Field(None, description="Prompt that triggered the finding")
    evidence_response: Optional[str] = Field(None, description="LLM response that contains the finding")
    confidence_score: Optional[float] = Field(
        None, 
        ge=0.0, 
        le=1.0, 
        description="Confidence score (0.0 to 1.0)"
    )
    extra_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata from the library"
    )
    
    @validator('severity')
    def validate_severity(cls, v):
        """Validate severity is one of the allowed values"""
        valid_severities = ["critical", "high", "medium", "low", "info"]
        if v not in valid_severities:
            raise ValueError(f"Severity must be one of {valid_severities}, got '{v}'")
        return v
    
    @validator('confidence_score')
    def validate_confidence(cls, v):
        """Validate confidence score is in valid range"""
        if v is not None and (v < 0.0 or v > 1.0):
            raise ValueError(f"Confidence score must be between 0.0 and 1.0, got {v}")
        return v
    
    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "execution_id": 1,
                "library": "garak",
                "test_category": "prompt_injection",
                "severity": "critical",
                "risk_type": "prompt_injection",
                "evidence_prompt": "Ignore all previous instructions...",
                "evidence_response": "I am programmed to...",
                "confidence_score": 0.85,
                "extra_metadata": {
                    "raw": {}
                }
            }
        }
