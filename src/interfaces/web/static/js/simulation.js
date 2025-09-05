// Enhanced Simulation & Training JavaScript
// =======================================
// Integrates with AI-driven backend for intelligent simulations

let isSimulationActive = false;
let currentScenario = null;
let simulationStartTime = null;
let turnCount = 0;
let sessionId = null;
let conversationHistory = [];
let realTimeScores = [];
let simulationTimer = null; // Add timer for auto-end
let sessionData = {
    scores: [],
    sessions: 0,
    totalScore: 0,
    bestScore: 0,
    detailedMetrics: []
};

// Load session data from localStorage
function loadSessionData() {
    const stored = localStorage.getItem('uob_simulation_data');
    if (stored) {
        sessionData = JSON.parse(stored);
        updateProgressDisplay();
    }
}

// Save session data to localStorage  
function saveSessionData() {
    localStorage.setItem('uob_simulation_data', JSON.stringify(sessionData));
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 1000);
    loadSessionData();
});

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('currentTime').textContent = timeString;
}

function selectScenario(scenarioType) {
    // Remove active class from all scenarios
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected scenario
    event.currentTarget.classList.add('active');
    
    currentScenario = scenarioType;
    document.getElementById('startBtn').disabled = false;
    

}

function getScenarioName(type) {
    const names = {
        'new_customer': 'New Customer Meeting',
        'objection_handling': 'Objection Handling',
        'complex_family': 'Complex Family Case',
        'cross_selling': 'Cross-selling Opportunity',
        'product_explanation': 'Product Explanation'
    };
    return names[type] || type;
}

function startSimulation() {
    if (!currentScenario) {

        return;
    }
    
    isSimulationActive = true;
    simulationStartTime = new Date();
    turnCount = 0;
    sessionId = generateSessionId();
    conversationHistory = [];
    realTimeScores = [];
    
    // Set up simulation timer for duration-based end
    const duration = parseInt(document.getElementById('sessionDuration').value) * 60 * 1000; // Convert to milliseconds
    simulationTimer = setTimeout(() => {
        if (isSimulationActive) {
            endSimulation();
        }
    }, duration);
    
    // Also check every 30 seconds for warnings
    const warningTimer = setInterval(() => {
        if (isSimulationActive) {
            checkSimulationEnd();
        } else {
            clearInterval(warningTimer);
        }
    }, 30000);
    
    // Update UI
    document.getElementById('questionInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('suggestions').style.display = 'none';
    document.getElementById('simControlsActive').style.display = 'flex';
    
    // Show loading
    document.getElementById('loading').classList.add('show');
    
    // Call backend to start simulation
    startSimulationAPI();
}

function startQuickSimulation(scenarioType) {
    currentScenario = scenarioType;
    
    // Select default settings for quick start
    document.getElementById('customerPersonality').value = 'friendly';
    document.getElementById('difficultyLevel').value = 'intermediate';
    document.getElementById('sessionDuration').value = '10';
    
    // Highlight the scenario
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.classList.remove('active');
    });
    
    startSimulation();
}

// Enhanced backend integration functions
async function startSimulationAPI() {
    try {
        const response = await fetch('/api/simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'start',
                scenario: currentScenario,
                context: {
                    session_id: sessionId,
                    personality: document.getElementById('customerPersonality').value,
                    difficulty: document.getElementById('difficultyLevel').value,
                    duration: document.getElementById('sessionDuration').value
                }
            })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            document.getElementById('loading').classList.remove('show');
            initializeScenario(data.scenario_data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Simulation API Error:', error);
        document.getElementById('loading').classList.remove('show');
        // Fallback to local initialization
        initializeScenario(generateLocalScenario());
    }
}

function generateLocalScenario() {
    const scenarios = {
        'new_customer': {
            customer_name: 'Alex Chen',
            background: 'Young professional, age 28, works in tech',
            initial_message: "Hi, I'm Alex. I've been thinking about getting some insurance, but I'm not really sure what I need. A friend recommended I talk to someone at UOB. Can you help me understand my options?"
        },
        'objection_handling': {
            customer_name: 'Sarah Wong',
            background: 'Mid-career manager, age 35, cost-conscious',
            initial_message: "I've been looking at insurance options, and honestly, everything seems so expensive. I saw some cheaper options online. Why should I pay more for UOB insurance?"
        }
    };
    return scenarios[currentScenario] || scenarios['new_customer'];
}

