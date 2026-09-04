<%@ page contentType="text/html;charset=UTF-8" language="java" isELIgnored="false" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NFR Metrics - GlobalTrade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        const CONTEXT_PATH = '${pageContext.request.contextPath}';
    </script>
</head>
<body class="bg-slate-100 min-h-screen flex">

<jsp:include page="../fragments/sidebar.jsp"/>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">NFR Metrics</h1>
            <p class="text-sm text-slate-500 mt-1">Live telemetry of JVM resources and EJB container performance.</p>
        </div>
        <div class="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2.5 rounded-lg text-xs font-bold">
            <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Connection
        </div>
    </header>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <div class="p-2.5 bg-indigo-100 rounded-lg">
                        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                        </svg>
                    </div>
                    <p class="text-sm text-slate-500 font-medium">CPU Usage</p>
                </div>
                <span id="cpuTrend" class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">—</span>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-2 mb-3">
                <span id="cpuVal">0.0</span><span class="text-lg font-medium text-slate-400">%</span>
            </h3>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div id="cpuBar" class="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style="width: 0%"></div>
            </div>
            <p class="text-xs text-slate-400 mt-2">Processor utilisation</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-2 mb-4">
                <div class="p-2.5 bg-emerald-100 rounded-lg">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    </svg>
                </div>
                <p class="text-sm text-slate-500 font-medium">Thread Concurrency</p>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-2 mb-1" id="threadVal">0</h3>
            <p class="text-xs text-slate-400 mb-3">Active threads</p>
            <div class="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                <p class="text-xs font-bold text-emerald-600">Peak: <span id="peakThreadVal">0</span> threads</p>
            </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-2 mb-4">
                <div class="p-2.5 bg-amber-100 rounded-lg">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                    </svg>
                </div>
                <p class="text-sm text-slate-500 font-medium">JVM Heap Memory</p>
            </div>
            <div class="flex items-end justify-between mb-3">
                <h3 class="text-3xl font-bold text-slate-800">
                    <span id="heapVal">0.0</span><span class="text-base font-medium text-slate-400"> MB</span>
                </h3>
                <p class="text-xs text-slate-400 font-medium">Max: <span id="maxHeapVal" class="font-bold text-slate-600">0.0</span> MB</p>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div id="heapBar" class="bg-amber-500 h-2 rounded-full transition-all duration-1000" style="width: 0%"></div>
            </div>
            <p class="text-xs text-slate-400 mt-2" id="heapPct">0% of max heap used</p>
        </div>

    </div>

    <!-- Live Chart -->
    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden mb-8">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
                <h3 class="text-base font-bold text-slate-800">Real-Time Resource Utilisation</h3>
                <p class="text-xs text-slate-500 mt-0.5">Updates every 5 seconds</p>
            </div>
            <div class="flex items-center gap-4 text-xs font-semibold">
                <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span class="text-slate-500">CPU %</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span class="text-slate-500">Threads</span>
                </div>
            </div>
        </div>
        <div class="p-6" style="height: 280px;">
            <canvas id="nfrLiveChart"></canvas>
        </div>
    </div>

    <!-- Session Info -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Last Updated</p>
            <p class="text-lg font-bold text-slate-800" id="lastUpdated">—</p>
            <p class="text-xs text-slate-400 mt-1">Auto-refreshes every 5s</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Data Points</p>
            <p class="text-lg font-bold text-slate-800" id="dataPoints">0</p>
            <p class="text-xs text-slate-400 mt-1">Samples collected this session</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Connection</p>
            <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <p class="text-lg font-bold text-emerald-600">Active</p>
            </div>
            <p class="text-xs text-slate-400 mt-1">REST API streaming</p>
        </div>
    </div>

</main>

<script>
    let dataPointCount = 0;

    const ctx = document.getElementById('nfrLiveChart').getContext('2d');
    const liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU Usage (%)',
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    data: [],
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2
                },
                {
                    label: 'Active Threads',
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    data: [],
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                }
            },
            animation: { duration: 600 }
        }
    });

    function updateNFRMetrics() {
        const url = window.location.origin + "/globaltrade/api/admin/nfr-metrics";

        console.log("Fetching NFR metrics from:", url);

        let fetchCall;
        if (typeof fetchWithAuth === 'function') {
            fetchCall = fetchWithAuth(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } else {
            const token = typeof getCookie === 'function' ? getCookie('accessToken') : '';
            fetchCall = fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': token ? 'Bearer ' + token : '',
                    'Content-Type': 'application/json'
                }
            });
        }

        fetchCall
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errText => {
                        throw new Error(`HTTP Error: ${response.status} - ${errText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("NFR Metrics received:", data);

                // --- UI Update Logic ---
                document.getElementById('cpuVal').innerText = data.cpuUsage.toFixed(1);
                document.getElementById('cpuBar').style.width = data.cpuUsage + '%';
                document.getElementById('cpuBar').className = 'h-2 rounded-full transition-all duration-1000 ' +
                    (data.cpuUsage > 80 ? 'bg-red-500' : data.cpuUsage > 50 ? 'bg-amber-500' : 'bg-indigo-500');

                document.getElementById('cpuTrend').innerText = data.cpuUsage > 80 ? 'High' : data.cpuUsage > 50 ? 'Medium' : 'Normal';
                document.getElementById('cpuTrend').className = 'text-xs font-bold px-2 py-0.5 rounded-full ' +
                    (data.cpuUsage > 80 ? 'bg-red-50 text-red-600' : data.cpuUsage > 50 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600');

                document.getElementById('threadVal').innerText = data.activeThreads;
                document.getElementById('peakThreadVal').innerText = data.peakThreads;

                document.getElementById('heapVal').innerText = data.usedHeap.toFixed(1);
                document.getElementById('maxHeapVal').innerText = data.maxHeap.toFixed(1);
                document.getElementById('heapBar').style.width = data.heapPercent + '%';
                document.getElementById('heapPct').innerText = data.heapPercent.toFixed(1) + '% of max heap used';

                const now = new Date();
                const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
                document.getElementById('lastUpdated').innerText = time;

                liveChart.data.labels.push(time);
                liveChart.data.datasets[0].data.push(data.cpuUsage);
                liveChart.data.datasets[1].data.push(data.activeThreads);

                if (liveChart.data.labels.length > 15) {
                    liveChart.data.labels.shift();
                    liveChart.data.datasets[0].data.shift();
                    liveChart.data.datasets[1].data.shift();
                }

                liveChart.update();
                dataPointCount++;
                document.getElementById('dataPoints').innerText = dataPointCount;
            })
            .catch(error => {
                console.error("NFR fetch error:", error);
            });
    }

    updateNFRMetrics();
    setInterval(updateNFRMetrics, 5000);
</script>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>

</body>
</html>