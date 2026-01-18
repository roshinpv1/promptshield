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
- And other required packages

#### 2.4 Create Required Directories

```bash
mkdir -p results reports
```

#### 2.5 Start Backend Server

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
   - Select libraries (Garak, PyRIT, LangTest)
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
# Then restart the server
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

