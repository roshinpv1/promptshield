"""
Baseline API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.db.models import Baseline, Execution
from app.services.baseline_manager import BaselineManager

router = APIRouter()


class BaselineCreate(BaseModel):
    execution_id: int
    name: str
    description: Optional[str] = None
    tag: Optional[str] = None
    created_by: Optional[str] = None


class BaselineResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    execution_id: int
    pipeline_id: int
    llm_config_id: int
    baseline_tag: Optional[str] = None
    created_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True


@router.post("/", response_model=BaselineResponse)
async def create_baseline(
    baseline: BaselineCreate,
    db: Session = Depends(get_db)
):
    """Create a baseline from an execution"""
    try:
        baseline_obj = BaselineManager.create_baseline(
            execution_id=baseline.execution_id,
            name=baseline.name,
            description=baseline.description,
            tag=baseline.tag,
            created_by=baseline.created_by
        )
        return baseline_obj
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating baseline: {str(e)}")


@router.get("/", response_model=List[BaselineResponse])
async def list_baselines(
    pipeline_id: Optional[int] = None,
    llm_config_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List all baselines, optionally filtered"""
    baselines = BaselineManager.list_baselines(
        pipeline_id=pipeline_id,
        llm_config_id=llm_config_id
    )
    return baselines


@router.get("/{baseline_id}", response_model=BaselineResponse)
async def get_baseline(
    baseline_id: int,
    db: Session = Depends(get_db)
):
    """Get baseline by ID"""
    baseline = BaselineManager.get_baseline(baseline_id)
    if not baseline:
        raise HTTPException(status_code=404, detail="Baseline not found")
    return baseline


@router.delete("/{baseline_id}")
async def delete_baseline(
    baseline_id: int,
    db: Session = Depends(get_db)
):
    """Delete a baseline"""
    success = BaselineManager.delete_baseline(baseline_id)
    if not success:
        raise HTTPException(status_code=404, detail="Baseline not found")
    return {"message": "Baseline deleted successfully"}


@router.get("/tag/{tag}", response_model=BaselineResponse)
async def get_baseline_by_tag(
    tag: str,
    db: Session = Depends(get_db)
):
    """Get baseline by tag"""
    baseline = BaselineManager.get_baseline_by_tag(tag)
    if not baseline:
        raise HTTPException(status_code=404, detail=f"Baseline with tag '{tag}' not found")
    return baseline
