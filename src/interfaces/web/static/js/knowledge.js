// Knowledge Mode JavaScript
// ========================

let isProcessing = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    loadStats();
    loadFiles();
    setInterval(updateTime, 1000);
});

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('currentTime').textContent = timeString;
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
            
            // Add sources in plain text format (not markdown)
            if (data.sources && data.sources.length > 0) {
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
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Check if content contains Thai characters
    const hasThaiChars = /[\\u0E00-\\u0E7F]/.test(content);
    if (hasThaiChars) {
        contentDiv.setAttribute('lang', 'th');
    }
    
    // Render Markdown for bot messages, keep plain text for user messages
    if (sender === 'bot') {
        contentDiv.innerHTML = marked.parse(content);
        
        // Add sources as plain HTML (not processed through markdown)
        if (sourcesHtml) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.innerHTML = sourcesHtml;
            contentDiv.appendChild(sourcesDiv);
        }
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