#!/usr/bin/env python3
"""
Test script to verify the coaching language detection fix
"""

import sys
import os
import re

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_language_detection():
    """Test the language detection in coaching prompts"""
    
    # Import the function after path setup
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'interfaces', 'web'))
    from app import create_coaching_prompt
    
    print("🧪 Testing coaching prompt language detection...")
    print("=" * 60)
    
    # Test cases: (question, expected_language_in_prompt, description)
    test_cases = [
        ("วิธีจัดการคำคัดค้านเรื่องราคาประกัน", "Thai", "Thai question about price objections"),
        ("How to handle price objections in insurance sales?", "English", "English question about price objections"),
        ("ผลิตภัณฑ์ประกันไหนเหมาะกับลูกค้าวัยทำงาน", "Thai", "Thai question about insurance products"),
        ("What insurance products are best for young professionals?", "English", "English question about insurance products"),
        ("เทคนิคการขายประกันชีวิต", "Thai", "Thai question about life insurance sales techniques"),
        ("Life insurance sales techniques", "English", "English question about life insurance techniques")
    ]
    
    print("📝 Test results:")
    all_passed = True
    
    for i, (question, expected_lang, description) in enumerate(test_cases):
        print(f"\\n{i+1}. Testing: {description}")
        print(f"   Question: '{question}'")
        
        # Generate the prompt
        prompt = create_coaching_prompt(question, 'general', '', '', {})
        
        # Check if the correct language instruction is in the prompt
        has_thai_instruction = "Respond in Thai language" in prompt
        has_english_instruction = "Respond in English" in prompt
        
        if expected_lang == "Thai":
            if has_thai_instruction and not has_english_instruction:
                print(f"   ✅ PASS - Thai language instruction found")
            else:
                print(f"   ❌ FAIL - Expected Thai instruction but found: Thai={has_thai_instruction}, English={has_english_instruction}")
                all_passed = False
        else:  # English
            if has_english_instruction and not has_thai_instruction:
                print(f"   ✅ PASS - English language instruction found")
            else:
                print(f"   ❌ FAIL - Expected English instruction but found: Thai={has_thai_instruction}, English={has_english_instruction}")
                all_passed = False
        
        # Show a snippet of the prompt
        prompt_snippet = prompt[:100] + "..." if len(prompt) > 100 else prompt
        print(f"   Prompt snippet: {prompt_snippet}")
    
    print("\\n" + "=" * 60)
    if all_passed:
        print("🎉 SUCCESS: All language detection tests passed!")
        print("✅ Coaching prompts will now respond in the same language as the question")
    else:
        print("❌ FAILURE: Some language detection tests failed")
        
    return all_passed

def test_thai_character_detection():
    """Test the Thai character detection regex"""
    print("\\n🧪 Testing Thai character detection regex...")
    
    thai_pattern = re.compile(r'[\\u0E00-\\u0E7F]')
    
    test_strings = [
        ("สวัสดี", True, "Pure Thai"),
        ("Hello", False, "Pure English"), 
        ("สวัสดี Hello", True, "Mixed with Thai"),
        ("Hello สวัสดี", True, "Mixed with English first"),
        ("123456", False, "Numbers only"),
        ("ประกัน insurance", True, "Thai and English mixed")
    ]
    
    print("📝 Regex test results:")
    for text, expected, description in test_strings:
        result = bool(thai_pattern.search(text))
        status = "✅ PASS" if result == expected else "❌ FAIL"
        print(f"   {status} - '{text}' ({description}) -> {result} (expected: {expected})")

if __name__ == "__main__":
    print("🚀 Testing Coaching Language Detection Fix")
    print("=" * 60)
    
    # Test 1: Thai character detection
    test_thai_character_detection()
    
    # Test 2: Language detection in coaching prompts
    test_passed = test_language_detection()
    
    print("\\n" + "=" * 60)
    if test_passed:
        print("🎉 ALL TESTS PASSED: Coaching language detection is working correctly!")
        print("✅ The system will now respond in Thai when questions are in Thai")
        print("✅ The system will respond in English when questions are in English")
    else:
        print("❌ SOME TESTS FAILED: Language detection needs further adjustment")
        
    print("=" * 60)