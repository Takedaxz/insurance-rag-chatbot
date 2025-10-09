// Enhanced Coaching Assistant JavaScript
// =====================================
// Integrates with advanced RAG system backend for intelligent coaching

let isProcessing = false;
let coachingSessions = 0;
let topicsCovered = new Set();
let performanceHistory = [];
let coachingInsights = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    generateDynamicWelcomeMessage();
    loadPerformanceMetrics();
    loadCoachingHistory();
});

function generateDynamicWelcomeMessage() {
    const welcomeMessages = [
        {
            greeting: "ยินดีต้อนรับสู่ผู้ช่วยโค้ชส่วนตัวของคุณ!",
            intro: "พร้อมช่วยให้คุณเป็น UOB Relationship Manager ด้วยการโค้ชที่ปรับให้เหมาะกับคุณเฉพาะตัว:",
            features: [
                "<strong>การวิเคราะห์คู่แข่ง:</strong> เจาะลึกจุดแข็ง-จุดอ่อน เทคนิคเอาชนะคู่แข่ง",
                "<strong>คำสำคัญที่ทรงพลัง:</strong> ประโยคมหัศจรรย์ที่สร้างผลกระทบทันที",
                "<strong>กลยุทธ์รับมือทุกสถานการณ์:</strong> เทคนิคจัดการคำคัดค้านแบบมืออาชีพ",
                "<strong>คราฟต์คำตอบสมบูรณ์:</strong> สร้างการตอบสนองที่โน้มน้าวใจลูกค้า"
            ],
            tip: "เริ่มต้นได้เลย: ใช้เครื่องมือด่วนด้านซ้าย หรือถามเฉพาะเจาะจงเกี่ยวกับเทคนิคการขาย!"
        },
        {
            greeting: "เตรียมพร้อมยกระดับทักษะการเป็น RM แล้วหรือยัง?",
            intro: "วันนี้เรามาฝึกฝนเพื่อให้คุณเป็น Top Performer กันเลย ฉันจะช่วยคุณใน:",
            features: [
                "<strong>การแกว่งคู่แข่ง:</strong> รู้จุดแข็งเรา ใช้ประโยชน์จากจุดอ่อนเขา",
                "<strong>เวทมนตร์คำพูด:</strong> คำศัพท์และวลีที่ทำให้ลูกค้าพยักหน้า",
                "<strong>บทบาทสมมุติ:</strong> เตรียมพร้อมรับมือทุกสถานการณ์ขาย",
                "<strong>คำตอบปังๆ:</strong> สร้างการตอบสนองที่เข้าถึงใจลูกค้า"
            ],
            tip: "Tip: เลือกใช้ปุ่มทางลัดเพื่อการโค้ชแบบเร็ว หรือพิมพ์คำถามเพื่อรับคำแนะนำเฉพาะทาง"
        },
        {
            greeting: "พร้อมมั้ย ที่จะกลายเป็น UOB RM ตัวจริง?",
            intro: "มาร่วมเจาะลึกเทคนิคการขายระดับโปรกันเลย! ฉันมีทุกสิ่งที่คุณต้องการ:",
            features: [
                "<strong>ศึกแดนการแข่งขัน:</strong> วิเคราะห์และเอาชนะคู่แข่งทุกราย",
                "<strong>ศิลปะแห่งคำพูด:</strong> สร้างสรรค์ข้อความที่สัมผัสหัวใจ",
                "<strong>เครื่องมือแก้ปัญหา:</strong> วิธีจัดการความท้าทายในการขาย",
                "<strong>การตอบสนองชั้นเซียน:</strong> คำตอบที่ครบครันและน่าเชื่อถือ"
            ],
            tip: "เริ่มเลย: คลิกเครื่องมือโค้ชด่วน หรือถามคำถามเฉพาะเพื่อรับคำแนะนำระดับเซียน!"
        }
    ];
    
    // Select a random welcome message
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    // Create message content
    let messageContent = `${randomMessage.greeting}<br><br>`;
    messageContent += `${randomMessage.intro}<br>`;
    messageContent += randomMessage.features.map(feature => `<br>• ${feature}`).join('');
    messageContent += `<br><br><em>${randomMessage.tip}</em>`;
    
    // Add the welcome message with a fixed timestamp
    addMessageWithTimestamp(messageContent, 'bot', new Date().toLocaleTimeString());
}

function askSuggestedQuestion(question) {
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('general');
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        askCoachingQuestion('general');
    }
}

// Enhanced Coaching Tool Functions with Backend Integration
function requestCompetitiveAnalysis() {
    const product = document.getElementById('productSelect').value;
    const question = product ? 
        `Provide a competitive analysis for ${product} compared to major competitors. What are our advantages?` :
        'Show me a competitive analysis of our insurance products vs competitors. What makes us stand out?';
    
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('competitive');
}

function requestUSPs() {
    const product = document.getElementById('productSelect').value;
    const question = product ? 
        `What are the unique selling points (USPs) for ${product}? How should I present them to customers?` :
        'What are our key unique selling points across all insurance products?';
    
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('competitive');
}

