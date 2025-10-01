#!/usr/bin/env python3
"""
Document Re-ingestion Script
============================
Re-ingests the updated healthcare document to fix RAG accuracy issues.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def reingest_healthcare_document():
    """Re-ingest the updated healthcare document"""
    print("🔄 Re-ingesting updated healthcare document...")
    print("=" * 50)
    
    try:
        # Import after path setup
        from src.core.rag_system import get_rag_system
        
        # Initialize RAG system
        print("⏳ Initializing RAG system...")
        rag_system = get_rag_system()
        
        # Path to the updated document
        doc_path = "/Users/pookansmacbookpro/Documents/insurance-chatbot/data/documents/uob_healthcareplus.txt"
        
        if not os.path.exists(doc_path):
            print(f"❌ Document not found: {doc_path}")
            return False
        
        print(f"📄 Re-ingesting document: {doc_path}")
        
        # Clear existing cache to force fresh ingestion
        rag_system._index_cache = None
        rag_system._query_lru_cache.clear()
        
        # Re-ingest the document
        result = rag_system.ingest_file(doc_path)
        
        if result["status"] == "success":
            print(f"✅ Successfully re-ingested: {result['filename']}")
            print(f"📊 Created {result['chunks_created']} chunks")
            print(f"📝 Total characters: {result['total_characters']:,}")
            
            # Test the fix with a specific query
            print("\n🧪 Testing Plan 2 coverage accuracy...")
            test_result = rag_system.query("แผน 2 ค่ารักษาพยาบาลการผ่าตัดเล็ก เท่าไหร่")
            
            if test_result["status"] == "success":
                answer = test_result["answer"]
                print(f"📝 Answer: {answer}")
                
                # Check if the answer contains the correct amount (1,000,000)
                if "1,000,000" in answer and "5,000,000" not in answer:
                    print("✅ Plan 2 accuracy issue appears to be FIXED!")
                else:
                    print("⚠️ Plan 2 accuracy issue may still exist")
            else:
                print(f"❌ Test query failed: {test_result.get('error', 'Unknown error')}")
            
            return True
        else:
            print(f"❌ Re-ingestion failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error during re-ingestion: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False

def test_all_plans():
    """Test all plan coverage amounts"""
    print("\n🧪 Testing all plan coverage amounts...")
    print("=" * 50)
    
    try:
        from src.core.rag_system import get_rag_system
        rag_system = get_rag_system()
        
        test_result = rag_system.query("แผน 1,2,3,4,5,6, ผลประโยชน์ค่ารักษาต่อปีกรมธรรม์เท่าไหร่")
        
        if test_result["status"] == "success":
            answer = test_result["answer"]
            print(f"📝 Answer: {answer}")
            
            # Expected correct amounts
            expected = {
                "แผน 1": "1,000,000",
                "แผน 2": "1,000,000", 
                "แผน 3": "3,000,000",
                "แผน 4": "3,000,000",
                "แผน 5": "5,000,000",
                "แผน 6": "5,000,000"
            }
            
            print("\n📊 Checking accuracy:")
            all_correct = True
            for plan, expected_amount in expected.items():
                if f"{plan}: {expected_amount}" in answer or f"{plan} มี" in answer and expected_amount in answer:
                    print(f"✅ {plan}: {expected_amount} บาท - CORRECT")
                else:
                    print(f"❌ {plan}: Expected {expected_amount} บาท - INCORRECT")
                    all_correct = False
            
            if all_correct:
                print("\n🎉 All plan coverage amounts are now CORRECT!")
            else:
                print("\n⚠️ Some plan coverage amounts are still incorrect")
                
        else:
            print(f"❌ Test query failed: {test_result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    print("🚀 Healthcare Document Re-ingestion Tool")
    print("=" * 50)
    
    success = reingest_healthcare_document()
    
    if success:
        test_all_plans()
    
    print("\n✅ Re-ingestion process completed!")