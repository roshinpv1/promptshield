#!/usr/bin/env python3
"""
Example Embedding Service for PromptShield
This is a simple FastAPI service that provides embeddings via API endpoint
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import logging

# Try to import sentence-transformers, but make it optional
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    print("Warning: sentence-transformers not installed. Install with: pip install sentence-transformers")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PromptShield Embedding Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
_model_cache = {}


def get_model(model_name: str = "all-MiniLM-L6-v2"):
    """Get or load embedding model"""
    global _model_cache
    
    if model_name in _model_cache:
        return _model_cache[model_name]
    
    if not HAS_SENTENCE_TRANSFORMERS:
        raise HTTPException(
            status_code=503,
            detail="sentence-transformers not installed. Install with: pip install sentence-transformers"
        )
    
    try:
        logger.info(f"Loading embedding model: {model_name}")
        model = SentenceTransformer(model_name)
        _model_cache[model_name] = model
        return model
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")


class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: str = "all-MiniLM-L6-v2"


class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "sentence_transformers_available": HAS_SENTENCE_TRANSFORMERS
    }


@app.post("/api/v1/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for a list of texts
    
    Request body:
    {
        "texts": ["text1", "text2", "text3"],
        "model": "all-MiniLM-L6-v2"
    }
    
    Response:
    {
        "embeddings": [
            [0.1, 0.2, 0.3, ...],
            [0.4, 0.5, 0.6, ...],
            [0.7, 0.8, 0.9, ...]
        ]
    }
    """
    if not request.texts:
        raise HTTPException(status_code=400, detail="texts list cannot be empty")
    
    try:
        model = get_model(request.model)
        
        # Generate embeddings
        logger.info(f"Generating embeddings for {len(request.texts)} texts using model {request.model}")
        embeddings = model.encode(request.texts, normalize_embeddings=True, show_progress_bar=False)
        
        # Convert to list of lists
        embeddings_list = embeddings.tolist()
        
        return EmbeddingResponse(embeddings=embeddings_list)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print("PromptShield Embedding Service")
    print("=" * 70)
    print()
    print("Starting embedding service on http://localhost:8001")
    print("API endpoint: POST http://localhost:8001/api/v1/embeddings")
    print()
    
    if not HAS_SENTENCE_TRANSFORMERS:
        print("⚠️  WARNING: sentence-transformers not installed!")
        print("   Install with: pip install sentence-transformers")
        print("   The service will not work without it.")
        print()
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
