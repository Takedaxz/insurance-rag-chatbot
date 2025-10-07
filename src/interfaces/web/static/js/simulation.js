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
    detailedMetrics: [],
    recentSessions: [],
    skillsHistory: {
        rapport_building: [],
        needs_discovery: [],
        product_knowledge: [],
        objection_handling: [],
        closing_effectiveness: [],
        communication_skills: []
    },
    lastUpdated: null
};

// Enhanced session data management with better caching
function loadSessionData() {
    const stored = localStorage.getItem('uob_simulation_data');
    if (stored) {
        try {
            const parsedData = JSON.parse(stored);
            
            // Validate parsed data
            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error('Invalid data structure');
            }
            
            // Merge with default structure to handle version updates
            sessionData = {
                ...sessionData,
                ...parsedData,
                skillsHistory: {
                    ...sessionData.skillsHistory,
                    ...(parsedData.skillsHistory || {})
                },
                recentSessions: parsedData.recentSessions || [],
                lastUpdated: parsedData.lastUpdated || null
            };
            
            // Validate loaded data
            if (!validateSessionData()) {
                console.warn('Loaded data failed validation, resetting to defaults');
                resetSessionData();
                return;
            }
            
            // Perform data cleanup and migration
            performDataMigration();
            
            updateProgressDisplay();
            updateScoreDashboard();
            
            console.log('Session data loaded successfully:', {
                sessions: sessionData.sessions,
                lastUpdated: sessionData.lastUpdated
            });
            
        } catch (e) {
            console.error('Error loading session data:', e);
            
            // Try to restore from backup
            if (!restoreDataBackup()) {
                // Reset to defaults if backup also fails
                resetSessionData();
            }
        }
    } else {
        console.log('No existing session data found, starting fresh');
        resetSessionData();
    }
}

// Reset session data to initial state
function resetSessionData() {
    sessionData = {
        scores: [],
        sessions: 0,
        totalScore: 0,
        bestScore: 0,
        detailedMetrics: [],
        recentSessions: [],
        skillsHistory: {
            rapport_building: [],
            needs_discovery: [],
            product_knowledge: [],
            objection_handling: [],
            closing_effectiveness: [],
            communication_skills: []
        },
        lastUpdated: null
    };
    saveSessionData();
}

// Data migration for handling version updates
function performDataMigration() {
    let migrationPerformed = false;
    
    // Migration for v1.0 -> v1.1: Ensure all skill histories exist
    const requiredSkills = ['rapport_building', 'needs_discovery', 'product_knowledge', 'objection_handling', 'closing_effectiveness', 'communication_skills'];
    
    requiredSkills.forEach(skill => {
        if (!sessionData.skillsHistory[skill]) {
            sessionData.skillsHistory[skill] = [];
            migrationPerformed = true;
        }
    });
    
    // Migration for ensuring proper data types
    if (typeof sessionData.sessions !== 'number') {
        sessionData.sessions = parseInt(sessionData.sessions) || 0;
        migrationPerformed = true;
    }
    
    if (typeof sessionData.totalScore !== 'number') {
        sessionData.totalScore = parseFloat(sessionData.totalScore) || 0;
        migrationPerformed = true;
    }
    
    if (typeof sessionData.bestScore !== 'number') {
        sessionData.bestScore = parseFloat(sessionData.bestScore) || 0;
        migrationPerformed = true;
    }
    
    // Migration for cleaning up invalid scores
    if (Array.isArray(sessionData.scores)) {
        const originalLength = sessionData.scores.length;
        sessionData.scores = sessionData.scores.filter(score => 
            typeof score === 'number' && score >= 0 && score <= 100 && !isNaN(score)
        );
        
        if (sessionData.scores.length !== originalLength) {
            // Recalculate sessions and total score
            sessionData.sessions = sessionData.scores.length;
            sessionData.totalScore = sessionData.scores.reduce((a, b) => a + b, 0);
            sessionData.bestScore = sessionData.scores.length > 0 ? Math.max(...sessionData.scores) : 0;
            migrationPerformed = true;
        }
    }
    
    if (migrationPerformed) {
        console.log('Data migration performed');
        saveSessionData();
    }
}

// Enhanced save with data validation and compression
function saveSessionData() {
    try {
        // Create backup before saving new data
        createDataBackup();
        
        // Update timestamp
        sessionData.lastUpdated = new Date().toISOString();
        
        // Validate data integrity
        if (!validateSessionData()) {
            console.warn('Session data validation failed, attempting to restore from backup');
            if (restoreDataBackup()) {
                console.log('Data restored from backup successfully');
                return;
            }
        }
        
        // Keep only last 50 sessions for performance
        if (sessionData.detailedMetrics.length > 50) {
            sessionData.detailedMetrics = sessionData.detailedMetrics.slice(-50);
        }
        
        // Keep only last 20 recent sessions for dashboard
        if (sessionData.recentSessions.length > 20) {
            sessionData.recentSessions = sessionData.recentSessions.slice(-20);
        }
        
        // Keep only last 20 entries per skill for history
        Object.keys(sessionData.skillsHistory).forEach(skill => {
            if (sessionData.skillsHistory[skill].length > 20) {
                sessionData.skillsHistory[skill] = sessionData.skillsHistory[skill].slice(-20);
            }
        });
        
        localStorage.setItem('uob_simulation_data', JSON.stringify(sessionData));
        console.log('Session data saved successfully at:', sessionData.lastUpdated);
        
    } catch (e) {
        console.error('Error saving session data:', e);
        // Try to restore from backup
        if (restoreDataBackup()) {
            console.log('Fallback: Data restored from backup after save failure');
        }
    }
}

