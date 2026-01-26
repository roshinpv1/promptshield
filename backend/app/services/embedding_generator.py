"""
Embedding Generator Service - Generates embeddings via API endpoint
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Embedding, Result, Execution
from app.core.config import settings
import logging
import numpy as np
import httpx

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """Generates embeddings for result responses"""
    
    @staticmethod
    async def _call_embedding_api(texts: List[str], model_name: Optional[str] = None) -> List[List[float]]:
        """
        Call embedding service API endpoint
        
        Args:
            texts: List of texts to embed
            model_name: Model name identifier (for tracking)
            
        Returns:
            List of embedding vectors
        """
        embedding_url = settings.EMBEDDING_SERVICE_URL
        model_name = model_name or settings.EMBEDDING_MODEL_NAME
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "texts": texts,
                    "model": model_name
                }
                
                logger.debug(f"Calling embedding API: {embedding_url}")
                response = await client.post(embedding_url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                # Handle different response formats
                if isinstance(result, dict):
                    if "embeddings" in result:
                        return result["embeddings"]
                    elif "data" in result:
                        # OpenAI-style format
                        return [item.get("embedding", []) for item in result["data"]]
                    else:
                        raise ValueError(f"Unexpected response format: {list(result.keys())}")
                elif isinstance(result, list):
                    # Direct list of embeddings
                    return result
                else:
                    raise ValueError(f"Unexpected response type: {type(result)}")
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"Embedding API returned error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Error calling embedding API: {e}")
            raise ConnectionError(f"Cannot connect to embedding service at {embedding_url}. Is it running?")
        except Exception as e:
            logger.error(f"Error generating embeddings via API: {e}")
            raise
    
    @staticmethod
    def generate_embedding_for_text(text: str, model_name: Optional[str] = None) -> List[float]:
        """
        Generate embedding for a single text (synchronous wrapper)
        
        Args:
            text: Text to embed
            model_name: Model name (defaults to config setting)
            
        Returns:
            List of floats representing the embedding vector
        """
        import asyncio
        
        if not text or len(text.strip()) == 0:
            logger.warning("Empty text provided for embedding")
            return [0.0] * 384  # Default dimension
        
        try:
            # Try to get existing event loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If loop is already running, use nest_asyncio
                    try:
                        import nest_asyncio
                        nest_asyncio.apply()
                        embeddings = loop.run_until_complete(
                            EmbeddingGenerator._call_embedding_api([text], model_name)
                        )
                    except ImportError:
                        # nest_asyncio not available, create new event loop in thread
                        import concurrent.futures
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(
                                asyncio.run,
                                EmbeddingGenerator._call_embedding_api([text], model_name)
                            )
                            embeddings = future.result()
                else:
                    embeddings = loop.run_until_complete(
                        EmbeddingGenerator._call_embedding_api([text], model_name)
                    )
            except RuntimeError:
                # No event loop, create one
                embeddings = asyncio.run(
                    EmbeddingGenerator._call_embedding_api([text], model_name)
                )
            
            return embeddings[0] if embeddings else [0.0] * 384
        except Exception as e:
            logger.error(f"Error in generate_embedding_for_text: {e}")
            raise
    
    @staticmethod
    async def generate_embeddings(
        execution_id: int,
        model_name: Optional[str] = None,
        batch_size: int = 32
    ) -> List[Embedding]:
        """
        Generate embeddings for all results in an execution via API endpoint
        
        Args:
            execution_id: Execution ID
            model_name: Model name (defaults to config setting)
            batch_size: Batch size for processing
            
        Returns:
            List of created Embedding objects
        """
        db = SessionLocal()
        model_name = model_name or settings.EMBEDDING_MODEL_NAME
        
        try:
            # Verify execution exists
            execution = db.query(Execution).filter(Execution.id == execution_id).first()
            if not execution:
                raise ValueError(f"Execution {execution_id} not found")
            
            # Get all results with responses
            results = (
                db.query(Result)
                .filter(
                    Result.execution_id == execution_id,
                    Result.evidence_response.isnot(None),
                    Result.evidence_response != ""
                )
                .all()
            )
            
            if not results:
                logger.warning(f"No results with responses found for execution {execution_id}")
                return []
            
            # Check which results already have embeddings
            existing_embeddings = {
                e.result_id for e in db.query(Embedding.result_id)
                .filter(Embedding.execution_id == execution_id, Embedding.model_name == model_name)
            }
            
            # Filter out results that already have embeddings
            results_to_process = [r for r in results if r.id not in existing_embeddings]
            
            if not results_to_process:
                logger.info(f"All results already have embeddings for execution {execution_id}")
                return db.query(Embedding).filter(Embedding.execution_id == execution_id).all()
            
            logger.info(f"Generating embeddings for {len(results_to_process)} results using embedding API")
            
            # Process in batches
            created_embeddings = []
            for i in range(0, len(results_to_process), batch_size):
                batch = results_to_process[i:i + batch_size]
                texts = [r.evidence_response for r in batch]
                
                try:
                    # Call embedding API
                    embeddings = await EmbeddingGenerator._call_embedding_api(texts, model_name)
                    
                    # Create Embedding objects
                    for result, embedding_vector in zip(batch, embeddings):
                        embedding = Embedding(
                            result_id=result.id,
                            execution_id=execution_id,
                            embedding_vector=embedding_vector,
                            model_name=model_name
                        )
                        db.add(embedding)
                        created_embeddings.append(embedding)
                    
                    logger.debug(f"Processed batch {i // batch_size + 1} ({len(batch)} results)")
                    
                except Exception as e:
                    logger.error(f"Error processing batch: {e}")
                    # Continue with next batch
                    continue
            
            db.commit()
            
            # Refresh all embeddings
            for emb in created_embeddings:
                db.refresh(emb)
            
            logger.info(f"Generated {len(created_embeddings)} embeddings for execution {execution_id}")
            return created_embeddings
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error generating embeddings: {e}")
            raise
        finally:
            db.close()
    
    @staticmethod
    def compute_centroid(embeddings: List[List[float]]) -> List[float]:
        """
        Compute centroid (mean) of a list of embeddings
        
        Args:
            embeddings: List of embedding vectors
            
        Returns:
            Centroid vector
        """
        if not embeddings:
            raise ValueError("Cannot compute centroid of empty embedding list")
        
        embeddings_array = np.array(embeddings)
        centroid = np.mean(embeddings_array, axis=0)
        return centroid.tolist()
    
    @staticmethod
    def get_embeddings_for_execution(execution_id: int, model_name: Optional[str] = None) -> List[Embedding]:
        """Get all embeddings for an execution"""
        db = SessionLocal()
        model_name = model_name or settings.EMBEDDING_MODEL_NAME
        
        try:
            embeddings = (
                db.query(Embedding)
                .filter(Embedding.execution_id == execution_id, Embedding.model_name == model_name)
                .all()
            )
            return embeddings
        finally:
            db.close()
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Compute cosine similarity between two vectors
        
        Args:
            vec1: First vector
            vec2: Second vector
            
        Returns:
            Cosine similarity (0-1)
        """
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)
        
        dot_product = np.dot(vec1_array, vec2_array)
        norm1 = np.linalg.norm(vec1_array)
        norm2 = np.linalg.norm(vec2_array)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        # Cosine similarity ranges from -1 to 1, but with normalized embeddings it's 0-1
        # Convert to 0-1 range for drift calculation (1 - similarity gives distance)
        return float(similarity)
