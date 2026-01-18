"""
Execution Engine - Orchestrates validation pipeline execution
"""

import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import SessionLocal
from app.db.models import Execution, Pipeline, LLMConfig, Result
from app.services.normalizer import ResultNormalizer
from app.services.library_adapters import get_library_adapter


class ExecutionEngine:
    """Orchestrates validation pipeline execution"""
    
    @staticmethod
    async def execute_pipeline(execution_id: int, pipeline_id: int, llm_config_id: int):
        """Execute a validation pipeline"""
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        
        db = SessionLocal()
        try:
            # Update execution status
            execution = db.query(Execution).filter(Execution.id == execution_id).first()
            if not execution:
                logger.warning(f"Execution {execution_id} not found")
                return
            
            execution.status = "running"
            execution.started_at = datetime.utcnow()
            db.commit()
            logger.info(f"Execution {execution_id} status set to 'running' at {execution.started_at}")
            print(f"[EXECUTION] Execution {execution_id} status set to 'running' at {execution.started_at}")
            
            # Get pipeline and LLM config
            pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
            llm_config = db.query(LLMConfig).filter(LLMConfig.id == llm_config_id).first()
            
            if not pipeline or not llm_config:
                execution.status = "failed"
                execution.error_message = "Pipeline or LLM config not found"
                db.commit()
                logger.error(f"Execution {execution_id} failed: Pipeline or LLM config not found")
                return
            logger.info(f"Starting execution {execution_id} with libraries: {pipeline.libraries}")
            print(f"[EXECUTION] Starting execution {execution_id} with libraries: {pipeline.libraries}")
            print(f"[EXECUTION] LLM Config: {llm_config.name} ({llm_config.endpoint_url})")
            
            tasks = []
            for library_name in pipeline.libraries:
                adapter = get_library_adapter(library_name)
                if adapter:
                    logger.info(f"Found adapter for library: {library_name}")
                    print(f"[EXECUTION] Found adapter for library: {library_name}")
                    task = ExecutionEngine._execute_library(
                        adapter,
                        library_name,
                        pipeline,
                        llm_config,
                        execution_id
                    )
                    tasks.append(task)
                else:
                    logger.warning(f"No adapter found for library: {library_name}")
                    print(f"[WARNING] No adapter found for library: {library_name}")
            
            # Wait for all libraries to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Normalize and store results
            normalizer = ResultNormalizer()
            total_results_added = 0
            library_names = pipeline.libraries
            
            for idx, library_results in enumerate(results):
                library_name = library_names[idx] if idx < len(library_names) else f"unknown_{idx}"
                
                if isinstance(library_results, Exception):
                    logger.error(f"Library '{library_name}' failed with exception: {library_results}")
                    print(f"[ERROR] Library '{library_name}' failed: {library_results}")
                    import traceback
                    print(f"[ERROR] Traceback: {traceback.format_exc()}")
                    continue
                
                if not library_results:
                    logger.warning(f"Library '{library_name}' returned no results")
                    print(f"[WARNING] Library '{library_name}' returned no results")
                    continue
                
                logger.info(f"Processing {len(library_results)} results from library '{library_name}'")
                print(f"[EXECUTION] Processing {len(library_results)} results from library '{library_name}'")
                
                for raw_result in library_results:
                    try:
                        normalized = normalizer.normalize(raw_result, execution_id)
                        db_result = Result(**normalized)
                        db.add(db_result)
                        total_results_added += 1
                        logger.debug(f"Added result: {normalized.get('library')} - {normalized.get('test_category')}")
                    except Exception as e:
                        logger.error(f"Error normalizing result: {e}")
                        print(f"[ERROR] Error normalizing result: {e}")
                        import traceback
                        print(f"[ERROR] Result data: {raw_result}")
                        print(f"[ERROR] Traceback: {traceback.format_exc()}")
            
            logger.info(f"Total results to be stored: {total_results_added}")
            print(f"[EXECUTION] Total results to be stored: {total_results_added}")
            
            db.commit()
            
            # Update execution status
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Execution {execution_id} completed with {total_results_added} results")
            print(f"[EXECUTION] Execution {execution_id} completed with {total_results_added} results")
            
        except Exception as e:
            logger.error(f"Execution {execution_id} failed with error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            print(f"[EXECUTION ERROR] Execution {execution_id} failed: {e}")
            print(f"[EXECUTION ERROR] Full traceback: {traceback.format_exc()}")
            
            execution = db.query(Execution).filter(Execution.id == execution_id).first()
            if execution:
                execution.status = "failed"
                # Truncate error message if too long (database column limit)
                error_msg = str(e)
                if len(error_msg) > 1000:
                    error_msg = error_msg[:1000] + "... (truncated)"
                execution.error_message = error_msg
                db.commit()
                logger.info(f"Execution {execution_id} status updated to 'failed'")
                print(f"[EXECUTION] Execution {execution_id} status updated to 'failed'")
        finally:
            db.close()
    
    @staticmethod
    async def _execute_library(adapter, library_name: str, pipeline, llm_config, execution_id: int):
        """Execute a single library adapter"""
        try:
            # Filter test categories for this library
            relevant_categories = [
                cat for cat in pipeline.test_categories
                if adapter.supports_category(cat)
            ]
            
            if not relevant_categories:
                return []
            
            # Execute library
            raw_results = await adapter.execute(
                llm_config=llm_config,
                test_categories=relevant_categories
            )
            
            return raw_results
        except Exception as e:
            print(f"Error executing library {library_name}: {e}")
            return []

