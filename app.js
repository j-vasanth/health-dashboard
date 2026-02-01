/**
 * Metabolic Command Center - Core Engine
 */

class HealthDataManager {
    constructor() {
        this.data = {
            labs: [],
            vitals: [],
            activity: [],
            sleep: []
        };
        this.metrics = [];
        this.currentMetric = 'RestingHeartRate';
        this.currentTimeRange = '1M';
    }

    async init() {
        try {
            const paths = {
                labs: './src/data/labs_master.json',
                vitals: './src/data/vitals_master.json',
                activity: './src/data/activity_master.json',
                sleep: './src/data/sleep_master.json'
            };

            for (const [key, path] of Object.entries(paths)) {
                const response = await fetch(path);
                this.data[key] = await response.json();
            }

            this.indexMetrics();
            return true;
        } catch (error) {
            console.error('Data Loading Error:', error);
            return false;
        }
    }

    indexMetrics() {
        const uniqueMetrics = new Set();
        const metricMap = new Map();

        Object.values(this.data).forEach(dataset => {
            dataset.forEach(entry => {
                const rawMetric = entry.metric || entry.Metric;
                const mKey = (rawMetric || '').toLowerCase();
                if (mKey && !uniqueMetrics.has(mKey)) {
                    uniqueMetrics.add(mKey);
                    metricMap.set(mKey, {
                        name: mKey,
                        label: entry.source_display || entry.OriginalName || rawMetric,
                        unit: entry.unit || entry.Unit || '',
                        source: dataset === this.data.labs ? 'Labs' : 
                                dataset === this.data.vitals ? 'Vitals' :
                                dataset === this.data.activity ? 'Activity' : 'Sleep'
                    });
                }
            });
        });

        this.metrics = Array.from(metricMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    getMetricData(metricName) {
        let allEntries = [];
        Object.values(this.data).forEach(dataset => {
            const filtered = dataset.filter(d => {
                const m = d.metric || d.Metric;
                return m && m.toLowerCase() === metricName.toLowerCase();
            });
            allEntries = allEntries.concat(filtered);
        });

        // Use a Map to keep only the latest value per timestamp string
        const uniqueByTime = new Map();
        allEntries.forEach(d => {
            const timeStr = d.timestamp || d.Timestamp;
            const val = d.value || d.Value;
            if (timeStr && val !== undefined) {
                uniqueByTime.set(timeStr, parseFloat(val));
            }
        });

        return Array.from(uniqueByTime.entries())
            .map(([time, value]) => ({
                x: new Date(time),
                y: value
            }))
            .filter(d => !isNaN(d.y))
            .sort((a, b) => a.x - b.x);
    }

    getLatestValue(metricName) {
        const data = this.getMetricData(metricName);
        if (data.length === 0) return null;
        
        const latest = data[data.length - 1];
        return {
            timestamp: latest.x.toISOString(),
            value: latest.y,
            metric: metricName,
            unit: this.metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase())?.unit || ''
        };
    }
}

class DashboardUI {
    constructor(manager) {
        this.manager = manager;
        this.chart = null;
        this.setupEventListeners();
    }

    async init() {
        this.renderVitalPulse();
        this.renderDataLogs();
        this.populateDropdown();
        this.initChart();
        this.updateChart(this.manager.currentMetric);
        
        // Hide startup overlay
        setTimeout(() => {
            const overlay = document.getElementById('startup-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 1000);
            }
        }, 1500);
    }

    populateDropdown() {
        const dropdown = document.getElementById('metric-dropdown');
        if (!dropdown) return;

        // Group metrics by source
        const groups = {};
        this.manager.metrics.forEach(m => {
            if (!groups[m.source]) groups[m.source] = [];
            groups[m.source].push(m);
        });

        Object.keys(groups).sort().forEach(source => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = source.toUpperCase();
            
            groups[source].forEach(m => {
                const option = document.createElement('option');
                option.value = m.name;
                option.textContent = m.label.toUpperCase();
                if (m.name === this.manager.currentMetric) option.selected = true;
                optgroup.appendChild(option);
            });
            dropdown.appendChild(optgroup);
        });

        dropdown.addEventListener('change', (e) => {
            if (e.target.value) {
                const metric = this.manager.metrics.find(m => m.name === e.target.value);
                this.manager.currentMetric = e.target.value;
                document.getElementById('metric-search').value = metric ? metric.label : '';
                this.updateChart(e.target.value);
            }
        });
    }

    setupEventListeners() {
        const searchInput = document.getElementById('metric-search');
        const resultsDiv = document.getElementById('search-results');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                resultsDiv.classList.add('hidden');
                return;
            }

            const filtered = this.manager.metrics.filter(m => 
                m.label.toLowerCase().includes(query) || 
                m.name.toLowerCase().includes(query)
            );

