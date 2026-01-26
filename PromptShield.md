# PromptShield – Unified LLM Validation & Red Teaming Platform

## 1. Product Name

**PromptShield**

## 2. Vision & Purpose

As enterprises increasingly embed Large Language Models (LLMs) into mission-critical systems, validating them for security, safety, robustness, bias, and misuse is no longer optional.

While powerful open-source Python LLM validation libraries exist, they are:
- **CLI-driven**
- **Fragmented**
- **Difficult to operationalize at enterprise scale**

PromptShield is a modern, enterprise-grade web platform that unifies open-source Python–based LLM validation and red-teaming libraries behind a single Postman-like UI, enabling repeatable, auditable, and scalable LLM validation workflows.

## 3. Goals & Objectives

### Primary Goals

1. **Centralize LLM validation** using open-source Python tooling only
2. **Eliminate CLI dependency** for security, QA, and platform teams
3. **Provide enterprise-grade LLM API configuration** (Postman-style)
4. **Enable continuous LLM security testing** across SDLC
5. **Normalize results** across heterogeneous libraries

### Explicit Constraints

✅ **Only open-source Python libraries**  
❌ **No commercial SaaS tools**  
❌ **No closed-source SDKs**

## 4. Target Users

| Persona | Responsibility |
|---------|---------------|
| Platform Engineers | Own LLM runtime & infra |
| AppSec Teams | Red teaming & abuse testing |
| QA Teams | Regression & release validation |
| AI Governance | Risk & compliance |
| Product Teams | Safe use-case validation |

## 5. Supported Open-Source Python Libraries

PromptShield is library-agnostic and plugin-based, but **only open-source Python libraries are allowed**.

### Phase-1 Supported Libraries (Python OSS Only) - **IMPLEMENTED**

| Category | Library | Description | Status |
|----------|---------|-------------|--------|
| LLM Red Teaming | **Garak** | Prompt injection, jailbreak, misuse, toxicity | ✅ Fully Implemented |
| LLM Red Teaming | **PyRIT** | Adversarial, multi-turn attacks, jailbreak | ✅ Fully Implemented |
| Robustness & Bias | **LangTest** | Bias, robustness, consistency, fairness testing | ✅ Fully Implemented |
| Evaluation & Quality | **Promptfoo** | Prompt quality, regression, output validation, prompt comparison | ✅ Fully Implemented |

**Note:** All implemented libraries make actual LLM API calls (no mocks). Each adapter includes comprehensive error handling, logging, and result normalization.

### Future Library Integrations (Planned)

| Category | Library | Description | Status |
|----------|---------|-------------|--------|
| ML Security | Adversarial Robustness Toolbox (ART) | Adversarial ML attacks | 🔄 Planned |
| Jailbreak Testing | BrokenHill | Automated jailbreak generation | 🔄 Planned |
| Fairness & Bias | AIF360 | Bias and fairness metrics | 🔄 Planned |
| Prompt Injection Detection | Rebuff (OSS mode) | Prompt injection detection | 🔄 Planned |
| Evaluation | OpenAI-Evals-style OSS frameworks | Custom Python eval harnesses | 🔄 Planned |

### Integration Requirements

All integrations must:
- Be installable via `pip`
- Have OSI-approved licenses
- Run locally or in enterprise VPCs

## 6. High-Level Architecture

### Frontend

- **Framework**: React 18.2.0
- **Type**: Modern SPA (Single Page Application)
- **UI Library**: Material-UI (MUI) 5.15.0
- **Theme**: Modern SaaS-grade light theme with sharp corners
  - Clean whites, professional grays, accent blues
  - Enterprise-grade design with sharp, precise corners (no rounded elements)
  - Consistent spacing and alignment
  - Modern typography and visual hierarchy
- **Layout Structure**:
  - Top header bar with logo, navigation links, and user actions
  - Left sidebar (280px) with user profile section and full navigation menu
  - Main content area (max-width: 1400px, centered)
- **UX Style**:
  - Dashboard-centric
  - Postman-like workflows
  - Zero CLI exposure
  - Auto-refresh for real-time updates
  - Polling for execution status

### Backend

- **Language**: Python
- **Framework**: FastAPI
- **Responsibilities**:
  - Validation orchestration
  - Library execution & isolation
  - Result normalization
  - Configuration management
  - Async pipeline execution

## 7. Core Functional Features

### 7.1 Unified Dashboard

Central command center showing:
- Validation runs & statuses
- Severity-based risk summaries
- Library-wise findings
- Execution history & trends
- Safety Score overview
- Drift Score overview (v1.1)
- Quick action buttons
- Real-time execution status updates

### 7.2 LLM API Configuration (Postman-Style)

Users configure LLM endpoints exactly like Postman.

**Supported Inputs:**
- Endpoint URL
- Port
- HTTP method
- Headers (key-value pairs)
- API keys / bearer tokens
- Payload templates with dynamic placeholders:
  - `{prompt}` - User prompt placeholder
  - `{system_prompt}` - System prompt placeholder
  - Both placeholders supported in messages array and top-level fields
