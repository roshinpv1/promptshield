"""
API Integration Tests for PromptShield
Tests the full flow from LLM config creation to execution and results retrieval
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"


def test_health_check():
    """Test basic API health"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        assert response.status_code == 200
        print("✓ Health check passed")
        return response.json()
    except requests.exceptions.ConnectionError:
        print("✗ ERROR: Backend server is not running!")
        print("  Please start the backend server first:")
        print("  cd backend && python main.py")
        raise
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        raise


def create_llm_config(name: str, endpoint_url: str, payload_template: str) -> Dict[str, Any]:
    """Create an LLM configuration"""
    print(f"\n=== Creating LLM Config: {name} ===")
    config_data = {
        "name": name,
        "endpoint_url": endpoint_url,
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "payload_template": payload_template,
        "timeout": 30,
        "max_retries": 3,
        "environment": "test"
    }
    
    response = requests.post(f"{BASE_URL}/llm-configs/", json=config_data)
    assert response.status_code == 200, f"Failed to create LLM config: {response.text}"
    config = response.json()
    print(f"✓ Created LLM config with ID: {config['id']}")
    return config


def create_pipeline(name: str, llm_config_id: int, libraries: list, test_categories: list) -> Dict[str, Any]:
    """Create a validation pipeline"""
    print(f"\n=== Creating Pipeline: {name} ===")
    pipeline_data = {
        "name": name,
        "description": f"Test pipeline for {name}",
        "libraries": libraries,
        "test_categories": test_categories,
        "severity_thresholds": {},
        "llm_config_id": llm_config_id,
        "is_template": False
    }
    
    response = requests.post(f"{BASE_URL}/pipelines/", json=pipeline_data)
    assert response.status_code == 200, f"Failed to create pipeline: {response.text}"
    pipeline = response.json()
    print(f"✓ Created pipeline with ID: {pipeline['id']}")
    return pipeline


def create_execution(pipeline_id: int, llm_config_id: int) -> Dict[str, Any]:
    """Create and start an execution"""
    print(f"\n=== Creating Execution ===")
    execution_data = {
        "pipeline_id": pipeline_id,
        "llm_config_id": llm_config_id
    }
    
    response = requests.post(f"{BASE_URL}/executions/", json=execution_data)
    assert response.status_code == 200, f"Failed to create execution: {response.text}"
    execution = response.json()
    print(f"✓ Created execution with ID: {execution['id']}")
    print(f"  Status: {execution['status']}")
    return execution


def wait_for_execution(execution_id: int, timeout: int = 120) -> Dict[str, Any]:
    """Wait for execution to complete"""
    print(f"\n=== Waiting for Execution {execution_id} to Complete ===")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        response = requests.get(f"{BASE_URL}/executions/{execution_id}")
        assert response.status_code == 200
        execution = response.json()
        
        status = execution['status']
        print(f"  Status: {status}")
        
        if status == "completed":
            print("✓ Execution completed")
            return execution
        elif status == "failed":
            error = execution.get('error_message', 'Unknown error')
            print(f"✗ Execution failed: {error}")
            raise Exception(f"Execution failed: {error}")
        
        time.sleep(2)
    
    raise TimeoutError(f"Execution did not complete within {timeout} seconds")


def get_execution_results(execution_id: int) -> list:
    """Get results for an execution"""
    print(f"\n=== Getting Results for Execution {execution_id} ===")
    response = requests.get(f"{BASE_URL}/results/execution/{execution_id}")
    assert response.status_code == 200
    results = response.json()
    print(f"✓ Retrieved {len(results)} results")
    return results


def get_execution_summary(execution_id: int) -> Dict[str, Any]:
    """Get summary statistics for an execution"""
    print(f"\n=== Getting Summary for Execution {execution_id} ===")
    response = requests.get(f"{BASE_URL}/results/execution/{execution_id}/summary")
    assert response.status_code == 200
    summary = response.json()
    print(f"✓ Summary: {summary}")
    return summary


def verify_results(results: list, expected_libraries: list):
    """Verify that results contain expected libraries"""
    print(f"\n=== Verifying Results ===")
    libraries_found = set()
    for result in results:
        libraries_found.add(result['library'])
        print(f"  Found result: {result['library']} - {result['test_category']} - {result['severity']}")
    
    print(f"\n  Libraries found: {libraries_found}")
    print(f"  Expected libraries: {set(expected_libraries)}")
    
    for lib in expected_libraries:
        if lib not in libraries_found:
            print(f"✗ WARNING: Expected library '{lib}' not found in results!")
        else:
            print(f"✓ Library '{lib}' found in results")
    
    return libraries_found


def main():
    """Run full integration test"""
    print("=" * 60)
    print("PromptShield API Integration Test")
    print("=" * 60)
    print("\n⚠️  Make sure the backend server is running:")
    print("   cd backend && python main.py")
    print("\n⚠️  Make sure your LLM server is running at http://localhost:1234")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    try:
        input()
    except KeyboardInterrupt:
        print("\nTest cancelled.")
        return {"success": False, "error": "Cancelled by user"}
    
    try:
        # 1. Health check
        test_health_check()
        
        # 2. Create LLM config
        payload_template = json.dumps({
            "model": "gemma-3-12b",
            "messages": [
                {
                    "role": "system",
                    "content": ""
                },
                {
                    "role": "user",
                    "content": "{prompt}"
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
            "stream": False
        })
        
        llm_config = create_llm_config(
            name="Test LLM Config",
            endpoint_url="http://localhost:1234/v1/chat/completions",
            payload_template=payload_template
        )
        
        # 3. Create pipeline with Garak
        pipeline = create_pipeline(
            name="Test Pipeline - Garak",
            llm_config_id=llm_config['id'],
            libraries=["garak"],
            test_categories=["prompt_injection", "jailbreak"]
        )
        
        # 4. Create execution
        execution = create_execution(
            pipeline_id=pipeline['id'],
            llm_config_id=llm_config['id']
        )
        
        # 5. Wait for completion
        completed_execution = wait_for_execution(execution['id'])
        
        # 6. Get results
        results = get_execution_results(execution['id'])
        
        # 7. Get summary
        summary = get_execution_summary(execution['id'])
        
        # 8. Verify results
        verify_results(results, ["garak"])
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
        return {
            "success": True,
            "execution_id": execution['id'],
            "results_count": len(results),
            "summary": summary
        }
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ Test failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    result = main()
    exit(0 if result.get("success") else 1)

