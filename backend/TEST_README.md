# API Integration Tests

This directory contains two test files:

1. **`test_simple.py`** - Tests the Garak adapter directly (no API server needed)
2. **`test_api.py`** - Full integration test through the API (requires backend server)

## Quick Test (Recommended First)

Test the Garak adapter directly without needing the full API:

```bash
cd backend
python test_simple.py
```

**Prerequisites:**
- LLM server running at `http://localhost:1234`
- No backend server needed

## Full API Test

Test the complete flow through the API:

```bash
# Terminal 1: Start backend server
cd backend
python main.py

# Terminal 2: Run the test
cd backend
python test_api.py
```

**Prerequisites:**
1. Backend server must be running on `http://localhost:8000`
2. LLM server must be running on `http://localhost:1234`
3. Database must be initialized

## What the Test Does

1. **Health Check**: Verifies the API is accessible
2. **Create LLM Config**: Creates a test LLM configuration
3. **Create Pipeline**: Creates a pipeline with Garak library
4. **Create Execution**: Starts a validation execution
5. **Wait for Completion**: Waits for the execution to finish (up to 120 seconds)
6. **Get Results**: Retrieves all results for the execution
7. **Get Summary**: Gets summary statistics
8. **Verify Results**: Checks that expected libraries are present in results

## Expected Output

```
============================================================
PromptShield API Integration Test
============================================================

=== Testing Health Check ===
✓ Health check passed

=== Creating LLM Config: Test LLM Config ===
✓ Created LLM config with ID: 1

=== Creating Pipeline: Test Pipeline - Garak ===
✓ Created pipeline with ID: 1

=== Creating Execution ===
✓ Created execution with ID: 1
  Status: pending

=== Waiting for Execution 1 to Complete ===
  Status: running
  Status: running
  Status: completed
✓ Execution completed

=== Getting Results for Execution 1 ===
✓ Retrieved 5 results

=== Getting Summary for Execution 1 ===
✓ Summary: {'total_results': 5, 'by_severity': {...}, 'by_library': {...}, 'by_category': {...}}

=== Verifying Results ===
  Found result: garak - prompt_injection - high
  Found result: garak - prompt_injection - medium
  ...
✓ Library 'garak' found in results

============================================================
✓ All tests passed!
============================================================
```

## Troubleshooting

### Test Fails with "Execution failed"
- Check backend logs for error messages
- Verify LLM server is running and accessible
- Check LLM configuration (endpoint URL, payload template)

### No Results Returned
- Check if execution completed successfully
- Verify pipeline includes the expected libraries
- Check backend logs for `[EXECUTION]` and `[GARAK]` messages

### Connection Errors
- Ensure backend is running: `python main.py`
- Check CORS settings if testing from different origin
- Verify API base URL in test file

