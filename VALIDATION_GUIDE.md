# PromptShield v1.1 - Validation Guide

This guide helps you validate all new drift detection features and functionalities.

## Prerequisites

1. **Backend running** on `http://localhost:8000`
2. **Frontend running** on `http://localhost:3000`
3. **Database migrations applied**: `alembic upgrade head`
4. **Dependencies installed**: All packages from `requirements.txt`

## Validation Checklist

### ✅ Phase 1: Basic Setup & Database

#### 1.1 Verify Database Tables
```bash
cd backend
python3 -c "
from app.db.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
required_tables = ['baselines', 'embeddings', 'drift_results', 'agent_traces']
for table in required_tables:
    if table in tables:
        print(f'✅ {table} table exists')
    else:
        print(f'❌ {table} table missing')
"
```

**Expected**: All 4 tables should exist.

#### 1.2 Verify API Endpoints
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test baseline endpoints exist
curl http://localhost:8000/api/v1/baselines

# Test drift endpoints exist
curl http://localhost:8000/api/v1/drift/execution/1/summary
```

**Expected**: 
- Health returns `{"status":"healthy",...}`
- Baselines endpoint returns `[]` (empty list)
- Drift endpoint may return 404 (execution not found) - that's OK

---

### ✅ Phase 2: Baseline Management

#### 2.1 Create an Execution (Baseline Source)

**Steps:**
1. Go to **LLM Configs** → Create a new LLM configuration
   - Enter your LLM API endpoint
   - Configure headers and payload template
   - Save

2. Go to **Pipelines** → Create a new pipeline
   - Select libraries (e.g., Garak, PyRIT)
   - Choose test categories
   - Link to your LLM config
   - Save

3. Go to **Executions** → Start Execution
   - Select your pipeline and LLM config
   - Wait for execution to complete (status: "completed")

**Verify:**
- Execution appears in the table
- Status changes from "pending" → "running" → "completed"
- Results are available (click to view)

#### 2.2 Create a Baseline

**Steps:**
1. In **Executions** page, find a completed execution
2. Click the ⭐ (star) icon in the Actions column
3. Fill in the dialog:
   - Name: "Test Baseline v1.0"
   - Tag: "golden-run" (optional)
4. Click "Create Baseline"

**Verify:**
- Dialog closes successfully
- Baseline indicator badge appears in the Baseline column
- Star icon becomes filled (⭐) and disabled

**API Test:**
```bash
# List baselines
curl http://localhost:8000/api/v1/baselines

# Get baseline by tag
curl http://localhost:8000/api/v1/baselines/tag/golden-run

# Get baseline by ID
curl http://localhost:8000/api/v1/baselines/1
```

**Expected**: Baseline object returned with execution_id, name, tag, etc.

#### 2.3 Verify Baseline Management

**Test Cases:**
- ✅ Create baseline with tag
- ✅ Create baseline without tag
- ✅ List all baselines
- ✅ Get baseline by tag
- ✅ Get baseline by ID
- ✅ Delete baseline (optional)

---

### ✅ Phase 3: Embedding Generation

#### 3.1 Verify Embeddings are Generated

**Steps:**
1. Run an execution (or use existing completed execution)
2. Wait a few seconds for embedding generation to complete
3. Check database or use API

**Database Check:**
```bash
cd backend
python3 -c "
from app.db.database import SessionLocal
from app.db.models import Embedding
db = SessionLocal()
embeddings = db.query(Embedding).limit(5).all()
print(f'Found {len(embeddings)} embeddings')
for e in embeddings:
    print(f'  - Execution {e.execution_id}, Model: {e.model_name}, Vector length: {len(e.embedding_vector)}')
db.close()
"
```

**Expected**: 
- Embeddings exist for completed executions
- Each embedding has a vector (list of floats)
- Model name is "all-MiniLM-L6-v2" (or configured model)

#### 3.2 Verify Embedding Quality

**Test:**
```bash
cd backend
python3 -c "
from app.services.embedding_generator import EmbeddingGenerator