- Timeout & retry configs

**Payload Template Features:**
- Supports both user and system prompts
- Flexible JSON structure
- Placeholder substitution in messages array
- Placeholder substitution in top-level JSON fields
- Automatic message array construction if not present

**Configurations are:**
- Reusable
- Environment-scoped
- Versioned

### 7.3 Validation Pipeline Builder

Visual pipeline creation:
- Select Python OSS libraries (Garak, PyRIT, LangTest, Promptfoo)
- Choose test categories by library:

  **Garak:**
  - Prompt Injection
  - Jailbreak
  - Misuse
  - Toxicity

  **PyRIT:**
  - Adversarial
  - Multi-turn
  - Jailbreak

  **LangTest:**
  - Bias
  - Robustness
  - Consistency
  - Fairness

  **Promptfoo:**
  - Prompt Quality
  - Regression
  - Output Validation
  - Prompt Comparison

- Configure severity thresholds
- Link to LLM configuration
- Save as reusable templates

### 7.4 Execution Engine (FastAPI)

The FastAPI backend:
- Loads Python OSS libraries dynamically
- Executes tests asynchronously
- Supports parallel execution
- Handles retries, timeouts, failures
- Produces normalized outputs

### 7.5 Result Normalization Layer

All library outputs are converted into a common schema:

- Test category
- Severity (critical, high, medium, low, info)
- Risk type
- Evidence (prompt/response)
- Confidence score (0.0-1.0)
- Library name
- Execution timestamp

### 7.6 Safety Score Calculation

**Safety Score Feature:**
- Calculates overall security health score (0-100 scale)
- Assigns letter grade (A, B, C, D, F)
- Based on severity-weighted findings:
  - Critical: -20 points
  - High: -10 points
  - Medium: -5 points
  - Low: -2 points
  - Info: -0.5 points
- Displayed prominently in results view
- Color-coded by grade for quick assessment

### 7.7 Reports & Evidence

Exports supported:
- **JSON** (machine-readable)
- **PDF** (audit & governance)
- **HTML** (human-readable)

### 7.8 Execution Management

**Features:**
- Asynchronous execution using `asyncio.create_task`
- Real-time status tracking (pending, running, completed, failed)
- Background task execution (non-blocking API)
- Comprehensive error handling and logging
- Execution timestamps (started_at, completed_at)
- Error message capture for failed executions
- Auto-refresh in UI (polling every 3 seconds)
- Execution lifecycle logging
- Baseline management (v1.1)
- Baseline indicators in execution list (v1.1)

### 7.9 Drift Detection (v1.1)

**Comprehensive behavior change detection across five drift types:**

1. **Output Drift Detection:**
   - Response length distribution analysis (Kolmogorov-Smirnov test)
   - Token frequency comparison
   - Response entropy calculation
   - Detects structural and content changes in LLM responses

2. **Safety Drift Detection:**
   - Safety score delta calculation
   - Severity count deltas (critical, high, medium, low, info)
   - Critical/high finding frequency changes
   - Tracks security posture changes over time

3. **Distribution Drift Detection:**
   - Statistical distribution shifts (KS test)
   - Population Stability Index (PSI) on severity distributions
   - Jensen-Shannon divergence on token frequencies
   - Identifies pattern changes in response distributions

4. **Embedding Drift Detection:**
   - Semantic similarity analysis using sentence embeddings
   - Centroid embedding comparison (cosine similarity)
   - Pairwise similarity variance
   - Detects semantic meaning changes not visible in surface metrics

5. **Agent/Tool Drift Detection:**
   - Tool frequency comparison (chi-square test)
   - Tool sequence comparison (Jaccard similarity, n-gram analysis)
   - New tool introduction detection
   - Tool overuse threshold detection
   - Loop detection (repeated tool sequences)
   - Tracks agent behavior changes

**Drift Detection Features:**
- Automatic embedding generation after execution completion
- Baseline management with tagging support
- Unified drift score (0-100) with letter grades (A-F)
- Configurable thresholds per drift type
- Deterministic and explainable calculations
- Async processing for non-blocking comparisons
- Detailed drift findings with metrics and evidence

### 7.10 Baseline Management (v1.1)

**Baseline creation and management:**
- Create baselines from completed executions
- Tag baselines for easy identification (e.g., "golden-run", "v1.0")
- Three baseline selection modes:
  - Previous execution (automatic)
  - Tagged baseline (by tag name)
  - Explicit baseline (by execution ID)
- Baseline indicators in UI
- Baseline CRUD operations via API
- Baseline deletion and management

### 7.11 Embedding Generation (v1.1)

**Automatic semantic embedding generation:**
- Generates embeddings for all result responses
- Uses sentence-transformers models (default: all-MiniLM-L6-v2)
- Supports multiple embedding models
- Batch processing for efficiency
- Model caching for performance
- Automatic generation after execution completion
- Embeddings stored for drift comparison
- Configurable embedding model at app level

