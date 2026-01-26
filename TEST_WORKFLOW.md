# Test Workflow - PromptShield v1.1

A step-by-step guide to test all new features.

## Quick Test (5 minutes)

### Step 1: Run Validation Script

```bash
cd backend
source venv/bin/activate  # If using virtual environment
python3 validate_v1.1.py
```

**Expected Output:**
```
============================================================
PromptShield v1.1 Validation
============================================================
🔍 Validating database tables...
  ✅ baselines
  ✅ embeddings
  ✅ drift_results
  ✅ agent_traces
...
✅ All validations passed!
```

### Step 2: Test Baseline Creation (UI)

1. **Open Frontend**: http://localhost:3000
2. **Go to Executions** page
3. **Find a completed execution** (or create one first)
4. **Click the ⭐ icon** next to the execution
5. **Fill in baseline details**:
   - Name: "Test Baseline"
   - Tag: "test-run"
6. **Click "Create Baseline"**

**Verify:**
- ✅ Dialog closes
- ✅ Baseline badge appears in table
- ✅ Star icon is now filled

### Step 3: Test Drift Comparison (UI)

1. **Run a new execution** (same pipeline, same LLM config)
2. **Wait for completion**
3. **Open Results page** for the new execution
4. **Scroll to "Compare with Baseline"** section
5. **Select your baseline** from dropdown
6. **Click "Compare"**

**Verify:**
- ✅ Comparison starts
- ✅ Drift Score card appears
- ✅ Drift results table shows findings
- ✅ Score and grade are displayed

---

## Comprehensive Test (15 minutes)

### Test Scenario: Model Update Detection

**Goal**: Detect behavior changes when LLM model is updated.

#### Setup

1. **Create LLM Config for Model A**
   ```
   Name: "Model A Config"
   Endpoint: [Your LLM API endpoint for Model A]
   ```

2. **Create Pipeline**
   ```
   Name: "Security Test Pipeline"
   Libraries: Garak, PyRIT
   Categories: prompt_injection, jailbreak, misuse
   LLM Config: Model A Config
   ```

3. **Run Execution #1**
   - Wait for completion
   - Note the Safety Score

4. **Create Baseline**
   - Set Execution #1 as baseline
   - Name: "Model A Baseline"
   - Tag: "model-a"

#### Test Model Update

5. **Update LLM Config** (or create new one for Model B)
   ```
   Name: "Model B Config"
   Endpoint: [Your LLM API endpoint for Model B]
   ```

6. **Update Pipeline** (or create new one)
   - Link to Model B Config
   - Keep same libraries and categories

7. **Run Execution #2**
   - Same pipeline structure
   - Different LLM model
   - Wait for completion

#### Detect Drift

8. **Compare Executions**
   - Go to Results page for Execution #2
   - Select "Model A Baseline"
   - Click "Compare"

9. **Analyze Results**
   - **Safety Drift**: Did safety score change?
   - **Output Drift**: Did response patterns change?
   - **Embedding Drift**: Did semantic meaning change?
   - **Overall Drift Score**: Is it stable (A/B) or unstable (C/D/F)?

**Expected**: System detects differences between Model A and Model B.

---

## API Testing

### Test Baseline API

```bash
# 1. Create baseline
curl -X POST http://localhost:8000/api/v1/baselines \
  -H "Content-Type: application/json" \
  -d '{
    "execution_id": 1,
    "name": "API Test Baseline",
    "tag": "api-test"
  }'

# 2. List baselines
curl http://localhost:8000/api/v1/baselines

# 3. Get baseline by tag
curl http://localhost:8000/api/v1/baselines/tag/api-test

# 4. Get baseline by ID
curl http://localhost:8000/api/v1/baselines/1
```

### Test Drift API

```bash
# 1. Compare executions
curl -X POST http://localhost:8000/api/v1/drift/compare \
  -H "Content-Type: application/json" \
  -d '{
    "execution_id": 2,
    "baseline_execution_id": 1
  }'

# 2. Get drift results
curl http://localhost:8000/api/v1/drift/execution/2

# 3. Get drift summary
curl http://localhost:8000/api/v1/drift/execution/2/summary

# 4. Filter by drift type
curl "http://localhost:8000/api/v1/drift/execution/2?drift_type=safety"

# 5. Filter by severity
curl "http://localhost:8000/api/v1/drift/execution/2?severity=high"
```

---

## Feature-Specific Tests

### Test 1: Baseline Management

**Test Cases:**
- [ ] Create baseline from completed execution
- [ ] Create baseline with tag
- [ ] Create baseline without tag
- [ ] List all baselines
- [ ] Get baseline by ID
- [ ] Get baseline by tag
- [ ] Delete baseline
- [ ] Try to create duplicate baseline (should handle gracefully)

### Test 2: Embedding Generation

**Test Cases:**
- [ ] Embeddings auto-generate after execution
- [ ] Embeddings are stored in database
- [ ] Embedding vectors are valid (list of floats)
- [ ] Model name is stored correctly
- [ ] Duplicate embeddings are not created
- [ ] Embedding generation doesn't block execution

### Test 3: Drift Detection Types

**Test Each Drift Type:**

