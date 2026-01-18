"""
Simple test to verify Garak adapter is working
This test can be run without the full API server
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.library_adapters import GarakAdapter
from app.db.models import LLMConfig
from app.services.normalizer import ResultNormalizer


async def test_garak_adapter():
    """Test Garak adapter directly"""
    print("=" * 60)
    print("Testing Garak Adapter Directly")
    print("=" * 60)
    
    # Create a mock LLM config
    llm_config = LLMConfig(
        id=1,
        name="Test Config",
        endpoint_url="http://localhost:1234/v1/chat/completions",
        method="POST",
        headers={"Content-Type": "application/json"},
        payload_template='''{
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
  "stream": false
}''',
        timeout=30,
        max_retries=3,
        environment="test"
    )
    
    # Create adapter
    adapter = GarakAdapter()
    
    print(f"\n✓ Created GarakAdapter")
    print(f"✓ Testing with LLM endpoint: {llm_config.endpoint_url}")
    print(f"✓ Test categories: ['prompt_injection']")
    
    try:
        # Execute with just one category to test
        print("\n=== Executing Garak Tests ===")
        results = await adapter.execute(
            llm_config=llm_config,
            test_categories=["prompt_injection"]
        )
        
        print(f"\n✓ Execution completed")
        print(f"✓ Number of results: {len(results)}")
        
        if len(results) == 0:
            print("\n✗ WARNING: No results returned!")
            print("  This could mean:")
            print("  - LLM server is not running")
            print("  - LLM calls are failing")
            print("  - Check backend logs for [GARAK] and [LLM CALL] messages")
            return False
        
        # Test normalizer
        print("\n=== Testing Result Normalizer ===")
        normalizer = ResultNormalizer()
        normalized_results = []
        
        for raw_result in results:
            normalized = normalizer.normalize(raw_result, execution_id=1)
            normalized_results.append(normalized)
            print(f"  ✓ Normalized: {normalized['library']} - {normalized['test_category']} - {normalized['severity']}")
        
        print(f"\n✓ Normalized {len(normalized_results)} results")
        
        # Verify results structure
        print("\n=== Verifying Result Structure ===")
        for result in normalized_results:
            required_fields = ['execution_id', 'library', 'test_category', 'severity', 'risk_type']
            missing = [f for f in required_fields if f not in result]
            if missing:
                print(f"✗ Result missing fields: {missing}")
                return False
            print(f"  ✓ Result has all required fields")
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Results returned: {len(results)}")
        print(f"  - Libraries: {set(r['library'] for r in normalized_results)}")
        print(f"  - Categories: {set(r['test_category'] for r in normalized_results)}")
        print(f"  - Severities: {set(r['severity'] for r in normalized_results)}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n⚠️  Make sure your LLM server is running at http://localhost:1234")
    print("Press Enter to continue or Ctrl+C to cancel...")
    try:
        input()
    except KeyboardInterrupt:
        print("\nTest cancelled.")
        sys.exit(1)
    
    result = asyncio.run(test_garak_adapter())
    sys.exit(0 if result else 1)