## 8. Supported LLMs

PromptShield works with any LLM exposed via HTTP API, including:
- OpenAI-compatible APIs
- Azure OpenAI
- Anthropic
- Gemini
- Private/on-prem enterprise LLMs

**No SDK dependency required.**

## 9. User Workflow

### Basic Validation Workflow (v1.0)

1. Open PromptShield dashboard
2. Configure LLM API (headers, URL, port)
3. Select Python OSS validation libraries
4. Build or select pipeline
5. Execute validation
6. Review findings
7. Export/share reports

### Drift Detection Workflow (v1.1)

1. **Create Baseline:**
   - Complete an execution
   - Set it as baseline (with optional tag)
   - Baseline stored for future comparisons

2. **Run New Execution:**
   - Execute same pipeline with same LLM config
   - Wait for completion
   - Embeddings auto-generated

3. **Compare for Drift:**
   - Open Results page for new execution
   - Select baseline from dropdown
   - Click "Compare with Baseline"
   - Review drift score and findings

4. **Analyze Results:**
   - Check drift score (0-100, higher is better)
   - Review drift grade (A-F)
   - Examine drift findings by type
   - Make informed decisions about model updates

## 10. Non-Functional Requirements

### Performance
- Async execution
- Concurrent pipelines
- Large prompt set handling

### Security
- Secrets never logged
- No prompt persistence by default
- On-prem / VPC-friendly

### Scalability
- Stateless frontend
- Horizontally scalable FastAPI backend
- Docker/Kubernetes-ready

## 11. Extensibility Model

- Python plugin interface
- Adapter-based architecture
- Internal enterprise test packs supported

## 12. UI / UX Requirements

- **Theme**: Modern SaaS-grade light theme with sharp corners
- **Design**: Enterprise-grade design with precise corners (no rounded elements)
- **Layout**: 
  - Top header with logo and navigation
  - Left sidebar (280px) with user profile and full navigation
  - Centered main content (max-width: 1400px)
- **Visualization**: Clear severity and drift visualization
- **User Experience**: 
  - Minimal cognitive load
  - Auto-refresh for real-time updates
  - Loading indicators for async operations
  - Comprehensive error messages
  - Intuitive baseline and drift management

## 13. Success Metrics

- Reduction in manual LLM security testing
- Increased vulnerability detection pre-prod
- Adoption across teams
- Pipeline reuse and automation rate

## 14. Implementation Summary

### Project Structure

```
promptshield/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       ├── llm_configs.py      # LLM API configuration management
│   │   │       ├── pipelines.py        # Pipeline CRUD operations
│   │   │       ├── executions.py       # Execution management
│   │   │       ├── results.py          # Results retrieval and filtering
│   │   │       ├── reports.py          # Report generation endpoints
│   │   │       ├── baselines.py        # Baseline management (v1.1)
│   │   │       └── drift.py            # Drift detection (v1.1)
│   │   ├── core/
│   │   │   └── config.py               # Application configuration
│   │   ├── db/
│   │   │   ├── database.py             # Database setup
│   │   │   └── models.py               # SQLAlchemy models
│   │   └── services/
│   │       ├── execution_engine.py     # Pipeline orchestration
│   │       ├── normalizer.py           # Result normalization
│   │       ├── library_adapters.py     # Library plugin interface
│   │       ├── report_generator.py     # Report generation (JSON/PDF/HTML)
│   │       ├── baseline_manager.py     # Baseline management (v1.1)
│   │       ├── embedding_generator.py # Embedding generation (v1.1)
│   │       ├── drift_engine.py         # Drift detection engine (v1.1)
│   │       └── agent_trace_extractor.py # Agent trace extraction (v1.1)
│   ├── main.py                         # FastAPI application entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── alembic/                        # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_add_drift_detection_tables.py
│   ├── alembic.ini                     # Alembic configuration
│   └── validate_v1.1.py               # Validation script (v1.1)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js               # Main layout with navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.js            # Unified dashboard
│   │   │   ├── LLMConfigs.js           # Postman-style LLM config UI
│   │   │   ├── Pipelines.js            # Pipeline builder
│   │   │   ├── Executions.js           # Execution management
│   │   │   └── Results.js              # Results viewer with filters
│   │   ├── App.js                      # React router setup
│   │   └── index.js                    # React entry point
│   ├── package.json                    # Node.js dependencies
│   └── public/
│       └── index.html                  # HTML template
├── README.md                           # Quick start guide
├── SETUP.md                            # Detailed setup guide
├── QUICK_START.md                      # Quick start guide
├── VALIDATION_GUIDE.md                 # Feature validation guide (v1.1)
├── TEST_WORKFLOW.md                    # Test workflow guide (v1.1)
├── FUNCTIONALITY_GUIDE.md              # Non-technical user guide
├── PromptShield.md                     # This documentation file
└── .gitignore                          # Git ignore rules
```

### Key Components

#### Backend (FastAPI)

