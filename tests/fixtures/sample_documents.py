"""
Sample documents for testing
===========================
"""

SAMPLE_TXT_CONTENT = """
# UOB Insurance Products

## Healthcare Plus Plans

### Plan 1 - Basic Coverage
- Annual coverage: 1,000,000 THB
- Room and board: 2,000 THB/day
- Surgical benefits: 50,000 THB
- Emergency coverage: 100,000 THB

### Plan 2 - Standard Coverage  
- Annual coverage: 1,000,000 THB
- Room and board: 3,000 THB/day
- Surgical benefits: 100,000 THB
- Emergency coverage: 200,000 THB

### Plan 3 - Premium Coverage
- Annual coverage: 3,000,000 THB
- Room and board: 5,000 THB/day
- Surgical benefits: 200,000 THB
- Emergency coverage: 500,000 THB

## Sales Guidelines

### Fact Finding Questions
1. What is your current insurance coverage?
2. What are your main health concerns?
3. What is your budget for insurance?
4. Do you have any pre-existing conditions?

### Objection Handling
- Price objections: Focus on value and protection
- Coverage concerns: Explain benefits clearly
- Trust issues: Provide testimonials and credentials

### Closing Techniques
1. Assumptive close
2. Alternative choice close
3. Urgency close
4. Benefit summary close
"""

SAMPLE_ETHICS_CONTENT = """
# Insurance Agent Code of Ethics

## 10 Core Principles

1. **Integrity**: Always act with honesty and transparency
2. **Professionalism**: Maintain high standards of conduct
3. **Customer Focus**: Put customer needs first
4. **Confidentiality**: Protect customer information
5. **Compliance**: Follow all regulatory requirements
6. **Fair Dealing**: Treat all customers equally
7. **Competence**: Maintain professional knowledge
8. **Diligence**: Provide thorough service
9. **Loyalty**: Act in best interest of customers
10. **Respect**: Treat everyone with dignity

## Sales Practices

### Do's
- Provide accurate information
- Explain terms clearly
- Recommend suitable products
- Follow up regularly
- Maintain records properly

### Don'ts
- Mislead customers
- Use high-pressure tactics
- Recommend unsuitable products
- Ignore customer concerns
- Violate privacy
"""

SAMPLE_WORKFLOW_CONTENT = """
# Standard Sales Workflow

## Step 1: Initial Contact
- Greet customer warmly
- Introduce yourself and company
- Establish rapport
- Set meeting agenda

## Step 2: Needs Assessment
- Ask fact-finding questions
- Listen actively
- Identify key concerns
- Document requirements

## Step 3: Product Presentation
- Present relevant products
- Explain benefits clearly
- Use visual aids
- Address concerns

## Step 4: Handling Objections
- Listen to concerns
- Acknowledge feelings
- Provide solutions
- Confirm understanding

## Step 5: Closing
- Summarize benefits
- Create urgency
- Ask for decision
- Handle final objections

## Step 6: Follow-up
- Confirm coverage details
- Provide documentation
- Schedule next meeting
- Maintain relationship
"""

# Sample data for different test scenarios
SAMPLE_QUESTIONS = [
    "What are the benefits of Plan 1?",
    "How does Plan 2 compare to Plan 3?",
    "What is the coverage amount for surgical benefits?",
    "How to handle price objections?",
    "What are the fact finding questions?",
    "วิธีจัดการคำคัดค้านเรื่องราคา?",
    "แผน 1 และแผน 2 ต่างกันอย่างไร?",
    "ผลประโยชน์ค่ารักษาต่อปีเท่าไหร่?"
]

SAMPLE_COACHING_SCENARIOS = [
    {
        "type": "competitive",
        "question": "How do we compare to other insurance companies?",
        "customer_type": "young_professional",
        "product": "health_insurance"
    },
    {
        "type": "objection_handling", 
        "question": "Customer says it's too expensive",
        "customer_type": "family",
        "product": "life_insurance"
    },
    {
        "type": "communication",
        "question": "What keywords should I use when explaining benefits?",
        "customer_type": "business_owner",
        "product": "health_insurance"
    }
]

SAMPLE_SIMULATION_SCENARIOS = [
    {
        "type": "new_customer",
        "customer_name": "คุณสมชาย ใหม่",
        "age": 28,
        "occupation": "วิศวกร",
        "background": "เพิ่งเริ่มทำงาน ต้องการประกันครั้งแรก",
        "initial_message": "สวัสดีครับ ผมสนใจประกันสุขภาพ แต่ไม่รู้จะเริ่มยังไง"
    },
    {
        "type": "objection_handling",
        "customer_name": "คุณวิไล กังวล",
        "age": 45,
        "occupation": "พนักงานบริษัท",
        "background": "เคยมีประสบการณ์ไม่ดีกับประกัน",
        "initial_message": "ดิฉันเคยโดนเอเย่นต์หลอกมาก่อน ยังไม่แน่ใจ"
    }
]
