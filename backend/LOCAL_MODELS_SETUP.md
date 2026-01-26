# Local Models Setup Guide

PromptShield now uses **local models only** - no HuggingFace downloads at runtime.

## Quick Setup

### Step 1: Download the Embedding Model

Run the setup script:

```bash
cd backend
python3 setup_local_models.py
```

This will:
- Download the `all-MiniLM-L6-v2` model from HuggingFace (one-time)
- Save it to `./local_models/all-MiniLM-L6-v2/`
- The model will be available locally for all future runs

### Step 2: Verify Configuration

Check that `backend/app/core/config.py` has:

```python
EMBEDDING_MODEL: str = "./local_models/all-MiniLM-L6-v2"
```

### Step 3: Restart Backend

Restart your backend server for changes to take effect.

## Manual Setup (Alternative)

If you prefer to download manually:

```python
from sentence_transformers import SentenceTransformer

# Download and save model locally
model = SentenceTransformer('all-MiniLM-L6-v2')
model.save('./local_models/all-MiniLM-L6-v2')
```

## Using Different Models

To use a different embedding model:

1. Download it locally:
   ```python
   from sentence_transformers import SentenceTransformer
   model = SentenceTransformer('your-model-name')
   model.save('./local_models/your-model-name')
   ```

2. Update `config.py`:
   ```python
   EMBEDDING_MODEL: str = "./local_models/your-model-name"
   ```

## Model Path Format

The system supports:
- **Relative paths**: `./local_models/model-name`
- **Absolute paths**: `/path/to/your/model`
- **Any local directory**: `../models/model-name`

The system will **NOT** download models from HuggingFace automatically. All models must be available locally.

## Troubleshooting

### Error: "Model not found locally"

**Solution**: Run `setup_local_models.py` to download the model first.

### Error: "sentence-transformers not installed"

**Solution**: Install with `pip install sentence-transformers`

### Model path not working

**Solution**: 
- Use absolute paths: `/full/path/to/model`
- Or ensure relative paths are correct from the backend directory
- Check that the model directory exists and contains model files

## Model Storage

Models are stored in:
```
backend/
  local_models/
    all-MiniLM-L6-v2/
      (model files)
```

This directory can be:
- Committed to git (if models are small)
- Added to `.gitignore` (if models are large)
- Shared across team members
- Backed up separately

## Benefits of Local Models

✅ **No internet required** at runtime  
✅ **Faster loading** (no download delays)  
✅ **Consistent versions** (same model for all users)  
✅ **Offline capability**  
✅ **Better security** (no external API calls)