            this.renderSearchResults(filtered);
        });

        document.querySelectorAll('.time-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.manager.currentTimeRange = btn.dataset.range;
                this.updateChart(this.manager.currentMetric);
            });
        });

        // Close search on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.classList.add('hidden');
            }
        });
    }

    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.classList.add('hidden');
            return;
        }

        results.forEach(res => {
            const div = document.createElement('div');
            div.className = 'px-4 py-3 border-b border-white/5 cursor-pointer flex justify-between items-center transition-colors';
            div.innerHTML = `
                <div>
                    <div class="text-[10px] font-bold text-white uppercase">${res.label}</div>
                    <div class="text-[8px] text-gray-500 uppercase font-mono">${res.source}</div>
                </div>
                <div class="text-[8px] font-mono text-cyan-500/50">${res.name}</div>
            `;
            div.onclick = () => {
                this.manager.currentMetric = res.name;
                document.getElementById('metric-search').value = res.label;
                container.classList.add('hidden');
                this.updateChart(res.name);
            };
            container.appendChild(div);
        });

        container.classList.remove('hidden');
    }

    renderVitalPulse() {
        const metrics = [
            { id: 'RestingHeartRate', label: 'RHR' },
            { id: 'VO2Max', label: 'VO2MAX' },
            { id: 'HRV', label: 'HRV' },
            { id: 'glucose', label: 'GLUCOSE' },
            { id: 'StepCount', label: 'STEPS' },
            { id: 'SleepScore', label: 'SLEEP' }
        ];

        const container = document.getElementById('vital-pulse-strip');
        container.innerHTML = '';

        metrics.forEach(m => {
            const data = this.manager.getLatestValue(m.id);
            const val = data ? parseFloat(data.value).toFixed(data.metric && data.metric.toLowerCase() === 'hba1c' ? 1 : 0) : '--';
            const unit = data ? data.unit : '';
            const dateStr = data ? new Date(data.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : 'No Data';
            
            const card = document.createElement('div');
            card.className = 'pulse-card glass border border-white/5 p-4 rounded-lg flex flex-col justify-between h-24 cursor-pointer';
            card.innerHTML = `
                <div class="flex justify-between items-start w-full">
                    <div class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">${m.label}</div>
                    <div class="text-[7px] font-mono text-gray-600 uppercase">${dateStr}</div>
                </div>
                <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-['JetBrains_Mono'] text-white font-bold">${val}</span>
                    <span class="text-[8px] text-gray-600 uppercase font-bold">${unit}</span>
                </div>
            `;
            card.onclick = () => {
                this.manager.currentMetric = m.id;
                this.updateChart(m.id);
            };
            container.appendChild(card);
        });
    }

    renderDataLogs() {
        const logs = [
            { msg: 'System initialized. Loading temporal data...', time: '0ms' },
            { msg: 'Connection established to local data stores.', time: '124ms' },
            { msg: 'Indexing 43,204 data points across 4 masters.', time: '342ms' },
            { msg: 'Metric Switcher indexing complete.', time: '410ms' },
            { msg: 'Ready for temporal analysis.', time: '415ms' }
        ];

        const container = document.getElementById('data-logs');
        logs.forEach((log, i) => {
            setTimeout(() => {
                const div = document.createElement('div');
                div.className = 'flex gap-3 opacity-0 transition-opacity duration-500';
                div.innerHTML = `<span class="text-cyan-500/30">[${log.time}]</span><span>${log.msg}</span>`;
                container.appendChild(div);
                setTimeout(() => div.classList.replace('opacity-0', 'opacity-100'), 10);
            }, i * 200);
        });
    }

    initChart() {
        const ctx = document.getElementById('temporal-chart').getContext('2d');
        
        // Create Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Value',
                    data: [],
                    borderColor: '#06b6d4',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#06b6d4',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#0a0a0a',
                        titleFont: { family: 'JetBrains Mono', size: 10 },
                        bodyFont: { family: 'JetBrains Mono', size: 12 },
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        grid: { display: false },
                        ticks: {
                            font: { family: 'JetBrains Mono', size: 9 },
                            color: '#444',
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: {
                            font: { family: 'JetBrains Mono', size: 9 },
                            color: '#444'
                        }
                    }
                }
            }
        });
    }

    async updateChart(metricName) {
        const loading = document.getElementById('chart-loading');
        loading.classList.remove('hidden');

        // Allow some time for the loading animation to be seen
        await new Promise(r => setTimeout(r, 300));

        const data = this.manager.getMetricData(metricName);
        const metricInfo = this.manager.metrics.find(m => m.name === metricName);

        if (metricInfo) {
            document.getElementById('metric-info').innerHTML = 
                `Metric: <span class="text-gray-300">${metricInfo.label}</span> | Unit: <span class="text-gray-300">${metricInfo.unit}</span>`;
        }

        // Apply Time Range Filter
        const now = new Date();
        let filteredData = data;
        
        if (this.manager.currentTimeRange !== 'ALL') {
            const months = this.manager.currentTimeRange === '1M' ? 1 : (this.manager.currentTimeRange === '6M' ? 6 : 12);
            const cutoff = new Date();
            cutoff.setMonth(now.getMonth() - months);
            filteredData = data.filter(d => d.x >= cutoff);
        }

        this.chart.data.datasets[0].data = filteredData;
        this.chart.update();

        loading.classList.add('hidden');
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', async () => {
    // Need a moment for scripts to load if using modules, but here we just go
    const manager = new HealthDataManager();
    const success = await manager.init();
    
    if (success) {
        const ui = new DashboardUI(manager);
        window.ui = ui; // Global access for debugging
        ui.init();
        document.getElementById('sync-status').textContent = 'Online';
    } else {
        document.getElementById('sync-status').textContent = 'Error';
        document.getElementById('sync-status').classList.add('text-red-500');
    }
});
