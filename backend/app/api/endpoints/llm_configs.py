"""
LLM API Configuration endpoints (Postman-style)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, HttpUrl, field_serializer
from app.db.database import get_db
from app.db.models import LLMConfig

router = APIRouter()


class LLMConfigCreate(BaseModel):
    name: str
    endpoint_url: str
    method: str = "POST"
    headers: dict = {}
    payload_template: str = ""
    timeout: int = 30
    max_retries: int = 3
    environment: str = "default"


class LLMConfigUpdate(BaseModel):
    name: str = None
    endpoint_url: str = None
    method: str = None
    headers: dict = None
    payload_template: str = None
    timeout: int = None
    max_retries: int = None
    environment: str = None


class LLMConfigResponse(BaseModel):
    id: int
    name: str
    endpoint_url: str
    method: str
    headers: dict
    payload_template: str
    timeout: int
    max_retries: int
    environment: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: Optional[datetime], _info):
        if value is None:
            return None
        return value.isoformat()
    
    class Config:
        from_attributes = True


@router.post("/", response_model=LLMConfigResponse)
async def create_llm_config(config: LLMConfigCreate, db: Session = Depends(get_db)):
    """Create a new LLM API configuration"""
    db_config = LLMConfig(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.get("/", response_model=List[LLMConfigResponse])
async def list_llm_configs(
    environment: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all LLM configurations"""
    query = db.query(LLMConfig)
    if environment:
        query = query.filter(LLMConfig.environment == environment)
    configs = query.offset(skip).limit(limit).all()
    return configs


@router.get("/{config_id}", response_model=LLMConfigResponse)
async def get_llm_config(config_id: int, db: Session = Depends(get_db)):
    """Get a specific LLM configuration"""
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM configuration not found")
    return config


@router.put("/{config_id}", response_model=LLMConfigResponse)
async def update_llm_config(
    config_id: int,
    config_update: LLMConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update an LLM configuration"""
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM configuration not found")
    
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    return config


@router.delete("/{config_id}")
async def delete_llm_config(config_id: int, db: Session = Depends(get_db)):
    """Delete an LLM configuration"""
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM configuration not found")
    
    db.delete(config)
    db.commit()
    return {"message": "LLM configuration deleted successfully"}