1. **API Endpoints** (`app/api/endpoints/`)
   - RESTful API for all operations
   - CRUD operations for configs, pipelines, executions
   - Result filtering and aggregation
   - Report generation endpoints

2. **Database Models** (`app/db/models.py`)
   - `LLMConfig`: Stores LLM API configurations
   - `Pipeline`: Validation pipeline definitions
   - `Execution`: Execution records with status tracking
   - `Result`: Normalized validation results
   - **v1.1 Models:**
     - `Baseline`: Baseline execution references with tags
     - `Embedding`: Embedding vectors for semantic drift detection
     - `DriftResult`: Drift detection results with metrics
     - `AgentTrace`: Agent execution traces for behavior drift

3. **Execution Engine** (`app/services/execution_engine.py`)
   - Async pipeline orchestration
   - Parallel library execution
   - Status tracking and error handling
   - **v1.1 Enhancements:**
     - Automatic embedding generation after execution
     - Agent trace extraction (if enabled)
     - Background task management for post-execution processing

4. **Library Adapters** (`app/services/library_adapters.py`)
   - Plugin-based architecture
   - Base `LibraryAdapter` interface
   - Implementations for Garak, PyRIT, LangTest, Promptfoo
   - **All adapters make actual LLM API calls** (no mocks)
   - Comprehensive error handling with tracebacks
   - Detailed logging for debugging
   - Support for system prompts in payload templates
   - Centralized HTTP client with retry logic
   - Response validation and error detection
   - Extensible for additional libraries

5. **Result Normalizer** (`app/services/normalizer.py`)
   - Converts library-specific outputs to common schema
   - Standardizes severity levels
   - Preserves metadata

6. **Report Generator** (`app/services/report_generator.py`)
   - JSON export (machine-readable)
   - HTML export (human-readable with styling)
   - PDF export (audit-ready)

7. **Baseline Manager** (`app/services/baseline_manager.py`) - v1.1
   - Create baselines from executions
   - Retrieve baselines by ID, tag, or execution
   - List and manage baselines
   - Get previous execution for automatic baseline selection
   - Delete baselines

8. **Embedding Generator** (`app/services/embedding_generator.py`) - v1.1
   - Generate embeddings for result responses
   - Support multiple embedding models
   - Batch processing for efficiency
   - Model caching for performance
   - Cosine similarity calculation
   - Centroid computation for drift detection

9. **Drift Engine** (`app/services/drift_engine.py`) - v1.1
   - Compare executions for behavior drift
   - Detect 5 types of drift (output, safety, distribution, embedding, agent_tool)
   - Calculate unified drift score (0-100)
   - Assign drift grades (A-F)
   - Statistical analysis (KS test, PSI, chi-square, Jaccard)
   - Deterministic and explainable calculations

10. **Agent Trace Extractor** (`app/services/agent_trace_extractor.py`) - v1.1
    - Extract structured traces from agent executions
    - LangChain callback integration (optional)
    - AutoGen hook integration (optional)
    - Parse tool calls and LLM calls
    - Store traces for behavior drift analysis

#### Frontend (React)

1. **Dashboard** (`pages/Dashboard.js`)
   - Overview statistics
   - Severity-based charts
   - Quick actions

2. **LLM Configs** (`pages/LLMConfigs.js`)
   - Postman-style configuration UI
   - Header management
   - Payload template editor
   - Environment scoping

3. **Pipelines** (`pages/Pipelines.js`)
   - Visual pipeline builder
   - Library selection
   - Test category selection
   - Template management

4. **Executions** (`pages/Executions.js`)
   - Execution list with status
   - Start new executions
   - Auto-refresh (polling every 3 seconds)
   - Loading indicators for running executions
   - Polling logic for new execution completion
   - Error message display for failed executions
   - **Baseline management (v1.1):**
     - Baseline indicator badge on baseline executions
     - "Set as Baseline" button (⭐ icon) for completed executions
     - Baseline creation dialog with name and tag input
     - Baseline column in executions table
   - Export reports

5. **Results** (`pages/Results.js`)
   - Filterable results table
   - Severity-based visualization
   - **Safety Score card** with grade (A-F) and color coding
   - **Drift Detection UI (v1.1):**
     - "Drift Detected" badge when drift results exist
     - Baseline selector dropdown
     - "Compare with Baseline" button
     - **Drift Score card** with grade (A-F) and color coding
     - Drift results table with columns:
       - Drift Type, Metric, Value, Threshold, Severity, Confidence
     - Expandable details for each drift finding
     - Filtering by drift type and severity
   - Evidence viewer
   - Export functionality (JSON, HTML, PDF)
   - Summary statistics (by severity, library, category)
   - Drift summary statistics (v1.1)

### Database Schema

**Core Tables (v1.0):**
- **LLMConfig**: API endpoint configurations with headers, payloads, timeouts
- **Pipeline**: Library selections, test categories, severity thresholds
- **Execution**: Status tracking, timestamps, error messages
- **Result**: Normalized findings with evidence, severity, confidence