// Add the missing initializeScenario function
function initializeScenario(scenarioData) {
    // Add scenario introduction message
    const introMessage = `🎭 **Scenario Started: ${getScenarioName(currentScenario)}**\n\n` +
        `**Customer:** ${scenarioData.customer_name}\n` +
        `**Background:** ${scenarioData.background}\n\n` +
        `*The simulation begins now. Respond naturally as a UOB Relationship Manager.*`;
    
    addMessage(introMessage, 'scenario');
    
    // Add customer's initial message
    setTimeout(() => {
        addMessage(scenarioData.initial_message, 'customer');
    }, 1000);
}

function generateSessionId() {
    return 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendResponse();
    }
}

function sendResponse() {
    if (!isSimulationActive) return;
    
    const input = document.getElementById('questionInput');
    const response = input.value.trim();
    
    if (!response) return;
    
    input.value = '';
    turnCount++;
    
    // Add user response
    addMessage(response, 'user');
    
    // Store user response in conversation history
    conversationHistory.push({
        turn: turnCount,
        user_message: response,
        timestamp: new Date().toISOString()
    });
    
    // Show loading for customer response
    document.getElementById('loading').classList.add('show');
    
    // Generate customer response via API
    generateCustomerResponseAPI(response);
}

// Enhanced customer response generation with API integration
async function generateCustomerResponseAPI(userResponse) {
    try {
        const response = await fetch('/api/simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'respond',
                scenario: currentScenario,
                response: userResponse,
                session_id: sessionId,
                context: {
                    conversation: conversationHistory,
                    turn_count: turnCount,
                    personality: document.getElementById('customerPersonality').value,
                    difficulty: document.getElementById('difficultyLevel').value
                }
            })
        });

        const data = await response.json();
        
        document.getElementById('loading').classList.remove('show');
        
        if (data.status === 'success') {
            // Add AI-generated customer response
            addMessage(data.customer_response, 'customer');
            
            // Store customer response
            conversationHistory.push({
                turn: turnCount,
                customer_message: data.customer_response,
                customer_emotion: data.customer_emotion,
                timestamp: new Date().toISOString()
            });
            
            // Show real-time feedback if available
            if (data.real_time_feedback) {
                displayRealTimeFeedback(data.real_time_feedback);
            }
            
            // Update scores if available
            if (data.score_update) {
                realTimeScores.push({
                    turn: turnCount,
                    score_change: data.score_update,
                    timestamp: new Date().toISOString()
                });
                updateRealTimeScore(data.score_update);
            }
            
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Customer Response API Error:', error);
        document.getElementById('loading').classList.remove('show');
        
        // Fallback to local generation
        generateCustomerResponse(userResponse);
    }
    
    // Check if simulation should end
    checkSimulationEnd();
}

function displayRealTimeFeedback(feedback) {
    let feedbackHTML = `## 📊 Real-time Feedback\n\n`;
    
    if (feedback.strengths && feedback.strengths.length > 0) {
        feedbackHTML += `**Strengths:**\n${feedback.strengths.map(s => `✅ ${s}`).join('\n')}\n\n`;
    }
    
    if (feedback.improvements && feedback.improvements.length > 0) {
        feedbackHTML += `**Improvements:**\n${feedback.improvements.map(i => `💡 ${i}`).join('\n')}\n\n`;
    }
    
    if (feedback.specific_tips && feedback.specific_tips.length > 0) {
        feedbackHTML += `**Tips:**\n${feedback.specific_tips.map(t => `• ${t}`).join('\n')}`;
    }
    
    addMessage(feedbackHTML, 'feedback');
}

function updateRealTimeScore(scoreChange) {
    // Update UI to show score change
    if (scoreChange !== 0) {
        const indicator = document.createElement('div');
        indicator.className = `score-indicator ${scoreChange > 0 ? 'positive' : 'negative'}`;
        indicator.textContent = `${scoreChange > 0 ? '+' : ''}${scoreChange}`;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 100px;
            background: ${scoreChange > 0 ? '#10b981' : '#ef4444'};
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(indicator);
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }
}

