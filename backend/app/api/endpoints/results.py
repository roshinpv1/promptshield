"""
Result endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, field_serializer
from app.db.database import get_db
from app.db.models import Result, Execution

router = APIRouter()


class ResultResponse(BaseModel):
    id: int
    execution_id: int
    library: str
    test_category: str
    severity: str
    risk_type: str
    evidence_prompt: Optional[str] = None
    evidence_response: Optional[str] = None
    confidence_score: Optional[float] = None
    extra_metadata: dict
    created_at: Optional[datetime] = None
    
    @field_serializer('created_at')
    def serialize_datetime(self, value: Optional[datetime], _info):
        if value is None:
            return None
        return value.isoformat()
    
    class Config:
        from_attributes = True


class ResultSummary(BaseModel):
    total_results: int
    by_severity: dict
    by_library: dict
    by_category: dict
    safety_score: Optional[float] = None  # 0-100 scale
    safety_grade: Optional[str] = None  # A, B, C, D, F


@router.get("/execution/{execution_id}", response_model=List[ResultResponse])
async def get_execution_results(
    execution_id: int,
    severity: Optional[str] = None,
    library: Optional[str] = None,
    test_category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get results for a specific execution"""
    # Verify execution exists
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    query = db.query(Result).filter(Result.execution_id == execution_id)
    
    if severity:
        query = query.filter(Result.severity == severity)
    if library:
        query = query.filter(Result.library == library)
    if test_category:
        query = query.filter(Result.test_category == test_category)
    
    results = query.order_by(Result.created_at.desc()).all()
    return results


@router.get("/execution/{execution_id}/summary", response_model=ResultSummary)
async def get_execution_summary(execution_id: int, db: Session = Depends(get_db)):
    """Get summary statistics for an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    results = db.query(Result).filter(Result.execution_id == execution_id).all()
    
    by_severity = {}
    by_library = {}
    by_category = {}
    
    # Severity weights for safety score calculation
    # Higher severity = more points deducted
    SEVERITY_WEIGHTS = {
        "critical": 20.0,  # -20 points per critical finding
        "high": 10.0,      # -10 points per high finding
        "medium": 5.0,     # -5 points per medium finding
        "low": 2.0,        # -2 points per low finding
        "info": 0.5,       # -0.5 points per info finding
    }
    
    for result in results:
        # Count by severity
        by_severity[result.severity] = by_severity.get(result.severity, 0) + 1
        
        # Count by library
        by_library[result.library] = by_library.get(result.library, 0) + 1
        
        # Count by category
        by_category[result.test_category] = by_category.get(result.test_category, 0) + 1
    
    # Calculate safety score (0-100 scale)
    # Start at 100 and deduct points based on findings
    safety_score = 100.0
    for severity, count in by_severity.items():
        weight = SEVERITY_WEIGHTS.get(severity.lower(), 1.0)
        # Apply confidence-weighted deduction if available
        # For now, simple deduction
        safety_score -= weight * count
    
    # Cap score between 0 and 100
    safety_score = max(0.0, min(100.0, safety_score))
    
    # Calculate safety grade
    if safety_score >= 90:
        safety_grade = "A"
    elif safety_score >= 80:
        safety_grade = "B"
    elif safety_score >= 70:
        safety_grade = "C"
    elif safety_score >= 60:
        safety_grade = "D"
    else:
        safety_grade = "F"
    
    return ResultSummary(
        total_results=len(results),
        by_severity=by_severity,
        by_library=by_library,
        by_category=by_category,
        safety_score=round(safety_score, 2),
        safety_grade=safety_grade
    )


@router.get("/{result_id}", response_model=ResultResponse)
async def get_result(result_id: int, db: Session = Depends(get_db)):
    """Get a specific result"""
    result = db.query(Result).filter(Result.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result