// Data validation function
function validateSessionData() {
    try {
        // Check basic structure
        if (!sessionData || typeof sessionData !== 'object') return false;
        
        // Check required fields
        const requiredFields = ['scores', 'sessions', 'totalScore', 'bestScore', 'detailedMetrics', 'recentSessions', 'skillsHistory'];
        for (const field of requiredFields) {
            if (!(field in sessionData)) return false;
        }
        
        // Check data types
        if (!Array.isArray(sessionData.scores)) return false;
        if (typeof sessionData.sessions !== 'number') return false;
        if (typeof sessionData.totalScore !== 'number') return false;
        if (typeof sessionData.bestScore !== 'number') return false;
        if (!Array.isArray(sessionData.detailedMetrics)) return false;
        if (!Array.isArray(sessionData.recentSessions)) return false;
        if (typeof sessionData.skillsHistory !== 'object') return false;
        
        // Check consistency
        if (sessionData.scores.length !== sessionData.sessions) {
            console.warn('Score array length does not match sessions count');
            // Try to fix automatically
            sessionData.sessions = sessionData.scores.length;
            sessionData.totalScore = sessionData.scores.reduce((a, b) => a + b, 0);
        }
        
        // Check for valid score ranges
        const invalidScores = sessionData.scores.filter(score => score < 0 || score > 100 || isNaN(score));
        if (invalidScores.length > 0) {
            console.warn('Invalid scores found:', invalidScores);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Data validation error:', error);
        return false;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    generateDynamicWelcomeMessage();
    loadSessionData();
    // Remove continuous time updates - timestamps are now fixed when messages are created
    
    // Initialize score dashboard with empty state
    updateScoreDashboard();
});

function generateDynamicWelcomeMessage() {
    const welcomeMessages = [
        {
            greeting: "ยินดีต้อนรับสู่สภาพแวดล้อมการจำลองและฝึกอบรมขั้นสูง!",
            intro: "ที่นี่คุณจะได้ฝึกการปฏิสัมพันธ์กับลูกค้าแบบสมจริง นี่คือการทำงาน:",
            features: [
                "<strong>สร้างสถานการณ์ของคุณ:</strong> เลือกจากหลากหลายสถานการณ์ที่หลากหลาย",
                "<strong>ลูกค้าเสมือนจริง AI:</strong> ฉันจะแสดงเป็นลูกค้าที่มีบุคลิกภาพที่หลากหลาย",
                "<strong>ผลป้อนกลับแบบทันที:</strong> คะแนนและข้อเสนอแนะอัปเดตแบบเรียลไทม์",
                "<strong>การติดตามความก้าวหน้า:</strong> ระบบติดตามผลการปฏิบัติงานของคุณ"
            ],
            tip: "เริ่มได้เลย: เลือกสถานการณ์แล้วคลิก 'เริ่มการจำลอง' เพื่อเริ่มฝึกการขาย!"
        },
        {
            greeting: "สวัสดีครับ! เตรียมพร้อมที่จะกลายเป็น RM มืออาชีพแล้วหรือยัง?",
            intro: "ศูนย์การฝึกอบรมแห่งนี้จะทำให้คุณเตรียมพร้อมสำหรับ:",
            features: [
                "<strong>สถานการณ์แบบสมจริง:</strong> ลูกค้าใหม่ คัดค้าน ครอบครัวซับซ้อน",
                "<strong>AI ที่ฉลาดและตอบสนอง:</strong> พฤติกรรมและการตอบสนองแบบจริง",
                "<strong>คำแนะนำและคะแนนทันที:</strong> ปรับปรุงทักษะของคุณในทันที",
                "<strong>รายงานผลการปฏิบัติงาน:</strong> เปรียบเทียบคะแนนและการพัฒนา"
            ],
            tip: "เคล็ดลับ: ใช้ปุ่มด่วนเพื่อการฝึกแบบไว หรือเลือกสถานการณ์แล้วเริ่มการจำลอง"
        },
        {
            greeting: "RM มือใหม่! พร้อมที่จะเข้าสู่สนามการฝึก?",
            intro: "ก่อนเข้าสู่สนามจริง มาเตรียมตัวกับ:",
            features: [
                "<strong>ชาเลนจ์ระดับเซียน:</strong> สถานการณ์ที่ท้าทายและซับซ้อน",
                "<strong>บทบาทแบบสมจริง:</strong> ลูกค้า AI ที่เหมือนจริงทุกประการ",
                "<strong>แผนการพัฒนาส่วนตัว:</strong> เส้นทางการพัฒนาทักษะที่ชัดเจน",
                "<strong>ความมั่นใจและความสำเร็จ:</strong> ลูกค้าจะเชื่อใจคุณมากขึ้น!"
            ],
            tip: "เทคนิคขั้นสูง: รวมสถานการณ์หลายแบบ ฝึกกับ AI และได้ feedback แบบ real-time!"
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
        'new_customer': 'พบลูกค้าใหม่',
        'objection_handling': 'จัดการความคัดค้าน',
        'complex_family': 'ครอบครัวซับซ้อน',
        'cross_selling': 'โอกาสขายเพิ่มเติม',
        'product_explanation': 'นำเสนอผลิตภัณฑ์',
        'high_net_worth': 'ลูกค้า High Net Worth',
        'young_professional': 'วัยทำงานยุคใหม่',
        'senior_planning': 'การเตรียมพร้อมเกษียณ',
        'business_owner': 'เจ้าของธุรกิจ',
        'crisis_situation': 'สถานการณ์วิกฤติ',
        'investment_focused': 'มุ่งเน้นการลงทุน'
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
            customer_name: 'คุณอเล็กซ์ เฉิน',
            background: 'วัยทำงานยุคใหม่ อายุ 28 ปี ทำงานในสายไอที',
            initial_message: "สวัสดีครับ ผม อเล็กซ์ ครับ ผมกำลังคิดจะทำประกันแต่ไม่แน่ใจว่าควรเลือกแบบไหน เพื่อนแนะนำให้มาคุยกับ UOB ครับ ช่วยแนะนำหน่อยได้ไหมครับ?"
        },
        'objection_handling': {
            customer_name: 'คุณซาร่า วงษ์',
            background: 'ผู้จัดการระดับกลาง อายุ 35 ปี ใส่ใจเรื่องค่าใช้จ่าย',
            initial_message: "ดิฉันดูประกันมาหลายที่แล้วค่ะ รู้สึกว่าราคาแพงหมดเลย เห็นที่อื่นมีราคาถูกกว่า ทำไมต้องเลือก UOB ที่ราคาแพงกว่าล่ะคะ?"
        },
        'complex_family': {
            customer_name: 'คุณประเสริฐ ตันติวงศ์',
            background: 'พ่อครอบครัว อายุ 42 ปี มีลูก 3 คน ภรรยาไม่ได้ทำงาน',
            initial_message: "ผมมีครอบครัวใหญ่ ลูก 3 คน อายุต่างกันเยอะ ภรรยาดูแลบ้าน ต้องการประกันที่ครอบคลุมทุกคนในครอบครัว แต่งบประมาณก็จำกัด ช่วยแนะนำหน่อยครับ"
        },
        'cross_selling': {
            customer_name: 'คุณมนัสวี ศรีนวล',
            background: 'ลูกค้าเก่า UOB มีประกันชีวิตพื้นฐานแล้ว อายุ 38 ปี',
            initial_message: "ดิฉันมีประกันชีวิตกับ UOB อยู่แล้วค่ะ แต่เพิ่งได้เลื่อนตำแหน่ง รายได้ดีขึ้น คิดว่าน่าจะเพิ่มความคุ้มครองเพิ่มเติม มีอะไรแนะนำบ้างคะ?"
        },
        'high_net_worth': {
            customer_name: 'คุณรัฐพงษ์ เศรษฐกุล',
            background: 'นักธุรกิจมั่งคั่ง อายุ 45 ปี ทรัพย์สินมาก ต้องการบริการพิเศษ',
            initial_message: "ผมเป็นลูกค้า Private Banking ของ UOB อยู่แล้ว ต้องการประกันที่เหมาะกับสถานะและทรัพย์สิน ต้องการความคุ้มครองระดับสูง บริการต้องเป็นเลิศ"
        },
        'young_professional': {
            customer_name: 'คุณนิชา เจนเนอเรชั่น',
            background: 'Gen Z อายุ 25 ปี เพิ่งเริ่มทำงาน ชอบเทคโนโลยี',
            initial_message: "ฮัลโหล~ ชื่อนิชาค่ะ เพิ่งจบมหาลัย เริ่มทำงานได้ปีนึง อยากมีประกันแต่ยังไม่รู้จะเลือกยังไง ต้องการแบบที่ยืดหยุ่น จัดการผ่านแอพได้ด้วย"
        },
        'senior_planning': {
            customer_name: 'คุณสมชาย วัยเกษียณ',
            background: 'ใกล้เกษียณ อายุ 58 ปี ต้องการความมั่นคงทางการเงิน',
            initial_message: "ผมอีก 2 ปีจะเกษียณแล้ว ต้องการวางแผนการเงินให้มั่นคง มีเงินออมบ้าง อยากได้ประกันที่ให้ผลตอบแทนและคุ้มครองด้วย"
        },
        'business_owner': {
            customer_name: 'คุณสุธีรา เอนเตอร์ไพรส์',
            background: 'เจ้าของร้านอาหาร อายุ 40 ปี มีพนักงาน 15 คน',
            initial_message: "ดิฉันเปิดร้านอาหารมา 5 ปีแล้ว ตอนนี้มีพนักงาน 15 คน อยากจะทำประกันกลุ่มให้พนักงาน และประกันธุรกิจด้วย งบประมาณประมาณเท่าไหร่คะ?"
        },
        'crisis_situation': {
            customer_name: 'คุณวิไล ช่วยเหลือ',
            background: 'ภรรยา อายุ 35 ปี สามีเพิ่งเสียชีวิต มีลูก 2 คน',
            initial_message: "ดิฉัน... สามีดิฉันเพิ่งเสียชีวิตไป มีลูก 2 คน ต้องเลี้ยงคนเดียว อยากรู้ว่าประกันที่สามีทำไว้จะช่วยอะไรได้บ้าง และดิฉันควรทำอะไรเพิ่มเติม"
        },
        'investment_focused': {
            customer_name: 'คุณธนพล นักลงทุน',
            background: 'นักลงทุนมืออาชีพ อายุ 33 ปี รู้เรื่องการเงิน',
            initial_message: "ผมลงทุนหุ้น กองทุน อสังหาฯ อยู่แล้ว แต่อยากเพิ่ม unit link หรือประกันแบบลงทุนเข้าไปในพอร์ต ช่วยเปรียบเทียบผลิตภัณฑ์ให้หน่อยครับ"
        }
    };
    return scenarios[currentScenario] || scenarios['new_customer'];
}

// Add the missing initializeScenario function
function initializeScenario(scenarioData) {
    // Add scenario introduction message
    const introMessage = `**Scenario Started: ${getScenarioName(currentScenario)}**\n\n` +
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

// Fallback customer response generation for offline mode
function generateCustomerResponse(userResponse) {
    const responses = {
        'new_customer': [
            "ขอบคุณที่อธิบายครับ แต่ผมยังไม่แน่ใจ มีอะไรแนะนำสำหรับคนอายุเท่าผมบ้างครับ?",
            "เข้าใจแล้วครับ แต่เรื่องราคาเป็นอย่างไรบ้างครับ?",
            "โอเค ขอถามเพิ่มหน่อยได้ไหมครับ ผมควรเริ่มจากไหนดี?"
        ],
        'objection_handling': [
            "แต่ราคาก็ยังแพงอยู่นะคะ จริงๆ แล้วแตกต่างจากที่อื่นยังไง?",
            "ฟังแล้วดีนะคะ แต่ถ้าเปรียบเทียบกับออนไลน์แล้วล่ะ?",
            "อืม... ยังไม่แน่ใจ มีส่วนลดหรือโปรโมชั่นไหมคะ?"
        ],
        'high_net_worth': [
            "เข้าใจครับ สำหรับ portfolio ของผม ท่านแนะนำอย่างไรครับ?",
            "บริการนี้น่าสนใจ แต่ผมต้องการข้อมูลเพิ่มเติมเรื่อง tax planning ครับ",
            "ดีครับ ผมอยากทราบเรื่อง estate planning ด้วยครับ"
        ]
    };
    
    // Get appropriate responses or default
    const scenarioResponses = responses[currentScenario] || responses['new_customer'];
    const randomResponse = scenarioResponses[Math.floor(Math.random() * scenarioResponses.length)];
    
    // Simulate some delay and add response
    setTimeout(() => {
        addMessage(randomResponse, 'customer');
        
        // Store in conversation history
        conversationHistory.push({
            turn: turnCount,
            customer_message: randomResponse,
            timestamp: new Date().toISOString()
        });
    }, 1500 + Math.random() * 1000); // Random delay 1.5-2.5 seconds
}

function displayRealTimeFeedback(feedback) {
    let feedbackHTML = `## Real-time Feedback\n\n`;
    
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
        // Show loading indicator for automatic end
        const loadingElement = document.getElementById('loading');
        const loadingText = loadingElement.querySelector('p');
        loadingText.textContent = 'เวลาหมดแล้ว! กำลังวิเคราะห์ผลการปฏิบัติงาน...';
        loadingElement.classList.add('show');
        
        // Disable the end button during processing
        const endBtn = document.getElementById('endSimBtn');
        if (endBtn) {
            endBtn.disabled = true;
            endBtn.style.opacity = '0.6';
            endBtn.style.cursor = 'not-allowed';
        }
        
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
            // Show loading indicator immediately
            const loadingElement = document.getElementById('loading');
            const loadingText = loadingElement.querySelector('p');
            loadingText.textContent = 'กำลังวิเคราะห์ผลการปฏิบัติงานและสร้างรายงาน...';
            loadingElement.classList.add('show');
            
            // Disable the end button during processing
            const endBtn = document.getElementById('endSimBtn');
            endBtn.disabled = true;
            endBtn.style.opacity = '0.6';
            endBtn.style.cursor = 'not-allowed';
            
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
    } finally {
        // Always hide loading indicator when done
        const loadingElement = document.getElementById('loading');
        loadingElement.classList.remove('show');
        
        // Reset loading text for future use
        const loadingText = loadingElement.querySelector('p');
        loadingText.textContent = 'กำลังจำลอง...';
    }
    
    // Reset UI
    resetSimulationUI();
}

// Enhanced performance feedback and analytics functions
function displayEnhancedPerformanceFeedback(performanceData) {
    const { overall_score, detailed_metrics, feedback, improvement_plan, comparative_analysis } = performanceData;
    
    let performance = 'ต้องปรับปรุง';
    if (overall_score >= 85) performance = 'ยอดเยี่ยม';
    else if (overall_score >= 75) performance = 'ดี';
    else if (overall_score >= 60) performance = 'พอใช้';
    
    // Helper function to clean content from markdown/HTML artifacts
    function cleanContent(text) {
        if (!text) return '';
        return String(text)
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold** markdown
            .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* markdown
            .replace(/###\s*\d+\.\s*/g, '')  // Remove ### 3. prefixes
            .replace(/###\s*/g, '')          // Remove ### headers
            .replace(/##\s*/g, '')           // Remove ## headers
            .replace(/#\s*[\u0E00-\u0E7F\w\s]+/g, '') // Remove # Thai/English headers
            .replace(/\*+/g, '')             // Remove stray asterisks
            .replace(/^[\-\*\+\•\◦\→\⁃\.\)\]\}\>\s]+/gm, '') // Remove bullet points and numbering
            .replace(/\s+/g, ' ')            // Normalize whitespace
            .replace(/^\s*$/gm, '')          // Remove empty lines
            .trim();                         // Remove leading/trailing space
    }
    
    // Create clean HTML content with proper structure
    let htmlContent = `
        <div class="performance-report">
            <h2 style="color: #16a34a; text-align: center; margin-bottom: 1rem;">📊 รายงานผลการปฏิบัติงานแบบครอบคลุม</h2>
            <hr style="border: 2px solid #dcfce7; margin: 1rem 0;">
            
            <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #16a34a;">
                <h3 style="color: #15803d; margin-bottom: 0.5rem;">🎯 ผลการปฏิบัติงานโดยรวม</h3>
                <p><strong>คะแนน:</strong> <span style="color: #16a34a; font-weight: bold; font-size: 1.1rem;">${overall_score}/100</span> (${performance})</p>
                <p><strong>ระยะเวลาการฝึก:</strong> ${((new Date() - simulationStartTime) / 1000 / 60).toFixed(1)} นาที</p>
                <p><strong>ปฏิสัมพันธ์กับลูกค้า:</strong> ${turnCount} ครั้ง</p>
            </div>`;
    
    // Add Workflow Checklist (Mock version based on workflow.txt)
    htmlContent += `
        <div style="background: #eff6ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-bottom: 0.5rem;">✅ รายการตรวจสอบตามขั้นตอนการนำเสนอ (Workflow Checklist)</h3>
            <div style="font-size: 0.9rem;">
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">1. การแนะนำตัวและแนะนำผลิตภัณฑ์</div>
                    <div style="padding-left: 1rem;">
                        ${Math.random() > 0.3 ? '✅' : '❌'} แนะนำชื่อ-นามสกุล และตำแหน่ง<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} แสดงบัตรพนักงานและใบอนุญาต<br>
                        ${Math.random() > 0.5 ? '✅' : '❌'} แนะนำว่าเป็น "ผลิตภัณฑ์ประกันชีวิต"
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">2. การสอบถามข้อมูล KYC</div>
                    <div style="padding-left: 1rem;">
                        ${Math.random() > 0.3 ? '✅' : '❌'} ตรวจสอบอายุและประสบการณ์<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} สอบถามวัตถุประสงค์ในการซื้อ<br>
                        ${Math.random() > 0.5 ? '✅' : '❌'} ตรวจสอบว่าเป็นลูกค้าเปราะบางหรือไม่
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">3. การวิเคราะห์ความต้องการ (4C)</div>
                    <div style="padding-left: 1rem;">
                        ${Math.random() > 0.3 ? '✅' : '❌'} สอบถามเป้าหมายการลงทุน<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} สอบถามรายได้และค่าใช้จ่าย<br>
                        ${Math.random() > 0.5 ? '✅' : '❌'} ตรวจสอบการคุ้มครองที่มีอยู่เดิม<br>
                        ${Math.random() > 0.6 ? '✅' : '❌'} แนะนำผลิตภัณฑ์มากกว่า 2-3 ตัวเลือก
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">4. สิทธิของผู้บริโภค</div>
                    <div style="padding-left: 1rem;">
                        ${Math.random() > 0.3 ? '✅' : '❌'} แจ้งสิทธิในการเลือกซื้ออย่างอิสระ<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} แจ้งช่องทางร้องเรียน (Call Center 02-285-1555)
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">5. การแนะนำผลิตภัณฑ์</div>
                    <div style="padding-left: 1rem;">
                        ${Math.random() > 0.3 ? '✅' : '❌'} ย้ำว่า "ประกันชีวิต" ไม่ใช่เงินฝาก<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} อธิบายสิทธิประโยชน์ตามเพศและอายุ<br>
                        ${Math.random() > 0.5 ? '✅' : '❌'} อธิบายข้อยกเว้น (บอกล้าง, ฆ่าตัวตาย, ฯลฯ)<br>
                        ${Math.random() > 0.6 ? '✅' : '❌'} แจ้งเบี้ยประกันและระยะเวลาชำระ<br>
                        ${Math.random() > 0.7 ? '✅' : '❌'} อธิบาย Free Look Period (15 วัน)<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} แจ้งช่องทางติดต่อ (PRU Call Center 1621)
                    </div>
                </div>
                
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">6. การสื่อสารและมารยาท</div>
                    <div style="padding-left: 1rem;">
                        ${Math.random() > 0.3 ? '✅' : '❌'} แนะนำอย่างสุภาพ ไม่เร่งรัด<br>
                        ${Math.random() > 0.4 ? '✅' : '❌'} ห้ามขายทางโทรศัพท์<br>
                        ${Math.random() > 0.5 ? '✅' : '❌'} มอบเอกสารให้ลูกค้า (แบบประกัน, PRU QUOTE, แผ่นพับ)
                    </div>
                </div>
            </div>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #bfdbfe; font-size: 0.85rem; color: #1e40af;">
                <strong>หมายเหตุ:</strong> ✅ = ผ่าน | ❌ = ต้องปรับปรุง (นี่คือโหมดทดสอบ - คะแนนสุ่ม)
            </div>
        </div>`;
    
    // Add detailed metrics
    if (detailed_metrics) {
        htmlContent += `<h3 style="color: #15803d;">📈 ตัวชี้วัดละเอียด</h3><div style="display: grid; gap: 0.5rem; margin-bottom: 1rem;">`;
        
        const metricNames = {
            'rapport_building': 'การสร้างความสัมพันธ์',
            'needs_discovery': 'การค้นหาความต้องการ', 
            'product_knowledge': 'ความรู้ผลิตภัณฑ์',
            'objection_handling': 'การจัดการความคัดค้าน',
            'communication_skills': 'ทักษะการสื่อสาร',
            'closing_effectiveness': 'ความสามารถในการปิดการขาย'
        };
        
        Object.entries(detailed_metrics).forEach(([metric, score]) => {
            const emoji = score >= 80 ? '🌟' : score >= 70 ? '👍' : '📚';
            // Use metricNames mapping, but fallback to displayName if not found
            let displayName = metricNames[metric];
            if (!displayName) {
                // Convert snake_case to readable format as fallback
                displayName = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                console.warn(`Missing Thai translation for metric: ${metric}`);
            }
            htmlContent += `<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;"><span>${emoji} <strong>${displayName}</strong></span><span style="font-weight: bold;">${Math.round(score)}/100</span></div>`;
        });
        htmlContent += `</div>`;
    }
    
    // Add feedback sections
    if (feedback) {
        if (feedback.strengths && feedback.strengths.length > 0) {
            htmlContent += `<h3 style="color: #15803d;"> จุดแข็งหลัก</h3><ol>`;
            feedback.strengths.forEach(strength => {
                // Clean and sanitize content to remove any markdown or HTML
                const cleanStrength = cleanContent(strength);
                if (cleanStrength && cleanStrength.length > 3) {
                    htmlContent += `<li style="margin-bottom: 0.5rem;">${cleanStrength}</li>`;
                }
            });
            htmlContent += `</ol>`;
        }
        
        if (feedback.improvements && feedback.improvements.length > 0) {
            htmlContent += `<h3 style="color: #15803d;"> จุดที่ควรปรับปรุง</h3><ol>`;
            feedback.improvements.forEach(improvement => {
                // Clean and sanitize content to remove any markdown or HTML
                const cleanImprovement = cleanContent(improvement);
                if (cleanImprovement && cleanImprovement.length > 3) {
                    htmlContent += `<li style="margin-bottom: 0.5rem;">${cleanImprovement}</li>`;
                }
            });
            htmlContent += `</ol>`;
        }
    }
    
    // Add improvement plan
    if (improvement_plan && improvement_plan.length > 0) {
        htmlContent += `<h3 style="color: #15803d;">🎯 แผนปฏิบัติการ</h3><ol>`;
        improvement_plan.forEach(action => {
            // Clean and sanitize content to remove any markdown or HTML
            const cleanAction = cleanContent(action);
            if (cleanAction && cleanAction.length > 3) {
                htmlContent += `<li style="margin-bottom: 0.5rem;">${cleanAction}</li>`;
            }
        });
        htmlContent += `</ol>`;
    }
    
    // Add comparison
    if (comparative_analysis && comparative_analysis.vs_average) {
        const diff = comparative_analysis.vs_average;
        const indicator = diff > 0 ? '📈' : '📉';
        const status = diff > 0 ? 'สูงกว่า' : 'ต่ำกว่า';
        htmlContent += `<h3 style="color: #15803d;">📊 การเปรียบเทียบมาตรฐาน</h3><p>${indicator} เทียบกับค่าเฉลี่ย: <strong>${status} ${Math.abs(diff.toFixed(1))} คะแนน</strong></p>`;
    }
    
    htmlContent += `<hr style="border: 2px solid #dcfce7; margin: 1rem 0;"><div style="text-align: center; color: #16a34a;"><p>💡 <em>ฝึกฝนต่อไปเพื่อพัฒนาทักษะของคุณ!</em></p><p>🚀 <em>ความสำเร็จอยู่ในการฝึกฝนอย่างสม่ำเสมอ</em></p></div></div>`;
    
    // Add message with HTML content
    addMessageWithHTML(htmlContent, 'performance');
}

function updateSessionData(performanceData) {
    // Update session statistics
    sessionData.sessions++;
    sessionData.scores.push(performanceData.overall_score);
    sessionData.totalScore += performanceData.overall_score;
    if (performanceData.overall_score > sessionData.bestScore) {
        sessionData.bestScore = performanceData.overall_score;
    }
    
    // Store detailed metrics with enhanced data
    const sessionRecord = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        scenario: currentScenario,
        overall_score: performanceData.overall_score,
        detailed_metrics: performanceData.detailed_metrics,
        turn_count: turnCount,
        duration: (new Date() - simulationStartTime) / 1000 / 60, // in minutes
        difficulty: document.getElementById('difficultyLevel')?.value || 'intermediate',
        personality: document.getElementById('customerPersonality')?.value || 'friendly'
    };
    
    sessionData.detailedMetrics.push(sessionRecord);
    
    // Update skills history for dashboard
    if (performanceData.detailed_metrics) {
        Object.entries(performanceData.detailed_metrics).forEach(([skill, score]) => {
            if (!sessionData.skillsHistory[skill]) {
                sessionData.skillsHistory[skill] = [];
            }
            sessionData.skillsHistory[skill].push({
                score: score,
                timestamp: new Date().toISOString(),
                session_id: sessionId
            });
        });
    }
    
    // Update recent sessions for dashboard
    const recentSession = {
        id: sessionId,
        scenario: getScenarioName(currentScenario),
        score: performanceData.overall_score,
        date: new Date().toISOString(),
        duration: sessionRecord.duration
    };
    
    sessionData.recentSessions.unshift(recentSession); // Add to beginning
    
    saveSessionData();
    updateProgressDisplay();
    updateScoreDashboard();
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
        rapport_building: Math.round(70 + Math.random() * 20),
        needs_discovery: Math.round(65 + Math.random() * 25),
        product_knowledge: Math.round(75 + Math.random() * 20),
        objection_handling: Math.round(68 + Math.random() * 22),
        communication_skills: Math.round(72 + Math.random() * 18),
        closing_effectiveness: Math.round(70 + Math.random() * 20)
    };
}

