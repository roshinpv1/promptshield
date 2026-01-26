#!/usr/bin/env python3
"""
Script to download and setup local embedding models
This downloads models locally so the app doesn't need to access HuggingFace at runtime
"""

import os
import sys
from pathlib import Path

def download_model(model_name: str, local_path: str):
    """Download a model from HuggingFace and save it locally"""
    try:
        from sentence_transformers import SentenceTransformer
        
        print(f"Downloading model '{model_name}' from HuggingFace...")
        print("This is a one-time download. The model will be saved locally.")
        
        # Download model
        model = SentenceTransformer(model_name)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # Save model locally
        print(f"Saving model to: {local_path}")
        model.save(local_path)
        
        print(f"✅ Model saved successfully to: {local_path}")
        print(f"   You can now use this path in your config: EMBEDDING_MODEL = '{local_path}'")
        return True
        
    except ImportError:
        print("❌ sentence-transformers not installed")
        print("   Install with: pip install sentence-transformers")
        return False
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        return False

def main():
    print("=" * 70)
    print("Local Model Setup for PromptShield")
    print("=" * 70)
    print()
    print("This script downloads embedding models locally so the app")
    print("doesn't need to access HuggingFace at runtime.")
    print()
    
    # Default model
    default_model = "all-MiniLM-L6-v2"
    local_path = f"./local_models/{default_model}"
    
    print(f"Default model: {default_model}")
    print(f"Local path: {local_path}")
    print()
    
    response = input("Download this model? (y/n): ").strip().lower()
    if response != 'y':
        print("Cancelled.")
        return
    
    success = download_model(default_model, local_path)
    
    if success:
        print()
        print("=" * 70)
        print("✅ Setup complete!")
        print("=" * 70)
        print()
        print("Next steps:")
        print(f"1. Update config.py: EMBEDDING_MODEL = '{local_path}'")
        print("2. Restart the backend server")
        print()
    else:
        print()
        print("=" * 70)
        print("❌ Setup failed")
        print("=" * 70)
        sys.exit(1)

if __name__ == "__main__":
    main()
