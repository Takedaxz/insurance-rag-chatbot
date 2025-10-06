// Dashboard JavaScript for Admin Interface
// =====================================

// Mock Data Generation
class MockDataGenerator {
    constructor() {
        this.traineeNames = [
            'คุณสมชาย วิวัฒน์', 'คุณสมหญิง เก่งมาก', 'คุณวิชัย รุ่งโรจน์', 'คุณวิไล สวยงาม',
            'คุณธนพล มั่งคั่ง', 'คุณธิดา น่ารัก', 'คุณประเสริฐ ดีเลิศ', 'คุณปราณี ใจดี',
            'คุณมนตรี สุขใส', 'คุณมาลี สวยใส', 'คุณนิติ เก่งมาก', 'คุณนิภา สวยงาม',
            'คุณปิยะ เก่งมาก', 'คุณปิยมาศ สวยใส', 'คุณรัชพล เก่งมาก', 'คุณรัชนี สวยงาม',
            'คุณศิริ เก่งมาก', 'คุณศิริวรรณ สวยใส', 'คุณสิทธิ เก่งมาก', 'คุณสิริมา สวยงาม'
        ];
        
        this.positions = [
            'RM อาวุโส', 'RM ใหม่', 'Senior RM', 'Junior RM', 
            'Relationship Manager', 'Account Manager', 'Sales Manager'
        ];
        
        this.scenarios = [
            'new_customer', 'objection_handling', 'complex_family', 'cross_selling',
            'high_net_worth', 'young_professional', 'senior_planning', 'business_owner',
            'crisis_situation', 'investment_focused'
        ];
        
        this.scenarioNames = {
            'new_customer': 'ลูกค้าใหม่',
            'objection_handling': 'จัดการความคัดค้าน',
            'complex_family': 'ครอบครัวซับซ้อน',
            'cross_selling': 'ขายข้าม',
            'high_net_worth': 'ลูกค้าระดับสูง',
            'young_professional': 'วัยทำงานรุ่นใหม่',
            'senior_planning': 'วางแผนเกษียณ',
            'business_owner': 'เจ้าของธุรกิจ',
            'crisis_situation': 'สถานการณ์วิกฤต',
            'investment_focused': 'เน้นการลงทุน'
        };
    }

    generateTrainees(count = 20) {
        const trainees = [];
        for (let i = 1; i <= count; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90));
            
            trainees.push({
                id: `T${i.toString().padStart(3, '0')}`,
                name: this.traineeNames[i - 1],
                position: this.positions[Math.floor(Math.random() * this.positions.length)],
                startDate: startDate.toISOString().split('T')[0],
                totalSessions: Math.floor(Math.random() * 20) + 5,
                averageScore: Math.floor(Math.random() * 30) + 65, // 65-95%
                status: Math.random() > 0.2 ? 'active' : (Math.random() > 0.5 ? 'completed' : 'inactive'),
                lastActivity: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
        return trainees;
    }

    generateSimulationScores(traineeCount = 20, sessionsPerTrainee = 15) {
        const scores = [];
        let sessionId = 1;
        
        for (let traineeId = 1; traineeId <= traineeCount; traineeId++) {
            for (let session = 1; session <= sessionsPerTrainee; session++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 90));
                
                const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
                
                // Generate correlated scores (some consistency in performance)
                const baseScore = Math.floor(Math.random() * 30) + 65;
                const rapport = Math.floor(baseScore + (Math.random() - 0.5) * 20);
                const needsDiscovery = Math.floor(baseScore + (Math.random() - 0.5) * 20);
                const productKnowledge = Math.floor(baseScore + (Math.random() - 0.5) * 20);
                const objectionHandling = Math.floor(baseScore + (Math.random() - 0.5) * 20);
                const closingEffectiveness = Math.floor(baseScore + (Math.random() - 0.5) * 20);
                const communicationSkills = Math.floor(baseScore + (Math.random() - 0.5) * 20);
                
                const overallScore = Math.floor((rapport + needsDiscovery + productKnowledge + 
                    objectionHandling + closingEffectiveness + communicationSkills) / 6);
                
                scores.push({
                    id: sessionId++,
                    traineeId: `T${traineeId.toString().padStart(3, '0')}`,
                    traineeName: this.traineeNames[traineeId - 1],
                    scenario: scenario,
                    scenarioName: this.scenarioNames[scenario],
                    date: date.toISOString().split('T')[0],
                    overallScore: Math.max(0, Math.min(100, overallScore)),
                    rapportBuilding: Math.max(0, Math.min(100, rapport)),
                    needsDiscovery: Math.max(0, Math.min(100, needsDiscovery)),
                    productKnowledge: Math.max(0, Math.min(100, productKnowledge)),
                    objectionHandling: Math.max(0, Math.min(100, objectionHandling)),
                    closingEffectiveness: Math.max(0, Math.min(100, closingEffectiveness)),
                    communicationSkills: Math.max(0, Math.min(100, communicationSkills)),
                    duration: Math.floor(Math.random() * 20) + 10, // 10-30 minutes
                    feedback: this.generateFeedback(overallScore)
                });
            }
        }
        