function generateLocalFeedback(score) {
    const strengths = [
        'รูปแบบการสื่อสารที่เป็นมืออาชีพ',
        'แสดงการฟังอย่างตั้งใจ',
        'เทคนิคการถามคำถามที่ดี'
    ];
    
    const improvements = score < 70 ? [
        'โฟกัสการสร้างความสัมพันธ์ตั้งแต่เริ่มต้น',
        'ถามคำถามเพื่อค้นหาให้มากขึ้น',
        'ฝึกฝนการจัดการความคัดค้าน'
    ] : [
        'พัฒนาเทคนิคการปิดการขาย',
        'เพิ่มความรู้ลึกเกี่ยวกับผลิตภัณฑ์'
    ];
    
    return { strengths, improvements, overall_rating: score >= 75 ? 'ดี' : 'ต้องปรับปรุง' };
}

function resetSimulationUI() {
    document.getElementById('questionInput').disabled = true;
    document.getElementById('sendButton').disabled = true;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('suggestions').style.display = 'flex';
    document.getElementById('simControlsActive').style.display = 'none';
    
    // Re-enable and reset the end simulation button
    const endBtn = document.getElementById('endSimBtn');
    if (endBtn) {
        endBtn.disabled = false;
        endBtn.style.opacity = '1';
        endBtn.style.cursor = 'pointer';
    }
    
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
    addMessageWithTimestamp(content, sender, new Date().toLocaleTimeString());
}

