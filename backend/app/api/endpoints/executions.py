"""
Execution endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, field_serializer
from datetime import datetime
import asyncio
import logging
import traceback
from app.db.database import get_db
from app.db.models import Execution, Pipeline, LLMConfig
from app.services.execution_engine import ExecutionEngine

logger = logging.getLogger(__name__)

router = APIRouter()


class ExecutionCreate(BaseModel):
    pipeline_id: int
    llm_config_id: int


class ExecutionResponse(BaseModel):
    id: int
    pipeline_id: int
    llm_config_id: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    @field_serializer('started_at', 'completed_at')
    def serialize_datetime(self, value: Optional[datetime], _info):
        if value is None:
            return None
        return value.isoformat()
    
    class Config:
        from_attributes = True


@router.post("/", response_model=ExecutionResponse)
async def create_execution(
    execution: ExecutionCreate,
    db: Session = Depends(get_db)
):
    """Create and start a new validation execution"""
    # Verify pipeline exists
    pipeline = db.query(Pipeline).filter(Pipeline.id == execution.pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Verify LLM config exists
    llm_config = db.query(LLMConfig).filter(LLMConfig.id == execution.llm_config_id).first()
    if not llm_config:
        raise HTTPException(status_code=404, detail="LLM configuration not found")
    
    # Create execution record
    db_execution = Execution(
        pipeline_id=execution.pipeline_id,
        llm_config_id=execution.llm_config_id,
        status="pending"
    )
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    
    # Start execution in background using asyncio.create_task
    # This is more reliable for async functions than FastAPI's BackgroundTasks
    async def run_execution_task():
        """Wrapper to ensure async execution runs properly and handles errors"""
        logger.info(f"[API] Scheduling background execution {db_execution.id}")
        print(f"[API] Scheduling background execution {db_execution.id}")
        try:
            await ExecutionEngine.execute_pipeline(
                db_execution.id,
                execution.pipeline_id,
                execution.llm_config_id
            )
            logger.info(f"[API] Background execution {db_execution.id} completed")
            print(f"[API] Background execution {db_execution.id} completed")
        except Exception as e:
            logger.error(f"[API ERROR] Error in background execution {db_execution.id}: {e}")
            logger.error(f"[API ERROR] Traceback: {traceback.format_exc()}")
            print(f"[API ERROR] Background execution {db_execution.id} failed: {e}")
            print(f"[API ERROR] Traceback: {traceback.format_exc()}")
            # Update execution status to failed in a new session to avoid conflicts
            from app.db.database import SessionLocal
            db_fail = SessionLocal()
            try:
                exec_fail = db_fail.query(Execution).filter(Execution.id == db_execution.id).first()
                if exec_fail:
                    exec_fail.status = "failed"
                    # Truncate error message if too long
                    error_msg = str(e)
                    if len(error_msg) > 1000:
                        error_msg = error_msg[:1000] + "... (truncated)"
                    exec_fail.error_message = error_msg
                    db_fail.commit()
                    logger.info(f"[API] Execution {db_execution.id} status updated to 'failed' due to background error.")
            finally:
                db_fail.close()
    
    asyncio.create_task(run_execution_task())
    
    logger.info(f"[API] Created execution {db_execution.id}, background task scheduled")
    print(f"[API] Created execution {db_execution.id}, background task scheduled")
    
    return db_execution


@router.get("", response_model=List[ExecutionResponse])
@router.get("/", response_model=List[ExecutionResponse])
async def list_executions(
    pipeline_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all executions"""
    try:
        query = db.query(Execution)
        if pipeline_id:
            query = query.filter(Execution.pipeline_id == pipeline_id)
        if status:
            query = query.filter(Execution.status == status)
        executions = query.order_by(Execution.started_at.desc()).offset(skip).limit(limit).all()
        return executions
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error listing executions: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error retrieving executions: {str(e)}")


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(execution_id: int, db: Session = Depends(get_db)):
    """Get a specific execution"""
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        return execution
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error retrieving execution {execution_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error retrieving execution: {str(e)}")


@router.post("/{execution_id}/cancel")
async def cancel_execution(execution_id: int, db: Session = Depends(get_db)):
    """Cancel a running execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail="Execution cannot be cancelled")
    
    execution.status = "cancelled"
    db.commit()
    return {"message": "Execution cancelled"}

