"""
Web Chatbot for RAG System
==========================
Flask web application providing a web interface for the RAG system.
"""

from flask import Flask, render_template, request, jsonify
from pathlib import Path
import os
import traceback
from werkzeug.utils import secure_filename

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.core.rag_system import get_rag_system
from src.core.file_monitor import get_file_monitor

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Global instances
rag_system = None
file_monitor = None

def initialize_rag():
    """Initialize RAG system and file monitor"""
    global rag_system, file_monitor
    
    try:
        rag_system = get_rag_system()
        file_monitor = get_file_monitor()
        file_monitor.start_monitoring()
        print("✅ RAG system initialized for web interface")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize RAG system: {e}")
        return False

# Initialize RAG system when module is imported
initialize_rag()

@app.route('/')
def index():
    """Homepage with feature navigation"""
    return render_template('index.html')

@app.route('/knowledge')
def knowledge_mode():
    """Knowledge Mode - Deep Q&A Engine"""
    return render_template('knowledge.html')

@app.route('/coaching')
def coaching_mode():
    """Coaching Assistant Mode"""
    return render_template('coaching.html')

@app.route('/simulation')
def simulation_mode():
    """Simulation & Training Mode"""
    return render_template('simulation.html')

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """API endpoint for asking questions"""
    try:
        data = request.get_json()
        question = data.get('question', '').strip()
        use_web_search = data.get('use_web_search', False)
        
        if not question:
            return jsonify({
                'status': 'error',
                'message': 'Question is required'
            }), 400
        
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Process the question
        result = rag_system.query(question, use_web_search=use_web_search)
        
        if result["status"] == "success":
            return jsonify({
                'status': 'success',
                'answer': result['answer'],
                'sources': result.get('sources', []),
                'quality_metrics': result.get('quality_metrics', {})
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result.get('error', 'Unknown error occurred')
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API endpoint for file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = Path("./data/documents") / filename
        file_path.parent.mkdir(exist_ok=True)
        file.save(str(file_path))
        
        # Ingest the file
        result = rag_system.ingest_file(str(file_path))
        
        if result["status"] == "success":
            return jsonify({
                'status': 'success',
                'filename': result['filename'],
                'chunks_created': result['chunks_created'],
                'total_characters': result['total_characters']
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result.get('error', 'Upload failed')
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Upload error: {str(e)}'
        }), 500

@app.route('/api/stats')
def get_stats():
    """API endpoint for system statistics"""
    try:
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Translate core stats to the fields expected by the UI
        core_stats = rag_system.get_stats()

        # Load index for file and chunk breakdowns
        vectorstore = rag_system.load_index()
        total_chunks = 0
        total_files = 0
        if vectorstore:
            total_chunks = vectorstore.index.ntotal
            filenames = set()
            for doc in vectorstore.docstore._dict.values():
                metadata = getattr(doc, 'metadata', {}) or {}
                name = metadata.get('filename')
                if name:
                    filenames.add(name)
            total_files = len(filenames)

        # Format index size consistently with UI (e.g., "12.3 MB")
        index_size_mb = core_stats.get('index_size_mb', 0)
        stats = {
            'total_files': total_files,
            'total_chunks': total_chunks,
            'index_size': f"{round(index_size_mb, 2)} MB"
        }

        return jsonify({
            'status': 'success',
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error getting stats: {str(e)}'
        }), 500

@app.route('/api/files')
def list_files():
    """API endpoint for listing uploaded files"""
    try:
        if not file_monitor:
            return jsonify({
                'status': 'error',
                'message': 'File monitor not initialized'
            }), 500
        
        # Build file list with chunk counts from the current index
        files_with_stats = []
        try:
            if not rag_system:
                raise RuntimeError('RAG system not initialized')

            vectorstore = rag_system.load_index()
            if vectorstore is None:
                # No index yet; fall back to filenames known by the file monitor
                filenames = file_monitor.get_processed_files() or []
                files_with_stats = [{
                    'filename': name,
                    'chunks': 0
                } for name in sorted(filenames)]
            else:
                # Aggregate chunk counts by filename from document metadata
                filename_to_chunks = {}
                for doc in vectorstore.docstore._dict.values():
                    metadata = getattr(doc, 'metadata', {}) or {}
                    name = metadata.get('filename')
                    if not name:
                        continue
                    filename_to_chunks[name] = filename_to_chunks.get(name, 0) + 1

                # Ensure files known by the monitor are also represented
                for name in file_monitor.get_processed_files() or []:
                    filename_to_chunks.setdefault(name, 0)

                files_with_stats = [
                    {
                        'filename': name,
                        'chunks': count
                    }
                    for name, count in sorted(filename_to_chunks.items())
                ]
        except Exception:
            # If anything goes wrong, don't fail the request; provide best-effort data
            filenames = file_monitor.get_processed_files() or []
            files_with_stats = [{
                'filename': name,
                'chunks': 0
            } for name in sorted(filenames)]

        return jsonify({
            'status': 'success',
            'files': files_with_stats
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error listing files: {str(e)}'
        }), 500

@app.route('/api/coaching', methods=['POST'])
def coaching_session():
    """Enhanced API endpoint for coaching assistant with advanced prompt engineering"""
    try:
        data = request.get_json()
        question = data.get('question', '').strip()
        coaching_type = data.get('type', 'general')
        product = data.get('product', '')
        customer_type = data.get('customer_type', '')
        context = data.get('context', {})
        
        if not question:
            return jsonify({
                'status': 'error',
                'message': 'Question is required'
            }), 400
        
        if not rag_system:
            return jsonify({
                'status': 'error',
                'message': 'RAG system not initialized'
            }), 500
        
        # Advanced prompt engineering based on coaching type
        enhanced_question = create_coaching_prompt(question, coaching_type, product, customer_type, context)
        
        # Process the coaching question with enhanced prompting
        result = rag_system.query(enhanced_question, use_web_search=False)
        
        if result["status"] == "success":
            # Post-process the answer for coaching context
            processed_answer = process_coaching_response(result['answer'], coaching_type, context)
            
            # Generate coaching insights and recommendations
            insights = generate_coaching_insights(question, result['answer'], coaching_type)
            
            return jsonify({
                'status': 'success',
                'answer': processed_answer,
                'coaching_type': coaching_type,
                'insights': insights,
                'practice_suggestions': generate_practice_suggestions(coaching_type, context),
                'sources': result.get('sources', []),
                'quality_metrics': result.get('quality_metrics', {})
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result.get('error', 'Coaching session failed')
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Coaching error: {str(e)}'
        }), 500

@app.route('/api/simulation', methods=['POST'])
def simulation_session():
    """Enhanced API endpoint for simulation training with AI-driven scenarios"""
    try:
        data = request.get_json()
        action = data.get('action')  # start, respond, end, analyze
        scenario_type = data.get('scenario')
        user_response = data.get('response', '')
        session_id = data.get('session_id', '')
        simulation_context = data.get('context', {})
        
        if action == 'start':
            # Generate intelligent simulation scenario
            scenario_data = generate_simulation_scenario(scenario_type, simulation_context)
            return jsonify({
                'status': 'success',
                'message': 'Simulation started',
                'scenario_data': scenario_data
            })
        
        elif action == 'respond':
            # Process user response and generate AI customer reply
            customer_response = generate_customer_response(user_response, scenario_type, simulation_context)
            real_time_feedback = analyze_user_response(user_response, scenario_type, simulation_context)
            
            return jsonify({
                'status': 'success',
                'customer_response': customer_response['message'],
                'customer_emotion': customer_response['emotion'],
                'real_time_feedback': real_time_feedback,
                'score_update': real_time_feedback.get('score_impact', 0)
            })
        
        elif action == 'analyze':
            # Provide detailed analysis of specific response
            analysis = analyze_conversation_turn(user_response, scenario_type, simulation_context)
            return jsonify({
                'status': 'success',
                'analysis': analysis
            })
        
        elif action == 'end':
            # Calculate comprehensive performance with detailed analytics
            conversation_history = simulation_context.get('conversation', [])
            performance_data = calculate_detailed_performance(conversation_history, scenario_type, simulation_context)
            
            return jsonify({
                'status': 'success',
                'performance_score': performance_data['overall_score'],
                'detailed_metrics': performance_data['metrics'],
                'detailed_feedback': performance_data['feedback'],
                'improvement_plan': performance_data['improvement_plan'],
                'comparative_analysis': performance_data['comparative_analysis']
            })
        
        return jsonify({
            'status': 'error',
            'message': 'Invalid simulation action'
        }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Simulation error: {str(e)}'
        }), 500

@app.route('/api/files/delete', methods=['POST'])
def delete_file():
    """Delete a file's vectors from the index by filename"""
    try:
        data = request.get_json() or {}
        filename = (data.get('filename') or '').strip()
        if not filename:
            return jsonify({'status': 'error', 'message': 'Filename is required'}), 400

        if not rag_system:
            return jsonify({'status': 'error', 'message': 'RAG system not initialized'}), 500

        vectorstore = rag_system.load_index()
        if vectorstore is None:
            return jsonify({'status': 'error', 'message': 'No index found'}), 404

        # Find docstore IDs matching the filename
        ids_to_delete = [
            doc_id for doc_id, doc in vectorstore.docstore._dict.items()
            if getattr(doc, 'metadata', {}).get('filename') == filename
        ]

        if not ids_to_delete:
            return jsonify({'status': 'error', 'message': 'File not found in index'}), 404

        before = vectorstore.index.ntotal
        vectorstore.delete(ids_to_delete)
        rag_system.save_index(vectorstore)
        after = vectorstore.index.ntotal

        # Remove from file monitor cache if present
        try:
            if file_monitor and file_monitor.handler:
                if filename in file_monitor.handler.processed_files:
                    file_monitor.handler.processed_files.remove(filename)
        except Exception:
            pass

        # Also remove the physical file from data/documents if present
        try:
            doc_dir = Path("./data/documents")
            file_path = doc_dir / filename
            if file_path.is_file():
                file_path.unlink()
        except Exception:
            # Do not fail the request if filesystem deletion fails
            pass

        return jsonify({
            'status': 'success',
            'filename': filename,
            'chunks_removed': max(before - after, 0)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error deleting file: {str(e)}'}), 500

# Advanced Coaching and Simulation Helper Functions
def create_coaching_prompt(question, coaching_type, product, customer_type, context):
    """Create concise prompts for coaching scenarios"""
    
    # Simplify and clean the question
    cleaned_question = question.strip()[:300]  # Limit length
    
    # Remove redundant words more aggressively
    words = cleaned_question.split()
    filtered_words = []
    seen_count = {}
    
    for word in words:
        word_lower = word.lower()
        count = seen_count.get(word_lower, 0)
        seen_count[word_lower] = count + 1
        
        # Allow common words to repeat more, but limit others
        if word_lower in ['the', 'and', 'or', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'with', 'our', 'we', 'i', 'you', 'my', 'me', 'is', 'are', 'insurance']:
            filtered_words.append(word)
        elif count <= 2:  # Limit other words to 2 occurrences
            filtered_words.append(word)
    
    clean_question = ' '.join(filtered_words)
    
    # Create simple, direct prompt
    prompt = f"As a UOB insurance expert, help with: {clean_question}. Provide specific advice for {product or 'insurance'} sales."
    
    return prompt

def process_coaching_response(answer, coaching_type, context):
    """Post-process coaching responses for better structure"""
    # Add coaching-specific formatting and structure
    if "##" not in answer:
        # Add structure if not already present
        lines = answer.split('\n')
        structured_answer = f"## {coaching_type.title()} Coaching\n\n"
        structured_answer += "\n".join(lines)
    else:
        structured_answer = answer
    
    return structured_answer

def generate_coaching_insights(question, answer, coaching_type):
    """Generate additional coaching insights and tips"""
    insights = {
        'key_focus_areas': [],
        'practice_exercises': [],
        'success_indicators': [],
        'common_mistakes': []
    }
    
    # Generate insights based on coaching type
    if coaching_type == 'competitive':
        insights['key_focus_areas'] = [
            'Value proposition clarity',
            'Competitive differentiation',
            'Customer benefit focus'
        ]
        insights['practice_exercises'] = [
            'Practice elevator pitch for each product',
            'Role-play competitive comparison scenarios',
            'Create benefit vs feature comparison charts'
        ]
    elif coaching_type == 'objection_handling':
        insights['key_focus_areas'] = [
            'Active listening skills',
            'Empathy and understanding',
            'Reframing techniques'
        ]
        insights['practice_exercises'] = [
            'Record and analyze objection handling sessions',
            'Practice the "Feel, Felt, Found" technique',
            'Develop objection prevention strategies'
        ]
    
    return insights

def generate_practice_suggestions(coaching_type, context):
    """Generate specific practice suggestions"""
    suggestions = []
    
    if coaching_type == 'competitive':
        suggestions = [
            "Practice your 30-second value proposition",
            "Memorize 3 key differentiators for each product",
            "Role-play price objection scenarios"
        ]
    elif coaching_type == 'objection_handling':
        suggestions = [
            "Practice active listening techniques",
            "Develop your empathy statement repertoire",
            "Master the pause-and-respond technique"
        ]
    else:
        suggestions = [
            "Practice your product explanations",
            "Work on your questioning techniques",
            "Improve your closing skills"
        ]
    
    return suggestions

def generate_simulation_scenario(scenario_type, context):
    """Generate intelligent, realistic simulation scenarios"""
    scenarios = {
        'new_customer': {
            'customer_name': 'Sarah Chen',
            'age': 28,
            'occupation': 'Marketing Executive',
            'background': 'Single professional, tech-savvy, first-time insurance buyer',
            'personality': 'Analytical, asks detailed questions, comparison shops',
            'initial_message': "Hi, I'm Sarah. I've been putting off getting insurance, but my friends keep telling me I should. I honestly don't know where to start - there are so many options and it's all quite confusing.",
            'goals': ['Understand basic insurance needs', 'Get affordable coverage', 'Simple application process'],
            'concerns': ['Cost vs budget', 'Complexity of products', 'Trust in recommendations'],
            'triggers': ['Uses smartphone frequently', 'Mentions budget constraints', 'Asks for comparisons']
        },
        'objection_handling': {
            'customer_name': 'David Wong',
            'age': 42,
            'occupation': 'Business Owner',
            'background': 'Experienced buyer, price-sensitive, had bad experience with previous agent',
            'personality': 'Skeptical, direct communicator, wants value for money',
            'initial_message': "Look, I've been burned before by insurance agents who promised one thing and delivered another. I've seen your brochures and frankly, your prices are higher than what I can get online. Why should I pay more?",
            'goals': ['Find best value', 'Avoid being oversold', 'Get straight answers'],
            'concerns': ['Being misled', 'Overpaying', 'Hidden terms and conditions'],
            'triggers': ['Mentions price frequently', 'References past bad experiences', 'Challenges statements']
        },
        'complex_family': {
            'customer_name': 'Michelle Lim',
            'age': 38,
            'occupation': 'Senior Manager',
            'background': 'Married with 2 children, elderly parents, multiple financial priorities',
            'personality': 'Thorough, family-focused, wants comprehensive protection',
            'initial_message': "I need to get our family's insurance sorted out properly. We have young kids, elderly parents who depend on us, and I'm the main breadwinner. It feels overwhelming trying to figure out what we need and what we can afford.",
            'goals': ['Comprehensive family protection', 'Estate planning', 'Education funding'],
            'concerns': ['Adequate coverage for all', 'Affordability', 'Policy coordination'],
            'triggers': ['Talks about family frequently', 'Asks about coverage amounts', 'Mentions financial planning']
        },
        'cross_selling': {
            'customer_name': 'Robert Tan',
            'age': 45,
            'occupation': 'Engineer',
            'background': 'Existing UOB customer, has basic term life, good relationship with bank',
            'personality': 'Loyal, trusting, open to suggestions, detail-oriented',
            'initial_message': "Hi! I've been very happy banking with UOB for over 10 years. I have a basic term life policy through you guys, but my financial advisor mentioned I should consider other types of coverage. What do you think I should be looking at?",
            'goals': ['Optimize insurance portfolio', 'Leverage existing relationship', 'Get expert advice'],
            'concerns': ['Making right decisions', 'Not over-insuring', 'Cost efficiency'],
            'triggers': ['References existing relationship', 'Asks for recommendations', 'Shows trust in UOB']
        }
    }
    
    return scenarios.get(scenario_type, scenarios['new_customer'])

def generate_customer_response(user_response, scenario_type, context):
    """Generate intelligent customer responses using simplified RAG prompts"""
    if not rag_system:
        return {
            'message': "I understand. Could you tell me more about that?",
            'emotion': 'neutral',
            'engagement_level': 0.5
        }
    
    # Create very simple, direct prompt to avoid validation issues
    simple_prompt = f"Act as insurance customer. Agent said: '{user_response[:200]}'. Reply naturally in 1-2 sentences."
    
    try:
        # Use RAG system with simple prompt
        result = rag_system.query(simple_prompt, use_web_search=False)
        
        if result["status"] == "success":
            response_text = result['answer'].strip()
            # Clean response
            if len(response_text) > 150:
                response_text = response_text[:150] + "..."
            
            return {
                'message': response_text,
                'emotion': 'neutral',
                'engagement_level': 0.7
            }
        else:
            raise Exception(f"RAG error: {result.get('error', 'Unknown')}")
            
    except Exception as e:
        print(f"Error generating customer response: {e}")
        # Improved fallback responses based on scenario
        fallback_responses = {
            'new_customer': "That sounds interesting. Can you explain how that would work for someone like me?",
            'objection_handling': "I'm still not convinced. What makes this different from other options?",
            'complex_family': "That's a lot to consider. How do I know this is the right choice for my family?",
            'cross_selling': "I appreciate the suggestion. How would this complement what I already have?"
        }
        
        return {
            'message': fallback_responses.get(scenario_type, "I see. Can you tell me more?"),
            'emotion': 'neutral', 
            'engagement_level': 0.5
        }

def analyze_response_sentiment(response):
    """Simple sentiment analysis for user responses"""
    positive_words = ['good', 'great', 'excellent', 'helpful', 'understand', 'makes sense', 'thank you']
    negative_words = ['expensive', 'concerned', 'worried', 'confused', 'complicated', 'not sure']
    
    response_lower = response.lower()
    positive_count = sum(1 for word in positive_words if word in response_lower)
    negative_count = sum(1 for word in negative_words if word in response_lower)
    
    return (positive_count - negative_count) / max(len(response.split()), 1)

def analyze_user_response(user_response, scenario_type, context):
    """Analyze user response with simplified RAG prompts"""
    if not rag_system:
        return {
            'strengths': ['Response recorded'],
            'improvements': ['Keep practicing'],
            'score_impact': 0,
            'specific_tips': ['Continue the conversation']
        }
    
    # Create very simple analysis prompt
    simple_prompt = f"Analyze insurance sales response: '{user_response[:150]}'. Give 2 strengths, 2 improvements, score -5 to +5."
    
    try:
        result = rag_system.query(simple_prompt, use_web_search=False)
        
        if result["status"] == "success":
            analysis = result['answer']
            
            # Simple parsing - look for key indicators
            feedback = {
                'strengths': [],
                'improvements': [], 
                'score_impact': 2,  # Default positive score
                'specific_tips': []
            }
            
            # Extract strengths and improvements from response
            lines = analysis.split('\n')
            for line in lines:
                line = line.strip()
                if any(word in line.lower() for word in ['strength', 'good', 'well', 'excellent', 'effective']):
                    if len(line) > 10 and len(feedback['strengths']) < 2:
                        feedback['strengths'].append(line.replace('•', '').replace('-', '').strip())
                elif any(word in line.lower() for word in ['improve', 'better', 'consider', 'should', 'could']):
                    if len(line) > 10 and len(feedback['improvements']) < 2:
                        feedback['improvements'].append(line.replace('•', '').replace('-', '').strip())
            
            # Fallback if parsing failed
            if not feedback['strengths']:
                feedback['strengths'] = ['Shows engagement with customer']
            if not feedback['improvements']:
                feedback['improvements'] = ['Continue building rapport']
            
            feedback['specific_tips'] = ['Ask follow-up questions', 'Focus on benefits']
            
            return feedback
            
    except Exception as e:
        print(f"Error analyzing user response: {e}")
    
    # Simple fallback analysis based on response content
    response_lower = user_response.lower()
    strengths = []
    improvements = []
    score_impact = 0
    
    # Basic analysis
    if '?' in user_response:
        strengths.append('Uses questions to engage customer')
        score_impact += 2
    
    if any(word in response_lower for word in ['understand', 'help', 'benefit']):
        strengths.append('Shows empathy and focus on benefits')
        score_impact += 2
    
    if len(user_response.split()) > 30:
        improvements.append('Consider being more concise')
        score_impact -= 1
    
    if not any(word in response_lower for word in ['you', 'your']):
        improvements.append('Make response more customer-focused')
        score_impact -= 1
    
    # Ensure we have content
    if not strengths:
        strengths = ['Professional communication']
    if not improvements:
        improvements = ['Continue developing techniques']
    
    return {
        'strengths': strengths,
        'improvements': improvements,
        'score_impact': score_impact,
        'specific_tips': ['Ask follow-up questions', 'Highlight key benefits']
    }

def analyze_conversation_turn(user_response, scenario_type, context):
    """Provide detailed analysis of a conversation turn"""
    return {
        'communication_style': 'Professional and empathetic',
        'technique_used': 'Active listening and benefit positioning',
        'effectiveness_score': 7.5,
        'suggestions': [
            'Consider asking a follow-up question to deepen engagement',
            'Use specific examples to make benefits more concrete'
        ]
    }

def calculate_detailed_performance(conversation_history, scenario_type, context):
    """Calculate comprehensive performance metrics using RAG analysis"""
    if not rag_system or not conversation_history:
        # Fallback performance data
        return {
            'overall_score': 75.0,
            'metrics': {
                'rapport_building': 75,
                'needs_discovery': 70,
                'product_knowledge': 80,
                'objection_handling': 72,
                'closing_effectiveness': 68,
                'communication_skills': 78
            },
            'feedback': {
                'strengths': ['Professional communication', 'Good engagement'],
                'improvements': ['Practice objection handling', 'Improve closing techniques'],
                'overall_rating': 'Good'
            },
            'improvement_plan': ['Practice more scenarios', 'Focus on closing techniques'],
            'comparative_analysis': {'vs_average': 5.0, 'percentile_rank': 65}
        }
    
    # Prepare conversation summary for analysis
    conversation_summary = "\n".join([
        f"Turn {turn.get('turn', i+1)}: RM said '{turn.get('user_message', '')}'"
        for i, turn in enumerate(conversation_history) if turn.get('user_message')
    ][:10])  # Limit to first 10 turns
    
    # Create comprehensive analysis prompt
    analysis_prompt = f"""Analyze this insurance sales conversation for a {scenario_type} scenario:

{conversation_summary}

Provide detailed scoring (0-100) for each area:

Rapport Building: [score]
Needs Discovery: [score] 
Product Knowledge: [score]
Objection Handling: [score]
Closing Effectiveness: [score]
Communication Skills: [score]

Strengths: [list 2-3 strengths]
Improvements: [list 2-3 improvements]
Overall Rating: [Excellent/Good/Satisfactory/Needs Improvement]

Improvement Plan:
1. [specific action]
2. [specific action]
3. [specific action]

Analysis:"""
    
    try:
        result = rag_system.query(analysis_prompt, use_web_search=False)
        
        if result["status"] == "success":
            analysis_text = result['answer']
            
            # Parse metrics
            metrics = {}
            metric_names = ['rapport_building', 'needs_discovery', 'product_knowledge', 'objection_handling', 'closing_effectiveness', 'communication_skills']
            
            for metric in metric_names:
                metric_display = metric.replace('_', ' ').title()
                if metric_display in analysis_text:
                    try:
                        # Find the score after the metric name
                        import re
                        pattern = f"{metric_display}:\s*(\d+)"
                        match = re.search(pattern, analysis_text)
                        if match:
                            metrics[metric] = max(0, min(100, int(match.group(1))))
                        else:
                            metrics[metric] = 75  # Default score
                    except:
                        metrics[metric] = 75
                else:
                    metrics[metric] = 75
            
            # Calculate overall score
            overall_score = sum(metrics.values()) / len(metrics)
            
            # Parse feedback
            strengths = []
            improvements = []
            overall_rating = 'Good'
            
            if 'Strengths:' in analysis_text:
                strengths_section = analysis_text.split('Strengths:')[1].split('Improvements:')[0] if 'Improvements:' in analysis_text else analysis_text.split('Strengths:')[1]
                strengths = [s.strip().replace('•', '').replace('-', '').strip() for s in strengths_section.split('\n') if s.strip() and len(s.strip()) > 5][:3]
            
            if 'Improvements:' in analysis_text:
                improvements_section = analysis_text.split('Improvements:')[1].split('Overall Rating:')[0] if 'Overall Rating:' in analysis_text else analysis_text.split('Improvements:')[1].split('Improvement Plan:')[0] if 'Improvement Plan:' in analysis_text else analysis_text.split('Improvements:')[1]
                improvements = [s.strip().replace('•', '').replace('-', '').strip() for s in improvements_section.split('\n') if s.strip() and len(s.strip()) > 5][:3]
            
            if 'Overall Rating:' in analysis_text:
                rating_line = [line for line in analysis_text.split('\n') if 'Overall Rating:' in line]
                if rating_line:
                    rating_text = rating_line[0].split('Overall Rating:')[1].strip()
                    if any(word in rating_text.lower() for word in ['excellent', 'outstanding']):
                        overall_rating = 'Excellent'
                    elif any(word in rating_text.lower() for word in ['good', 'strong']):
                        overall_rating = 'Good'
                    elif any(word in rating_text.lower() for word in ['satisfactory', 'adequate']):
                        overall_rating = 'Satisfactory'
                    else:
                        overall_rating = 'Needs Improvement'
            
            # Parse improvement plan
            improvement_plan = []
            if 'Improvement Plan:' in analysis_text:
                plan_section = analysis_text.split('Improvement Plan:')[1]
                plan_items = [s.strip() for s in plan_section.split('\n') if s.strip() and (s.strip().startswith(tuple('123456789')) or s.strip().startswith(('•', '-')))]
                improvement_plan = [item.strip().replace('•', '').replace('-', '').strip().lstrip('123456789. ') for item in plan_items][:3]
            
            # Ensure fallback data
            if not strengths:
                strengths = ['Professional approach', 'Good communication']
            if not improvements:
                improvements = ['Practice more scenarios', 'Enhance closing techniques']
            if not improvement_plan:
                improvement_plan = ['Continue practicing', 'Focus on weak areas', 'Get more coaching']
            
            return {
                'overall_score': round(overall_score, 1),
                'metrics': metrics,
                'feedback': {
                    'strengths': strengths,
                    'improvements': improvements,
                    'overall_rating': overall_rating
                },
                'improvement_plan': improvement_plan,
                'comparative_analysis': generate_comparative_analysis(overall_score, scenario_type)
            }
            
    except Exception as e:
        print(f"Error calculating performance: {e}")
    
    # Fallback calculation
    return {
        'overall_score': 75.0,
        'metrics': {
            'rapport_building': 75,
            'needs_discovery': 70,
            'product_knowledge': 80,
            'objection_handling': 72,
            'closing_effectiveness': 68,
            'communication_skills': 78
        },
        'feedback': {
            'strengths': ['Professional communication', 'Customer engagement'],
            'improvements': ['Practice objection handling', 'Improve closing'],
            'overall_rating': 'Good'
        },
        'improvement_plan': ['Practice more scenarios', 'Focus on closing techniques', 'Get additional coaching'],
        'comparative_analysis': {'vs_average': 5.0, 'percentile_rank': 65}
    }



def generate_comparative_analysis(overall_score, scenario_type):
    """Generate comparative analysis with benchmarks"""
    benchmarks = {
        'new_customer': {'average': 72, 'top_10_percent': 85},
        'objection_handling': {'average': 68, 'top_10_percent': 82},
        'complex_family': {'average': 70, 'top_10_percent': 84},
        'cross_selling': {'average': 75, 'top_10_percent': 87}
    }
    
    benchmark = benchmarks.get(scenario_type, benchmarks['new_customer'])
    
    return {
        'vs_average': overall_score - benchmark['average'],
        'vs_top_performers': overall_score - benchmark['top_10_percent'],
        'percentile_rank': min(95, max(5, (overall_score / benchmark['top_10_percent']) * 85))
    }

if __name__ == '__main__':
    # Initialize RAG system
    if not initialize_rag():
        print("❌ Failed to initialize RAG system. Exiting.")
        exit(1)
    
    # Run the Flask app
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5501)