function requestKeywords() {
    const product = document.getElementById('productSelect').value;
    const customerType = document.getElementById('customerType').value;
    
    let question = 'Give me powerful keywords and phrases to use when selling';
    if (product) question += ` ${product}`;
    if (customerType) question += ` to ${customerType}`;
    question += '. What language resonates best?';
    
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('communication');
}

function requestTalkingPoints() {
    const product = document.getElementById('productSelect').value;
    const question = product ? 
        `What are the key talking points I should cover when presenting ${product} to customers?` :
        'Give me the most important talking points for insurance sales conversations.';
    
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('product_explanation');
}

function requestScenarioHelp() {
    const question = 'I need help handling common customer objections. What are the best responses to typical concerns about insurance?';
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('objection_handling');
}

function requestBestPractices() {
    const customerType = document.getElementById('customerType').value;
    const question = customerType ? 
        `What are the best practices for engaging with ${customerType}? How should I adapt my approach?` :
        'What are the best practices for successful insurance sales conversations?';
    
    document.getElementById('questionInput').value = question;
    askCoachingQuestion('needs_analysis');
}

// Main coaching question function with enhanced backend integration
async function askCoachingQuestion(coachingType = 'general') {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();
    
    if (!question || isProcessing) return;

    isProcessing = true;
    input.value = '';
    
    // Add user message
    addMessage(question, 'user');
    
    // Show loading
    document.getElementById('loading').classList.add('show');
    document.getElementById('askButton').disabled = true;

    try {
        // Call enhanced coaching API endpoint
        const response = await fetch('/api/coaching', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                type: coachingType,
                product: document.getElementById('productSelect')?.value || '',
                customer_type: document.getElementById('customerType')?.value || '',
                context: {
                    session_id: generateSessionId(),
                    previous_topics: Array.from(topicsCovered),
                    performance_history: performanceHistory.slice(-5)
                }
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            addMessage(data.answer, 'bot');
            
            if (data.insights) {
                displayCoachingInsights(data.insights);
            }
            
            if (data.practice_suggestions && data.practice_suggestions.length > 0) {
                displayPracticeSuggestions(data.practice_suggestions);
            }
            
            coachingSessions++;
            updateTopicsCovered(question);
            
            const sessionData = {
                timestamp: new Date().toISOString(),
                type: coachingType,
                question: question,
                quality_score: data.quality_metrics?.confidence_score || 0.7
            };
            performanceHistory.push(sessionData);
            
            saveCoachingHistory();
            updatePerformanceMetrics();
            
        } else {
            addMessage(`Error: ${data.message}`, 'bot');
        }
        
    } catch (error) {
        console.error('Coaching API Error:', error);
        addMessage(`Network error. Using offline coaching mode.`, 'bot');
        
        const fallbackResponse = generateFallbackCoaching(question, coachingType);
        addMessage(fallbackResponse, 'bot');
        
    } finally {
        document.getElementById('loading').classList.remove('show');
        document.getElementById('askButton').disabled = false;
        isProcessing = false;
    }
}

// Enhanced coaching display and helper functions
function displayCoachingInsights(insights) {
    let insightsHTML = `## 🎯 Coaching Insights\n\n**จุดสำคัญที่ต้องเน้น:**\n${insights.key_focus_areas.map(area => `• ${area}`).join('\n')}`;
    addMessage(insightsHTML, 'insights');
}

function displayPracticeSuggestions(suggestions) {
    let suggestionsHTML = `## 💪 คำแนะนำในการฝึกฝน\n\n${suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}`;
    addMessage(suggestionsHTML, 'practice');
}

function generateFallbackCoaching(question, coachingType) {
    const fallbackResponses = {
        'competitive': `## Competitive Analysis Guidance 🏆\n\n**UOB's Core Advantages:**\n- Bank Integration: Seamless banking + insurance\n- Personal RM support vs call centers\n- AA- rating provides customer confidence\n\n*Offline coaching mode*`,
        'objection_handling': `## Objection Handling Framework 💪\n\n**4-Step Process:**\n1. Listen & Acknowledge\n2. Empathize with customer\n3. Educate with benefits\n4. Confirm understanding\n\n*Offline coaching mode*`,
        'general': `## General Coaching 📚\n\n**Excellence Framework:**\n- Prepare thoroughly\n- Build rapport through listening\n- Focus on customer benefits\n\n*Offline coaching mode*`
    };
    return fallbackResponses[coachingType] || fallbackResponses['general'];
}

function generateSessionId() {
    return 'coaching_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveCoachingHistory() {
    const historyData = {
        sessions: coachingSessions,
        topicsCovered: Array.from(topicsCovered),
        performanceHistory: performanceHistory,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('uob_coaching_history', JSON.stringify(historyData));
}

function loadCoachingHistory() {
    const stored = localStorage.getItem('uob_coaching_history');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            coachingSessions = data.sessions || 0;
            topicsCovered = new Set(data.topicsCovered || []);
            performanceHistory = data.performanceHistory || [];
        } catch (e) {
            console.log('Error loading coaching history:', e);
        }
    }
}

