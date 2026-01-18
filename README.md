# PromptShield

Unified LLM Validation & Red Teaming Platform

## Overview

PromptShield is a modern, enterprise-grade web platform that unifies open-source Python-based LLM validation and red-teaming libraries behind a single Postman-like UI, enabling repeatable, auditable, and scalable LLM validation workflows.

## Architecture

- **Frontend**: React SPA with Wells Fargo-inspired design
- **Backend**: FastAPI with async execution engine
- **Libraries**: Open-source Python validation libraries only

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Option 1: Using Startup Scripts (Easiest)

**Terminal 1 - Start Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Start Frontend:**
```bash
./start-frontend.sh
```

### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

**Frontend Setup:**
```bash
cd frontend
npm install
npm start
```

Frontend will run on `http://localhost:3000`

### Detailed Setup Instructions

See [SETUP.md](./SETUP.md) for comprehensive setup guide with troubleshooting.

### Docker Setup (Alternative)

```bash
docker-compose up
```

This will start both backend and frontend services.

## Features

- ✅ Postman-style LLM API configuration
- ✅ Visual pipeline builder
- ✅ Unified dashboard with severity-based visualization
- ✅ Async execution engine with parallel library execution
- ✅ Result normalization across libraries
- ✅ Multiple export formats (JSON, PDF, HTML)
- ✅ Extensible plugin architecture for new libraries

## Project Structure

```
promptshield/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # REST API endpoints
│   │   ├── core/     # Configuration
│   │   ├── db/       # Database models
│   │   └── services/ # Business logic
│   └── main.py       # Application entry point
├── frontend/         # React frontend
│   └── src/
│       ├── components/
│       └── pages/
└── PromptShield.md   # Complete documentation
```

## Documentation

See [PromptShield.md](./PromptShield.md) for complete documentation including:
- Architecture details
- API endpoints
- Extension guide for new libraries
- Usage examples
- Security considerations

## License

Open Source (TBD)