function checkSimulationEnd() {
    // Check if simulation should end based on duration (in minutes)
    const maxDuration = parseInt(document.getElementById('sessionDuration').value);
    const currentDuration = (new Date() - simulationStartTime) / 1000 / 60; // Convert to minutes
    
    // Auto-end after time limit or if many turns completed
    if (currentDuration >= maxDuration || turnCount >= 15) {
        endSimulation();
    }
    // Warn user when approaching time limit
    else if (currentDuration >= maxDuration * 0.8) {
        const remaining = Math.ceil(maxDuration - currentDuration);

    }
}

// Add manual end simulation function
function endSimulationManually() {
    if (isSimulationActive) {
        if (confirm('Are you sure you want to end this simulation session?')) {
            endSimulation();
        }
    }
}

// Add demo scoring function for testing
function demoScoreUpdate() {
    const demoScore = 75 + Math.random() * 20;
    const demoData = {
        overall_score: Math.round(demoScore),
        detailed_metrics: generateLocalMetrics(),
        feedback: generateLocalFeedback(demoScore),
        improvement_plan: ['Practice active listening', 'Improve closing techniques'],
        comparative_analysis: { vs_average: demoScore - 70 }
    };
    
    updateSessionData(demoData);
    displayEnhancedPerformanceFeedback(demoData);

}

async function endSimulation() {
    isSimulationActive = false;
    
    // Clear any active timers
    if (simulationTimer) {
        clearTimeout(simulationTimer);
        simulationTimer = null;
    }
    
    try {
        // Calculate comprehensive performance via API
        const response = await fetch('/api/simulation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'end',
                session_id: sessionId,
                scenario: currentScenario,
                context: {
                    conversation: conversationHistory,
                    real_time_scores: realTimeScores,
                    session_duration: (new Date() - simulationStartTime) / 1000 / 60,
                    turn_count: turnCount,
                    personality: document.getElementById('customerPersonality').value,
                    difficulty: document.getElementById('difficultyLevel').value
                }
            })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            // Use AI-generated performance data
            const performanceData = {
                overall_score: data.performance_score,
                detailed_metrics: data.detailed_metrics,
                feedback: data.detailed_feedback,
                improvement_plan: data.improvement_plan,
                comparative_analysis: data.comparative_analysis
            };
            
            displayEnhancedPerformanceFeedback(performanceData);
            updateSessionData(performanceData);
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('End Simulation API Error:', error);
        // Fallback to local performance calculation
        const sessionDuration = (new Date() - simulationStartTime) / 1000 / 60;
        const localScore = calculateLocalPerformanceScore();
        
        const fallbackData = {
            overall_score: localScore,
            detailed_metrics: generateLocalMetrics(),
            feedback: generateLocalFeedback(localScore),
            improvement_plan: ['Practice more scenarios', 'Focus on listening skills'],
            comparative_analysis: { vs_average: localScore - 70 }
        };
        
        displayEnhancedPerformanceFeedback(fallbackData);
        updateSessionData(fallbackData);
    }
    
    // Reset UI
    resetSimulationUI();
}

