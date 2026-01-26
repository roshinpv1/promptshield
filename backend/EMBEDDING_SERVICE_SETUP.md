# Embedding Service Setup

PromptShield now uses an **embedding service API endpoint** instead of local models.

## Configuration

The embedding service is configured in `backend/app/core/config.py`:

```python
EMBEDDING_SERVICE_URL: str = "http://localhost:8001/api/v1/embeddings"
EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
```

## Embedding Service API Specification

The embedding service must implement the following endpoint:

### POST `/api/v1/embeddings`

**Request Body:**
```json
{
  "texts": ["text1", "text2", "text3"],
  "model": "all-MiniLM-L6-v2"
}
```

**Response (Option 1 - Direct list):**
```json
[
  [0.1, 0.2, 0.3, ...],
  [0.4, 0.5, 0.6, ...],
  [0.7, 0.8, 0.9, ...]
]
```

**Response (Option 2 - Wrapped in object):**
```json
{
  "embeddings": [
    [0.1, 0.2, 0.3, ...],
    [0.4, 0.5, 0.6, ...],
    [0.7, 0.8, 0.9, ...]
  ]
}
```

**Response (Option 3 - OpenAI-style):**
```json
{
  "data": [
    {"embedding": [0.1, 0.2, 0.3, ...]},
    {"embedding": [0.4, 0.5, 0.6, ...]},
    {"embedding": [0.7, 0.8, 0.9, ...]}
  ]
}
```

## Example Embedding Service Implementation

Here's a simple FastAPI embedding service example:

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: str = "all-MiniLM-L6-v2"

@app.post("/api/v1/embeddings")
async def generate_embeddings(request: EmbeddingRequest):
    embeddings = model.encode(request.texts, normalize_embeddings=True)
    return {"embeddings": embeddings.tolist()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

## Running the Embedding Service

1. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn sentence-transformers
   ```

2. **Start the service:**
   ```bash
   python embedding_service.py
   ```

3. **Verify it's running:**
   ```bash
   curl -X POST http://localhost:8001/api/v1/embeddings \
     -H "Content-Type: application/json" \
     -d '{"texts": ["test"], "model": "all-MiniLM-L6-v2"}'
   ```

## Updating Configuration

To use a different embedding service:

1. Update `EMBEDDING_SERVICE_URL` in `config.py`:
   ```python
   EMBEDDING_SERVICE_URL: str = "http://your-service:port/api/v1/embeddings"
   ```

2. Update `EMBEDDING_MODEL_NAME` if needed:
   ```python
   EMBEDDING_MODEL_NAME: str = "your-model-name"
   ```

3. Restart the PromptShield backend server

## Environment Variables

You can also set these via environment variables:

```bash
export EMBEDDING_SERVICE_URL="http://localhost:8001/api/v1/embeddings"
export EMBEDDING_MODEL_NAME="all-MiniLM-L6-v2"
```

## Error Handling

If the embedding service is unavailable:
- The system will log an error
- Embedding generation will fail gracefully
- Drift detection that requires embeddings will be skipped
- Results will still be stored, but without embeddings

## Benefits of API-Based Embeddings

✅ **Separation of concerns** - Embedding logic is separate from main app  
✅ **Scalability** - Can scale embedding service independently  
✅ **Flexibility** - Easy to swap embedding models/services  
✅ **Resource management** - Embedding models don't consume main app memory  
✅ **Multi-service support** - Can use different embedding services per environment
