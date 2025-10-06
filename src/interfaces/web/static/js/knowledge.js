// Knowledge Mode JavaScript
// ========================

let isProcessing = false;
let showSources = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    generateDynamicWelcomeMessage();
    // Check if user is admin (passed from Flask template via data attribute)
    const userRole = document.body.getAttribute('data-user-role');
    console.log('User role from data attribute:', userRole, 'Type:', typeof userRole);

    if (userRole === 'admin') {
        console.log('User is admin, loading stats and files');
        showSources = true;
        loadStats();
        loadFiles();
    } else {
        console.log('User is not admin, showing access message');
        // For non-admin users, hide or update the stats and files sections
        document.getElementById('stats').innerHTML = '<div class="stat-item">เข้าถึงได้เฉพาะผู้ดูแลระบบ</div>';
        document.getElementById('files').innerHTML = '<div class="file-item">เข้าถึงได้เฉพาะผู้ดูแลระบบ</div>';
    }
    
    // Add click-outside-to-close functionality for file view modal
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('fileViewModal');
        if (event.target === modal) {
            closeFileViewModal();
        }
    });
    
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

// Admin functionality - now handled server-side based on user role

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
                    `<button class=\"view-btn\" onclick=\"viewFileContent('${file.filename.replace(/'/g, "\\'")}')\">ดู</button>`+
                    `<button class=\"delete-btn\" onclick=\"deleteUploadedFile('${file.filename.replace(/'/g, "\\'")}')\">ลบ</button>`+
                    `</div>`+
                    `</div>`
                ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

async function viewFileContent(filename) {
    console.log('Viewing file content for:', filename);
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('fileViewModal');
    if (!modal) {
        modal = createFileViewModal();
        document.body.appendChild(modal);
    }
    
    // Show modal and loading state
    modal.style.display = 'block';
    const contentDiv = document.getElementById('fileViewContent');
    const titleDiv = document.getElementById('fileViewTitle');
    
    titleDiv.textContent = `เนื้อหาไฟล์: ${filename}`;
    contentDiv.innerHTML = '<div class="loading show"><div class="spinner"></div><p>กำลังโหลดเนื้อหาไฟล์...</p></div>';
    
    try {
        const response = await fetch('/api/files/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Display file content
            if (data.content && data.content.length > 0) {
                let contentHtml = '<div class="file-content">';
                
                // Group content by chunks for better readability
                data.content.forEach((chunk, index) => {
                    // Try to extract section title from content
                    let sectionTitle = `ส่วนที่ ${index + 1}`;
                    const content = chunk.content || '';
                    
                    // Look for headers in the content
                    const lines = content.split('\n');
                    for (let line of lines.slice(0, 3)) {
                        line = line.trim();
                        if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
                            sectionTitle = line.replace(/^#+\s*/, '');
                            break;
                        } else if (line && line.length > 3 && line.length < 100) {
                            // Check if it looks like a title (short line, no punctuation at end)
                            if (!line.endsWith('.') && !line.endsWith(':') && line.length > 5) {
                                sectionTitle = line;
                                break;
                            }
                        }
                    }
                    
                    contentHtml += `<div class="content-chunk">`;
                    contentHtml += `<h4 class="section-title">${sectionTitle}</h4>`;
                    contentHtml += `<div class="chunk-content">${content}</div>`;
                    if (chunk.metadata) {
                        contentHtml += `<div class="chunk-metadata">`;
                        if (chunk.metadata.page) contentHtml += `<span>หน้า: ${chunk.metadata.page}</span>`;
                        if (chunk.metadata.source) contentHtml += `<span>แหล่งที่มา: ${chunk.metadata.source}</span>`;
                        contentHtml += `</div>`;
                    }
                    contentHtml += `</div>`;
                });
                
                contentHtml += '</div>';
                contentDiv.innerHTML = contentHtml;
            } else {
                contentDiv.innerHTML = '<div class="no-content">ไม่พบเนื้อหาในไฟล์นี้</div>';
            }
        } else {
            contentDiv.innerHTML = `<div class="error">เกิดข้อผิดพลาด: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Error loading file content:', error);
        contentDiv.innerHTML = `<div class="error">เกิดข้อผิดพลาดในการโหลดไฟล์: ${error.message}</div>`;
    }
}

function createFileViewModal() {
    const modal = document.createElement('div');
    modal.id = 'fileViewModal';
    modal.className = 'file-view-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="fileViewTitle">เนื้อหาไฟล์</h3>
                <button class="close-btn" onclick="closeFileViewModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div id="fileViewContent"></div>
            </div>
        </div>
    `;
    return modal;
}

function closeFileViewModal() {
    const modal = document.getElementById('fileViewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function deleteUploadedFile(filename) {
    if (!confirm(`ลบไฟล์ "${filename}" ออกจากระบบ?`)) return;
    
    // Show loading state
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.querySelector('.filename').textContent.includes(filename.slice(0, 15))) {
            item.style.opacity = '0.5';
            const deleteBtn = item.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.textContent = 'กำลังลบ...';
                deleteBtn.disabled = true;
            }
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
            addMessage(`ไฟล์ "${filename}" ถูกลบเรียบร้อยแล้ว ลบ ${data.chunks_removed || 0} ส่วน`, 'bot');
        } else {
            // Show error and restore UI
            addMessage(`ไม่สามารถลบไฟล์ได้: ${data.message}`, 'bot');
            loadFiles(); // Restore the file list
        }
    } catch (e) {
        // Show error and restore UI
        addMessage(`เกิดข้อผิดพลาดในการลบไฟล์: ${e.message}`, 'bot');
        loadFiles(); // Restore the file list
    }
}