function addMessage(content, sender) {
    addMessageWithTimestamp(content, sender, new Date().toLocaleTimeString());
}

function addMessageWithTimestamp(content, sender, timestamp) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    // Enhanced message styling based on sender type
    let messageClass = 'message';
    if (sender === 'insights') {
        messageClass += ' bot insights-message';
    } else if (sender === 'practice') {
        messageClass += ' bot practice-message';
    } else {
        messageClass += ` ${sender}`;
    }
    
    messageDiv.className = messageClass;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Special styling for different message types
    if (sender === 'insights') {
        contentDiv.style.background = '#f0f9ff';
        contentDiv.style.borderColor = '#0284c7';
        contentDiv.style.borderLeft = '4px solid #0284c7';
    } else if (sender === 'practice') {
        contentDiv.style.background = '#f0fdf4';
        contentDiv.style.borderColor = '#16a34a';
        contentDiv.style.borderLeft = '4px solid #16a34a';
    }
    
    // Check if content contains Thai characters
    const hasThaiChars = /[\\u0E00-\\u0E7F]/.test(content);
    if (hasThaiChars) {
        contentDiv.setAttribute('lang', 'th');
    }
    
    // Render Markdown for bot messages, keep plain text for user messages
    if (sender === 'bot' || sender === 'insights' || sender === 'practice') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.textContent = content;
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp; // Use provided timestamp instead of generating new one
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}



function updateTopicsCovered(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('objection') || lowerQuestion.includes('price')) {
        topicsCovered.add('objection_handling');
    }
    if (lowerQuestion.includes('competitive') || lowerQuestion.includes('advantage')) {
        topicsCovered.add('competitive_analysis');
    }
    if (lowerQuestion.includes('young') || lowerQuestion.includes('professional')) {
        topicsCovered.add('target_segments');
    }
    if (lowerQuestion.includes('unit-linked') || lowerQuestion.includes('product')) {
        topicsCovered.add('product_explanation');
    }
}

function updatePerformanceMetrics() {
    const metrics = document.getElementById('performanceMetrics');
    
    // Calculate advanced metrics from performance history
    let avgQuality = 0;
    let improvementTrend = 0;
    let recentTopics = new Set();
    
    if (performanceHistory.length > 0) {
        avgQuality = performanceHistory.reduce((sum, session) => sum + (session.quality_score || 0.7), 0) / performanceHistory.length;
        
        // Calculate improvement trend (last 3 vs first 3 sessions)
        if (performanceHistory.length >= 6) {
            const recent = performanceHistory.slice(-3);
            const early = performanceHistory.slice(0, 3);
            const recentAvg = recent.reduce((sum, s) => sum + s.quality_score, 0) / recent.length;
            const earlyAvg = early.reduce((sum, s) => sum + s.quality_score, 0) / early.length;
            improvementTrend = ((recentAvg - earlyAvg) / earlyAvg * 100);
        }
        
        // Get recent topic variety
        performanceHistory.slice(-5).forEach(session => recentTopics.add(session.type));
    }
    
    // Determine focus areas based on topic coverage and performance
    const improvementAreas = [];
    if (!topicsCovered.has('objection_handling')) improvementAreas.push('Objection Handling');
    if (!topicsCovered.has('competitive_analysis')) improvementAreas.push('Competitive Analysis');
    if (!topicsCovered.has('product_explanation')) improvementAreas.push('Product Explanation');
    if (avgQuality < 0.6) improvementAreas.push('Response Quality');
    
    metrics.innerHTML = `
        <div class=\"metric-item\">
            <span class=\"metric-label\">Coaching Sessions:</span>
            <span class=\"metric-value\">${coachingSessions}</span>
        </div>
        <div class=\"metric-item\">
            <span class=\"metric-label\">Topics Covered:</span>
            <span class=\"metric-value\">${topicsCovered.size}/6</span>
        </div>
        <div class=\"metric-item\">
            <span class=\"metric-label\">Avg Quality:</span>
            <span class=\"metric-value\">${(avgQuality * 100).toFixed(0)}%</span>
        </div>
        <div class=\"metric-item\">
            <span class=\"metric-label\">Improvement:</span>
            <span class=\"metric-value ${improvementTrend > 0 ? 'positive' : 'neutral'}\">
                ${improvementTrend > 0 ? '+' : ''}${improvementTrend.toFixed(0)}%
            </span>
        </div>
        <div class=\"metric-item full-width\">
            <span class=\"metric-label\">Next Focus:</span>
            <span class=\"metric-value\">${improvementAreas.length > 0 ? improvementAreas[0] : 'Well-rounded! 🎉'}</span>
        </div>
    `;
}

function loadPerformanceMetrics() {
    // Initialize metrics display
    updatePerformanceMetrics();
}