// Enhanced performance feedback and analytics functions
function displayEnhancedPerformanceFeedback(performanceData) {
    const { overall_score, detailed_metrics, feedback, improvement_plan, comparative_analysis } = performanceData;
    
    let performance = 'Needs Improvement';
    if (overall_score >= 85) performance = 'Excellent';
    else if (overall_score >= 75) performance = 'Good';
    else if (overall_score >= 60) performance = 'Satisfactory';
    
    let feedbackMessage = `# 🎯 Comprehensive Performance Report\n\n`;
    
    // Overall Performance
    feedbackMessage += `## 📊 Overall Performance\n`;
    feedbackMessage += `**Score: ${overall_score}/100** (${performance})\n`;
    feedbackMessage += `**Session Duration:** ${((new Date() - simulationStartTime) / 1000 / 60).toFixed(1)} minutes\n`;
    feedbackMessage += `**Customer Interactions:** ${turnCount} exchanges\n\n`;
    
    // Detailed Metrics
    if (detailed_metrics) {
        feedbackMessage += `## 📈 Detailed Metrics\n`;
        Object.entries(detailed_metrics).forEach(([metric, score]) => {
            const emoji = score >= 80 ? '🌟' : score >= 70 ? '👍' : '📚';
            feedbackMessage += `**${metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:** ${score}/100 ${emoji}\n`;
        });
        feedbackMessage += `\n`;
    }
    
    // Feedback
    if (feedback) {
        if (feedback.strengths && feedback.strengths.length > 0) {
            feedbackMessage += `## ✅ Key Strengths\n`;
            feedback.strengths.forEach(strength => {
                feedbackMessage += `• ${strength}\n`;
            });
            feedbackMessage += `\n`;
        }
        
        if (feedback.improvements && feedback.improvements.length > 0) {
            feedbackMessage += `## 🔄 Areas for Improvement\n`;
            feedback.improvements.forEach(improvement => {
                feedbackMessage += `• ${improvement}\n`;
            });
            feedbackMessage += `\n`;
        }
    }
    
    // Improvement Plan
    if (improvement_plan && improvement_plan.length > 0) {
        feedbackMessage += `## 🎯 Action Plan\n`;
        improvement_plan.forEach((action, index) => {
            feedbackMessage += `${index + 1}. ${action}\n`;
        });
        feedbackMessage += `\n`;
    }
    
    // Comparative Analysis
    if (comparative_analysis) {
        feedbackMessage += `## 📉 Benchmark Comparison\n`;
        if (comparative_analysis.vs_average) {
            const diff = comparative_analysis.vs_average;
            const indicator = diff > 0 ? '↑' : diff < 0 ? '↓' : '=';
            feedbackMessage += `**vs Average:** ${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${indicator}\n`;
        }
        if (comparative_analysis.percentile_rank) {
            feedbackMessage += `**Percentile Rank:** ${comparative_analysis.percentile_rank.toFixed(0)}th percentile\n`;
        }
    }
    
    feedbackMessage += `\n---\n*Keep practicing to master your skills! 🚀*`;
    
    addMessage(feedbackMessage, 'performance');
}

function updateSessionData(performanceData) {
    // Update session statistics
    sessionData.sessions++;
    sessionData.scores.push(performanceData.overall_score);
    sessionData.totalScore += performanceData.overall_score;
    if (performanceData.overall_score > sessionData.bestScore) {
        sessionData.bestScore = performanceData.overall_score;
    }
    
    // Store detailed metrics
    sessionData.detailedMetrics.push({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        scenario: currentScenario,
        overall_score: performanceData.overall_score,
        detailed_metrics: performanceData.detailed_metrics,
        turn_count: turnCount
    });
    
    saveSessionData();
    updateProgressDisplay();
}

function calculateLocalPerformanceScore() {
    // Simplified local scoring when API is unavailable
    let baseScore = 60;
    
    // Bonus for engagement (number of turns)
    baseScore += Math.min(turnCount * 3, 20);
    
    // Bonus for conversation length
    const avgResponseLength = conversationHistory
        .filter(turn => turn.user_message)
        .reduce((sum, turn) => sum + turn.user_message.length, 0) / Math.max(turnCount, 1);
    
    if (avgResponseLength > 50) baseScore += 5;
    if (avgResponseLength > 100) baseScore += 5;
    
    // Random variation
    baseScore += Math.random() * 15 - 7;
    
    return Math.min(Math.max(Math.round(baseScore), 0), 100);
}

function generateLocalMetrics() {
    return {
        rapport_building: 70 + Math.random() * 20,
        needs_discovery: 65 + Math.random() * 25,
        product_knowledge: 75 + Math.random() * 20,
        objection_handling: 68 + Math.random() * 22,
        communication_skills: 72 + Math.random() * 18
    };
}

function generateLocalFeedback(score) {
    const strengths = [
        'Professional communication style',
        'Active listening demonstrated',
        'Good question-asking techniques'
    ];
    
    const improvements = score < 70 ? [
        'Focus on building rapport early',
        'Ask more discovery questions',
        'Practice objection handling'
    ] : [
        'Enhance closing techniques',
        'Deepen product knowledge'
    ];
    
    return { strengths, improvements, overall_rating: score >= 75 ? 'Good' : 'Needs Improvement' };
}

