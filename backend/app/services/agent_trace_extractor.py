"""
Agent Trace Extractor Service - Extracts structured traces from agent executions
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import AgentTrace, Execution, Result
from app.core.config import settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Optional imports for agent frameworks
_langchain_available = False
_autogen_available = False
BaseCallbackHandler = None

try:
    from langchain.callbacks.base import BaseCallbackHandler
    from langchain.schema import LLMResult
    _langchain_available = True
except ImportError:
    logger.debug("LangChain not available")
    # Create a dummy base class if LangChain is not available
    class BaseCallbackHandler:
        pass


class PromptShieldLangChainCallback(BaseCallbackHandler):
    """LangChain callback handler for capturing agent traces"""
    
    def __init__(self, execution_id: int):
        super().__init__()
        self.execution_id = execution_id
        self.step = 0
        self.traces = []
    
    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs) -> None:
        """Called when LLM starts"""
        self.step += 1
        trace = {
            "execution_id": self.execution_id,
            "step": self.step,
            "action_type": "llm_call",
            "timestamp": datetime.utcnow(),
            "metadata": {
                "prompts": prompts,
                "serialized": serialized
            }
        }
        self.traces.append(trace)
    
    def on_tool_start(self, serialized: Dict[str, Any], input_str: str, **kwargs) -> None:
        """Called when tool starts"""
        self.step += 1
        tool_name = serialized.get("name", "unknown")
        trace = {
            "execution_id": self.execution_id,
            "step": self.step,
            "action_type": "tool_call",
            "tool_name": tool_name,
            "timestamp": datetime.utcnow(),
            "metadata": {
                "input": input_str,
                "serialized": serialized
            }
        }
        self.traces.append(trace)
    
    def on_agent_action(self, action, **kwargs) -> None:
        """Called when agent takes an action"""
        self.step += 1
        trace = {
            "execution_id": self.execution_id,
            "step": self.step,
            "action_type": "decision",
            "timestamp": datetime.utcnow(),
            "metadata": {
                "action": str(action),
                **kwargs
            }
        }
        self.traces.append(trace)
    
    def save_traces(self):
        """Save collected traces to database"""
        if not self.traces:
            return
        
        db = SessionLocal()
        try:
            for trace_data in self.traces:
                trace = AgentTrace(
                    execution_id=trace_data["execution_id"],
                    step=trace_data["step"],
                    action_type=trace_data["action_type"],
                    tool_name=trace_data.get("tool_name"),
                    timestamp=trace_data["timestamp"],
                    trace_metadata=trace_data.get("metadata", {})
                )
                db.add(trace)
            
            db.commit()
            logger.info(f"Saved {len(self.traces)} agent traces for execution {self.execution_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving agent traces: {e}")
            raise
        finally:
            db.close()


class AgentTraceExtractor:
    """Extracts and stores agent execution traces"""
    
    @staticmethod
    def extract_traces_from_execution(execution_id: int) -> List[AgentTrace]:
        """
        Extract traces from an execution (if available in metadata)
        
        This is a fallback method for extracting traces that were stored
        in execution metadata or results metadata.
        
        Args:
            execution_id: Execution ID
            
        Returns:
            List of AgentTrace objects
        """
        db = SessionLocal()
        try:
            execution = db.query(Execution).filter(Execution.id == execution_id).first()
            if not execution:
                raise ValueError(f"Execution {execution_id} not found")
            
            # Check if traces already exist
            existing_traces = db.query(AgentTrace).filter(AgentTrace.execution_id == execution_id).all()
            if existing_traces:
                logger.info(f"Traces already exist for execution {execution_id}")
                return existing_traces
            
            # Try to extract from results metadata
            results = db.query(Result).filter(Result.execution_id == execution_id).all()
            traces = []
            step = 0
            
            for result in results:
                metadata = result.extra_metadata or {}
                
                # Check for agent trace data in metadata
                if "agent_trace" in metadata:
                    trace_data = metadata["agent_trace"]
                    step += 1
                    trace = AgentTrace(
                        execution_id=execution_id,
                        result_id=result.id,
                        step=step,
                        action_type=trace_data.get("action_type", "llm_call"),
                        tool_name=trace_data.get("tool_name"),
                        timestamp=datetime.utcnow(),
                        trace_metadata=trace_data.get("metadata", {})
                    )
                    traces.append(trace)
            
            if traces:
                for trace in traces:
                    db.add(trace)
                db.commit()
                logger.info(f"Extracted {len(traces)} traces from execution {execution_id}")
            
            return traces
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error extracting traces: {e}")
            raise
        finally:
            db.close()
    
    @staticmethod
    def register_langchain_callbacks(execution_id: int) -> Optional[PromptShieldLangChainCallback]:
        """
        Register LangChain callbacks for an execution
        
        Args:
            execution_id: Execution ID
            
        Returns:
            Callback handler instance, or None if LangChain not available
        """
        if not _langchain_available:
            logger.warning("LangChain not available, cannot register callbacks")
            return None
        
        if not settings.ENABLE_AGENT_TRACES:
            logger.debug("Agent traces disabled in config")
            return None
        
        callback = PromptShieldLangChainCallback(execution_id)
        logger.info(f"Registered LangChain callbacks for execution {execution_id}")
        return callback
    
    @staticmethod
    def register_autogen_hooks(execution_id: int):
        """
        Register AutoGen hooks for an execution
        
        Args:
            execution_id: Execution ID
            
        Returns:
            Hook configuration, or None if AutoGen not available
        """
        if not _autogen_available:
            logger.warning("AutoGen not available, cannot register hooks")
            return None
        
        if not settings.ENABLE_AGENT_TRACES:
            logger.debug("Agent traces disabled in config")
            return None
        
        # AutoGen hook registration would go here
        # This is a placeholder for future implementation
        logger.info(f"AutoGen hooks would be registered for execution {execution_id}")
        return None
    
    @staticmethod
    def parse_tool_call(tool_data: Dict[str, Any]) -> AgentTrace:
        """
        Parse tool call data into an AgentTrace
        
        Args:
            tool_data: Dictionary containing tool call information
            
        Returns:
            AgentTrace object
        """
        trace = AgentTrace(
            execution_id=tool_data.get("execution_id"),
            result_id=tool_data.get("result_id"),
            step=tool_data.get("step", 0),
            action_type="tool_call",
            tool_name=tool_data.get("tool_name"),
            timestamp=tool_data.get("timestamp", datetime.utcnow()),
            trace_metadata=tool_data.get("metadata", {})
        )
        return trace
    
    @staticmethod
    def get_traces_for_execution(execution_id: int) -> List[AgentTrace]:
        """Get all traces for an execution"""
        db = SessionLocal()
        try:
            traces = (
                db.query(AgentTrace)
                .filter(AgentTrace.execution_id == execution_id)
                .order_by(AgentTrace.step)
                .all()
            )
            return traces
        finally:
            db.close()
