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

### Phase-1 Supported Libraries (Python OSS Only)

| Category | Library | Description |
|----------|---------|-------------|
| LLM Red Teaming | Garak | Prompt injection, jailbreak, misuse |
| LLM Red Teaming | PyRIT | Adversarial and multi-turn attacks |
| Robustness & Bias | LangTest | Bias, robustness, consistency testing |
| ML Security | Adversarial Robustness Toolbox (ART) | Adversarial ML attacks |
| Jailbreak Testing | BrokenHill | Automated jailbreak generation |
| Fairness & Bias | AIF360 | Bias and fairness metrics |
| Prompt Injection Detection | Rebuff (OSS mode) | Prompt injection detection |
| Evaluation | OpenAI-Evals-style OSS frameworks | Custom Python eval harnesses |

### Integration Requirements

All integrations must:
- Be installable via `pip`
- Have OSI-approved licenses
- Run locally or in enterprise VPCs

## 6. High-Level Architecture

### Frontend

- **Framework**: React
- **Type**: Modern SPA
- **Theme**: Light Wells Fargo–inspired color palette
  - Clean whites, soft blues, muted yellows
- **UX Style**:
  - Dashboard-centric
  - Postman-like workflows
  - Zero CLI exposure

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
- Filters by model, API, environment, test type

### 7.2 LLM API Configuration (Postman-Style)

Users configure LLM endpoints exactly like Postman.

**Supported Inputs:**
- Endpoint URL
- Port
- HTTP method
- Headers (key-value pairs)
- API keys / bearer tokens
- Payload templates
- Timeout & retry configs

**Configurations are:**
- Reusable
- Environment-scoped
- Versioned

### 7.3 Validation Pipeline Builder

Visual pipeline creation:
- Select Python OSS libraries
- Choose test categories:
  - Prompt Injection
  - Jailbreak
  - Data Leakage
  - Bias & Fairness
  - Toxicity
  - Hallucination
- Configure severity thresholds
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
- Severity
- Risk type
- Evidence (prompt/response)
- Confidence score (if available)

### 7.6 Reports & Evidence

Exports supported:
- **JSON** (machine-readable)
- **PDF** (audit & governance)
- **HTML** (human-readable)

## 8. Supported LLMs

PromptShield works with any LLM exposed via HTTP API, including:
- OpenAI-compatible APIs
- Azure OpenAI
- Anthropic
- Gemini
- Private/on-prem enterprise LLMs

**No SDK dependency required.**

## 9. User Workflow

1. Open PromptShield dashboard
2. Configure LLM API (headers, URL, port)
3. Select Python OSS validation libraries
4. Build or select pipeline
5. Execute validation
6. Review findings
7. Export/share reports

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

- Light Wells Fargo–style color theme
- Modern enterprise design
- Clear severity visualization
- Minimal cognitive load

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
│   │   │       └── reports.py          # Report generation endpoints
│   │   ├── core/
│   │   │   └── config.py               # Application configuration
│   │   ├── db/
│   │   │   ├── database.py             # Database setup
│   │   │   └── models.py               # SQLAlchemy models
│   │   └── services/
│   │       ├── execution_engine.py     # Pipeline orchestration
│   │       ├── normalizer.py           # Result normalization
│   │       ├── library_adapters.py     # Library plugin interface
│   │       └── report_generator.py     # Report generation (JSON/PDF/HTML)
│   ├── main.py                         # FastAPI application entry point
│   └── requirements.txt                 # Python dependencies
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

3. **Execution Engine** (`app/services/execution_engine.py`)
   - Async pipeline orchestration
   - Parallel library execution
   - Status tracking and error handling

4. **Library Adapters** (`app/services/library_adapters.py`)
   - Plugin-based architecture
   - Base `LibraryAdapter` interface
   - Implementations for Garak, PyRIT, LangTest
   - Extensible for additional libraries

5. **Result Normalizer** (`app/services/normalizer.py`)
   - Converts library-specific outputs to common schema
   - Standardizes severity levels
   - Preserves metadata

6. **Report Generator** (`app/services/report_generator.py`)
   - JSON export (machine-readable)
   - HTML export (human-readable with styling)
   - PDF export (audit-ready)

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
   - Export reports

5. **Results** (`pages/Results.js`)
   - Filterable results table
   - Severity-based visualization
   - Evidence viewer
   - Export functionality

### Database Schema

- **LLMConfig**: API endpoint configurations with headers, payloads, timeouts
- **Pipeline**: Library selections, test categories, severity thresholds
- **Execution**: Status tracking, timestamps, error messages
- **Result**: Normalized findings with evidence, severity, confidence

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
- `GET /api/v1/results/execution/{id}` - Get execution results
- `GET /api/v1/results/execution/{id}/summary` - Get summary statistics
- `GET /api/v1/results/{id}` - Get specific result

#### Reports
- `GET /api/v1/reports/execution/{id}/json` - JSON report
- `GET /api/v1/reports/execution/{id}/html` - HTML report
- `GET /api/v1/reports/execution/{id}/pdf` - PDF report

### Color Theme (Wells Fargo Inspired)

- **Primary Blue**: `#003087`
- **Secondary Blue**: `#0053A0`
- **Light Blue**: `#E6F0F5`
- **Accent Yellow**: `#FFC72C`
- **Muted Yellow**: `#F5E6D3`
- **Severity Colors**:
  - Critical: `#D32F2F` (Red)
  - High: `#F57C00` (Orange)
  - Medium: `#FBC02D` (Yellow)
  - Low: `#388E3C` (Green)
  - Info: `#1976D2` (Blue)

### Technology Stack

**Backend:**
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- Pydantic 2.5.0
- Uvicorn (ASGI server)
- ReportLab (PDF generation)
- Jinja2 (HTML templating)

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
    "new_library": NewLibraryAdapter(),
}
```

### Security Considerations

- API keys stored in database (consider encryption for production)
- No prompt persistence by default (configurable)
- Secrets never logged
- On-prem/VPC deployment ready
- CORS configured for frontend origins

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
- ✅ Provides Postman-style LLM API configuration
- ✅ Enables repeatable, auditable validation workflows
- ✅ Normalizes results across heterogeneous libraries
- ✅ Supports multiple export formats for governance and reporting
- ✅ Implements extensible plugin architecture for new libraries
- ✅ Delivers enterprise-grade UX with Wells Fargo-inspired design

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Open Source (TBD)

