"""
Baseline Manager Service - Manages baseline executions for drift detection
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Baseline, Execution, Pipeline, LLMConfig
import logging

logger = logging.getLogger(__name__)


class BaselineManager:
    """Manages baseline creation, retrieval, and management"""
    
    @staticmethod
    def create_baseline(
        execution_id: int,
        name: str,
        description: Optional[str] = None,
        tag: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Baseline:
        """
        Create a baseline from an execution
        
        Args:
            execution_id: ID of the execution to use as baseline
            name: Name for the baseline
            description: Optional description
            tag: Optional tag for "golden run" identification
            created_by: Optional user identifier
            
        Returns:
            Created Baseline object
        """
        db = SessionLocal()
        try:
            # Verify execution exists and is completed
            execution = db.query(Execution).filter(Execution.id == execution_id).first()
            if not execution:
                raise ValueError(f"Execution {execution_id} not found")
            
            if execution.status != "completed":
                raise ValueError(f"Execution {execution_id} is not completed (status: {execution.status})")
            
            # Check if baseline already exists for this execution
            existing = db.query(Baseline).filter(Baseline.execution_id == execution_id).first()
            if existing:
                logger.warning(f"Baseline already exists for execution {execution_id}")
                return existing
            
            # Create baseline
            baseline = Baseline(
                name=name,
                description=description,
                execution_id=execution_id,
                pipeline_id=execution.pipeline_id,
                llm_config_id=execution.llm_config_id,
                baseline_tag=tag,
                created_by=created_by
            )
            
            db.add(baseline)
            db.commit()
            db.refresh(baseline)
            
            logger.info(f"Created baseline {baseline.id} from execution {execution_id}")
            return baseline
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating baseline: {e}")
            raise
        finally:
            db.close()
    
    @staticmethod
    def get_baseline_by_tag(tag: str) -> Optional[Baseline]:
        """Get baseline by tag name"""
        db = SessionLocal()
        try:
            baseline = db.query(Baseline).filter(Baseline.baseline_tag == tag).first()
            return baseline
        finally:
            db.close()
    
    @staticmethod
    def get_baseline_by_execution(execution_id: int) -> Optional[Baseline]:
        """Get baseline for a specific execution"""
        db = SessionLocal()
        try:
            baseline = db.query(Baseline).filter(Baseline.execution_id == execution_id).first()
            return baseline
        finally:
            db.close()
    
    @staticmethod
    def get_previous_execution(pipeline_id: int, llm_config_id: int) -> Optional[Execution]:
        """
        Get the most recent completed execution for a pipeline + LLM config combination
        
        Args:
            pipeline_id: Pipeline ID
            llm_config_id: LLM config ID
            
        Returns:
            Most recent completed Execution, or None if none found
        """
        db = SessionLocal()
        try:
            execution = (
                db.query(Execution)
                .filter(
                    Execution.pipeline_id == pipeline_id,
                    Execution.llm_config_id == llm_config_id,
                    Execution.status == "completed"
                )
                .order_by(Execution.completed_at.desc())
                .first()
            )
            return execution
        finally:
            db.close()
    
    @staticmethod
    def list_baselines(
        pipeline_id: Optional[int] = None,
        llm_config_id: Optional[int] = None
    ) -> List[Baseline]:
        """
        List all baselines, optionally filtered
        
        Args:
            pipeline_id: Optional filter by pipeline
            llm_config_id: Optional filter by LLM config
            
        Returns:
            List of Baseline objects
        """
        db = SessionLocal()
        try:
            query = db.query(Baseline)
            
            if pipeline_id:
                query = query.filter(Baseline.pipeline_id == pipeline_id)
            if llm_config_id:
                query = query.filter(Baseline.llm_config_id == llm_config_id)
            
            baselines = query.order_by(Baseline.created_at.desc()).all()
            return baselines
        finally:
            db.close()
    
    @staticmethod
    def get_baseline(baseline_id: int) -> Optional[Baseline]:
        """Get baseline by ID"""
        db = SessionLocal()
        try:
            baseline = db.query(Baseline).filter(Baseline.id == baseline_id).first()
            return baseline
        finally:
            db.close()
    
    @staticmethod
    def delete_baseline(baseline_id: int) -> bool:
        """
        Delete a baseline
        
        Returns:
            True if deleted, False if not found
        """
        db = SessionLocal()
        try:
            baseline = db.query(Baseline).filter(Baseline.id == baseline_id).first()
            if not baseline:
                return False
            
            db.delete(baseline)
            db.commit()
            logger.info(f"Deleted baseline {baseline_id}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting baseline: {e}")
            raise
        finally:
            db.close()
