// Knowledge Mode JavaScript
// ========================

let isProcessing = false;
let adminMode = false;
let showSources = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    generateDynamicWelcomeMessage();
    loadAdminModeState();
    if (adminMode) {
        loadStats();
        loadFiles();
    }
    // Remove continuous time updates - timestamps are now fixed when messages are created
});

function generateDynamicWelcomeMessage() {
    const welcomeMessages = [
        {
            greeting: "สวัสดีครับ! ผมเป็นผู้ช่วยคลังความรู้ UOB ที่พร้อมช่วยเหลือคุณ",
            intro: "อัปโหลดเอกสารแล้วถามคำถามเฉพาะเจาะจงเกี่ยวกับ:",
            features: [
                "<strong>รายละเอียดผลิตภัณฑ์และขั้นตอนการทำงาน:</strong> ข้อมูลเชิงลึกเกี่ยวกับผลิตภัณฑ์ประกันต่างๆ",
                "<strong>แนวทางการปฏิบัติตามกฎระเบียบ:</strong> ข้อกำหนดและระเบียบที่ต้องปฏิบัติตาม",
                "<strong>คู่มือการปฏิบัติงานแบบขั้นตอน:</strong> วิธีการทำงานที่ละเอียดและชัดเจน",
                "<strong>คำแนะนำเชิงกลยุทธ์และการวิเคราะห์กรณีศึกษา:</strong> แนวทางการตัดสินใจและแก้ไขปัญหา"
            ],
            tip: "เริ่มต้น: อัปโหลดเอกสารของคุณแล้วเริ่มถามคำถามได้เลย!"
        },
        {
            greeting: "ยินดีต้อนรับครับ! พร้อมเป็นคลังความรู้ประกันที่ครบครันสำหรับคุณ",
            intro: "ระบบนี้จะช่วยให้คุณเข้าถึงข้อมูลได้อย่างรวดเร็วในเรื่อง:",
            features: [
                "<strong>การค้นหาข้อมูลผลิตภัณฑ์:</strong> รายละเอียดครอบคลุมทุกประเภทประกัน",
                "<strong>กระบวนการและขั้นตอนงาน:</strong> วิธีปฏิบัติงานที่ถูกต้องและมีประสิทธิภาพ",
                "<strong>เทคนิคการขายและการบริการ:</strong> กลยุทธ์ที่ช่วยเพิ่มประสิทธิภาพ",
                "<strong>มาตรฐานและข้อกำหนด:</strong> ข้อกฎหมายและระเบียบที่เกี่ยวข้อง"
            ],
            tip: "เคล็ดลับ: ใช้คำถามเฉพาะเจาะจงจะได้คำตอบที่ตรงใจมากขึ้น!"
        },
        {
            greeting: "สวัสดีค่ะ! ฉันคือระบบคลังความรู้อัจฉริยะที่จะช่วยคุณค้นหาข้อมูล",
            intro: "มาใช้ประโยชน์จากความรู้ที่ครบครันใน:",
            features: [
                "<strong>ข้อมูลผลิตภัณฑ์ครบถ้วน:</strong> ทุกรายละเอียดที่ RM ต้องรู้",
                "<strong>การอบรมและพัฒนาทักษะ:</strong> เนื้อหาสำหรับการเรียนรู้",
                "<strong>ความปลอดภัยและการปฏิบัติตาม:</strong> มาตรฐานและข้อกำหนด",
                "<strong>กรณีศึกษาและตัวอย่าง:</strong> ประสบการณ์จริงจากการทำงาน"
            ],
            tip: "ลองใช้: อัปโหลดเอกสารแล้วถามอะไรก็ได้ที่อยากรู้!"
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

// Admin toggle functionality
function toggleAdminMode() {
    adminMode = !adminMode;
    const sidebar = document.getElementById('adminSidebar');
    const toggleBtn = document.getElementById('adminToggle');
    
    if (adminMode) {
        sidebar.style.display = 'block';
        toggleBtn.textContent = 'Admin';
        toggleBtn.style.background = '#16a34a';
        showSources = true;
        loadStats();
        loadFiles();
    } else {
        sidebar.style.display = 'none';
        toggleBtn.textContent = 'Admin';
        toggleBtn.style.background = '#6b7280';
        showSources = false;
    }
    
    // Save admin mode state
    localStorage.setItem('knowledge_admin_mode', adminMode);
    localStorage.setItem('knowledge_show_sources', showSources);
}

// Load admin mode state from localStorage
function loadAdminModeState() {
    const savedAdminMode = localStorage.getItem('knowledge_admin_mode');
    const savedShowSources = localStorage.getItem('knowledge_show_sources');
    
    if (savedAdminMode === 'true') {
        adminMode = true;
        showSources = savedShowSources === 'true';
        
        const sidebar = document.getElementById('adminSidebar');
        const toggleBtn = document.getElementById('adminToggle');
        
        sidebar.style.display = 'block';
        toggleBtn.textContent = 'Admin';
        toggleBtn.style.background = '#16a34a';
    }
}

function askSuggestedQuestion(question) {
    document.getElementById('questionInput').value = question;
    askQuestion();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        askQuestion();
    }
}

async function askQuestion() {
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
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                use_web_search: false
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            let botMessage = data.answer;
            let sourcesHtml = '';
            
            // Only show sources if admin mode is enabled
            if (showSources && data.sources && data.sources.length > 0) {
                sourcesHtml = '<div class="sources"><h4>Sources:</h4>';
                data.sources.forEach((source, index) => {
                    const filename = source.metadata?.filename || 'Unknown';
                    const content = source.content.substring(0, 100) + '...';
                    sourcesHtml += `<div class="source-item"><strong>${index + 1}. ${filename}</strong><br>${content}</div>`;
                });
                sourcesHtml += '</div>';
            }

            addMessage(botMessage, 'bot', sourcesHtml);
        } else {
            addMessage(`Error: ${data.message}`, 'bot');
        }
    } catch (error) {
        addMessage(`Network error: ${error.message}`, 'bot');
    } finally {
        document.getElementById('loading').classList.remove('show');
        document.getElementById('askButton').disabled = false;
        isProcessing = false;
    }
}

