"""
Validation Pipeline endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, field_serializer
from app.db.database import get_db
from app.db.models import Pipeline

router = APIRouter()


class PipelineCreate(BaseModel):
    name: str
    description: str = ""
    libraries: List[str]  # e.g., ["garak", "pyrit", "langtest"]
    test_categories: List[str]  # e.g., ["prompt_injection", "jailbreak", "bias"]
    severity_thresholds: dict = {}
    llm_config_id: int
    is_template: bool = False


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    libraries: Optional[List[str]] = None
    test_categories: Optional[List[str]] = None
    severity_thresholds: Optional[dict] = None
    llm_config_id: Optional[int] = None
    is_template: Optional[bool] = None


class PipelineResponse(BaseModel):
    id: int
    name: str
    description: str
    libraries: List[str]
    test_categories: List[str]
    severity_thresholds: dict
    llm_config_id: int
    is_template: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: Optional[datetime], _info):
        if value is None:
            return None
        return value.isoformat()
    
    class Config:
        from_attributes = True


@router.post("/", response_model=PipelineResponse)
async def create_pipeline(pipeline: PipelineCreate, db: Session = Depends(get_db)):
    """Create a new validation pipeline"""
    db_pipeline = Pipeline(**pipeline.dict())
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    return db_pipeline


@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(
    is_template: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all pipelines"""
    query = db.query(Pipeline)
    if is_template is not None:
        query = query.filter(Pipeline.is_template == is_template)
    pipelines = query.offset(skip).limit(limit).all()
    return pipelines


@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    """Get a specific pipeline"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


@router.put("/{pipeline_id}", response_model=PipelineResponse)
async def update_pipeline(
    pipeline_id: int,
    pipeline_update: PipelineUpdate,
    db: Session = Depends(get_db)
):
    """Update a pipeline"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    update_data = pipeline_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pipeline, field, value)
    
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    """Delete a pipeline"""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    db.delete(pipeline)
    db.commit()
    return {"message": "Pipeline deleted successfully"}

