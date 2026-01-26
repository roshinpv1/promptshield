# Local Setup Guide

This guide will help you run PromptShield locally on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Git** (optional, for cloning)

Verify installations:
```bash
python --version  # Should be 3.11 or higher
node --version     # Should be 18 or higher
npm --version
```

## Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd /Users/roshinpv/Documents/AI/promptshield
```

### 2. Backend Setup

#### 2.1 Create Virtual Environment

```bash
cd backend
python -m venv venv
```

#### 2.2 Activate Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

#### 2.3 Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI and Uvicorn
- SQLAlchemy for database
- ReportLab for PDF generation
- **Drift Detection Libraries**: sentence-transformers, scipy, numpy, scikit-learn, evidently
- **Agent Frameworks**: langchain, pyautogen (optional)
- And other required packages

**Note:** Installing sentence-transformers may take a few minutes as it downloads ML models.

#### 2.4 Run Database Migrations (v1.1)

**Important:** For v1.1, you need to run database migrations to create the new drift detection tables:

```bash
# Make sure you're in the backend directory
cd backend

# Run migrations
alembic upgrade head
```

This will create the following new tables:
- `baselines` - Baseline execution references
- `embeddings` - Embedding vectors for drift detection
- `drift_results` - Drift detection results
- `agent_traces` - Agent execution traces

**If you get an error about Alembic not being installed:**
```bash
pip install alembic
```

**If you're upgrading from v1.0:**
- The migration will add new tables without affecting existing data
- Your existing executions and results will remain intact

#### 2.5 Create Required Directories

```bash
mkdir -p results reports
```

#### 2.6 Start Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or simply:
```bash
python main.py
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Backend is now running at:** `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs` (Swagger UI)

### 3. Frontend Setup

Open a **new terminal window** (keep backend running in the first terminal).

#### 3.1 Navigate to Frontend Directory

```bash
cd /Users/roshinpv/Documents/AI/promptshield/frontend
```

#### 3.2 Install Dependencies

```bash
npm install
```

This will install:
- React and React DOM
- Material-UI components
- React Router
- Axios for API calls
- Recharts for data visualization

#### 3.3 Start Frontend Development Server

```bash
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

**Frontend is now running at:** `http://localhost:3000`

## Verify Installation

### Test Backend

1. Open browser and go to: `http://localhost:8000`
   - Should see: `{"status":"ok","service":"PromptShield API"}`

2. Go to: `http://localhost:8000/health`
   - Should see health check response

3. Go to: `http://localhost:8000/docs`
   - Should see Swagger API documentation

### Test Frontend

1. Open browser and go to: `http://localhost:3000`
   - Should see the PromptShield dashboard

2. Navigate through the menu:
   - Dashboard
   - LLM Configs
   - Pipelines
   - Executions

## Quick Start Workflow

Once both servers are running:

1. **Create an LLM Configuration:**
   - Go to "LLM Configs" in the frontend
   - Click "New Configuration"
   - Enter your LLM API details (URL, headers, payload template)
   - Save

2. **Create a Pipeline:**
   - Go to "Pipelines"
   - Click "New Pipeline"
   - Select libraries (Garak, PyRIT, LangTest, Promptfoo)
   - Choose test categories
   - Link to your LLM config
   - Save

3. **Run an Execution:**
   - Go to "Executions"
   - Click "Start Execution"
   - Select pipeline and LLM config
   - Execution will run in the background

4. **View Results:**
   - Click on an execution to view results
   - Filter by severity, library, or category
   - Export reports (JSON, PDF, HTML)

## Using Drift Detection (v1.1)

### Creating a Baseline

1. **Complete an Execution:**
   - Run an execution and wait for it to complete
   - This becomes your reference point

2. **Set as Baseline:**
   - In the Executions page, click the star icon (⭐) next to a completed execution
   - Enter a baseline name (e.g., "Production Baseline v1.0")
   - Optionally add a tag (e.g., "golden-run")
   - Click "Create Baseline"

### Comparing with Baseline

1. **In Results Page:**
   - Open the results page for a completed execution
   - Scroll to "Compare with Baseline" section

2. **Select Baseline:**
   - Choose a baseline from the dropdown (or use "Previous Execution")
   - Click "Compare" button

3. **View Drift Results:**
   - Drift Score card will appear (similar to Safety Score)
   - Review drift results table showing:
     - Drift type (output, safety, distribution, embedding, agent_tool)
     - Metric used
     - Drift value vs threshold
     - Severity level
   - Filter and explore detailed drift findings

### Understanding Drift Scores

- **Drift Score (0-100)**: Higher is better
  - 90-100 (Grade A): Stable - No significant drift
  - 75-89 (Grade B): Minor Drift - Acceptable
  - 60-74 (Grade C): Risk - Review recommended
  - 45-59 (Grade D): Significant Drift
  - <45 (Grade F): Unstable - Action required

- **Drift Types:**
  - **Output Drift**: Changes in response structure/content
  - **Safety Drift**: Changes in safety scores and severity counts
  - **Distribution Drift**: Statistical shifts in response patterns
  - **Embedding Drift**: Semantic meaning changes
  - **Agent/Tool Drift**: Changes in agent behavior and tool usage

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --reload --port 8001
```

**Database errors:**
```bash
# Delete existing database and restart
rm backend/promptshield.db
# Run migrations to recreate tables
alembic upgrade head
# Then restart the server
```

**Migration errors:**
```bash
# If migration fails, check Alembic is installed
pip install alembic

# Check migration status
alembic current

# View migration history
alembic history

# If needed, manually create tables (not recommended)
# The app will auto-create tables on first run, but migrations are preferred
```

**Import errors:**
```bash
# Make sure you're in the backend directory
cd backend
# And virtual environment is activated
source venv/bin/activate
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# React will ask to use a different port, say yes
# Or manually set port:
PORT=3001 npm start
```

**Module not found errors:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**npm cache permission errors:**
```bash
# Fix npm cache permissions (run once)
sudo chown -R $(whoami) ~/.npm

# Or use a different cache location
npm install --cache /tmp/.npm
```

**CORS errors:**
- Make sure backend is running on port 8000
- Check that `proxy` in `package.json` points to `http://localhost:8000`

### Common Issues

**"Cannot connect to API":**
- Verify backend is running: `curl http://localhost:8000/health`
- Check frontend proxy settings in `package.json`
- Verify CORS settings in `backend/app/core/config.py`

**"Database locked":**
- SQLite can have locking issues with multiple connections
- Restart the backend server
- For production, consider using PostgreSQL

## Running in Development Mode

Both servers support hot-reload:
- **Backend**: Changes to Python files will automatically restart the server
- **Frontend**: Changes to React files will automatically refresh the browser

## Stopping the Servers

- **Backend**: Press `Ctrl+C` in the backend terminal
- **Frontend**: Press `Ctrl+C` in the frontend terminal

## Next Steps

- Read the full documentation in [PromptShield.md](./PromptShield.md)
- Explore the API documentation at `http://localhost:8000/docs`
- Check out the code structure in the `backend/app/` and `frontend/src/` directories

## Alternative: Docker Setup

If you prefer Docker:

```bash
# Build and start both services
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- Backend on `http://localhost:8000`
- Frontend on `http://localhost:3000`

