"""
Unit tests for embedding generator
"""

import pytest
from app.services.embedding_generator import EmbeddingGenerator


def test_embedding_generator_exists():
    """Test that EmbeddingGenerator class exists and has expected methods"""
    assert hasattr(EmbeddingGenerator, 'generate_embedding_for_text')
    assert hasattr(EmbeddingGenerator, 'generate_embeddings')
    assert hasattr(EmbeddingGenerator, 'compute_centroid')
    assert hasattr(EmbeddingGenerator, 'cosine_similarity')


def test_compute_centroid():
    """Test centroid computation"""
    embeddings = [
        [1.0, 2.0, 3.0],
        [2.0, 3.0, 4.0],
        [3.0, 4.0, 5.0],
    ]
    centroid = EmbeddingGenerator.compute_centroid(embeddings)
    assert len(centroid) == 3
    assert centroid[0] == 2.0
    assert centroid[1] == 3.0
    assert centroid[2] == 4.0


def test_cosine_similarity():
    """Test cosine similarity calculation"""
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    similarity = EmbeddingGenerator.cosine_similarity(vec1, vec2)
    assert 0 <= similarity <= 1
    # Identical vectors should have similarity close to 1
    assert similarity > 0.9
