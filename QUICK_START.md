# Quick Start Guide - PromptShield v1.1

## 🚀 Fast Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (IMPORTANT for v1.1)
alembic upgrade head

# Start backend
python main.py
```

Backend runs at: **http://localhost:8000**

### 2. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
```

Frontend opens at: **http://localhost:3000**

## ✅ Verify It Works

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy","version":"1.0.0","service":"PromptShield"}`

2. **Frontend:**
   - Open browser: http://localhost:3000
   - You should see the PromptShield dashboard

## 🎯 First Execution

1. **Create LLM Config:**
   - Go to "LLM Configs" → "New Configuration"
   - Enter your LLM API endpoint details
   - Save

2. **Create Pipeline:**
   - Go to "Pipelines" → "New Pipeline"
   - Select libraries (Garak, PyRIT, LangTest, or Promptfoo)
   - Choose test categories
   - Link to your LLM config
   - Save

3. **Run Execution:**
   - Go to "Executions" → "Start Execution"
   - Select pipeline and LLM config
   - Wait for completion

4. **View Results:**
   - Click on the execution to view results
   - See Safety Score and detailed findings

## 🔍 Using Drift Detection (v1.1)

### Step 1: Create Baseline
- In Executions page, click ⭐ icon on a completed execution
- Enter name: "My Baseline"
- Optionally add tag: "v1.0"
- Click "Create Baseline"

### Step 2: Run New Execution
- Execute the same pipeline again
- Wait for completion

### Step 3: Compare for Drift
- Open Results page for the new execution
- Scroll to "Compare with Baseline" section
- Select your baseline
- Click "Compare"
- View Drift Score and detailed drift findings

## 📊 Understanding Scores

**Safety Score (0-100):**
- Measures security vulnerabilities found
- Higher = More secure

**Drift Score (0-100):**
- Measures behavior stability vs baseline
- Higher = More stable (less drift)

## 🐛 Troubleshooting

**Backend won't start:**
```bash
# Check if port 8000 is in use
lsof -ti:8000 | xargs kill -9

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Migration errors:**
```bash
# Make sure Alembic is installed
pip install alembic

# Check current migration status
alembic current
```

**Frontend won't start:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Can't connect to API:**
- Verify backend is running on port 8000
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` in frontend `.env` (if set)

## 📚 More Information

- Full setup guide: [SETUP.md](./SETUP.md)
- Complete documentation: [PromptShield.md](./PromptShield.md)
- API docs: http://localhost:8000/docs

## 🎉 You're Ready!

Start testing your LLM systems for security vulnerabilities and behavior drift!