**Drift Detection Tables (v1.1):**
- **Baseline**: Baseline execution references with tags and metadata
- **Embedding**: Embedding vectors for result responses (JSON array of floats)
- **DriftResult**: Drift detection results with metrics, values, and severity
- **AgentTrace**: Agent execution traces for tool/behavior drift detection

### API Endpoints

#### LLM Configs
- `POST /api/v1/llm-configs` - Create configuration
- `GET /api/v1/llm-configs` - List configurations
- `GET /api/v1/llm-configs/{id}` - Get configuration
- `PUT /api/v1/llm-configs/{id}` - Update configuration
- `DELETE /api/v1/llm-configs/{id}` - Delete configuration

#### Pipelines
- `POST /api/v1/pipelines` - Create pipeline
- `GET /api/v1/pipelines` - List pipelines
- `GET /api/v1/pipelines/{id}` - Get pipeline
- `PUT /api/v1/pipelines/{id}` - Update pipeline
- `DELETE /api/v1/pipelines/{id}` - Delete pipeline

#### Executions
- `POST /api/v1/executions` - Start execution
- `GET /api/v1/executions` - List executions
- `GET /api/v1/executions/{id}` - Get execution
- `POST /api/v1/executions/{id}/cancel` - Cancel execution

#### Results
- `GET /api/v1/results/execution/{id}` - Get execution results (with filters: severity, library, test_category)
- `GET /api/v1/results/execution/{id}/summary` - Get summary statistics (includes safety_score, safety_grade, drift_score, drift_grade)
- `GET /api/v1/results/{id}` - Get specific result

#### Reports
- `GET /api/v1/reports/execution/{id}/json` - JSON report
- `GET /api/v1/reports/execution/{id}/html` - HTML report
- `GET /api/v1/reports/execution/{id}/pdf` - PDF report

#### Baselines (v1.1)
- `POST /api/v1/baselines` - Create baseline from execution
- `GET /api/v1/baselines` - List all baselines (with optional filters: pipeline_id, llm_config_id)
- `GET /api/v1/baselines/{id}` - Get baseline details
- `DELETE /api/v1/baselines/{id}` - Delete baseline
- `GET /api/v1/baselines/tag/{tag}` - Get baseline by tag

#### Drift Detection (v1.1)
- `POST /api/v1/drift/compare` - Compare execution with baseline (async processing)
  - Request body: `{execution_id, baseline_execution_id?, baseline_tag?, baseline_mode?}`
  - Returns: `{drift_results, drift_score, drift_grade, execution_id, baseline_execution_id}`
- `GET /api/v1/drift/execution/{id}` - Get drift results for execution
  - Query params: `baseline_execution_id?, drift_type?, severity?`
  - Returns: List of drift results
- `GET /api/v1/drift/execution/{id}/summary` - Get drift summary
  - Returns: `{drift_score, drift_grade, total_drift_results, by_type, by_severity}`

### Color Theme (Modern SaaS-Grade Light Theme)

- **Primary Colors**: Professional blues and grays
- **Background**: Clean whites and light grays
- **Accent Colors**: Professional palette
- **Component Styling**: Sharp corners (borderRadius: 0) for all elements
- **Severity Colors**:
  - Critical: `#D32F2F` (Red)
  - High: `#F57C00` (Orange)
  - Medium: `#FBC02D` (Yellow)
  - Low: `#388E3C` (Green)
  - Info: `#1976D2` (Blue)
- **Safety Score Colors**:
  - Grade A (90-100): Green border
  - Grade B (80-89): Blue border
  - Grade C (70-79): Yellow border
  - Grade D (60-69): Orange border
  - Grade F (<60): Red border

### Technology Stack

**Backend:**
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- Pydantic 2.5.0
- Uvicorn (ASGI server)
- ReportLab (PDF generation)
- Jinja2 (HTML templating)
- **Drift Detection & ML (v1.1):**
  - sentence-transformers 2.2.2 (embedding generation)
  - scipy 1.11.4 (statistical tests)
  - numpy 1.24.3 (numerical operations)
  - scikit-learn 1.3.2 (additional metrics)
  - evidently 0.4.15 (distribution drift)
- **Agent Frameworks (v1.1, optional):**
  - langchain 0.1.0 (agent framework hooks)
  - pyautogen 0.8.5 (agent framework hooks)

**Frontend:**
- React 18.2.0
- Material-UI 5.15.0
- React Router 6.20.0
- Axios (HTTP client)
- Recharts (Data visualization)

### Installation & Setup

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

### Usage Example

1. **Configure LLM API:**
   - Navigate to "LLM Configs"
   - Click "New Configuration"
   - Enter endpoint URL, headers, payload template
   - Save configuration

2. **Create Pipeline:**
   - Navigate to "Pipelines"
   - Click "New Pipeline"
   - Select libraries (e.g., Garak, PyRIT)
   - Choose test categories (e.g., prompt_injection, jailbreak)
   - Link to LLM configuration
   - Save pipeline

