"""
Unit tests for drift engine
"""

import pytest
from app.services.drift_engine import DriftEngine


def test_assign_severity():
    """Test severity assignment based on drift value"""
    assert DriftEngine.assign_severity(0.5) == "critical"
    assert DriftEngine.assign_severity(0.35) == "high"
    assert DriftEngine.assign_severity(0.25) == "medium"
    assert DriftEngine.assign_severity(0.15) == "low"


def test_calculate_drift_score():
    """Test drift score calculation"""
    # Mock drift results
    from app.db.models import DriftResult
    
    results = [
        type('DriftResult', (), {'severity': 'critical'})(),
        type('DriftResult', (), {'severity': 'high'})(),
        type('DriftResult', (), {'severity': 'medium'})(),
    ]
    
    score = DriftEngine.calculate_drift_score(results)
    assert 0 <= score <= 100
    assert score < 100  # Should be less than 100 due to findings


def test_get_drift_grade():
    """Test drift grade assignment"""
    assert DriftEngine.get_drift_grade(95) == "A"
    assert DriftEngine.get_drift_grade(80) == "B"
    assert DriftEngine.get_drift_grade(65) == "C"
    assert DriftEngine.get_drift_grade(50) == "D"
    assert DriftEngine.get_drift_grade(30) == "F"


def test_jaccard_similarity():
    """Test Jaccard similarity calculation"""
    seq1 = ["a", "b", "c"]
    seq2 = ["a", "b", "d"]
    similarity = DriftEngine._jaccard_similarity(seq1, seq2)
    assert 0 <= similarity <= 1
    assert similarity == 0.5  # 2 common, 4 total unique


def test_calculate_entropy():
    """Test entropy calculation"""
    texts = ["hello", "world", "test"]
    entropy = DriftEngine._calculate_entropy(texts)
    assert entropy >= 0


def test_calculate_psi():
    """Test PSI calculation"""
    current = ["a", "a", "b", "c"]
    baseline = ["a", "b", "b", "c"]
    psi = DriftEngine._calculate_psi(current, baseline)
    assert psi >= 0