// New function to add HTML content directly without markdown parsing
function addMessageWithHTML(htmlContent, sender) {
    addMessageWithTimestampHTML(htmlContent, sender, new Date().toLocaleTimeString());
}

function addMessageWithTimestampHTML(htmlContent, sender, timestamp) {
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
        contentDiv.style.padding = '1.5rem';
        contentDiv.style.borderRadius = '12px';
        contentDiv.style.lineHeight = '1.6';
        contentDiv.style.fontSize = '0.95rem';
        contentDiv.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.1)';
    }
    
    // Set HTML content directly
    contentDiv.innerHTML = htmlContent;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp;
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageWithTimestamp(content, sender, timestamp) {
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
        content = `**Customer:** ${content}`;
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
        contentDiv.style.padding = '1.5rem';
        contentDiv.style.borderRadius = '12px';
        contentDiv.style.lineHeight = '1.6';
        contentDiv.style.fontSize = '0.95rem';
        contentDiv.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.1)';
    }
    
    // Render Markdown for bot messages, keep plain text for user messages
    if (sender === 'bot' || sender === 'system' || sender === 'customer' || sender === 'feedback' || sender === 'performance' || sender === 'scenario') {
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

// Enhanced Score Dashboard Update Function
function updateScoreDashboard() {
    updatePerformanceChart();
    updateSkillMeters();
    updateRecentSessions();
}

// Performance Chart Function
function updatePerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    const placeholder = document.getElementById('chartPlaceholder');
    
    if (sessionData.scores.length < 3) {
        canvas.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
    }
    
    canvas.style.display = 'block';
    placeholder.style.display = 'none';
    
    const ctx = canvas.getContext('2d');
    const scores = sessionData.scores.slice(-10); // Last 10 sessions
    const labels = scores.map((_, index) => `${scores.length - index}`);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        // Y-axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Noto Sans Thai';
        ctx.textAlign = 'right';
        const value = 100 - (i * 25);
        ctx.fillText(value.toString(), padding - 5, y + 3);
    }
    
    // Draw line chart
    if (scores.length > 0) {
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        scores.forEach((score, index) => {
            const x = padding + (chartWidth / (scores.length - 1)) * index;
            const y = padding + chartHeight - (score / 100) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#16a34a';
        scores.forEach((score, index) => {
            const x = padding + (chartWidth / (scores.length - 1)) * index;
            const y = padding + chartHeight - (score / 100) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    // Chart title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Noto Sans Thai';
    ctx.textAlign = 'center';
    ctx.fillText('แนวโน้มคะแนนล่าสุด', canvas.width / 2, 20);
}

// Skill Meters Update Function
function updateSkillMeters() {
    const skillMapping = {
        'rapport_building': { element: 'rapport', name: 'การสร้างความสัมพันธ์' },
        'needs_discovery': { element: 'needs', name: 'การค้นหาความต้องการ' },
        'product_knowledge': { element: 'product', name: 'ความรู้ผลิตภัณฑ์' },
        'objection_handling': { element: 'objection', name: 'การจัดการความคัดค้าน' },
        'closing_effectiveness': { element: 'closing', name: 'ความสามารถในการปิดการขาย' },
        'communication_skills': { element: 'communication', name: 'ทักษะการสื่อสาร' }
    };
    
    Object.entries(skillMapping).forEach(([skill, config]) => {
        const scoreElement = document.getElementById(`${config.element}_score`);
        const progressElement = document.getElementById(`${config.element}_progress`);
        
        if (scoreElement && progressElement) {
            const skillHistory = sessionData.skillsHistory[skill] || [];
            
            if (skillHistory.length > 0) {
                // Get latest score
                const latestScore = skillHistory[skillHistory.length - 1].score;
                scoreElement.textContent = `${Math.round(latestScore)}/100`;
                progressElement.style.width = `${latestScore}%`;
                
                // Add trend indicator
                if (skillHistory.length >= 2) {
                    const prevScore = skillHistory[skillHistory.length - 2].score;
                    const trend = latestScore - prevScore;
                    const trendText = trend > 0 ? ` ↗` : trend < 0 ? ` ↘` : ` →`;
                    scoreElement.textContent += trendText;
                }
            } else {
                scoreElement.textContent = '-';
                progressElement.style.width = '0%';
            }
        }
    });
}

// Recent Sessions Update Function
function updateRecentSessions() {
    const sessionsList = document.getElementById('recentSessionsList');
    
    if (sessionData.recentSessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="no-sessions">
                <p>ยังไม่มีการจำลอง</p>
                <small>เริ่มการจำลองเพื่อดูประวัติ</small>
            </div>
        `;
        return;
    }
    
    const sessionsHtml = sessionData.recentSessions.slice(0, 10).map(session => {
        const date = new Date(session.date);
        const scoreClass = session.score >= 85 ? 'excellent' : 
                          session.score >= 75 ? 'good' : 
                          session.score >= 60 ? 'average' : 'poor';
        
        return `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-scenario">${session.scenario}</div>
                    <div class="session-date">${date.toLocaleDateString('th-TH')} ${date.toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div class="session-score ${scoreClass}">${Math.round(session.score)}/100</div>
            </div>
        `;
    }).join('');
    
    sessionsList.innerHTML = sessionsHtml;
}

function showProgress() {
    if (sessionData.sessions === 0) {
        addMessage('กรุณาทำการจำลองอย่างน้อย 1 ครั้งก่อนเพื่อดูรายงานความก้าวหน้า', 'system');
        return;
    }
    
    // Enhanced progress analytics
    const avgScore = Math.round(sessionData.totalScore / sessionData.sessions);
    const recentScores = sessionData.scores.slice(-5);
    const recentAvg = recentScores.length > 0 ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) : 0;
    
    // Calculate skill averages
    const skillAverages = {};
    Object.entries(sessionData.skillsHistory).forEach(([skill, history]) => {
        if (history.length > 0) {
            const avg = history.reduce((sum, entry) => sum + entry.score, 0) / history.length;
            skillAverages[skill] = Math.round(avg);
        }
    });
    
    // Performance trend analysis
    let trendText = 'มีความคงที่';
    if (sessionData.scores.length >= 3) {
        const firstHalf = sessionData.scores.slice(0, Math.floor(sessionData.scores.length / 2));
        const secondHalf = sessionData.scores.slice(Math.floor(sessionData.scores.length / 2));
        
        if (firstHalf.length > 0 && secondHalf.length > 0) {
            const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            const improvement = secondHalfAvg - firstHalfAvg;
            
            if (improvement > 5) trendText = 'มีการพัฒนาขึ้นอย่างชัดเจน 📈';
            else if (improvement < -5) trendText = 'ต้องการการปรับปรุง 📉';
            else trendText = 'มีความคงที่ →';
        }
    }
    
    const progressReport = `**รายงานความก้าวหน้าในการฝึกอบรมของคุณ** 📊

**ผลการปฏิบัติงานโดยรวม:**
• จำนวนเซสชั่นที่ทำเสร็จ: ${sessionData.sessions} เซสชั่น
• คะแนนเฉลี่ยปัจจุบัน: ${avgScore}/100
• คะแนนสูงสุดที่ทำได้: ${sessionData.bestScore}/100
• คะแนนเฉลี่ย 5 ครั้งล่าสุด: ${recentAvg}/100

**แนวโน้มผลการปฏิบัติงาน:**
• แนวโน้มโดยรวม: ${trendText}
${sessionData.scores.length >= 3 ? 
    `• คะแนน 5 ครั้งล่าสุด: ${sessionData.scores.slice(-5).join(', ')}` :
    '• ทำการจำลองเพิ่มเติมเพื่อวิเคราะห์แนวโน้ม'}

**ผลคะแนนตามทักษะ (เฉลี่ย):**
${Object.entries(skillAverages).map(([skill, avg]) => {
    const skillNames = {
        'rapport_building': 'การสร้างความสัมพันธ์',
        'needs_discovery': 'การค้นหาความต้องการ',
        'product_knowledge': 'ความรู้ผลิตภัณฑ์',
        'objection_handling': 'การจัดการความคัดค้าน',
        'closing_effectiveness': 'ความสามารถในการปิดการขาย',
        'communication_skills': 'ทักษะการสื่อสาร'
    };
    const emoji = avg >= 80 ? '🌟' : avg >= 70 ? '👍' : avg >= 60 ? '📚' : '💪';
    return `• ${emoji} ${skillNames[skill] || skill}: ${avg}/100`;
}).join('\n')}

**ข้อเสนอแนะสำหรับการพัฒนา:**
• ${avgScore < 60 ? '🎯 มุ่งเน้นการฝึกสถานการณ์พื้นฐานและการเรียนรู้ผลิตภัณฑ์' : 
     avgScore < 75 ? '📈 ลองทำสถานการณ์ที่ท้าทายมากขึ้นและฝึกทักษะเฉพาะ' :
     avgScore < 85 ? '🚀 เพิ่มความซับซ้อนและเน้นความเป็นเลิศในการบริการ' :
     '⭐ ผลงานยอดเยี่ยม! พิจารณาเป็นผู้ฝึกสอนหรือพี่เลี้ยง'}
• ${Object.keys(skillAverages).length > 0 ? 
    `พัฒนาทักษะที่ต้องการความสนใจ: ${Object.entries(skillAverages)
        .filter(([_, avg]) => avg < 70)
        .map(([skill, _]) => {
            const skillNames = {
                'rapport_building': 'การสร้างความสัมพันธ์',
                'needs_discovery': 'การค้นหาความต้องการ',
                'product_knowledge': 'ความรู้ผลิตภัณฑ์',
                'objection_handling': 'การจัดการความคัดค้าน',
                'closing_effectiveness': 'ความสามารถในการปิดการขาย',
                'communication_skills': 'ทักษะการสื่อสาร'
            };
            return skillNames[skill] || skill;
        }).join(', ') || 'ทุกทักษะอยู่ในระดับดี!'}`
    : 'ฝึกฝนในทุกด้านอย่างสม่ำเสมอ'}

💡 **เคล็ดลับ:** ใช้แดชบอร์ดคะแนนเพื่อติดตามความก้าวหน้าแบบเรียลไทม์!
🎯 **เป้าหมายต่อไป:** ${avgScore < 70 ? 'ยกระดับคะแนนเฉลี่ยให้ถึง 70+' : 
                                              avgScore < 85 ? 'มุ่งสู่ระดับผู้เชี่ยวชาญ (85+)' : 
                                              'รักษาความเป็นเลิศและแบ่งปันประสบการณ์'}

🏆 **เก็บผลงานที่ดีต่อไป! การฝึกฝนสม่ำเสมอคือกุญแจสู่ความสำเร็จ**`;

    addMessage(progressReport, 'system');
}

// Enhanced Performance Data Management Functions
function clearPerformanceData() {
    if (confirm('⚠️ คุณแน่ใจที่จะลบข้อมูลผลการปฏิบัติงานทั้งหมดหรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!')) {
        // Reset session data to initial state
        sessionData = {
            scores: [],
            sessions: 0,
            totalScore: 0,
            bestScore: 0,
            detailedMetrics: [],
            recentSessions: [],
            skillsHistory: {
                rapport_building: [],
                needs_discovery: [],
                product_knowledge: [],
                objection_handling: [],
                closing_effectiveness: [],
                communication_skills: []
            },
            lastUpdated: null
        };
        
        // Save cleared data
        saveSessionData();
        
        // Update UI
        updateProgressDisplay();
        updateScoreDashboard();
        
        addMessage('🗑️ ข้อมูลผลการปฏิบัติงานทั้งหมดถูกลบเรียบร้อยแล้ว\n\nคุณสามารถเริ่มต้นใหม่ได้เลย!', 'system');
    }
}

function exportPerformanceData() {
    try {
        const exportData = {
            export_date: new Date().toISOString(),
            export_version: '1.0',
            user_data: sessionData,
            summary: {
                total_sessions: sessionData.sessions,
                average_score: sessionData.sessions > 0 ? Math.round(sessionData.totalScore / sessionData.sessions) : 0,
                best_score: sessionData.bestScore,
                skill_averages: {}
            }
        };
        
        // Calculate skill averages for summary
        Object.entries(sessionData.skillsHistory).forEach(([skill, history]) => {
            if (history.length > 0) {
                const avg = history.reduce((sum, entry) => sum + entry.score, 0) / history.length;
                exportData.summary.skill_averages[skill] = Math.round(avg);
            }
        });
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `uob-simulation-performance-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addMessage(`📊 **ข้อมูลผลการปฏิบัติงานถูกส่งออกเรียบร้อย**\n\n**สรุปข้อมูล:**\n• จำนวนเซสชั่น: ${exportData.summary.total_sessions}\n• คะแนนเฉลี่ย: ${exportData.summary.average_score}/100\n• คะแนนสูงสุด: ${exportData.summary.best_score}/100\n\n📁 **ไฟล์ที่บันทึก:** uob-simulation-performance-${new Date().toISOString().split('T')[0]}.json\n\n💡 เก็บไฟล์นี้เป็นการสำรองข้อมูลของคุณ!`, 'system');
        
    } catch (error) {
        console.error('Export error:', error);
        addMessage('❌ เกิดข้อผิดพลาดในการส่งออกข้อมูล กรุณาลองใหม่อีกครั้ง', 'system');
    }
}

function importPerformanceData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate imported data structure
                if (!importedData.user_data || !importedData.user_data.sessions !== undefined) {
                    throw new Error('Invalid data format');
                }
                
                if (confirm(`📥 **นำเข้าข้อมูลผลการปฏิบัติงาน**\n\n**ข้อมูลที่จะนำเข้า:**\n• จำนวนเซสชั่น: ${importedData.summary?.total_sessions || 'ไม่ระบุ'}\n• คะแนนเฉลี่ย: ${importedData.summary?.average_score || 'ไม่ระบุ'}/100\n• วันที่ส่งออก: ${importedData.export_date ? new Date(importedData.export_date).toLocaleDateString('th-TH') : 'ไม่ระบุ'}\n\n⚠️ **หมายเหตุ:** ข้อมูลปัจจุบันจะถูกแทนที่\n\nต้องการดำเนินการต่อหรือไม่?`)) {
                    
                    // Merge with default structure to handle version differences
                    sessionData = {
                        scores: importedData.user_data.scores || [],
                        sessions: importedData.user_data.sessions || 0,
                        totalScore: importedData.user_data.totalScore || 0,
                        bestScore: importedData.user_data.bestScore || 0,
                        detailedMetrics: importedData.user_data.detailedMetrics || [],
                        recentSessions: importedData.user_data.recentSessions || [],
                        skillsHistory: {
                            rapport_building: [],
                            needs_discovery: [],
                            product_knowledge: [],
                            objection_handling: [],
                            closing_effectiveness: [],
                            communication_skills: [],
                            ...(importedData.user_data.skillsHistory || {})
                        },
                        lastUpdated: new Date().toISOString()
                    };
                    
                    // Save imported data
                    saveSessionData();
                    
                    // Update UI
                    updateProgressDisplay();
                    updateScoreDashboard();
                    
                    addMessage(`✅ **นำเข้าข้อมูลสำเร็จ!**\n\n**ข้อมูลที่นำเข้า:**\n• จำนวนเซสชั่น: ${sessionData.sessions}\n• คะแนนเฉลี่ย: ${sessionData.sessions > 0 ? Math.round(sessionData.totalScore / sessionData.sessions) : 0}/100\n• คะแนนสูงสุด: ${sessionData.bestScore}/100\n\n🎯 ข้อมูลผลการปฏิบัติงานของคุณพร้อมใช้งานแล้ว!`, 'system');
                }
                
            } catch (error) {
                console.error('Import error:', error);
                addMessage('❌ **ไม่สามารถนำเข้าข้อมูลได้**\n\nกรุณาตรวจสอบว่าไฟล์เป็นรูปแบบที่ถูกต้องและลองใหม่อีกครั้ง', 'system');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Enhanced session data backup functions
function createDataBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(sessionData)) // Deep clone
    };
    
    localStorage.setItem('uob_simulation_backup', JSON.stringify(backup));
    console.log('Data backup created:', backup.timestamp);
}

function restoreDataBackup() {
    try {
        const backup = localStorage.getItem('uob_simulation_backup');
        if (backup) {
            const parsedBackup = JSON.parse(backup);
            sessionData = parsedBackup.data;
            updateProgressDisplay();
            updateScoreDashboard();
            console.log('Data restored from backup:', parsedBackup.timestamp);
            return true;
        }
    } catch (error) {
        console.error('Backup restoration failed:', error);
    }
    return false;
}

// ========================================
// Voice Mode Functionality
// ========================================

let isRecording = false;
let recognition = null;
let voiceModeEnabled = false;

// Initialize Speech Recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported in this browser');
        return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'th-TH'; // Thai language
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Voice input:', transcript);
        
        const questionInput = document.getElementById('questionInput');
        if (questionInput) {
            questionInput.value = transcript;
        }
        
        stopRecording();
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        
        if (event.error === 'no-speech') {
            showNotification('ไม่พบเสียงพูด กรุณาลองอีกครั้ง', 'warning');
        } else if (event.error === 'not-allowed') {
            showNotification('กรุณาอนุญาตการใช้งานไมโครโฟน', 'error');
        } else {
            showNotification('เกิดข้อผิดพลาดในการรับเสียง', 'error');
        }
    };
    
    recognition.onend = function() {
        if (isRecording) {
            stopRecording();
        }
    };
    
    return true;
}

