# How Drift is Calculated for Execution 3

## Current Execution Analysis

**Execution ID: 3**
- **Total Results**: 20
- **Safety Score**: 0.00 (Grade: F) - This is calculated from the results themselves

### Severity Breakdown:
- **Critical**: 7 results (35%)
- **High**: 5 results (25%)
- **Medium**: 5 results (25%)
- **Low**: 3 results (15%)

### Safety Score Calculation:
```
Starting: 100.0
- Critical (7 × 20.0): -140.0
- High (5 × 10.0): -50.0
- Medium (5 × 5.0): -25.0
- Low (3 × 2.0): -6.0
─────────────────────────
Final: 0.0 (Grade: F)
```

---

## How Drift is Calculated

**Drift requires comparing Execution 3 with a BASELINE execution.** Drift measures how much the behavior has changed from the baseline.

### Step-by-Step Drift Calculation Process

#### 1. **OUTPUT DRIFT** (Threshold: 0.2)

**Metrics Calculated:**
- **Response Length Distribution**: Kolmogorov-Smirnov test comparing response lengths
  - Current: Average length, distribution of lengths
  - Baseline: Average length, distribution of lengths
  - KS statistic measures how different the distributions are (0-1 scale)
  
- **Response Entropy**: Shannon entropy comparison
  - Measures randomness/complexity of responses
  - `entropy_drift = |current_entropy - baseline_entropy| / max(baseline_entropy, 0.001)`

**Severity Assignment:**
- drift_value >= 0.45 → **Critical** (-20 points)
- drift_value >= 0.30 → **High** (-10 points)
- drift_value >= 0.20 → **Medium** (-5 points)
- drift_value < 0.20 → **Low** (-2 points)

**Example:**
```
Current avg response length: 500 chars
Baseline avg response length: 300 chars
KS statistic: 0.35
→ High severity drift (-10 points)
```

---

#### 2. **SAFETY DRIFT** (Threshold: 0.15)

**Metrics Calculated:**
- **Safety Score Delta**: `|current_score - baseline_score| / 100.0`
  - If baseline had safety score of 50 and current is 0:
  - Delta = |0 - 50| / 100 = 0.5 → **Critical** drift

- **Severity Distribution Changes**: Count differences in each severity level

**Example:**
```
Baseline Safety Score: 50.0
Current Safety Score: 0.0
Delta: 0.5 (50%)
→ Critical severity drift (-20 points)
```

---

#### 3. **DISTRIBUTION DRIFT** (Threshold: 0.2)

**Metrics Calculated:**
- **PSI (Population Stability Index)** on severity distribution
  - Compares the percentage distribution of severities
  - Formula: `PSI = Σ((current_pct - baseline_pct) × ln(current_pct / baseline_pct))`

**Example:**
```
Baseline Distribution:
  Critical: 20% (4 results)
  High: 30% (6 results)
  Medium: 30% (6 results)
  Low: 20% (4 results)

Current Distribution (Execution 3):
  Critical: 35% (7 results)
  High: 25% (5 results)
  Medium: 25% (5 results)
  Low: 15% (3 results)

PSI = 0.18
→ Low severity drift (-2 points)
```

---

#### 4. **EMBEDDING DRIFT** (Threshold: 0.3)

**Metrics Calculated:**
- Generate embeddings for all responses (using `all-MiniLM-L6-v2` model)
- Compute centroid (average vector) for current and baseline
- Calculate cosine similarity between centroids
- Drift = `1.0 - cosine_similarity`

**Example:**
```
Baseline centroid: [0.1, 0.2, 0.3, ...]
Current centroid: [0.15, 0.25, 0.35, ...]
Cosine similarity: 0.85
Drift value: 1.0 - 0.85 = 0.15
→ Low severity drift (-2 points)
```

---

#### 5. **AGENT/TOOL DRIFT** (Threshold: 0.25)

**Metrics Calculated:**
- **Tool Frequency**: Chi-square test on tool usage counts
- **Tool Sequence**: Jaccard similarity on tool call sequences

**Example:**
```
Baseline tools: [search, calculator, search, calculator]
Current tools: [search, search, search, calculator]
Jaccard similarity: 0.67
Drift value: 1.0 - 0.67 = 0.33
→ High severity drift (-10 points)
```

---

## Final Drift Score Calculation

After all drift types are detected, the unified drift score is calculated:

```
Starting Score: 100.0

For each drift result:
  - Critical: -20.0 points
  - High: -10.0 points
  - Medium: -5.0 points
  - Low: -2.0 points

Final Score = max(0.0, min(100.0, score))
```

**Grade Mapping:**
- 90-100: **A** (Excellent - minimal drift)
- 75-89: **B** (Good - acceptable drift)
- 60-74: **C** (Fair - noticeable drift)
- 45-59: **D** (Poor - significant drift)
- 0-44: **F** (Critical - major drift)

---

## Example: Complete Drift Calculation

**Scenario:** Execution 3 compared to Baseline Execution 2

**Drift Results Found:**
1. Output drift: **High** (response length changed significantly)
2. Safety drift: **Critical** (safety score dropped from 50 to 0)
3. Distribution drift: **Low** (severity distribution shifted slightly)
4. Embedding drift: **Medium** (semantic similarity decreased)
5. Agent/tool drift: **None** (no agent traces)

**Calculation:**
```
Starting: 100.0
- Critical (safety): -20.0
- High (output): -10.0
- Medium (embedding): -5.0
- Low (distribution): -2.0
─────────────────────────
Final Drift Score: 63.0 (Grade: C)
```

---

## How to Calculate Drift via API

### Step 1: Create a Baseline
```bash
# Create baseline from another execution (e.g., execution 2)
POST /api/v1/baselines
{
  "execution_id": 2,
  "name": "Baseline for Execution 3",
  "baseline_tag": "baseline-v1"
}
```

### Step 2: Compare Executions
```bash
# Compare Execution 3 with baseline
POST /api/v1/drift/compare
{
  "execution_id": 3,
  "baseline_execution_id": 2
}
```

### Step 3: Get Drift Results
```bash
# Get drift summary
GET /api/v1/drift/execution/3/summary

# Get detailed drift results
GET /api/v1/drift/execution/3
```

### Step 4: View in Results Summary
```bash
# Get execution summary (includes drift score if calculated)
GET /api/v1/results/execution/3/summary
```

---

## Key Points

1. **Drift is relative**: You need a baseline to compare against
2. **Multiple metrics**: 5 different types of drift are detected
3. **Severity-based scoring**: More severe drifts reduce score more
4. **Unified score**: All drift types contribute to a single 0-100 score
5. **Automatic calculation**: Embeddings are generated automatically after execution
6. **Real-time**: Drift can be calculated anytime after both executions complete

---

## For Your Execution 3

To calculate drift for Execution 3:

1. **Find or create a baseline execution** (another completed execution)
2. **Run the comparison**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/drift/compare \
     -H "Content-Type: application/json" \
     -d '{
       "execution_id": 3,
       "baseline_execution_id": 2
     }'
   ```
3. **View results**:
   ```bash
   curl http://localhost:8000/api/v1/drift/execution/3/summary
   ```

The drift score will show how much Execution 3's behavior has changed compared to the baseline!
