"""
Result Normalization Layer - Converts library outputs to common schema
"""

from typing import Dict, Any, Optional, Union
from datetime import datetime
from app.schemas.normalized_result import NormalizedResult


class ResultNormalizer:
    """Normalizes results from different libraries to a common schema"""
    
    SEVERITY_MAPPING = {
        "critical": "critical",
        "high": "high",
        "medium": "medium",
        "low": "low",
        "info": "info",
        "warning": "medium",
        "error": "high",
    }
    
    def normalize(
        self, 
        raw_result: Dict[str, Any], 
        execution_id: int,
        return_dict: bool = False
    ) -> Union[NormalizedResult, Dict[str, Any]]:
        """
        Normalize a raw result from any library to common schema
        
        Args:
            raw_result: Raw result dictionary from library adapter
            execution_id: Execution ID this result belongs to
            return_dict: If True, return dict instead of Pydantic model (for backward compatibility)
        
        Returns:
            NormalizedResult (Pydantic model) or dict if return_dict=True
        """
        # Extract and normalize fields
        normalized_data = {
            "execution_id": execution_id,
            "library": raw_result.get("library", "unknown"),
            "test_category": raw_result.get("test_category", "unknown"),
            "severity": self._normalize_severity(raw_result.get("severity", "info")),
            "risk_type": raw_result.get("risk_type", raw_result.get("test_category", "unknown")),
            "evidence_prompt": raw_result.get("prompt") or raw_result.get("input") or raw_result.get("evidence_prompt"),
            "evidence_response": raw_result.get("response") or raw_result.get("output") or raw_result.get("evidence_response"),
            "confidence_score": raw_result.get("confidence") or raw_result.get("confidence_score"),
            "extra_metadata": raw_result.get("metadata", {})
        }
        
        # Preserve original library-specific fields in metadata
        if "metadata" not in raw_result:
            normalized_data["extra_metadata"]["raw"] = raw_result
        
        # Validate and create Pydantic model
        try:
            normalized_result = NormalizedResult(**normalized_data)
            
            # Return dict if requested (for backward compatibility)
            if return_dict:
                return normalized_result.dict()
            
            return normalized_result
        except Exception as e:
            # If validation fails, log and return dict with warning
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Validation failed for normalized result: {e}. Returning dict.")
            return normalized_data
    
    def _normalize_severity(self, severity: str) -> str:
        """Normalize severity to standard levels"""
        severity_lower = severity.lower() if severity else "info"
        return self.SEVERITY_MAPPING.get(severity_lower, "info")

