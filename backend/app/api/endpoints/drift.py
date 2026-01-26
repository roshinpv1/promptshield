"""
Drift detection API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
import logging
from app.db.database import get_db, SessionLocal
from app.db.models import DriftResult, Execution
from app.services.drift_engine import DriftEngine
from app.services.baseline_manager import BaselineManager

router = APIRouter()
logger = logging.getLogger(__name__)


class DriftCompareRequest(BaseModel):
    execution_id: int
    baseline_execution_id: Optional[int] = None
    baseline_tag: Optional[str] = None
    baseline_mode: Optional[str] = "previous"  # previous, tagged, explicit
    drift_types: Optional[List[str]] = None  # If None, check all types


class DriftResultResponse(BaseModel):
    id: int
    execution_id: int
    baseline_execution_id: int
    drift_type: str
    metric: str
    value: float
    threshold: float
    severity: str
    confidence: Optional[float] = None
    details: dict
    created_at: datetime
    
    class Config:
        from_attributes = True


class DriftSummaryResponse(BaseModel):
    drift_score: Optional[float] = None
    drift_grade: Optional[str] = None
    total_drift_results: int
    by_type: dict
    by_severity: dict


class DriftCompareResponse(BaseModel):
    drift_results: List[DriftResultResponse]
    drift_score: float
    drift_grade: str
    execution_id: int
    baseline_execution_id: int


async def run_drift_comparison(
    execution_id: int,
    baseline_execution_id: int,
    drift_types: Optional[List[str]] = None
):
    """Background task to run drift comparison"""
    logger.info(f"Starting drift comparison: execution {execution_id} vs baseline {baseline_execution_id}")
    try:
        drift_results = DriftEngine.compare_executions(
            current_execution_id=execution_id,
            baseline_execution_id=baseline_execution_id,
            drift_types=drift_types
        )
        logger.info(f"Drift comparison completed: {len(drift_results)} results")
    except Exception as e:
        logger.error(f"Error in drift comparison: {e}")
        import traceback
        logger.error(traceback.format_exc())


@router.post("/compare", response_model=DriftCompareResponse)
async def compare_executions(
    request: DriftCompareRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Compare current execution with baseline and detect drift
    
    This endpoint runs the comparison asynchronously and returns immediately.
    Use GET /drift/execution/{id} to retrieve results.
    """
    # Determine baseline execution ID
    baseline_execution_id = None
    
    if request.baseline_execution_id:
        baseline_execution_id = request.baseline_execution_id
    elif request.baseline_tag:
        baseline = BaselineManager.get_baseline_by_tag(request.baseline_tag)
        if not baseline:
            raise HTTPException(status_code=404, detail=f"Baseline with tag '{request.baseline_tag}' not found")
        baseline_execution_id = baseline.execution_id
    elif request.baseline_mode == "previous":
        # Get execution to find pipeline and LLM config
        execution = db.query(Execution).filter(Execution.id == request.execution_id).first()
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        previous_exec = BaselineManager.get_previous_execution(
            pipeline_id=execution.pipeline_id,
            llm_config_id=execution.llm_config_id
        )
        if not previous_exec:
            raise HTTPException(status_code=404, detail="No previous execution found")
        baseline_execution_id = previous_exec.id
    else:
        raise HTTPException(status_code=400, detail="Must provide baseline_execution_id, baseline_tag, or use baseline_mode='previous'")
    
    # Verify both executions exist and are completed
    current_exec = db.query(Execution).filter(Execution.id == request.execution_id).first()
    baseline_exec = db.query(Execution).filter(Execution.id == baseline_execution_id).first()
    
    if not current_exec or not baseline_exec:
        raise HTTPException(status_code=404, detail="One or both executions not found")
    
    if current_exec.status != "completed" or baseline_exec.status != "completed":
        raise HTTPException(status_code=400, detail="Both executions must be completed")
    
    # Check if comparison already exists
    existing = (
        db.query(DriftResult)
        .filter(
            DriftResult.execution_id == request.execution_id,
            DriftResult.baseline_execution_id == baseline_execution_id
        )
        .first()
    )
    
    if existing:
        # Return existing results
        all_results = (
            db.query(DriftResult)
            .filter(
                DriftResult.execution_id == request.execution_id,
                DriftResult.baseline_execution_id == baseline_execution_id
            )
            .all()
        )
        drift_score = DriftEngine.calculate_drift_score(all_results)
        drift_grade = DriftEngine.get_drift_grade(drift_score)
        
        return DriftCompareResponse(
            drift_results=[DriftResultResponse.model_validate(r) for r in all_results],
            drift_score=drift_score,
            drift_grade=drift_grade,
            execution_id=request.execution_id,
            baseline_execution_id=baseline_execution_id
        )
    
    # Run comparison in background
    background_tasks.add_task(
        run_drift_comparison,
        request.execution_id,
        baseline_execution_id,
        request.drift_types
    )
    
    # Return initial response (results will be available via GET endpoint)
    return DriftCompareResponse(
        drift_results=[],
        drift_score=100.0,
        drift_grade="A",
        execution_id=request.execution_id,
        baseline_execution_id=baseline_execution_id
    )


@router.get("/execution/{execution_id}", response_model=List[DriftResultResponse])
async def get_execution_drift_results(
    execution_id: int,
    baseline_execution_id: Optional[int] = None,
    drift_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get drift results for an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    query = db.query(DriftResult).filter(DriftResult.execution_id == execution_id)
    
    if baseline_execution_id:
        query = query.filter(DriftResult.baseline_execution_id == baseline_execution_id)
    if drift_type:
        query = query.filter(DriftResult.drift_type == drift_type)
    if severity:
        query = query.filter(DriftResult.severity == severity)
    
    results = query.order_by(DriftResult.created_at.desc()).all()
    return results


@router.get("/execution/{execution_id}/summary", response_model=DriftSummaryResponse)
async def get_execution_drift_summary(
    execution_id: int,
    baseline_execution_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get drift summary for an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    query = db.query(DriftResult).filter(DriftResult.execution_id == execution_id)
    if baseline_execution_id:
        query = query.filter(DriftResult.baseline_execution_id == baseline_execution_id)
    
    drift_results = query.all()
    
    if not drift_results:
        # Return null values to indicate no drift comparison has been made
        return DriftSummaryResponse(
            drift_score=None,
            drift_grade=None,
            total_drift_results=0,
            by_type={},
            by_severity={}
        )
    
    # Calculate drift score
    drift_score = DriftEngine.calculate_drift_score(drift_results)
    drift_grade = DriftEngine.get_drift_grade(drift_score)
    
    # Aggregate by type and severity
    by_type = {}
    by_severity = {}
    
    for result in drift_results:
        by_type[result.drift_type] = by_type.get(result.drift_type, 0) + 1
        by_severity[result.severity] = by_severity.get(result.severity, 0) + 1
    
    return DriftSummaryResponse(
        drift_score=drift_score,
        drift_grade=drift_grade,
        total_drift_results=len(drift_results),
        by_type=by_type,
        by_severity=by_severity
    )
