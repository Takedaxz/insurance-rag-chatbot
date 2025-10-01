"""
Unit tests for Language Detection
=================================
"""

import pytest
from src.interfaces.web.app import detect_coaching_type, create_coaching_prompt


class TestLanguageDetection:
    """Test cases for language detection functionality"""
    
    def test_thai_character_detection(self):
        """Test Thai character detection regex"""
        import re
        
        thai_pattern = re.compile(r'[\u0E00-\u0E7F]')
        
        test_cases = [
            ("สวัสดี", True, "Pure Thai"),
            ("Hello", False, "Pure English"),
            ("สวัสดี Hello", True, "Mixed with Thai"),
            ("Hello สวัสดี", True, "Mixed with English first"),
            ("123456", False, "Numbers only"),
            ("ประกัน insurance", True, "Thai and English mixed")
        ]
        
        for text, expected, description in test_cases:
            result = bool(thai_pattern.search(text))
            assert result == expected, f"Failed for {description}: '{text}'"
    
    def test_language_detection_in_prompts(self):
        """Test language detection in coaching prompts"""
        test_cases = [
            ("วิธีจัดการคำคัดค้านเรื่องราคาประกัน", "Thai"),
            ("How to handle price objections in insurance sales?", "English"),
            ("ผลิตภัณฑ์ประกันไหนเหมาะกับลูกค้าวัยทำงาน", "Thai"),
            ("What insurance products are best for young professionals?", "English"),
            ("เทคนิคการขายประกันชีวิต", "Thai"),
            ("Life insurance sales techniques", "English")
        ]
        
        for question, expected_language in test_cases:
            prompt = create_coaching_prompt(question, 'general', '', '', {})
            
            if expected_language == "Thai":
                assert "Thai" in prompt or "ภาษาไทย" in prompt
            else:
                assert "English" in prompt or "ภาษาอังกฤษ" in prompt


class TestCoachingTypeDetection:
    """Test cases for coaching type detection"""
    
    def test_detect_competitive_analysis(self):
        """Test competitive analysis coaching type detection"""
        competitive_questions = [
            "How do we compare to competitors?",
            "What are our advantages vs other companies?",
            "Why should customers choose us over others?",
            "เปรียบเทียบกับคู่แข่งอย่างไร",
            "ข้อดีของเราต่อคู่แข่ง"
        ]
        
        for question in competitive_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type == 'competitive'
    
    def test_detect_objection_handling(self):
        """Test objection handling coaching type detection"""
        objection_questions = [
            "Customer says it's too expensive",
            "How to handle price objections?",
            "Customer is concerned about coverage",
            "ลูกค้าบอกว่าแพงเกินไป",
            "จัดการข้อโต้แย้งเรื่องราคายังไง"
        ]
        
        for question in objection_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type == 'objection_handling'
    
    def test_detect_communication(self):
        """Test communication coaching type detection"""
        communication_questions = [
            "What keywords should I use?",
            "How to explain benefits clearly?",
            "What phrases work best?",
            "ใช้คำไหนดีที่สุด",
            "อธิบายประโยชน์ยังไงให้เข้าใจ"
        ]
        
        for question in communication_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type == 'communication'
    
    def test_detect_product_knowledge(self):
        """Test product knowledge coaching type detection"""
        product_questions = [
            "What are the benefits of this product?",
            "How does this coverage work?",
            "What features does it have?",
            "ผลิตภัณฑ์นี้มีประโยชน์อะไร",
            "ความคุ้มครองนี้ทำงานยังไง"
        ]
        
        for question in product_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type == 'product_knowledge'
    
    def test_detect_sales_process(self):
        """Test sales process coaching type detection"""
        sales_questions = [
            "How to close the sale?",
            "What are the sales steps?",
            "How to approach new customers?",
            "ปิดการขายยังไง",
            "ขั้นตอนการขายมีอะไรบ้าง"
        ]
        
        for question in sales_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type == 'sales_process'
    
    def test_detect_general(self):
        """Test general coaching type detection"""
        general_questions = [
            "Help me improve my sales skills",
            "Give me some advice",
            "What should I focus on?",
            "ช่วยพัฒนาทักษะการขาย",
            "แนะนำหน่อย"
        ]
        
        for question in general_questions:
            coaching_type = detect_coaching_type(question)
            assert coaching_type == 'general'


class TestCoachingPromptGeneration:
    """Test cases for coaching prompt generation"""
    
    def test_competitive_prompt_generation(self):
        """Test competitive analysis prompt generation"""
        question = "How do we compare to competitors?"
        prompt = create_coaching_prompt(question, 'competitive', 'life_insurance', 'young_professional', {})
        
        assert "competitive analysis expert" in prompt.lower()
        assert "advantage" in prompt.lower()
        assert "life_insurance" in prompt.lower()
        assert "young_professional" in prompt.lower()
    
    def test_objection_handling_prompt_generation(self):
        """Test objection handling prompt generation"""
        question = "Customer says it's too expensive"
        prompt = create_coaching_prompt(question, 'objection_handling', '', 'business_owner', {})
        
        assert "objection handling coach" in prompt.lower()
        assert "objection" in prompt.lower()
        assert "business_owner" in prompt.lower()
    
    def test_communication_prompt_generation(self):
        """Test communication prompt generation"""
        question = "What keywords should I use?"
        prompt = create_coaching_prompt(question, 'communication', 'health_insurance', '', {})
        
        assert "communication expert" in prompt.lower()
        assert "keywords" in prompt.lower()
        assert "health_insurance" in prompt.lower()
    
    def test_prompt_cleaning(self):
        """Test prompt cleaning and optimization"""
        # Test with repetitive words
        question = "the the the insurance insurance product product benefits benefits"
        prompt = create_coaching_prompt(question, 'general', '', '', {})
        
        # Should reduce repetitive words
        assert prompt.count("the") < question.count("the")
        assert prompt.count("insurance") < question.count("insurance")
        assert prompt.count("product") < question.count("product")
    
    def test_prompt_length_limitation(self):
        """Test prompt length limitation"""
        long_question = "word " * 200  # Very long question
        prompt = create_coaching_prompt(long_question, 'general', '', '', {})
        
        # Should be limited to reasonable length
        assert len(prompt) < len(long_question)
        assert len(prompt) > 50  # But should still be substantial
