<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Coordinator Dashboard â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 flex min-h-screen">

<!-- Sidebar à¶‘à¶š à¶‡à¶­à·”à·…à¶­à·Š à¶šà·’à¶»à·“à¶¸ -->
<%@ include file="../fragments/sidebar.jsp" %>

<!-- Main Content Area -->
<main class="flex-1 p-8 overflow-y-auto">
    <div class="max-w-7xl mx-auto space-y-6">

        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-slate-900">Coordinator Control Center</h1>
                <p class="text-sm text-slate-500">A quick overview of system exceptions, customs status, and global shipments.</p>
            </div>
            <button onclick="loadCoordinatorData()" class="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
            </button>
        </div>

        <!-- Panels Grid (Modern Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> System Exceptions
                    </h2>
                </div>
                <div id="exceptionsContainer" class="space-y-2 text-sm text-slate-600">Loading exceptions...</div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Customs Status
                    </h2>
                </div>
                <div id="customsContainer" class="space-y-2 text-sm text-slate-600">Loading customs status...</div>
            </div>
        </div>

        <!-- Table Section with Search & Filter -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 class="font-bold text-slate-900 text-base">Global Shipments Overview</h3>

                <!-- Search and Status Filter Controls -->
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </span>
                        <input type="text" id="shipmentSearchInput" placeholder="Search tracking or carrier..." class="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64">
                    </div>

                    <select id="shipmentStatusFilter" class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600">
                        <option value="">All Statuses</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="CUSTOMS">Customs</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="PENDING">Pending</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                    <tr class="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th class="px-6 py-4 font-semibold">Tracking #</th>
                        <th class="px-6 py-4 font-semibold">Route</th>
                        <th class="px-6 py-4 font-semibold">Carrier</th>
                        <th class="px-6 py-4 font-semibold">Status</th>
                    </tr>
                    </thead>
                    <tbody id="shipmentsTableBody" class="divide-y divide-slate-100">
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/coordinator-center.js"></script>
</body>
</html>
