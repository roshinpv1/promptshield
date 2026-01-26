"""
Drift Engine Service - Detects behavior drift between executions
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import DriftResult, Result, Execution, AgentTrace
from app.core.config import settings
from app.api.endpoints.results import calculate_execution_summary
from app.services.embedding_generator import EmbeddingGenerator
from app.services.agent_trace_extractor import AgentTraceExtractor
import logging
import numpy as np
from scipy import stats
from collections import Counter
import math

logger = logging.getLogger(__name__)


class DriftEngine:
    """Detects drift between current and baseline executions"""
    
    # Severity mapping based on drift value
    SEVERITY_THRESHOLDS = {
        "critical": 0.45,
        "high": 0.30,
        "medium": 0.20,
        "low": 0.0
    }
    
    @staticmethod
    def assign_severity(drift_value: float, threshold: Optional[float] = None) -> str:
        """
        Assign severity based on drift value
        
        Args:
            drift_value: Calculated drift value (0-1)
            threshold: Optional custom threshold
            
        Returns:
            Severity level (critical, high, medium, low)
        """
        if drift_value >= 0.45:
            return "critical"
        elif drift_value >= 0.30:
            return "high"
        elif drift_value >= 0.20:
            return "medium"
        else:
            return "low"
    
    @staticmethod
    def compare_executions(
        current_execution_id: int,
        baseline_execution_id: int,
        drift_types: Optional[List[str]] = None
    ) -> List[DriftResult]:
        """
        Compare current execution with baseline and detect all drift types
        
        Args:
            current_execution_id: Current execution ID
            baseline_execution_id: Baseline execution ID
            drift_types: Optional list of drift types to check (default: all)
            
        Returns:
            List of DriftResult objects
        """
        db = SessionLocal()
        drift_types = drift_types or ["output", "safety", "distribution", "embedding", "agent_tool"]
        all_drift_results = []
        
        try:
            # Verify executions exist
            current_exec = db.query(Execution).filter(Execution.id == current_execution_id).first()
            baseline_exec = db.query(Execution).filter(Execution.id == baseline_execution_id).first()
            
            if not current_exec or not baseline_exec:
                raise ValueError("One or both executions not found")
            
            if current_exec.status != "completed" or baseline_exec.status != "completed":
                raise ValueError("Both executions must be completed")
            
            # Get results for both executions
            current_results = db.query(Result).filter(Result.execution_id == current_execution_id).all()
            baseline_results = db.query(Result).filter(Result.execution_id == baseline_execution_id).all()
            
            if not current_results or not baseline_results:
                logger.warning("One or both executions have no results")
                return []
            
            # Detect different types of drift
            if "output" in drift_types:
                output_drift = DriftEngine.detect_output_drift(current_results, baseline_results)
                if output_drift:
                    all_drift_results.extend(output_drift)
            
            if "safety" in drift_types:
                safety_drift = DriftEngine.detect_safety_drift(current_execution_id, baseline_execution_id)
                if safety_drift:
                    all_drift_results.append(safety_drift)
            
            if "distribution" in drift_types:
                dist_drift = DriftEngine.detect_distribution_drift(current_results, baseline_results)
                if dist_drift:
                    all_drift_results.extend(dist_drift)
            
            if "embedding" in drift_types:
                embedding_drift = DriftEngine.detect_embedding_drift(current_execution_id, baseline_execution_id)
                if embedding_drift:
                    all_drift_results.append(embedding_drift)
            
            if "agent_tool" in drift_types:
                agent_drift = DriftEngine.detect_agent_tool_drift(current_execution_id, baseline_execution_id)
                if agent_drift:
                    all_drift_results.extend(agent_drift)
            
            # Store drift results
            for drift_result in all_drift_results:
                drift_result.execution_id = current_execution_id
                drift_result.baseline_execution_id = baseline_execution_id
                db.add(drift_result)
            
            db.commit()
            
            logger.info(f"Detected {len(all_drift_results)} drift results for execution {current_execution_id}")
            return all_drift_results
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error comparing executions: {e}")
            raise
        finally:
            db.close()
    
    @staticmethod
    def detect_output_drift(current_results: List[Result], baseline_results: List[Result]) -> List[DriftResult]:
        """
        Detect output drift (response length, token frequency, etc.)
        
        Returns:
            List of DriftResult objects
        """
        drift_results = []
        
        try:
            # Response length distribution
            current_lengths = [len(r.evidence_response or "") for r in current_results if r.evidence_response]
            baseline_lengths = [len(r.evidence_response or "") for r in baseline_results if r.evidence_response]
            
            if len(current_lengths) > 0 and len(baseline_lengths) > 0:
                # KS test on response lengths
                ks_statistic, p_value = stats.ks_2samp(current_lengths, baseline_lengths)
                drift_value = float(ks_statistic)
                threshold = settings.DRIFT_THRESHOLDS.get("output", 0.2)
                
                drift_result = DriftResult(
                    drift_type="output",
                    metric="response_length_ks_test",
                    value=drift_value,
                    threshold=threshold,
                    severity=DriftEngine.assign_severity(drift_value, threshold),
                    confidence=min(1.0, max(0.0, 1.0 - p_value)),
                    details={
                        "ks_statistic": float(ks_statistic),
                        "p_value": float(p_value),
                        "current_mean_length": float(np.mean(current_lengths)),
                        "baseline_mean_length": float(np.mean(baseline_lengths)),
                    }
                )
                drift_results.append(drift_result)
            
            # Response entropy (simplified)
            if current_results and baseline_results:
                current_entropy = DriftEngine._calculate_entropy([r.evidence_response or "" for r in current_results])
                baseline_entropy = DriftEngine._calculate_entropy([r.evidence_response or "" for r in baseline_results])
                entropy_drift = abs(current_entropy - baseline_entropy) / max(baseline_entropy, 0.001)
                threshold = settings.DRIFT_THRESHOLDS.get("output", 0.2)
                
                drift_result = DriftResult(
                    drift_type="output",
                    metric="response_entropy",
                    value=float(entropy_drift),
                    threshold=threshold,
                    severity=DriftEngine.assign_severity(entropy_drift, threshold),
                    confidence=0.7,
                    details={
                        "current_entropy": float(current_entropy),
                        "baseline_entropy": float(baseline_entropy),
                    }
                )
                drift_results.append(drift_result)
            
        except Exception as e:
            logger.error(f"Error detecting output drift: {e}")
        
        return drift_results
    
    @staticmethod
    def detect_safety_drift(current_execution_id: int, baseline_execution_id: int) -> Optional[DriftResult]:
        """
        Detect safety drift (safety score delta, severity changes)
        
        Returns:
            DriftResult object or None
        """
        try:
            # Get summaries for both executions
            db = SessionLocal()
            try:
                current_summary = calculate_execution_summary(current_execution_id, db)
                baseline_summary = calculate_execution_summary(baseline_execution_id, db)
            finally:
                db.close()
            
            # Safety score delta
            current_score = current_summary.safety_score or 100.0
            baseline_score = baseline_summary.safety_score or 100.0
            score_delta = abs(current_score - baseline_score) / 100.0  # Normalize to 0-1
            
            threshold = settings.DRIFT_THRESHOLDS.get("safety", 0.15)
            
            # Severity count deltas
            severity_deltas = {}
            for severity in ["critical", "high", "medium", "low", "info"]:
                current_count = current_summary.by_severity.get(severity, 0)
                baseline_count = baseline_summary.by_severity.get(severity, 0)
                severity_deltas[severity] = abs(current_count - baseline_count)
            
            drift_result = DriftResult(
                drift_type="safety",
                metric="safety_score_delta",
                value=float(score_delta),
                threshold=threshold,
                severity=DriftEngine.assign_severity(score_delta, threshold),
                confidence=0.9,
                details={
                    "current_safety_score": float(current_score),
                    "baseline_safety_score": float(baseline_score),
                    "score_delta": float(score_delta * 100),
                    "severity_deltas": severity_deltas,
                }
            )
            
            return drift_result
            
        except Exception as e:
            logger.error(f"Error detecting safety drift: {e}")
            return None
    
    @staticmethod
    def detect_distribution_drift(current_results: List[Result], baseline_results: List[Result]) -> List[DriftResult]:
        """
        Detect distribution drift (KS test, PSI, JS divergence)
        Enhanced with Evidently AI for additional metrics
        
        Returns:
            List of DriftResult objects
        """
        drift_results = []
        
        try:
            # Severity distribution
            current_severities = [r.severity for r in current_results]
            baseline_severities = [r.severity for r in baseline_results]
            
            if len(current_severities) > 0 and len(baseline_severities) > 0:
                # PSI (Population Stability Index) on severity distribution
                psi = DriftEngine._calculate_psi(current_severities, baseline_severities)
                threshold = settings.DRIFT_THRESHOLDS.get("distribution", 0.2)
                
                drift_result = DriftResult(
                    drift_type="distribution",
                    metric="severity_psi",
                    value=float(psi),
                    threshold=threshold,
                    severity=DriftEngine.assign_severity(psi, threshold),
                    confidence=0.8,
                    details={
                        "psi_value": float(psi),
                        "current_severity_dist": dict(Counter(current_severities)),
                        "baseline_severity_dist": dict(Counter(baseline_severities)),
                    }
                )
                drift_results.append(drift_result)
                
                # Enhanced: Use Evidently AI for additional distribution metrics
                try:
                    evidently_results = DriftEngine._detect_evidently_drift(
                        current_results, baseline_results
                    )
                    if evidently_results:
                        drift_results.extend(evidently_results)
                except Exception as e:
                    logger.debug(f"Evidently AI drift detection not available: {e}")
                    # Continue without Evidently AI if not available
            
        except Exception as e:
            logger.error(f"Error detecting distribution drift: {e}")
        
        return drift_results
    
    @staticmethod
    def _detect_evidently_drift(
        current_results: List[Result], 
        baseline_results: List[Result]
    ) -> List[DriftResult]:
        """
        Use Evidently AI for additional drift detection metrics
        
        Returns:
            List of additional DriftResult objects from Evidently AI
        """
        try:
            from evidently import ColumnMapping
            from evidently.metric_preset import DataDriftPreset
            from evidently.report import Report
            import pandas as pd
            
            # Prepare data for Evidently AI
            # Convert results to DataFrame format
            current_data = DriftEngine._prepare_evidently_data(current_results)
            baseline_data = DriftEngine._prepare_evidently_data(baseline_results)
            
            if current_data.empty or baseline_data.empty:
                return []
            
            # Create column mapping
            column_mapping = ColumnMapping()
            column_mapping.categorical_features = ['severity', 'library', 'test_category', 'risk_type']
            column_mapping.numerical_features = ['confidence_score'] if 'confidence_score' in current_data.columns else []
            
            # Generate Evidently report
            report = Report(metrics=[DataDriftPreset()])
            report.run(
                reference_data=baseline_data,
                current_data=current_data,
                column_mapping=column_mapping
            )
            
            # Extract metrics from report
            additional_results = DriftEngine._extract_evidently_metrics(report)
            return additional_results
            
        except ImportError:
            logger.debug("Evidently AI not available - skipping enhanced drift detection")
            return []
        except Exception as e:
            logger.warning(f"Error using Evidently AI for drift detection: {e}")
            return []
    
    @staticmethod
    def _prepare_evidently_data(results: List[Result]):
        """Convert Result objects to pandas DataFrame for Evidently AI"""
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required for Evidently AI integration")
        
        import pandas as pd
        
        data = []
        for result in results:
            data.append({
                'severity': result.severity,
                'library': result.library,
                'test_category': result.test_category,
                'risk_type': result.risk_type,
                'confidence_score': result.confidence_score if result.confidence_score else 0.0,
                'response_length': len(result.evidence_response) if result.evidence_response else 0,
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def _extract_evidently_metrics(report) -> List[DriftResult]:
        """Extract drift metrics from Evidently AI report"""
        additional_results = []
        
        try:
            # Get metrics from report
            metrics = report.as_dict().get('metrics', [])
            
            for metric in metrics:
                metric_type = metric.get('metric', '')
                metric_result = metric.get('result', {})
                
                # Extract drift metrics
                if 'drift_score' in metric_result:
                    drift_score = metric_result['drift_score']
                    threshold = settings.DRIFT_THRESHOLDS.get("distribution", 0.2)
                    
                    # Convert Evidently's drift score (0-1) to our format
                    drift_value = float(drift_score) if drift_score else 0.0
                    
                    additional_result = DriftResult(
                        drift_type="distribution",
                        metric=f"evidently_{metric_type}",
                        value=drift_value,
                        threshold=threshold,
                        severity=DriftEngine.assign_severity(drift_value, threshold),
                        confidence=0.85,
                        details={
                            "evidently_metric": metric_type,
                            "evidently_drift_score": drift_score,
                            "drift_by_feature": metric_result.get('drift_by_feature', {}),
                        }
                    )
                    additional_results.append(additional_result)
            
        except Exception as e:
            logger.warning(f"Error extracting Evidently metrics: {e}")
        
        return additional_results
    
    @staticmethod
    def detect_embedding_drift(current_execution_id: int, baseline_execution_id: int) -> Optional[DriftResult]:
        """
        Detect embedding drift (semantic similarity)
        
        Returns:
            DriftResult object or None
        """
        try:
            # Get embeddings for both executions
            current_embeddings = EmbeddingGenerator.get_embeddings_for_execution(current_execution_id)
            baseline_embeddings = EmbeddingGenerator.get_embeddings_for_execution(baseline_execution_id)
            
            if not current_embeddings or not baseline_embeddings:
                logger.warning("Embeddings not found for one or both executions")
                return None
            
            # Compute centroids
            current_vectors = [e.embedding_vector for e in current_embeddings]
            baseline_vectors = [e.embedding_vector for e in baseline_embeddings]
            
            current_centroid = EmbeddingGenerator.compute_centroid(current_vectors)
            baseline_centroid = EmbeddingGenerator.compute_centroid(baseline_vectors)
            
            # Cosine similarity between centroids
            similarity = EmbeddingGenerator.cosine_similarity(current_centroid, baseline_centroid)
            drift_value = 1.0 - similarity  # Convert similarity to drift (0 = no drift, 1 = max drift)
            
            threshold = settings.DRIFT_THRESHOLDS.get("embedding", 0.3)
            
            drift_result = DriftResult(
                drift_type="embedding",
                metric="centroid_cosine_similarity",
                value=float(drift_value),
                threshold=threshold,
                severity=DriftEngine.assign_severity(drift_value, threshold),
                confidence=0.85,
                details={
                    "cosine_similarity": float(similarity),
                    "drift_value": float(drift_value),
                    "current_embedding_count": len(current_embeddings),
                    "baseline_embedding_count": len(baseline_embeddings),
                }
            )
            
            return drift_result
            
        except Exception as e:
            logger.error(f"Error detecting embedding drift: {e}")
            return None
    
    @staticmethod
    def detect_agent_tool_drift(current_execution_id: int, baseline_execution_id: int) -> List[DriftResult]:
        """
        Detect agent/tool behavior drift
        
        Returns:
            List of DriftResult objects
        """
        drift_results = []
        
        try:
            # Get traces for both executions
            current_traces = AgentTraceExtractor.get_traces_for_execution(current_execution_id)
            baseline_traces = AgentTraceExtractor.get_traces_for_execution(baseline_execution_id)
            
            if not current_traces or not baseline_traces:
                logger.debug("No agent traces found for one or both executions")
                return []
            
            # Tool frequency comparison
            current_tools = [t.tool_name for t in current_traces if t.tool_name]
            baseline_tools = [t.tool_name for t in baseline_traces if t.tool_name]
            
            if current_tools or baseline_tools:
                # Chi-square test on tool frequencies
                all_tools = set(current_tools + baseline_tools)
                current_counts = [current_tools.count(tool) for tool in all_tools]
                baseline_counts = [baseline_tools.count(tool) for tool in all_tools]
                
                if sum(current_counts) > 0 and sum(baseline_counts) > 0:
                    chi2, p_value = stats.chisquare(current_counts, baseline_counts)
                    drift_value = min(1.0, float(chi2) / 100.0)  # Normalize
                    threshold = settings.DRIFT_THRESHOLDS.get("agent_tool", 0.25)
                    
                    drift_result = DriftResult(
                        drift_type="agent_tool",
                        metric="tool_frequency_chi2",
                        value=float(drift_value),
                        threshold=threshold,
                        severity=DriftEngine.assign_severity(drift_value, threshold),
                        confidence=min(1.0, max(0.0, 1.0 - p_value)),
                        details={
                            "chi2_statistic": float(chi2),
                            "p_value": float(p_value),
                            "current_tool_counts": dict(Counter(current_tools)),
                            "baseline_tool_counts": dict(Counter(baseline_tools)),
                        }
                    )
                    drift_results.append(drift_result)
            
            # Tool sequence comparison (Jaccard similarity)
            if len(current_traces) > 1 and len(baseline_traces) > 1:
                current_sequence = [t.tool_name or t.action_type for t in current_traces]
                baseline_sequence = [t.tool_name or t.action_type for t in baseline_traces]
                
                jaccard = DriftEngine._jaccard_similarity(current_sequence, baseline_sequence)
                drift_value = 1.0 - jaccard
                threshold = settings.DRIFT_THRESHOLDS.get("agent_tool", 0.25)
                
                drift_result = DriftResult(
                    drift_type="agent_tool",
                    metric="sequence_jaccard",
                    value=float(drift_value),
                    threshold=threshold,
                    severity=DriftEngine.assign_severity(drift_value, threshold),
                    confidence=0.75,
                    details={
                        "jaccard_similarity": float(jaccard),
                        "current_sequence_length": len(current_sequence),
                        "baseline_sequence_length": len(baseline_sequence),
                    }
                )
                drift_results.append(drift_result)
            
        except Exception as e:
            logger.error(f"Error detecting agent/tool drift: {e}")
        
        return drift_results
    
    @staticmethod
    def calculate_drift_score(drift_results: List[DriftResult]) -> float:
        """
        Calculate unified drift score (0-100)
        
        Args:
            drift_results: List of drift results
            
        Returns:
            Drift score (0-100, higher is better)
        """
        if not drift_results:
            return 100.0
        
        score = 100.0
        severity_weights = {
            "critical": 20.0,
            "high": 10.0,
            "medium": 5.0,
            "low": 0.0,
        }
        
        for result in drift_results:
            weight = severity_weights.get(result.severity, 1.0)
            score -= weight
        
        return max(0.0, min(100.0, score))
    
    @staticmethod
    def get_drift_grade(drift_score: float) -> str:
        """Get letter grade for drift score"""
        if drift_score >= 90:
            return "A"
        elif drift_score >= 75:
            return "B"
        elif drift_score >= 60:
            return "C"
        elif drift_score >= 45:
            return "D"
        else:
            return "F"
    
    # Helper methods
    @staticmethod
    def _calculate_entropy(texts: List[str]) -> float:
        """Calculate Shannon entropy of text responses"""
        if not texts:
            return 0.0
        
        all_text = " ".join(texts)
        if not all_text:
            return 0.0
        
        char_counts = Counter(all_text.lower())
        total_chars = len(all_text)
        
        entropy = 0.0
        for count in char_counts.values():
            probability = count / total_chars
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        return entropy
    
    @staticmethod
    def _calculate_psi(current: List[str], baseline: List[str]) -> float:
        """Calculate Population Stability Index"""
        current_counts = Counter(current)
        baseline_counts = Counter(baseline)
        
        all_categories = set(current + baseline)
        psi = 0.0
        
        for category in all_categories:
            current_pct = current_counts.get(category, 0) / max(len(current), 1)
            baseline_pct = baseline_counts.get(category, 0) / max(len(baseline), 1)
            
            if baseline_pct > 0 and current_pct > 0:
                psi += (current_pct - baseline_pct) * math.log(current_pct / baseline_pct)
        
        return abs(psi)
    
    @staticmethod
    def _jaccard_similarity(seq1: List[str], seq2: List[str]) -> float:
        """Calculate Jaccard similarity between sequences"""
        set1 = set(seq1)
        set2 = set(seq2)
        
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        
        if union == 0:
            return 0.0
        
        return intersection / union