3. **Execute Validation:**
   - Navigate to "Executions"
   - Click "Start Execution"
   - Select pipeline and LLM config
   - Execution runs asynchronously

4. **Review Results:**
   - View execution status
   - Click to view detailed results
   - Filter by severity, library, category
   - Export reports (JSON/PDF/HTML)

### Extending with New Libraries

To add a new library adapter:

1. Create a new class inheriting from `LibraryAdapter` in `app/services/library_adapters.py`:

```python
class NewLibraryAdapter(LibraryAdapter):
    def get_name(self) -> str:
        return "new_library"
    
    def supports_category(self, category: str) -> bool:
        # Return True for supported categories
        return category in ["category1", "category2"]
    
    async def execute(self, llm_config: LLMConfig, test_categories: List[str]) -> List[Dict[str, Any]]:
        # Implement library execution
        # Return list of raw results
        pass
```

2. Register in `_ADAPTERS` dictionary:

```python
_ADAPTERS = {
    "garak": GarakAdapter(),
    "pyrit": PyRITAdapter(),
    "langtest": LangTestAdapter(),
    "promptfoo": PromptfooAdapter(),
    "new_library": NewLibraryAdapter(),
}
```

**Current Adapter Registry:**
- `garak` - GarakAdapter (prompt_injection, jailbreak, misuse, toxicity)
- `pyrit` - PyRITAdapter (adversarial, multi_turn, jailbreak)
- `langtest` - LangTestAdapter (bias, robustness, consistency, fairness)
- `promptfoo` - PromptfooAdapter (prompt_quality, regression, output_validation, prompt_comparison)

### Security Considerations

- API keys stored in database (consider encryption for production)
- No prompt persistence by default (configurable)
- Secrets never logged
- On-prem/VPC deployment ready
- CORS configured for frontend origins
- Comprehensive error handling prevents information leakage
- Request/response validation

### Implementation Details

**LLM Call Implementation:**
- All library adapters make actual HTTP calls to configured LLM endpoints
- Uses `httpx` for asynchronous HTTP requests
- Supports custom headers, authentication, and payload templates
- Handles connection errors, HTTP errors, and JSON parsing errors
- Validates responses to ensure actual LLM responses (not error messages)
- Comprehensive logging for debugging and monitoring

**Payload Template System:**
- Supports `{prompt}` placeholder for user prompts
- Supports `{system_prompt}` placeholder for system prompts
- Placeholders can be used in messages array or top-level JSON fields
- Automatic message array construction if template doesn't include it
- Flexible JSON structure support