function resetSimulationUI() {
    document.getElementById('questionInput').disabled = true;
    document.getElementById('sendButton').disabled = true;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('suggestions').style.display = 'flex';
    document.getElementById('simControlsActive').style.display = 'none';
    
    // Clear scenario selection
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.classList.remove('active');
    });
    currentScenario = null;
    sessionId = null;
    conversationHistory = [];
    realTimeScores = [];
    
    // Clear any active timers
    if (simulationTimer) {
        clearTimeout(simulationTimer);
        simulationTimer = null;
    }
}

function addMessage(content, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    // Enhanced message styling based on sender type
    if (sender === 'system') {
        messageDiv.className = 'message bot';
    } else if (sender === 'customer') {
        messageDiv.className = 'message bot';
    } else if (sender === 'feedback') {
        messageDiv.className = 'message bot feedback-message';
    } else if (sender === 'performance') {
        messageDiv.className = 'message bot performance-message';
    } else {
        messageDiv.className = `message ${sender}`;
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Special styling for different message types
    if (sender === 'customer') {
        contentDiv.style.background = '#fff7ed';
        contentDiv.style.borderColor = '#fb923c';
        content = `👤 **Customer:** ${content}`;
    } else if (sender === 'system') {
        contentDiv.style.background = '#f0f9ff';
        contentDiv.style.borderColor = '#0284c7';
    } else if (sender === 'scenario') {
        contentDiv.style.background = '#f3e8ff';
        contentDiv.style.borderColor = '#a855f7';
        contentDiv.style.borderLeft = '4px solid #a855f7';
    } else if (sender === 'feedback') {
        contentDiv.style.background = '#fefce8';
        contentDiv.style.borderColor = '#eab308';
        contentDiv.style.borderLeft = '4px solid #eab308';
    } else if (sender === 'performance') {
        contentDiv.style.background = '#f0fdf4';
        contentDiv.style.borderColor = '#16a34a';
        contentDiv.style.borderLeft = '4px solid #16a34a';
    }
    
    // Render Markdown for bot messages, keep plain text for user messages
    if (sender === 'bot' || sender === 'system' || sender === 'customer' || sender === 'feedback' || sender === 'performance' || sender === 'scenario') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.textContent = content;
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateProgressDisplay() {
    document.getElementById('sessionsCompleted').textContent = sessionData.sessions;
    document.getElementById('bestScore').textContent = sessionData.bestScore;
    
    if (sessionData.sessions > 0) {
        const avgScore = Math.round(sessionData.totalScore / sessionData.sessions);
        document.getElementById('avgScore').textContent = avgScore;
        document.getElementById('overallScore').textContent = avgScore;
        
        // Calculate improvement trend
        if (sessionData.scores.length >= 2) {
            const recent = sessionData.scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, sessionData.scores.length);
            const earlier = sessionData.scores.slice(0, -3);
            if (earlier.length > 0) {
                const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
                const improvement = ((recent - earlierAvg) / earlierAvg * 100).toFixed(0);
                document.getElementById('improvementTrend').textContent = `${improvement > 0 ? '+' : ''}${improvement}%`;
            }
        }
    }
}

function showProgress() {
    if (sessionData.sessions === 0) {

        return;
    }
    
    const progressReport = `📊 **Your Training Progress Report**

**Overall Performance:**
• Total Sessions Completed: ${sessionData.sessions}
• Current Average Score: ${Math.round(sessionData.totalScore / sessionData.sessions)}/100
• Best Score Achieved: ${sessionData.bestScore}/100

**Recent Performance Trend:**
${sessionData.scores.length >= 3 ? 
    `Last 3 sessions: ${sessionData.scores.slice(-3).join(', ')}` :
    'Complete more sessions for trend analysis'}

**Skill Development Areas:**
• Customer Engagement: ${sessionData.bestScore >= 80 ? 'Excellent ✅' : 'Needs Practice 📚'}
• Product Knowledge: ${sessionData.bestScore >= 75 ? 'Strong 💪' : 'Keep Learning 📖'}
• Objection Handling: ${sessionData.bestScore >= 70 ? 'Proficient 🎯' : 'More Practice Needed 🔄'}

**Recommendations:**
• ${sessionData.bestScore < 70 ? 'Focus on basic scenarios and product training' : 
     sessionData.bestScore < 85 ? 'Try more challenging scenarios' :
     'Excellent work! Help others and tackle advanced cases'}

Keep up the great work! 🚀`;

    addMessage(progressReport, 'system');
}

