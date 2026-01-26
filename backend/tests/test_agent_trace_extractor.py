"""
Unit tests for agent trace extractor
"""

import pytest
from app.services.agent_trace_extractor import AgentTraceExtractor


def test_agent_trace_extractor_exists():
    """Test that AgentTraceExtractor class exists and has expected methods"""
    assert hasattr(AgentTraceExtractor, 'extract_traces_from_execution')
    assert hasattr(AgentTraceExtractor, 'register_langchain_callbacks')
    assert hasattr(AgentTraceExtractor, 'register_autogen_hooks')
    assert hasattr(AgentTraceExtractor, 'parse_tool_call')
    assert hasattr(AgentTraceExtractor, 'get_traces_for_execution')