1. **Output Drift:**
   - [ ] Response length KS test works
   - [ ] Response entropy calculation works
   - [ ] Results show correct metrics

2. **Safety Drift:**
   - [ ] Safety score delta calculated
   - [ ] Severity count deltas shown
   - [ ] Results reflect actual differences

3. **Distribution Drift:**
   - [ ] PSI calculation works
   - [ ] Severity distribution compared
   - [ ] Results are meaningful

4. **Embedding Drift:**
   - [ ] Requires embeddings to exist
   - [ ] Centroid similarity calculated
   - [ ] Drift value reflects semantic changes

5. **Agent/Tool Drift:**
   - [ ] Tool frequency comparison works
   - [ ] Tool sequence comparison works
   - [ ] Requires agent traces (if enabled)

### Test 4: UI Components

**Executions Page:**
- [ ] Baseline column visible
- [ ] Baseline badge shows correctly
- [ ] Star icon works
- [ ] Baseline dialog opens
- [ ] Baseline creation works
- [ ] Error messages display

**Results Page:**
- [ ] "Drift Detected" badge appears
- [ ] Baseline selector dropdown works
- [ ] Compare button works
- [ ] Drift Score card displays
- [ ] Drift results table shows
- [ ] Table columns are correct
- [ ] Expandable details work
- [ ] Color coding matches grades

### Test 5: Error Handling

**Test Scenarios:**
- [ ] Invalid execution ID → 404
- [ ] Invalid baseline ID → 404
- [ ] Missing required fields → 400
- [ ] Compare incomplete execution → Error message
- [ ] Compare with missing baseline → Error message
- [ ] Network errors → Graceful handling
- [ ] Database errors → Logged, not exposed

---

## Performance Benchmarks

### Expected Performance

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Embedding generation (100 results) | < 30 seconds | First time loads model |
| Embedding generation (1000 results) | < 3 minutes | Batch processing |
| Drift comparison (small) | < 5 seconds | < 100 results each |
| Drift comparison (large) | < 30 seconds | 1000+ results each |
| Baseline creation | < 1 second | Simple DB operation |
| API response time | < 500ms | Most endpoints |

### Test Performance

```bash
# Time embedding generation
time python3 -c "
from app.services.embedding_generator import EmbeddingGenerator
EmbeddingGenerator.generate_embeddings(1)  # Replace with execution_id
"

# Time drift comparison
time curl -X POST http://localhost:8000/api/v1/drift/compare \
  -H "Content-Type: application/json" \
  -d '{"execution_id": 2, "baseline_execution_id": 1}'
```

---

## Validation Checklist

Use this checklist to track your testing:

### Setup ✅
- [ ] Backend running
- [ ] Frontend running
- [ ] Database migrations applied
- [ ] Dependencies installed
- [ ] Validation script passes

### Baseline Features ✅
- [ ] Create baseline (UI)
- [ ] Create baseline (API)
- [ ] List baselines
- [ ] Get baseline by tag
- [ ] Baseline indicator in UI
- [ ] Delete baseline

### Embedding Features ✅
- [ ] Embeddings auto-generate
- [ ] Embeddings stored correctly
- [ ] Embedding vectors valid
- [ ] Model name stored
- [ ] Performance acceptable

### Drift Detection ✅
- [ ] Output drift works
- [ ] Safety drift works
- [ ] Distribution drift works
- [ ] Embedding drift works
- [ ] Agent/tool drift works (if enabled)
- [ ] Drift score calculated
- [ ] Drift grade assigned
- [ ] Results displayed in UI

### UI Features ✅
- [ ] Baseline management UI
- [ ] Drift comparison UI
- [ ] Drift score card
- [ ] Drift results table
- [ ] Error messages
- [ ] Loading states

### API Features ✅
- [ ] All endpoints accessible
- [ ] Request validation works
- [ ] Response format correct
- [ ] Error handling works
- [ ] Async processing works

---

## Common Issues & Solutions

### Issue: "No baselines found" in dropdown
**Solution**: Create a baseline first from a completed execution

### Issue: Drift comparison returns empty results
**Solution**: 
- Verify both executions are completed
- Check if they have results
- For embedding drift, ensure embeddings were generated

### Issue: Embeddings not generating
**Solution**:
- Check if `sentence-transformers` is installed
- Verify execution has results with `evidence_response`
- Check backend logs for errors

### Issue: Drift score always 100
**Solution**: This is normal if executions are identical. Try comparing different executions.

### Issue: "Baseline not found" error
**Solution**: 
- Verify baseline was created successfully
- Check baseline ID is correct
- Refresh the page

---

## Success Criteria

Your validation is successful if:

1. ✅ All database tables exist
2. ✅ Can create and manage baselines
3. ✅ Embeddings generate automatically
4. ✅ Drift comparison works for all types
5. ✅ UI displays all features correctly
6. ✅ API endpoints are functional
7. ✅ Error handling works gracefully
8. ✅ Performance is acceptable

---

## Next Steps

After validation:

1. **Document any issues** found
2. **Test with real LLM APIs** (not just mocks)
3. **Test with large datasets** (1000+ results)
4. **Get user feedback** on UI/UX
5. **Performance tuning** if needed
6. **Update documentation** based on findings

---

**Happy Testing!** 🚀
