#!/usr/bin/env python3
"""
Performance Test Script
=======================
Quick test to verify performance improvements.
"""

import sys
import os
import time

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.core.rag_system import get_rag_system

def test_performance():
    """Test the performance of the optimized RAG system"""
    print("🚀 Testing Performance Optimizations")
    print("=" * 50)
    
    # Initialize RAG system
    print("⏳ Initializing RAG system...")
    start_init = time.time()
    rag_system = get_rag_system()
    init_time = time.time() - start_init
    print(f"✅ RAG system initialized in {init_time:.2f} seconds")
    
    # Test query performance (if index exists)
    print("\n⏳ Testing query performance...")
    
    # Check if we have data
    stats = rag_system.get_stats()
    if stats["status"] == "no_index":
        print("⚠️ No data indexed yet. Upload some files first using:")
        print("   python main.py")
        print("   Then use 'upload <filename>' command")
        return
    
    # Test queries
    test_queries = [
        "What are the benefits?",
        "How does fact finding work?", 
        "What products are recommended?"
    ]
    
    total_time = 0
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Test Query {i}: {query}")
        start_query = time.time()
        
        result = rag_system.query(query)
        query_time = time.time() - start_query
        total_time += query_time
        
        if result["status"] == "success":
            print(f"✅ Query completed in {query_time:.2f} seconds")
            print(f"📊 Sources found: {result['quality_metrics']['source_count']}")
        else:
            print(f"❌ Query failed: {result.get('error', 'Unknown error')}")
    
    avg_time = total_time / len(test_queries)
    print(f"\n📈 Performance Summary:")
    print(f"   Average query time: {avg_time:.2f} seconds")
    print(f"   Total test time: {total_time:.2f} seconds")
    print(f"   Index vectors: {stats.get('total_vectors', 0)}")
    
    if avg_time < 5:
        print("🎉 Excellent! Response time is under 5 seconds")
    elif avg_time < 10:
        print("✅ Good! Response time is under 10 seconds")  
    else:
        print("⚠️ Response time could be further optimized")

if __name__ == "__main__":
    test_performance()