// Toggle voice mode (MOCK MODE - No actual recording)
function toggleVoiceMode() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Start recording (MOCK MODE - Visual only)
function startRecording() {
    isRecording = true;
    const voiceBtn = document.getElementById('voiceModeButton');
    if (voiceBtn) {
        voiceBtn.classList.add('recording');
        voiceBtn.title = 'กำลังฟัง... คลิกเพื่อหยุด';
    }
    
    console.log('🎤 Mock voice recording started');
    showNotification('กำลังฟัง... ', 'info');
}

// Stop recording (MOCK MODE - Visual only)
function stopRecording() {
    isRecording = false;
    const voiceBtn = document.getElementById('voiceModeButton');
    if (voiceBtn) {
        voiceBtn.classList.remove('recording');
        voiceBtn.title = 'เปิด/ปิดโหมดเสียง';
    }
    
    console.log('🎤 Mock voice recording stopped');
    showNotification('หยุดฟังแล้ว', 'info');
    
    // Show mock voice session feedback after 1 second for realism
    setTimeout(() => {
        showMockVoiceSessionFeedback();
    }, 1000);
}

// Mock Voice Session Feedback
function showMockVoiceSessionFeedback() {
    const feedbackHTML = `
        <div class="performance-report">
            <h2 style="color: #16a34a; text-align: center; margin-bottom: 1rem;">📊 รายงานผลการปฏิบัติงานแบบครอบคลุม</h2>
            <hr style="border: 2px solid #dcfce7; margin: 1rem 0;">
            
            <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #16a34a;">
                <h3 style="color: #15803d; margin-bottom: 0.5rem;">🎯 ผลการปฏิบัติงานโดยรวม</h3>
                <p><strong>คะแนน:</strong> <span style="color: #16a34a; font-weight: bold; font-size: 1.1rem;">77.3/100</span> (ดี)</p>
                <p><strong>ระยะเวลาการฝึก:</strong> 0.1 นาที</p>
                <p><strong>ปฏิสัมพันธ์กับลูกค้า:</strong> 0 ครั้ง</p>
            </div>
            
            <div style="background: #eff6ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-bottom: 0.5rem;">✅ รายการตรวจสอบตามขั้นตอนการนำเสนอ (Workflow Checklist)</h3>
                <div style="font-size: 0.9rem;">
                    <div style="margin-bottom: 0.75rem;">
                        <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">1. การแนะนำตัวและแนะนำผลิตภัณฑ์</div>
                        <div style="padding-left: 1rem;">
                            ❌ แนะนำชื่อ-นามสกุล และตำแหน่ง<br>
                            ✅ แสดงบัตรพนักงานและใบอนุญาต<br>
                            ✅ แนะนำว่าเป็น "ผลิตภัณฑ์ประกันชีวิต"
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">2. การสอบถามข้อมูล KYC</div>
                        <div style="padding-left: 1rem;">
                            ✅ ตรวจสอบอายุและประสบการณ์<br>
                            ✅ สอบถามวัตถุประสงค์ในการซื้อ<br>
                            ❌ ตรวจสอบว่าเป็นลูกค้าเปราะบางหรือไม่
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">3. การวิเคราะห์ความต้องการ (4C)</div>
                        <div style="padding-left: 1rem;">
                            ✅ สอบถามเป้าหมายการลงทุน<br>
                            ✅ สอบถามรายได้และค่าใช้จ่าย<br>
                            ❌ ตรวจสอบการคุ้มครองที่มีอยู่เดิม<br>
                            ✅ แนะนำผลิตภัณฑ์มากกว่า 2-3 ตัวเลือก
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">4. สิทธิของผู้บริโภค</div>
                        <div style="padding-left: 1rem;">
                            ❌ แจ้งสิทธิในการเลือกซื้ออย่างอิสระ<br>
                            ❌ แจ้งช่องทางร้องเรียน (Call Center 02-285-1555)
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">5. การแนะนำผลิตภัณฑ์</div>
                        <div style="padding-left: 1rem;">
                            ✅ ย้ำว่า "ประกันชีวิต" ไม่ใช่เงินฝาก<br>
                            ❌ อธิบายสิทธิประโยชน์ตามเพศและอายุ<br>
                            ❌ อธิบายข้อยกเว้น (บอกล้าง, ฆ่าตัวตาย, ฯลฯ)<br>
                            ✅ แจ้งเบี้ยประกันและระยะเวลาชำระ<br>
                            ✅ อธิบาย Free Look Period (15 วัน)<br>
                            ✅ แจ้งช่องทางติดต่อ (PRU Call Center 1621)
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 0.75rem;">
                        <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">6. การสื่อสารและมารยาท</div>
                        <div style="padding-left: 1rem;">
                            ✅ แนะนำอย่างสุภาพ ไม่เร่งรัด<br>
                            ✅ ห้ามขายทางโทรศัพท์<br>
                            ❌ มอบเอกสารให้ลูกค้า (แบบประกัน, PRU QUOTE, แผ่นพับ)
                        </div>
                    </div>
                </div>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #bfdbfe; font-size: 0.85rem; color: #1e40af;">
                    <strong>หมายเหตุ:</strong> ✅ = ผ่าน | ❌ = ต้องปรับปรุง (นี่คือโหมดทดสอบ - คะแนนสุ่ม)
                </div>
            </div>
            
            <h3 style="color: #15803d;">📈 ตัวชี้วัดละเอียด</h3>
            <div style="display: grid; gap: 0.5rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <span>👍 <strong>ความสามารถในการปิดการขาย</strong></span>
                    <span style="font-weight: bold;">79/100</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <span>🌟 <strong>ทักษะการสื่อสาร</strong></span>
                    <span style="font-weight: bold;">80/100</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <span>📚 <strong>การค้นหาความต้องการ</strong></span>
                    <span style="font-weight: bold;">68/100</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <span>🌟 <strong>การจัดการความคัดค้าน</strong></span>
                    <span style="font-weight: bold;">81/100</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <span>👍 <strong>ความรู้ผลิตภัณฑ์</strong></span>
                    <span style="font-weight: bold;">72/100</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: #f9fafb; border-radius: 6px;">
                    <span>🌟 <strong>การสร้างความสัมพันธ์</strong></span>
                    <span style="font-weight: bold;">84/100</span>
                </div>
            </div>
            
            <h3 style="color: #15803d;">✨ จุดแข็งหลัก</h3>
            <ol>
                <li style="margin-bottom: 0.5rem;">การสื่อสารที่เป็นมืออาชีพ</li>
                <li style="margin-bottom: 0.5rem;">การมีส่วนร่วมกับลูกค้า</li>
            </ol>
            
            <h3 style="color: #15803d;">🔧 จุดที่ควรปรับปรุง</h3>
            <ol>
                <li style="margin-bottom: 0.5rem;">ฝึกฝนการจัดการความคัดค้าน</li>
                <li style="margin-bottom: 0.5rem;">พัฒนาการปิดการขาย</li>
            </ol>
            
            <h3 style="color: #15803d;">🎯 แผนปฏิบัติการ</h3>
            <ol>
                <li style="margin-bottom: 0.5rem;">ฝึกฝนสถานการณ์เพิ่มเติม</li>
                <li style="margin-bottom: 0.5rem;">โฟกัสเทคนิคการปิดการขาย</li>
                <li style="margin-bottom: 0.5rem;">รับคำแนะนำเพิ่มเติม</li>
            </ol>
            
            <h3 style="color: #15803d;">📊 การเปรียบเทียบมาตรฐาน</h3>
            <p>📈 เทียบกับค่าเฉลี่ย: <strong>สูงกว่า 5.3 คะแนน</strong></p>
            
            <hr style="border: 2px solid #dcfce7; margin: 1rem 0;">
            <div style="text-align: center; color: #16a34a;">
                <p>💡 <em>ฝึกฝนต่อไปเพื่อพัฒนาทักษะของคุณ!</em></p>
                <p>🚀 <em>ความสำเร็จอยู่ในการฝึกฝนอย่างสม่ำเสมอ</em></p>
            </div>
        </div>
    `;
    
    // Add the feedback message to chat
    addMessageWithHTML(feedbackHTML, 'performance');
    
    console.log('📊 Voice session feedback displayed');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `voice-notification voice-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
if (!document.getElementById('voice-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'voice-notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize voice mode on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Enable voice button when simulation is active
    const observer = new MutationObserver(function(mutations) {
        const sendButton = document.getElementById('sendButton');
        const voiceButton = document.getElementById('voiceModeButton');
        
        if (sendButton && voiceButton) {
            voiceButton.disabled = sendButton.disabled;
        }
    });
    
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        observer.observe(sendButton, { attributes: true, attributeFilter: ['disabled'] });
    }
    
    // ========================================
    // DEBUG: Add click event debugging
    // ========================================
    console.log('🔍 DEBUG MODE: Click debugging initialized');
    
    // Check element states
    const questionInput = document.getElementById('questionInput');
    const voiceButton = document.getElementById('voiceModeButton');
    
    console.log('📝 Input element:', questionInput);
    console.log('🎤 Voice button:', voiceButton);
    console.log('📤 Send button:', sendButton);
    
    if (questionInput) {
        console.log('Input disabled:', questionInput.disabled);
        console.log('Input style:', window.getComputedStyle(questionInput).pointerEvents);
    }
    
    if (sendButton) {
        console.log('Send button disabled:', sendButton.disabled);
        console.log('Send button style:', window.getComputedStyle(sendButton).pointerEvents);
    }
    
    if (voiceButton) {
        console.log('Voice button disabled:', voiceButton.disabled);
        console.log('Voice button style:', window.getComputedStyle(voiceButton).pointerEvents);
    }
    
    // Add click listeners to all input elements for debugging
    document.addEventListener('click', function(e) {
        console.log('🖱️ Click detected at:', e.clientX, e.clientY);
        console.log('🎯 Target element:', e.target);
        console.log('📍 Element ID:', e.target.id);
        console.log('🏷️ Element class:', e.target.className);
        
        // Get element at click position
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        console.log('👆 Top element at click:', elementAtPoint);
        console.log('👆 Top element style:', window.getComputedStyle(elementAtPoint).pointerEvents);
        
        // Check z-index stack
        let currentElement = elementAtPoint;
        let depth = 0;
        console.log('📚 Element stack (top to bottom):');
        while (currentElement && depth < 10) {
            const style = window.getComputedStyle(currentElement);
            console.log(`  ${depth}: ${currentElement.tagName}.${currentElement.className}`, {
                zIndex: style.zIndex,
                position: style.position,
                pointerEvents: style.pointerEvents
            });
            currentElement = currentElement.parentElement;
            depth++;
        }
    }, true);
    
    // Add focus listener to input
    if (questionInput) {
        questionInput.addEventListener('focus', function() {
            console.log('✅ Input focused successfully');
        });
        
        questionInput.addEventListener('blur', function() {
            console.log('❌ Input lost focus');
        });
        
        questionInput.addEventListener('input', function(e) {
            console.log('⌨️ Input value changed:', e.target.value);
        });
    }
    
    // Add click listener to send button
    if (sendButton) {
        sendButton.addEventListener('click', function(e) {
            console.log('📤 Send button clicked!', {
                disabled: sendButton.disabled,
                propagation: e.bubbles,
                defaultPrevented: e.defaultPrevented
            });
        }, true);
    }
    
    // Add click listener to voice button
    if (voiceButton) {
        voiceButton.addEventListener('click', function(e) {
            console.log('🎤 Voice button clicked!', {
                disabled: voiceButton.disabled,
                propagation: e.bubbles,
                defaultPrevented: e.defaultPrevented
            });
        }, true);
    }
    
    console.log('✅ Debug listeners attached');
});