# Test single text embedding
text = 'This is a test response from an LLM'
embedding = EmbeddingGenerator.generate_embedding_for_text(text)
print(f'✅ Embedding generated: {len(embedding)} dimensions')
print(f'   First 5 values: {embedding[:5]}')
"
```

**Expected**: 
- Embedding is a list of floats
- Length matches model dimensions (384 for all-MiniLM-L6-v2)
- Values are normalized (between -1 and 1)

---

### ✅ Phase 4: Drift Detection

#### 4.1 Create Baseline Execution

**Steps:**
1. Run an execution (Execution #1)
2. Wait for completion
3. Set it as baseline with tag "baseline-v1"

#### 4.2 Run New Execution

**Steps:**
1. Run the **same pipeline** with the **same LLM config** (Execution #2)
2. Wait for completion
3. This will be compared against the baseline

#### 4.3 Compare for Drift

**Via UI:**
1. Go to **Results** page for Execution #2
2. Scroll to "Compare with Baseline" section
3. Select your baseline from dropdown
4. Click "Compare" button
5. Wait a few seconds for comparison to complete

**Via API:**
```bash
# Compare executions
curl -X POST http://localhost:8000/api/v1/drift/compare \
  -H "Content-Type: application/json" \
  -d '{
    "execution_id": 2,
    "baseline_execution_id": 1
  }'

# Get drift results
curl http://localhost:8000/api/v1/drift/execution/2

# Get drift summary
curl http://localhost:8000/api/v1/drift/execution/2/summary
```

**Verify:**
- Comparison completes without errors
- Drift results are returned
- Drift score is calculated (0-100)
- Drift grade is assigned (A-F)

#### 4.4 Verify Drift Types

**Check for each drift type:**

1. **Output Drift:**
   - Response length distribution (KS test)
   - Response entropy

2. **Safety Drift:**
   - Safety score delta
   - Severity count deltas

3. **Distribution Drift:**
   - Severity PSI (Population Stability Index)

4. **Embedding Drift:**
   - Centroid cosine similarity
   - Requires embeddings to be generated

5. **Agent/Tool Drift:**
   - Tool frequency comparison
   - Tool sequence comparison
   - Requires agent traces (if enabled)

**API Test:**
```bash
# Get drift results filtered by type
curl "http://localhost:8000/api/v1/drift/execution/2?drift_type=output"
curl "http://localhost:8000/api/v1/drift/execution/2?drift_type=safety"
curl "http://localhost:8000/api/v1/drift/execution/2?drift_type=embedding"
```

**Expected**: Each drift type returns appropriate results with metrics and values.

---

### ✅ Phase 5: UI Validation

#### 5.1 Executions Page

**Verify:**
- ✅ Baseline column appears in table
- ✅ Baseline badge shows for baseline executions
- ✅ Star icon (⭐) appears in Actions column
- ✅ "Set as Baseline" dialog opens correctly
- ✅ Baseline creation works
- ✅ Star icon becomes filled after baseline creation

#### 5.2 Results Page

**Verify:**
- ✅ "Drift Detected" badge appears when drift results exist
- ✅ "Compare with Baseline" section is visible
- ✅ Baseline selector dropdown works
- ✅ "Compare" button triggers comparison
- ✅ Drift Score card appears (similar to Safety Score)
- ✅ Drift Score shows correct value (0-100)
- ✅ Drift Grade shows correct letter (A-F)
- ✅ Color coding matches grade:
  - A (90-100): Green
  - B (75-89): Blue
  - C (60-74): Yellow
  - D (45-59): Orange
  - F (<45): Red
- ✅ Drift results table appears
- ✅ Table columns: Drift Type, Metric, Value, Threshold, Severity, Confidence
- ✅ Filtering works (if implemented)
- ✅ Expandable details work

---

### ✅ Phase 6: End-to-End Workflow

#### 6.1 Complete Drift Detection Workflow

**Scenario: Detect behavior change after model update**

1. **Initial Baseline:**
   - Create LLM config for Model v1.0
   - Create pipeline with security tests
   - Run execution → Execution #1
   - Set as baseline: "Model v1.0 Baseline"

2. **Model Update:**
   - Update LLM config to point to Model v1.1
   - Run same pipeline → Execution #2

3. **Detect Drift:**
   - Compare Execution #2 with baseline
   - Review drift results:
     - Check safety drift (did security scores change?)
     - Check output drift (did response patterns change?)
     - Check embedding drift (did semantic meaning change?)

4. **Verify Results:**
   - Drift score indicates stability level
   - Individual drift findings show what changed
   - Can make informed decision about model update

**Expected**: System detects differences between v1.0 and v1.1 executions.

---

### ✅ Phase 7: Edge Cases & Error Handling

#### 7.1 Test Edge Cases

**Test Scenarios:**

1. **No Baseline:**
   - Try to compare without creating baseline
   - **Expected**: Clear error message

2. **Empty Execution:**
   - Compare execution with no results
   - **Expected**: Graceful handling, no drift results

3. **Different Pipelines:**
   - Compare executions from different pipelines
   - **Expected**: Comparison works (may show high drift)

4. **Missing Embeddings:**
   - Compare when embeddings not generated
   - **Expected**: Embedding drift skipped, other drifts work

5. **Same Execution:**
   - Compare execution with itself
   - **Expected**: Low/no drift detected

6. **Baseline Deletion:**
   - Delete baseline, then try to use it
   - **Expected**: Error handling

#### 7.2 Test Error Handling

**Verify:**
- ✅ Invalid execution IDs return 404
- ✅ Invalid baseline IDs return 404
- ✅ Missing required fields return 400
- ✅ Server errors are logged and handled gracefully
- ✅ Frontend shows user-friendly error messages

---

### ✅ Phase 8: Performance Validation

#### 8.1 Embedding Generation Performance

**Test:**
```bash
# Time embedding generation for execution with many results
time python3 -c "
from app.services.embedding_generator import EmbeddingGenerator
import time
start = time.time()
embeddings = EmbeddingGenerator.generate_embeddings(1)  # Replace with actual execution_id
end = time.time()
print(f'Generated {len(embeddings)} embeddings in {end-start:.2f} seconds')
"
```

**Expected**: 
- Embeddings generate in reasonable time (< 1 minute for 100 results)
- Batch processing works efficiently

#### 8.2 Drift Comparison Performance

**Test:**
```bash
# Time drift comparison
time curl -X POST http://localhost:8000/api/v1/drift/compare \
  -H "Content-Type: application/json" \
  -d '{"execution_id": 2, "baseline_execution_id": 1}'
