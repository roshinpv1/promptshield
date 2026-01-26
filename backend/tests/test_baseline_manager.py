"""
Unit tests for baseline manager
"""

import pytest
from app.services.baseline_manager import BaselineManager


def test_baseline_manager_exists():
    """Test that BaselineManager class exists and has expected methods"""
    assert hasattr(BaselineManager, 'create_baseline')
    assert hasattr(BaselineManager, 'get_baseline_by_tag')
    assert hasattr(BaselineManager, 'get_baseline_by_execution')
    assert hasattr(BaselineManager, 'get_previous_execution')
    assert hasattr(BaselineManager, 'list_baselines')
    assert hasattr(BaselineManager, 'get_baseline')
    assert hasattr(BaselineManager, 'delete_baseline')