        return scores.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    generateFeedback(score) {
        if (score >= 90) return 'ยอดเยี่ยม! การแสดงออกเป็นมืออาชีพมาก';
        if (score >= 80) return 'ดีมาก! มีการพัฒนาที่ชัดเจน';
        if (score >= 70) return 'ดี! ยังมีจุดที่ปรับปรุงได้';
        if (score >= 60) return 'พอใช้ ควรฝึกฝนเพิ่มเติม';
        return 'ต้องปรับปรุง ควรได้รับการฝึกอบรมเพิ่มเติม';
    }

    generateMonthlyData() {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            months.push({
                month: date.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
                averageScore: Math.floor(Math.random() * 20) + 70,
                totalSessions: Math.floor(Math.random() * 50) + 100,
                newTrainees: Math.floor(Math.random() * 10) + 5
            });
        }
        
        return months;
    }
}

// Dashboard Manager
class DashboardManager {
    constructor() {
        this.dataGenerator = new MockDataGenerator();
        this.trainees = this.dataGenerator.generateTrainees();
        this.scores = this.dataGenerator.generateSimulationScores();
        this.monthlyData = this.dataGenerator.generateMonthlyData();
        this.currentTab = 'overview';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        
        // Initialize chart references
        this.performanceTrendsChart = null;
        this.scenarioPerformanceChart = null;
        this.scoreDistributionChart = null;
        this.monthlyPerformanceChart = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadOverviewData();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Search and filter
        document.getElementById('trainee-search')?.addEventListener('input', (e) => {
            this.filterTrainees();
        });

        document.getElementById('score-filter')?.addEventListener('change', (e) => {
            this.filterTrainees();
        });

        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.filterTrainees();
        });

        document.getElementById('score-period')?.addEventListener('change', (e) => {
            this.loadScoresData();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        switch(tabName) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'trainees':
                this.loadTraineesData();
                break;
            case 'scores':
                this.loadScoresData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'reports':
                this.loadReportsData();
                break;
        }
    }

    loadOverviewData() {
        const totalTrainees = this.trainees.length;
        const avgScore = Math.floor(this.scores.reduce((sum, score) => sum + score.overallScore, 0) / this.scores.length);
        const completedSessions = this.scores.length;
        const topPerformer = this.getTopPerformer();

        const totalTraineesEl = document.getElementById('total-trainees');
        const avgScoreEl = document.getElementById('avg-score');
        const completedSessionsEl = document.getElementById('completed-sessions');
        const topPerformerEl = document.getElementById('top-performer');
        
        if (totalTraineesEl) totalTraineesEl.textContent = totalTrainees;
        if (avgScoreEl) avgScoreEl.textContent = `${avgScore}%`;
        if (completedSessionsEl) completedSessionsEl.textContent = completedSessions;
        if (topPerformerEl) topPerformerEl.textContent = topPerformer.name;

        this.loadRecentActivity();
    }

    getTopPerformer() {
        const traineeScores = {};
        
        this.scores.forEach(score => {
            if (!traineeScores[score.traineeId]) {
                traineeScores[score.traineeId] = { total: 0, count: 0, name: score.traineeName };
            }
            traineeScores[score.traineeId].total += score.overallScore;
            traineeScores[score.traineeId].count += 1;
        });

        let topPerformer = { name: '-', average: 0 };
        Object.values(traineeScores).forEach(trainee => {
            const average = trainee.total / trainee.count;
            if (average > topPerformer.average) {
                topPerformer = { name: trainee.name, average: average };
            }
        });

        return topPerformer;
    }

    loadRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        const recentScores = this.scores.slice(0, 5);
        
        activityContainer.innerHTML = recentScores.map(score => `
            <div class="activity-item">
                <div class="activity-icon">📊</div>
                <div class="activity-content">
                    <p><strong>${score.traineeName}</strong> เสร็จสิ้นการจำลอง ${score.scenarioName}</p>
                    <span class="activity-time">${this.formatDate(score.date)} - คะแนน ${score.overallScore}%</span>
                </div>
            </div>
        `).join('');
    }

    loadTraineesData() {
        const tableBody = document.getElementById('trainees-table-body');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.trainees.slice(startIndex, endIndex);

        tableBody.innerHTML = pageData.map(trainee => `
            <tr>
                <td>${trainee.id}</td>
                <td>${trainee.name}</td>
                <td>${trainee.position}</td>
                <td>${this.formatDate(trainee.startDate)}</td>
                <td>${trainee.totalSessions}</td>
                <td>
                    <div class="score-badge ${this.getScoreClass(trainee.averageScore)}">
                        ${trainee.averageScore}%
                    </div>
                </td>
                <td>
                    <span class="status-badge ${trainee.status}">
                        ${this.getStatusText(trainee.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewTraineeDetails('${trainee.id}')">
                        ดูรายละเอียด
                    </button>
                </td>
            </tr>
        `).join('');

        this.updatePagination();
    }

    loadScoresData() {
        const tableBody = document.getElementById('scores-table-body');
        const period = document.getElementById('score-period')?.value || 'all';
        const filteredScores = this.filterScoresByPeriod(period);

        // Update statistics
        const maxScore = Math.max(...filteredScores.map(s => s.overallScore));
        const minScore = Math.min(...filteredScores.map(s => s.overallScore));
        const avgScore = Math.floor(filteredScores.reduce((sum, s) => sum + s.overallScore, 0) / filteredScores.length);

        const maxScoreEl = document.getElementById('max-score');
        const minScoreEl = document.getElementById('min-score');
        const avgScoreDetailEl = document.getElementById('avg-score-detail');
        const totalSessionsEl = document.getElementById('total-sessions');
        
        if (maxScoreEl) maxScoreEl.textContent = `${maxScore}%`;
        if (minScoreEl) minScoreEl.textContent = `${minScore}%`;
        if (avgScoreDetailEl) avgScoreDetailEl.textContent = `${avgScore}%`;
        if (totalSessionsEl) totalSessionsEl.textContent = filteredScores.length;

        // Update table
        tableBody.innerHTML = filteredScores.slice(0, 20).map(score => `
            <tr>
                <td>${score.traineeName}</td>
                <td>${score.scenarioName}</td>
                <td>${this.formatDate(score.date)}</td>
                <td>
                    <div class="score-badge ${this.getScoreClass(score.overallScore)}">
                        ${score.overallScore}%
                    </div>
                </td>
                <td>${score.rapportBuilding}%</td>
                <td>${score.needsDiscovery}%</td>
                <td>${score.productKnowledge}%</td>
                <td>${score.objectionHandling}%</td>
                <td>${score.closingEffectiveness}%</td>
                <td>${score.communicationSkills}%</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewScoreDetails(${score.id})">
                        ดู
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateScoreDistributionChart(filteredScores);
    }

    loadAnalyticsData() {
        console.log('Loading analytics data...');
        try {
            this.updatePerformanceTrendsChart();
            this.updateScenarioPerformanceChart();
            console.log('Analytics data loaded successfully');
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }

    loadReportsData() {
        console.log('Loading reports data...');
        const reportsContainer = document.getElementById('generated-reports');
        if (!reportsContainer) {
            console.error('Generated reports container not found');
            return;
        }
        console.log('Reports container found:', reportsContainer);
        
        const reports = [
            { id: 1, name: 'รายงานประสิทธิภาพ มกราคม 2025', date: '2025-01-15', type: 'monthly' },
            { id: 2, name: 'รายงานผู้ฝึกอบรม - คุณสมชาย วิวัฒน์', date: '2025-01-14', type: 'trainee' },
            { id: 3, name: 'รายงานสถานการณ์ - ลูกค้าใหม่', date: '2025-01-13', type: 'scenario' }
        ];

        try {
            reportsContainer.innerHTML = reports.map(report => `
                <div class="report-item">
                    <div class="report-info">
                        <h4>${report.name}</h4>
                        <span class="report-date">สร้างเมื่อ: ${this.formatDate(report.date)}</span>
                    </div>
                    <div class="report-actions">
                        <button class="btn btn-sm btn-primary">ดาวน์โหลด</button>
                        <button class="btn btn-sm btn-secondary">ดูตัวอย่าง</button>
                    </div>
                </div>
            `).join('');
            console.log('Reports data loaded successfully, added', reports.length, 'reports');
        } catch (error) {
            console.error('Error loading reports data:', error);
        }
    }

    initializeCharts() {
        this.initializeMonthlyPerformanceChart();
        this.initializeScoreDistributionChart();
        this.initializePerformanceTrendsChart();
        this.initializeScenarioPerformanceChart();
    }

    initializeMonthlyPerformanceChart() {
        const ctx = document.getElementById('monthly-performance-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.monthlyPerformanceChart) {
            console.log('Destroying existing monthly performance chart');
            this.monthlyPerformanceChart.destroy();
            this.monthlyPerformanceChart = null;
        }

        try {
            this.monthlyPerformanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.monthlyData.map(d => d.month),
                    datasets: [{
                        label: 'คะแนนเฉลี่ย',
                        data: this.monthlyData.map(d => d.averageScore),
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 60,
                            max: 100
                        }
                    }
                }
            });
            console.log('Monthly performance chart created successfully');
        } catch (error) {
            console.error('Error creating monthly performance chart:', error);
        }
    }

    updateScoreDistributionChart(scores) {
        const ctx = document.getElementById('score-distribution-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.scoreDistributionChart) {
            console.log('Destroying existing score distribution chart');
            this.scoreDistributionChart.destroy();
            this.scoreDistributionChart = null;
        }

        const scoreRanges = {
            '90-100': 0,
            '80-89': 0,
            '70-79': 0,
            '60-69': 0,
            '0-59': 0
        };

        scores.forEach(score => {
            if (score.overallScore >= 90) scoreRanges['90-100']++;
            else if (score.overallScore >= 80) scoreRanges['80-89']++;
            else if (score.overallScore >= 70) scoreRanges['70-79']++;
            else if (score.overallScore >= 60) scoreRanges['60-69']++;
            else scoreRanges['0-59']++;
        });

        try {
            this.scoreDistributionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(scoreRanges),
                    datasets: [{
                        data: Object.values(scoreRanges),
                        backgroundColor: [
                            '#4CAF50',
                            '#8BC34A',
                            '#FFC107',
                            '#FF9800',
                            '#F44336'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            console.log('Score distribution chart created successfully');
        } catch (error) {
            console.error('Error creating score distribution chart:', error);
        }
    }

    initializeScoreDistributionChart() {
        // Chart will be updated when scores data is loaded
    }

    updatePerformanceTrendsChart() {
        console.log('Updating performance trends chart...');
        const ctx = document.getElementById('performance-trends-chart');
        if (!ctx) {
            console.error('Performance trends chart canvas not found');
            return;
        }
        console.log('Performance trends chart canvas found:', ctx);

        // Destroy existing chart if it exists
        if (this.performanceTrendsChart) {
            console.log('Destroying existing performance trends chart');
            this.performanceTrendsChart.destroy();
            this.performanceTrendsChart = null;
        }

        // Generate trend data for last 12 weeks
        const weeks = [];
        const trendData = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            weeks.push(`สัปดาห์ ${12 - i}`);
            trendData.push(Math.floor(Math.random() * 20) + 70);
        }

        try {
            this.performanceTrendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: weeks,
                    datasets: [{
                        label: 'คะแนนเฉลี่ย',
                        data: trendData,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 60,
                            max: 100
                        }
                    }
                }
            });
            console.log('Performance trends chart created successfully');
        } catch (error) {
            console.error('Error creating performance trends chart:', error);
        }
    }

    initializePerformanceTrendsChart() {
        // Chart will be updated when analytics data is loaded
    }

    updateScenarioPerformanceChart() {
        console.log('Updating scenario performance chart...');
        const ctx = document.getElementById('scenario-performance-chart');
        if (!ctx) {
            console.error('Scenario performance chart canvas not found');
            return;
        }
        console.log('Scenario performance chart canvas found:', ctx);

        // Destroy existing chart if it exists
        if (this.scenarioPerformanceChart) {
            console.log('Destroying existing scenario performance chart');
            this.scenarioPerformanceChart.destroy();
            this.scenarioPerformanceChart = null;
        }

        const scenarioScores = {};
        this.scores.forEach(score => {
            if (!scenarioScores[score.scenario]) {
                scenarioScores[score.scenario] = { total: 0, count: 0 };
            }
            scenarioScores[score.scenario].total += score.overallScore;
            scenarioScores[score.scenario].count += 1;
        });

        const scenarioNames = Object.keys(scenarioScores).map(scenario => 
            this.dataGenerator.scenarioNames[scenario]
        );
        const averageScores = Object.values(scenarioScores).map(data => 
            Math.floor(data.total / data.count)
        );

        try {
            this.scenarioPerformanceChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: scenarioNames,
                    datasets: [{
                        label: 'คะแนนเฉลี่ย',
                        data: averageScores,
                        backgroundColor: '#9C27B0',
                        borderColor: '#7B1FA2',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 60,
                            max: 100
                        }
                    }
                }
            });
            console.log('Scenario performance chart created successfully');
        } catch (error) {
            console.error('Error creating scenario performance chart:', error);
        }
    }

    initializeScenarioPerformanceChart() {
        // Chart will be updated when analytics data is loaded
    }

    destroyAllCharts() {
        console.log('Destroying all charts...');
        if (this.performanceTrendsChart) {
            this.performanceTrendsChart.destroy();
            this.performanceTrendsChart = null;
        }
        if (this.scenarioPerformanceChart) {
            this.scenarioPerformanceChart.destroy();
            this.scenarioPerformanceChart = null;
        }
        if (this.scoreDistributionChart) {
            this.scoreDistributionChart.destroy();
            this.scoreDistributionChart = null;
        }
        if (this.monthlyPerformanceChart) {
            this.monthlyPerformanceChart.destroy();
            this.monthlyPerformanceChart = null;
        }
        console.log('All charts destroyed');
    }

    filterTrainees() {
        const searchTerm = document.getElementById('trainee-search').value.toLowerCase();
        const scoreFilter = document.getElementById('score-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        let filtered = this.trainees;

        if (searchTerm) {
            filtered = filtered.filter(trainee => 
                trainee.name.toLowerCase().includes(searchTerm) ||
                trainee.position.toLowerCase().includes(searchTerm)
            );
        }

        if (scoreFilter) {
            const [min, max] = scoreFilter.split('-').map(Number);
            filtered = filtered.filter(trainee => 
                trainee.averageScore >= min && trainee.averageScore <= max
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(trainee => trainee.status === statusFilter);
        }

        // Update display with filtered results
        this.displayFilteredTrainees(filtered);
    }

    displayFilteredTrainees(filteredTrainees) {
        const tableBody = document.getElementById('trainees-table-body');
        tableBody.innerHTML = filteredTrainees.map(trainee => `
            <tr>
                <td>${trainee.id}</td>
                <td>${trainee.name}</td>
                <td>${trainee.position}</td>
                <td>${this.formatDate(trainee.startDate)}</td>
                <td>${trainee.totalSessions}</td>
                <td>
                    <div class="score-badge ${this.getScoreClass(trainee.averageScore)}">
                        ${trainee.averageScore}%
                    </div>
                </td>
                <td>
                    <span class="status-badge ${trainee.status}">
                        ${this.getStatusText(trainee.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewTraineeDetails('${trainee.id}')">
                        ดูรายละเอียด
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterScoresByPeriod(period) {
        const now = new Date();
        let cutoffDate;

        switch(period) {
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                return this.scores;
        }

        return this.scores.filter(score => new Date(score.date) >= cutoffDate);
    }

    updatePagination() {
        const totalPages = Math.ceil(this.trainees.length / this.itemsPerPage);
        const pagination = document.getElementById('trainees-pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="dashboardManager.goToPage(${this.currentPage - 1})">‹</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="page-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="dashboardManager.goToPage(${i})">${i}</button>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="dashboardManager.goToPage(${this.currentPage + 1})">›</button>`;
        }

        paginationHTML += '</div>';
        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadTraineesData();
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH');
    }

    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        if (score >= 60) return 'below-average';
        return 'poor';
    }

    getStatusText(status) {
        const statusTexts = {
            'active': 'กำลังฝึกอบรม',
            'completed': 'เสร็จสิ้น',
            'inactive': 'ไม่ใช้งาน'
        };
        return statusTexts[status] || status;
    }
}

// Global functions for HTML onclick handlers
function viewTraineeDetails(traineeId) {
    const trainee = dashboardManager.trainees.find(t => t.id === traineeId);
    if (!trainee) return;

    const modalBody = document.getElementById('trainee-modal-body');
    modalBody.innerHTML = `
        <div class="trainee-details">
            <div class="detail-row">
                <label>ID:</label>
                <span>${trainee.id}</span>
            </div>
            <div class="detail-row">
                <label>ชื่อ-นามสกุล:</label>
                <span>${trainee.name}</span>
            </div>
            <div class="detail-row">
                <label>ตำแหน่ง:</label>
                <span>${trainee.position}</span>
            </div>
            <div class="detail-row">
                <label>วันที่เริ่ม:</label>
                <span>${dashboardManager.formatDate(trainee.startDate)}</span>
            </div>
            <div class="detail-row">
                <label>เซสชันทั้งหมด:</label>
                <span>${trainee.totalSessions}</span>
            </div>
            <div class="detail-row">
                <label>คะแนนเฉลี่ย:</label>
                <span class="score-badge ${dashboardManager.getScoreClass(trainee.averageScore)}">
                    ${trainee.averageScore}%
                </span>
            </div>
            <div class="detail-row">
                <label>สถานะ:</label>
                <span class="status-badge ${trainee.status}">
                    ${dashboardManager.getStatusText(trainee.status)}
                </span>
            </div>
            <div class="detail-row">
                <label>กิจกรรมล่าสุด:</label>
                <span>${dashboardManager.formatDate(trainee.lastActivity)}</span>
            </div>
        </div>
    `;

    document.getElementById('trainee-modal').style.display = 'block';
}

function viewScoreDetails(scoreId) {
    const score = dashboardManager.scores.find(s => s.id === scoreId);
    if (!score) return;

    alert(`รายละเอียดคะแนน:\n\n` +
          `ผู้ฝึกอบรม: ${score.traineeName}\n` +
          `สถานการณ์: ${score.scenarioName}\n` +
          `วันที่: ${dashboardManager.formatDate(score.date)}\n` +
          `คะแนนรวม: ${score.overallScore}%\n` +
          `การสร้างความสัมพันธ์: ${score.rapportBuilding}%\n` +
          `การค้นหาความต้องการ: ${score.needsDiscovery}%\n` +
          `ความรู้ผลิตภัณฑ์: ${score.productKnowledge}%\n` +
          `การจัดการความคัดค้าน: ${score.objectionHandling}%\n` +
          `การปิดการขาย: ${score.closingEffectiveness}%\n` +
          `การสื่อสาร: ${score.communicationSkills}%\n` +
          `ระยะเวลา: ${score.duration} นาที\n` +
          `ข้อเสนอแนะ: ${score.feedback}`);
}

function closeModal() {
    document.getElementById('trainee-modal').style.display = 'none';
}

function addNewTrainee() {
    alert('ฟีเจอร์เพิ่มผู้ฝึกอบรมใหม่ - กำลังพัฒนา');
}

function refreshTrainees() {
    dashboardManager.loadTraineesData();
}

function exportScores() {
    alert('ฟีเจอร์ส่งออกข้อมูลคะแนน - กำลังพัฒนา');
}

function generateReport() {
    console.log('Generate Report clicked');
    const report = {
        id: Date.now(),
        title: 'รายงานทั่วไป',
        type: 'general',
        createdAt: new Date().toLocaleDateString('th-TH'),
        status: 'completed'
    };
    addGeneratedReport(report);
}

function generateMonthlyReport() {
    console.log('Generate Monthly Report clicked');
    const report = {
        id: Date.now(),
        title: 'รายงานประสิทธิภาพรายเดือน',
        type: 'monthly',
        createdAt: new Date().toLocaleDateString('th-TH'),
        status: 'completed',
        description: 'สรุปคะแนนและสถิติการฝึกอบรมของเดือนนี้'
    };
    addGeneratedReport(report);
}

function generateTraineeReport() {
    console.log('Generate Trainee Report clicked');
    const report = {
        id: Date.now(),
        title: 'รายงานผู้ฝึกอบรม',
        type: 'trainee',
        createdAt: new Date().toLocaleDateString('th-TH'),
        status: 'completed',
        description: 'รายละเอียดการพัฒนาของผู้ฝึกอบรมทั้งหมด'
    };
    addGeneratedReport(report);
}

function generateScenarioReport() {
    console.log('Generate Scenario Report clicked');
    const report = {
        id: Date.now(),
        title: 'รายงานสถานการณ์',
        type: 'scenario',
        createdAt: new Date().toLocaleDateString('th-TH'),
        status: 'completed',
        description: 'วิเคราะห์ประสิทธิภาพในแต่ละสถานการณ์การจำลอง'
    };
    addGeneratedReport(report);
}

function generateTrendReport() {
    console.log('Generate Trend Report clicked');
    const report = {
        id: Date.now(),
        title: 'รายงานแนวโน้ม',
        type: 'trend',
        createdAt: new Date().toLocaleDateString('th-TH'),
        status: 'completed',
        description: 'วิเคราะห์แนวโน้มการพัฒนาทักษะในระยะยาว'
    };
    addGeneratedReport(report);
}

function addGeneratedReport(report) {
    console.log('Adding report:', report);
    const reportsList = document.getElementById('generated-reports');
    if (!reportsList) {
        console.error('Generated reports container not found');
        return;
    }

    const reportItem = document.createElement('div');
    reportItem.className = 'report-item';
    reportItem.innerHTML = `
        <div class="report-info">
            <h4>${report.title}</h4>
            <p>${report.description || 'รายงานที่สร้างโดยระบบ'}</p>
            <span class="report-date">สร้างเมื่อ: ${report.createdAt}</span>
        </div>
        <div class="report-actions">
            <button class="btn btn-sm btn-primary" onclick="downloadReport('${report.id}')">ดาวน์โหลด</button>
            <button class="btn btn-sm btn-secondary" onclick="viewReport('${report.id}')">ดู</button>
            <button class="btn btn-sm btn-danger" onclick="deleteReport('${report.id}')">ลบ</button>
        </div>
    `;
    
    reportsList.appendChild(reportItem);
    console.log('Report added successfully');
}

function downloadReport(reportId) {
    console.log('Download report:', reportId);
    alert('ดาวน์โหลดรายงาน ID: ' + reportId);
}

function viewReport(reportId) {
    console.log('View report:', reportId);
    alert('ดูรายงาน ID: ' + reportId);
}

function deleteReport(reportId) {
    console.log('Delete report:', reportId);
    if (confirm('คุณต้องการลบรายงานนี้หรือไม่?')) {
        const reportItems = document.querySelectorAll('.report-item');
        reportItems.forEach(item => {
            const downloadBtn = item.querySelector('button[onclick*="' + reportId + '"]');
            if (downloadBtn) {
                item.remove();
                console.log('Report deleted:', reportId);
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
let dashboardManager;
document.addEventListener('DOMContentLoaded', function() {
    dashboardManager = new DashboardManager();
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('trainee-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