```

**Expected**: 
- Comparison completes in reasonable time (< 30 seconds for typical executions)
- Async processing doesn't block API

---

### ✅ Phase 9: Data Integrity

#### 9.1 Verify Data Consistency

**Database Checks:**
```bash
cd backend
python3 -c "
from app.db.database import SessionLocal
from app.db.models import Execution, Baseline, DriftResult, Embedding

db = SessionLocal()

# Check baseline references
baselines = db.query(Baseline).all()
for b in baselines:
    exec = db.query(Execution).filter(Execution.id == b.execution_id).first()
    if not exec:
        print(f'❌ Baseline {b.id} references missing execution {b.execution_id}')
    else:
        print(f'✅ Baseline {b.id} references valid execution {b.execution_id}')

# Check drift result references
drift_results = db.query(DriftResult).all()
for d in drift_results:
    exec1 = db.query(Execution).filter(Execution.id == d.execution_id).first()
    exec2 = db.query(Execution).filter(Execution.id == d.baseline_execution_id).first()
    if not exec1 or not exec2:
        print(f'❌ DriftResult {d.id} has invalid execution references')
    else:
        print(f'✅ DriftResult {d.id} has valid references')

# Check embedding references
embeddings = db.query(Embedding).all()
for e in embeddings:
    exec = db.query(Execution).filter(Execution.id == e.execution_id).first()
    if not exec:
        print(f'❌ Embedding {e.id} references missing execution {e.execution_id}')
    else:
        print(f'✅ Embedding {e.id} references valid execution {e.execution_id}')

db.close()
"
```

**Expected**: All foreign key references are valid.

---

### ✅ Phase 10: API Documentation

#### 10.1 Verify Swagger Documentation

**Steps:**
1. Open browser: `http://localhost:8000/docs`
2. Navigate to new endpoints:
   - `/api/v1/baselines` section
   - `/api/v1/drift` section

**Verify:**
- ✅ All endpoints are documented
- ✅ Request/response schemas are correct
- ✅ Can test endpoints from Swagger UI
- ✅ Examples are provided

---

## Quick Validation Script

Save this as `validate_v1.1.py` in the backend directory:

