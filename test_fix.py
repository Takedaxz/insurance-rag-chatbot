#!/usr/bin/env python3
"""
Test script to verify the _is_comparison_query method fix
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_comparison_query_detection():
    """Test the _is_comparison_query method"""
    print("🧪 Testing _is_comparison_query method...")
    
    try:
        from src.core.rag_system import get_rag_system
        rag = get_rag_system()
        
        # Test comparison queries
        test_queries = [
            "แผน 1,2,3,4,5,6, ผลประโยชน์ค่ารักษาต่อปีกรมธรรม์เท่าไหร่",
            "เปรียบเทียบแผน 1 และ แผน 2",
            "แผน 3 ดีกว่าแผน 5 อย่างไร",
            "ผลประโยชน์แผน 2 เท่าไหร่"  # Not a comparison
        ]
        
        expected_results = [True, True, True, False]
        
        print("📝 Test results:")
        all_passed = True
        
        for i, (query, expected) in enumerate(zip(test_queries, expected_results)):
            result = rag._is_comparison_query(query)
            status = "✅ PASS" if result == expected else "❌ FAIL"
            print(f"  {i+1}. {status} - Query: '{query[:50]}...' -> {result} (expected: {expected})")
            if result != expected:
                all_passed = False
        
        if all_passed:
            print("\n🎉 All tests passed! _is_comparison_query method is working correctly.")
        else:
            print("\n⚠️ Some tests failed. Method may need adjustment.")
            
        return all_passed
        
    except AttributeError as e:
        if "_is_comparison_query" in str(e):
            print(f"❌ AttributeError still exists: {e}")
            return False
        else:
            raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_query_execution():
    """Test a full query to ensure no AttributeError"""
    print("\n🧪 Testing full query execution...")
    
    try:
        from src.core.rag_system import get_rag_system
        rag = get_rag_system()
        
        # Test with a comparison query
        test_query = "แผน 1,2,3,4,5,6, ผลประโยชน์ค่ารักษาต่อปีกรมธรรม์เท่าไหร่"
        print(f"📝 Testing query: {test_query}")
        
        result = rag.query(test_query)
        
        if result["status"] == "success":
            print("✅ Query executed successfully - no AttributeError!")
            print(f"📊 Answer length: {len(result.get('answer', ''))}")
            print(f"📊 Sources found: {len(result.get('sources', []))}")
        elif "AttributeError" in result.get("error", ""):
            print(f"❌ AttributeError still occurs: {result['error']}")
            return False
        else:
            print(f"⚠️ Query failed with different error: {result.get('error', 'Unknown')}")
            # This might be expected if no documents are loaded
        
        return True
        
    except AttributeError as e:
        if "_is_comparison_query" in str(e):
            print(f"❌ AttributeError still exists: {e}")
            return False
        else:
            raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing AttributeError fix for _is_comparison_query")
    print("=" * 60)
    
    # Test 1: Method existence and functionality
    test1_passed = test_comparison_query_detection()
    
    # Test 2: Full query execution
    test2_passed = test_query_execution()
    
    print("\n" + "=" * 60)
    if test1_passed and test2_passed:
        print("🎉 SUCCESS: AttributeError has been fixed!")
        print("✅ The _is_comparison_query method is now properly implemented")
        print("✅ Full query execution works without AttributeError")
    else:
        print("❌ FAILURE: AttributeError fix incomplete")
        
    print("=" * 60)