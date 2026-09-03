<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warehouse Reports</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Utilization & Alerts</h1>
            <p class="text-sm text-slate-500 mt-1">Analytics and capacity reports for warehouses.</p>
        </div>
        <button class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
            </svg>
            Export Report
        </button>
    </header>

    <!-- Alert Banner -->
    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <div class="p-1.5 rounded-lg bg-amber-100 shrink-0">
            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
        </div>
        <div>
            <p class="text-sm font-semibold text-amber-800">No active alerts</p>
            <p class="text-xs text-amber-700 mt-0.5">Capacity and stock-level alerts will surface here once thresholds are configured.</p>
        </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Avg. Utilization</p>
                <div class="p-2 rounded-lg bg-indigo-50">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Across all warehouses</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Near Capacity</p>
                <div class="p-2 rounded-lg bg-amber-50">
                    <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Warehouses above 90%</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Low Stock Items</p>
                <div class="p-2 rounded-lg bg-red-50">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Below reorder threshold</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Reports Generated</p>
                <div class="p-2 rounded-lg bg-emerald-50">
                    <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">This month</p>
        </div>
    </div>

    <!-- Chart Placeholders -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">Capacity Trend</h2>
            <p class="text-xs text-slate-400 mt-0.5 mb-6">Utilization over time across all facilities</p>
            <div class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <svg class="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 15l4-6 4 3 5-8"/>
                </svg>
                <p class="text-sm text-slate-400">Chart will appear once report data is available</p>
            </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">Alerts by Warehouse</h2>
            <p class="text-xs text-slate-400 mt-0.5 mb-6">Distribution of active alerts</p>
            <div class="h-56 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <svg class="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3a9 9 0 010 18"/>
                </svg>
                <p class="text-sm text-slate-400 px-6 text-center">No alert data yet</p>
            </div>
        </div>
    </div>
</main>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
</body>
</html>