```python
#!/usr/bin/env python3
"""Quick validation script for PromptShield v1.1 features"""

import sys
from app.db.database import SessionLocal, engine
from app.db.models import Baseline, Embedding, DriftResult, AgentTrace
from sqlalchemy import inspect

def validate_database():
    """Validate database tables exist"""
    print("🔍 Validating database tables...")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    required = ['baselines', 'embeddings', 'drift_results', 'agent_traces']
    
    all_ok = True
    for table in required:
        if table in tables:
            print(f"  ✅ {table}")
        else:
            print(f"  ❌ {table} - MISSING")
            all_ok = False
    
    return all_ok

def validate_models():
    """Validate models can be imported"""
    print("\n🔍 Validating models...")
    try:
        from app.db.models import Baseline, Embedding, DriftResult, AgentTrace
        print("  ✅ All models importable")
        return True
    except Exception as e:
        print(f"  ❌ Model import failed: {e}")
        return False

def validate_services():
    """Validate services can be imported"""
    print("\n🔍 Validating services...")
    services = [
        'app.services.baseline_manager',
        'app.services.embedding_generator',
        'app.services.drift_engine',
        'app.services.agent_trace_extractor',
    ]
    
    all_ok = True
    for service in services:
        try:
            __import__(service)
            print(f"  ✅ {service}")
        except Exception as e:
            print(f"  ❌ {service} - {e}")
            all_ok = False
    
    return all_ok

def validate_api_endpoints():
    """Validate API endpoints can be imported"""
    print("\n🔍 Validating API endpoints...")
    endpoints = [
        'app.api.endpoints.baselines',
        'app.api.endpoints.drift',
    ]
    
    all_ok = True
    for endpoint in endpoints:
        try:
            __import__(endpoint)
            print(f"  ✅ {endpoint}")
        except Exception as e:
            print(f"  ❌ {endpoint} - {e}")
            all_ok = False
    
    return all_ok

def validate_config():
    """Validate configuration"""
    print("\n🔍 Validating configuration...")
    from app.core.config import settings
    
    checks = [
        ('EMBEDDING_MODEL', settings.EMBEDDING_MODEL),
        ('DRIFT_THRESHOLDS', settings.DRIFT_THRESHOLDS),
        ('ENABLE_AGENT_TRACES', settings.ENABLE_AGENT_TRACES),
    ]
    
    all_ok = True
    for name, value in checks:
        if value is not None:
            print(f"  ✅ {name} = {value}")
        else:
            print(f"  ❌ {name} is None")
            all_ok = False
    
    return all_ok

def main():
    print("=" * 60)
    print("PromptShield v1.1 Validation")
    print("=" * 60)
    
    results = [
        validate_database(),
        validate_models(),
        validate_services(),
        validate_api_endpoints(),
        validate_config(),
    ]
    
    print("\n" + "=" * 60)
    if all(results):
        print("✅ All validations passed!")
        sys.exit(0)
    else:
        print("❌ Some validations failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**Run validation:**
```bash
cd backend
python3 validate_v1.1.py
```

---

## Expected Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Database Tables | ✅ | All 4 tables created |
| Baseline Creation | ✅ | Can create from execution |
| Baseline Retrieval | ✅ | By ID, tag, or list all |
| Embedding Generation | ✅ | Auto-generated after execution |
| Drift Comparison | ✅ | All 5 drift types detected |
| Drift Score Calculation | ✅ | 0-100 scale, A-F grade |
| UI Baseline Management | ✅ | Star icon, badge, dialog |
| UI Drift Display | ✅ | Score card, results table |
| API Endpoints | ✅ | All endpoints functional |
| Error Handling | ✅ | Graceful failures |
| Performance | ✅ | Acceptable response times |

---

## Troubleshooting

### Issue: Embeddings not generating
**Solution:**
- Check if `sentence-transformers` is installed
- Verify execution has results with responses
- Check logs for errors

### Issue: Drift comparison returns empty
**Solution:**
- Verify both executions are completed
- Check if embeddings exist for embedding drift
- Verify baseline execution has results

### Issue: Baseline not appearing in dropdown
**Solution:**
- Refresh the page
- Verify baseline was created successfully
- Check API: `GET /api/v1/baselines`

### Issue: Drift score always 100
**Solution:**
- This is normal if executions are identical
- Try comparing different executions
- Check drift results for individual findings

---

## Next Steps After Validation

1. **Performance Testing**: Test with large datasets
2. **Integration Testing**: Test with real LLM APIs
3. **User Acceptance**: Get feedback from target users
4. **Documentation**: Update user guides based on findings

---

**Validation Complete!** ✅

If all checks pass, your PromptShield v1.1 installation is ready for use.