**Error Handling:**
- All adapters include try-except blocks with detailed logging
- Traceback logging for debugging
- Graceful failure handling (failed tests don't crash entire execution)
- Execution status tracking (failed executions marked appropriately)
- User-friendly error messages in UI

### Future Enhancements

- Authentication & authorization
- Multi-user support with roles
- Scheduled executions
- Webhook notifications
- Advanced filtering and search
- Custom test case creation
- Integration with CI/CD pipelines
- Real-time execution monitoring
- Result comparison across runs
- Compliance reporting templates

## 15. Final Summary

PromptShield is a production-grade LLM validation platform built entirely on open-source Python libraries, with a React frontend, FastAPI backend, and enterprise-ready UX.

It brings Postman-level usability to LLM security, red teaming, and governance—without vendor lock-in, closed tooling, or black-box dependencies.

The platform successfully:
- ✅ Centralizes LLM validation using only open-source Python libraries
- ✅ Eliminates CLI dependency with a modern web UI
- ✅ Provides Postman-style LLM API configuration with system prompt support
- ✅ Enables repeatable, auditable validation workflows
- ✅ Normalizes results across heterogeneous libraries
- ✅ Supports multiple export formats for governance and reporting
- ✅ Implements extensible plugin architecture for new libraries
- ✅ Delivers modern SaaS-grade UX with sharp corners and enterprise design
- ✅ **Makes actual LLM API calls** (no mocks) for all integrated libraries
- ✅ Implements **Safety Score** calculation and grading (A-F)
- ✅ Provides real-time execution monitoring with auto-refresh
- ✅ Includes comprehensive error handling and logging
- ✅ Supports 4 libraries: Garak, PyRIT, LangTest, Promptfoo
- ✅ Implements asynchronous execution with background tasks
- ✅ **v1.1: Drift Detection** - Comprehensive behavior change detection
- ✅ **v1.1: Baseline Management** - Tagged baseline system for comparisons
- ✅ **v1.1: Embedding Generation** - Automatic semantic embedding creation
- ✅ **v1.1: Five Drift Types** - Output, Safety, Distribution, Embedding, Agent/Tool
- ✅ **v1.1: Unified Drift Score** - 0-100 scale with A-F grading
- ✅ **v1.1: Agent Trace Support** - Optional LangChain/AutoGen integration

---

**Version**: 1.1.0  
**Last Updated**: December 2024  
**License**: Open Source (TBD)

## 17. PromptShield v1.1 - Drift Detection & Behavior Assurance

### 17.1 Overview

PromptShield v1.1 extends the platform with comprehensive drift detection capabilities, enabling enterprises to detect behavior changes in LLM systems and agents over time. This feature addresses the critical need to answer: *"Is our LLM or agent still behaving the way we approved?"*

**Key Capabilities:**
- **Batch-based drift detection** - Compare executions to detect behavior changes
- **Semantic embedding drift** - Detect meaning changes using embeddings
- **Agent/tool behavior drift** - Track agent behavior changes
- **Baseline management** - Tagged baseline system for golden runs
- **Unified scoring** - Single drift score (0-100) with letter grades
- **Deterministic results** - All calculations are explainable and reproducible

### 17.2 Drift Types Supported

| Drift Type | Description | Detection Method |
|------------|-------------|------------------|
| **Output Drift** | Structural/content changes in responses | Response length distribution (KS test), token frequency, response entropy |
| **Safety Drift** | Safety score and severity changes | Safety score delta, severity count deltas, critical/high finding frequency |
| **Distribution Drift** | Statistical distribution shifts | KS test, PSI (Population Stability Index), JS divergence |
| **Embedding Drift** | Semantic meaning changes | Cosine similarity between centroid embeddings, pairwise similarity variance |
| **Agent/Tool Drift** | Tool usage and behavior changes | Tool frequency comparison (chi-square), tool sequence comparison (Jaccard), new tool detection |

### 17.3 Baseline Management

Baselines are explicit, user-controlled reference points for comparison:

- **Previous Execution**: Automatically use the most recent completed execution for the same pipeline + LLM config
- **Tagged Baseline**: Create baselines with tags (e.g., "golden-run", "v1.0") for easy identification
- **Explicit Baseline**: Manually select any completed execution as a baseline

**Baseline Features:**
- Create baselines from completed executions
- Tag baselines for easy retrieval
- List and manage all baselines
- Delete baselines when no longer needed
- Baseline indicators in UI

### 17.4 Drift Detection Workflow

1. **Create Baseline:**
   - Complete an execution
   - Mark it as a baseline (with optional tag)
   - Baseline is stored for future comparisons

2. **Run New Execution:**
   - Execute the same pipeline with the same LLM config
   - Execution completes and results are stored

3. **Compare with Baseline:**
   - Select baseline (previous execution, tagged baseline, or explicit)
   - Trigger drift comparison
   - System calculates all drift types

4. **Review Drift Results:**
   - View drift score (0-100, higher is better)
   - Review drift grade (A-F)
   - Examine detailed drift findings by type
   - Filter by severity and drift type

### 17.5 Drift Score & Grading

**Unified Drift Score Calculation:**
- Starts at 100 (perfect stability)
- Deducts points based on drift severity:
  - Critical: -20 points
  - High: -10 points
  - Medium: -5 points
  - Low: -2 points
- Final score ranges from 0-100

**Drift Grade Mapping:**
- **A (90-100)**: Stable - No significant drift detected
- **B (75-89)**: Minor Drift - Some changes detected, acceptable
- **C (60-74)**: Risk - Moderate drift, review recommended
- **D (45-59)**: Significant Drift - Major changes detected
- **F (<45)**: Unstable - Critical drift, immediate action required

### 17.6 API Endpoints (v1.1)

#### Baseline Endpoints

- `POST /api/v1/baselines` - Create baseline from execution
- `GET /api/v1/baselines` - List all baselines (with optional filters)
- `GET /api/v1/baselines/{id}` - Get baseline details
- `DELETE /api/v1/baselines/{id}` - Delete baseline
- `GET /api/v1/baselines/tag/{tag}` - Get baseline by tag

#### Drift Detection Endpoints

- `POST /api/v1/drift/compare` - Compare execution with baseline (async)
- `GET /api/v1/drift/execution/{id}` - Get drift results for execution
- `GET /api/v1/drift/execution/{id}/summary` - Get drift summary (score, grade, aggregations)

### 17.7 Database Schema (v1.1 Additions)

**New Tables:**

1. **baselines** - Stores baseline execution references
2. **embeddings** - Stores embedding vectors for result responses
3. **drift_results** - Stores drift detection results
4. **agent_traces** - Stores agent execution traces (optional)

### 17.8 Configuration

**New Settings in `app/core/config.py`:**

```python
DRIFT_THRESHOLDS = {
    "output": 0.2,
    "safety": 0.15,
    "distribution": 0.2,
    "embedding": 0.3,
    "agent_tool": 0.25,
}
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
ENABLE_AGENT_TRACES = False
DRIFT_COMPARISON_TIMEOUT = 600  # seconds
```

### 17.9 Dependencies (v1.1)

**New Python Packages:**
- `sentence-transformers==2.2.2` - Embedding generation
- `scipy==1.11.4` - Statistical tests
- `numpy==1.24.3` - Numerical operations
- `scikit-learn==1.3.2` - Additional metrics
- `evidently==0.4.15` - Distribution drift (optional)
- `langchain==0.1.0` - Agent framework hooks (optional)
- `autogen==0.2.0` - Agent framework hooks (optional)

### 17.10 Usage Examples

#### Example 1: Create Baseline and Compare

```python
# 1. Create baseline from completed execution
POST /api/v1/baselines
{
  "execution_id": 123,
  "name": "Production Baseline v1.0",
  "tag": "golden-run"
}

# 2. Run new execution (execution_id: 124)

# 3. Compare with baseline
POST /api/v1/drift/compare
{
  "execution_id": 124,
  "baseline_tag": "golden-run"
}

# 4. Get drift summary
GET /api/v1/drift/execution/124/summary
```

#### Example 2: Compare with Previous Execution

```python
# Automatically compare with previous execution
POST /api/v1/drift/compare
{
  "execution_id": 125,
  "baseline_mode": "previous"
}
```

### 17.11 UI Enhancements (v1.1)

**Executions Page:**
- Baseline indicator badge on baseline executions
- "Set as Baseline" button for completed executions
- Baseline creation dialog with name and tag

**Results Page:**
- "Drift Detected" badge when drift results exist
- Baseline selector dropdown
- "Compare with Baseline" button
- Drift Score card (similar to Safety Score)
- Drift results table with filtering
- Color-coded drift grades

### 17.12 Technical Implementation

**Architecture:**
- Drift detection runs asynchronously via background tasks
- Embeddings are generated automatically after execution completion
- Agent traces are extracted if agent frameworks are enabled
- All drift calculations are deterministic and explainable

**Performance:**
- Batch processing for embedding generation
- Configurable thresholds for drift detection
- Efficient database queries with proper indexing
- Async processing for non-blocking comparisons

### 17.13 Migration Guide

To upgrade from v1.0 to v1.1:

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Database Migration:**
   ```bash
   alembic upgrade head
   ```

3. **Configure Settings:**
   - Update `app/core/config.py` with drift detection settings
   - Adjust thresholds as needed

4. **Restart Services:**
   - Restart backend server
   - Frontend will automatically pick up new features

### 17.14 Limitations & Future Enhancements

**Current Limitations:**
- Real-time drift detection not supported (batch-only)
- Agent framework hooks require manual integration (optional feature)
- Embedding generation adds processing time (runs asynchronously)
- Embedding model is app-level config (not per-execution)

**Future Enhancements:**
- Scheduled drift comparisons
- Drift trend visualization over time
- Automated alerting for significant drift
- Enhanced agent framework integration
- Custom drift metric definitions
- Per-pipeline embedding model selection
- Optional embedding generation toggle
- Drift comparison history and trends

## 16. Recent Updates & Improvements

### Completed Features (December 2024)

1. **Full Library Integration**
   - ✅ Garak adapter with actual LLM calls
   - ✅ PyRIT adapter with actual LLM calls (replaced mock)
   - ✅ LangTest adapter with actual LLM calls (replaced mock)
   - ✅ Promptfoo adapter with actual LLM calls (new integration)

2. **Safety Score Feature**
   - ✅ Safety score calculation (0-100 scale)
   - ✅ Letter grade assignment (A-F)
   - ✅ Color-coded display in UI
   - ✅ Integration in results summary API

3. **Payload Template Enhancements**
   - ✅ Support for `{prompt}` placeholder
   - ✅ Support for `{system_prompt}` placeholder
   - ✅ Flexible JSON structure handling

4. **UI/UX Improvements**
   - ✅ Modern SaaS-grade design with sharp corners
   - ✅ Top header with logo and navigation
   - ✅ Left sidebar with user profile and full navigation
   - ✅ Centered main content area (max-width: 1400px)
   - ✅ Auto-refresh for executions list
   - ✅ Polling for execution status
   - ✅ Loading indicators and error messages

5. **Error Handling & Logging**
   - ✅ Comprehensive logging throughout backend
   - ✅ Traceback logging for debugging
   - ✅ Error validation for LLM responses
   - ✅ Execution status tracking (failed executions properly marked)

6. **Execution Engine Improvements**
   - ✅ Asynchronous execution using `asyncio.create_task`
   - ✅ Background task management
   - ✅ Execution lifecycle logging
   - ✅ Proper timestamp tracking

7. **Testing & Validation**
   - ✅ API integration test (`test_api.py`)
   - ✅ Simple adapter test (`test_simple.py`)
   - ✅ Full flow verification (config → pipeline → execution → results)
   - ✅ Validation script (`validate_v1.1.py`)
   - ✅ Comprehensive validation guides

8. **Drift Detection Features (v1.1)**
   - ✅ Baseline management system
   - ✅ Automatic embedding generation
   - ✅ Five drift types detection
   - ✅ Unified drift scoring
   - ✅ Agent trace extraction (optional)
   - ✅ Complete UI integration
   - ✅ Full API support
   - ✅ Database migrations
   - ✅ Comprehensive documentation