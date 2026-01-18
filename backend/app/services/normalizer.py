"""
Result Normalization Layer - Converts library outputs to common schema
"""

from typing import Dict, Any, Optional
from datetime import datetime


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
    
    def normalize(self, raw_result: Dict[str, Any], execution_id: int) -> Dict[str, Any]:
        """
        Normalize a raw result from any library to common schema
        
        Common schema:
        - execution_id: int
        - library: str
        - test_category: str
        - severity: str (critical, high, medium, low, info)
        - risk_type: str
        - evidence_prompt: str (optional)
        - evidence_response: str (optional)
        - confidence_score: float (optional)
        - extra_metadata: dict (optional)
        """
        normalized = {
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
            normalized["extra_metadata"]["raw"] = raw_result
        
        return normalized
    
    def _normalize_severity(self, severity: str) -> str:
        """Normalize severity to standard levels"""
        severity_lower = severity.lower() if severity else "info"
        return self.SEVERITY_MAPPING.get(severity_lower, "info")