function addMessage(content, sender, sourcesHtml = '') {
    addMessageWithTimestamp(content, sender, new Date().toLocaleTimeString(), sourcesHtml);
}

function addMessageWithTimestamp(content, sender, timestamp, sourcesHtml = '') {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Apply Noto Sans Thai font for better Thai text rendering
    contentDiv.style.fontFamily = "'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif";
    
    // Check if content contains Thai characters
    const hasThaiChars = /[\u0E00-\u0E7F]/.test(content);
    if (hasThaiChars) {
        contentDiv.setAttribute('lang', 'th');
        // Ensure proper Thai font rendering
        contentDiv.style.lineHeight = '1.6';
        contentDiv.style.fontWeight = '400';
    }
    
    // Render Markdown for bot messages, keep plain text for user messages
    if (sender === 'bot') {
        contentDiv.innerHTML = marked.parse(content);
        
        // Add sources as plain HTML (not processed through markdown)
        if (sourcesHtml) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.innerHTML = sourcesHtml;
            sourcesDiv.style.fontFamily = "'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif";
            contentDiv.appendChild(sourcesDiv);
        }
    } else {
        contentDiv.textContent = content;
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp; // Use provided timestamp instead of generating new one
    timeDiv.style.fontFamily = "'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif";
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function uploadFile(input) {
    const file = input.files[0];
    if (!file) return;

    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = '<div class="loading show"><div class="spinner"></div><p>Uploading...</p></div>';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            statusDiv.innerHTML = `<div class="success">Uploaded ${data.filename}<br>Created ${data.chunks_created} chunks</div>`;

            loadStats();
            loadFiles();
        } else {
            statusDiv.innerHTML = `<div class="error">Upload failed: ${data.message}</div>`;

        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="error">Upload error: ${error.message}</div>`;

    }

    input.value = '';
}



async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        if (data.status === 'success') {
            const stats = data.stats;
            document.getElementById('stats').innerHTML = `
                <div class="stat-item">Files: ${stats.total_files || 0}</div>
                <div class="stat-item">Chunks: ${stats.total_chunks || 0}</div>
                <div class="stat-item">Index Size: ${stats.index_size || '0 MB'}</div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadFiles() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();

        if (data.status === 'success') {
            const files = data.files;
            if (files.length === 0) {
                document.getElementById('files').innerHTML = '<div class="file-item">No files uploaded yet</div>';
            } else {
                document.getElementById('files').innerHTML = files.map(file => 
                    `<div class=\"file-item\" title=\"${file.filename}\">`+
                    `<div>`+
                    `<span class=\"filename\">${(file.filename || '').slice(0, 15)}${(file.filename && file.filename.length > 15) ? '…' : ''}</span><br>`+
                    `<small>${file.chunks} chunks</small>`+
                    `</div>`+
                    `<div class=\"file-actions\">`+
                    `<button onclick=\"deleteUploadedFile('${file.filename.replace(/'/g, "\\'")}')\">Delete</button>`+
                    `</div>`+
                    `</div>`
                ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

async function deleteUploadedFile(filename) {
    if (!confirm(`Delete \"${filename}\" from the index?`)) return;
    
    // Show loading state
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.querySelector('.filename').textContent.includes(filename.slice(0, 15))) {
            item.style.opacity = '0.5';
            const deleteBtn = item.querySelector('button');
            deleteBtn.textContent = 'Deleting...';
            deleteBtn.disabled = true;
        }
    });
    
    try {
        const resp = await fetch('/api/files/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        const data = await resp.json();
        
        if (data.status === 'success') {
            // Immediately update the UI
            loadStats();
            loadFiles();
            
            // Show success message
            addMessage(`File \"${filename}\" deleted successfully. Removed ${data.chunks_removed || 0} chunks.`, 'bot');
        } else {
            // Show error and restore UI
            addMessage(`Failed to delete file: ${data.message}`, 'bot');
            loadFiles(); // Restore the file list
        }
    } catch (e) {
        // Show error and restore UI
        addMessage(`Error deleting file: ${e.message}`, 'bot');
        loadFiles(); // Restore the file list
    }
}