# High-Priority Enhancement Implementation Plan

## Overview
This plan implements three high-priority enhancements identified in COMPONENT_EVALUATION.md:
1. Leverage Evidently AI for additional drift metrics
2. Formalize Normalization with Pydantic models
3. Add Score Granularity (sub-scores by category/library)

---

## Enhancement 1: Leverage Evidently AI

### Current State
- Evidently AI (v0.4.23) is installed but not actively used
- Current drift detection uses SciPy/NumPy for statistical tests
- Missing advanced drift metrics that Evidently AI provides

### Implementation Plan

**File**: `backend/app/services/drift_engine.py`

**Changes:**
1. Add Evidently AI integration for data drift detection
2. Use Evidently's `DataDriftPreset` for comprehensive drift analysis
3. Add new drift metrics:
   - **Data Quality Drift**: Missing values, data types, value ranges
   - **Target Drift**: Changes in target variable distribution (if applicable)
   - **Prediction Drift**: Changes in prediction distribution
   - **Categorical Drift**: Chi-square test on categorical features
   - **Numerical Drift**: KS test, Wasserstein distance on numerical features

**New Methods:**
- `detect_evidently_drift()`: Wrapper for Evidently AI drift detection
- `_prepare_evidently_data()`: Convert Result objects to Evidently format
- `_extract_evidently_metrics()`: Extract metrics from Evidently report

**Benefits:**
- More comprehensive drift detection
- Industry-standard metrics
- Better visualization-ready data
- Additional statistical tests

---

## Enhancement 2: Formalize Normalization with Pydantic Models

### Current State
- `ResultNormalizer` uses plain dictionaries
- No runtime validation of normalized results
- Schema defined in docstrings only

### Implementation Plan

**New File**: `backend/app/schemas/normalized_result.py`

**Create Pydantic Models:**
```python
class NormalizedResult(BaseModel):
    execution_id: int
    library: str
    test_category: str
    severity: Literal["critical", "high", "medium", "low", "info"]
    risk_type: str
    evidence_prompt: Optional[str] = None
    evidence_response: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    extra_metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('severity')
    def validate_severity(cls, v):
        valid_severities = ["critical", "high", "medium", "low", "info"]
        if v not in valid_severities:
            raise ValueError(f"Severity must be one of {valid_severities}")
        return v
```

**File**: `backend/app/services/normalizer.py`

**Changes:**
1. Update `normalize()` to return `NormalizedResult` instead of dict
2. Add validation using Pydantic
3. Add error handling for invalid data
4. Maintain backward compatibility (convert to dict for database)

**Benefits:**
- Runtime validation catches errors early
- Type safety and IDE support
- Self-documenting schema
- Better error messages

---

## Enhancement 3: Score Granularity (Sub-scores)

### Current State
- Only overall Safety Score and Drift Score
- No breakdown by category or library
- Limited insights for debugging

### Implementation Plan

**File**: `backend/app/api/endpoints/results.py`

**Update `ResultSummary` Model:**
```python
class ResultSummary(BaseModel):
    total_results: int
    by_severity: dict
    by_library: dict
    by_category: dict
    safety_score: Optional[float] = None
    safety_grade: Optional[str] = None
    drift_score: Optional[float] = None
    drift_grade: Optional[str] = None
    # NEW: Sub-scores
    safety_scores_by_library: Dict[str, float] = Field(default_factory=dict)
    safety_scores_by_category: Dict[str, float] = Field(default_factory=dict)
    safety_grades_by_library: Dict[str, str] = Field(default_factory=dict)
    safety_grades_by_category: Dict[str, str] = Field(default_factory=dict)
```

**New Methods:**
- `_calculate_safety_score_by_library()`: Calculate safety score per library
- `_calculate_safety_score_by_category()`: Calculate safety score per category
- `_calculate_drift_score_by_type()`: Calculate drift score per drift type

**File**: `backend/app/services/drift_engine.py`

**Add Methods:**
- `calculate_drift_score_by_type()`: Breakdown drift score by drift type
- `get_drift_breakdown()`: Detailed breakdown of drift contributions

**Benefits:**
- Better debugging: Identify which library/category is causing issues
- Actionable insights: Know where to focus improvement efforts
- Trend analysis: Track scores over time by dimension
- Better reporting: More detailed executive summaries

---

## Implementation Order

1. **Enhancement 2** (Pydantic Models) - Foundation for validation
2. **Enhancement 3** (Score Granularity) - Builds on existing scoring
3. **Enhancement 1** (Evidently AI) - Adds new capabilities

---

## Files to Create/Modify

### New Files:
- `backend/app/schemas/__init__.py`
- `backend/app/schemas/normalized_result.py`

### Modified Files:
- `backend/app/services/normalizer.py` - Add Pydantic models
- `backend/app/services/drift_engine.py` - Add Evidently AI + granular scores
- `backend/app/api/endpoints/results.py` - Add sub-score fields
- `backend/app/services/execution_engine.py` - Update to use Pydantic models

### Database Changes:
- None required (backward compatible)

---

## Testing Strategy

1. **Unit Tests**: Test Pydantic validation, score calculations
2. **Integration Tests**: Test Evidently AI integration
3. **Backward Compatibility**: Ensure existing API responses still work
4. **Performance Tests**: Ensure Evidently AI doesn't slow down drift detection

---

## Migration Notes

- All changes are backward compatible
- Existing API responses will include new fields (optional)
- No database migrations required
- Existing code continues to work (dicts still supported)
