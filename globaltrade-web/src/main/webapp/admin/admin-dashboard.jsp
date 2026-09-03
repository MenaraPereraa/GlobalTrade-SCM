<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - GlobalTrade Portal</title>
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
            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
            <p class="text-sm text-slate-500 mt-1">System overview and supply chain analytics.</p>
        </div>
        <button onclick="loadAdminOverview()"
                class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-150 font-medium shadow-md text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
                <p class="text-sm text-slate-500 font-medium">Total Users</p>
                <div class="p-2.5 bg-blue-100 rounded-lg">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
            </div>
            <h3 id="statTotalUsers" class="text-3xl font-bold text-slate-800 mt-2">-</h3>
            <p id="statTotalUsersMeta" class="text-xs text-slate-400 mt-2">Active system users</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
                <p class="text-sm text-slate-500 font-medium">Active RFQs</p>
                <div class="p-2.5 bg-indigo-100 rounded-lg">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
            </div>
            <h3 id="statActiveRFQs" class="text-3xl font-bold text-indigo-600 mt-2">-</h3>
            <p class="text-xs text-slate-400 mt-2">Requests for quotation</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
                <p class="text-sm text-slate-500 font-medium">Pending Orders</p>
                <div class="p-2.5 bg-amber-100 rounded-lg">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10l-8-4V7m8 14v-6M7 11l-2 1m0 0l-2-1m2 1v4m6-12l2-1m0 0l2 1m-2-1v4"/></svg>
                </div>
            </div>
            <h3 id="statPendingOrders" class="text-3xl font-bold text-amber-600 mt-2">-</h3>
            <p class="text-xs text-slate-400 mt-2">Purchase orders</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
                <p class="text-sm text-slate-500 font-medium">In Transit</p>
                <div class="p-2.5 bg-emerald-100 rounded-lg">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
                </div>
            </div>
            <h3 id="statInTransit" class="text-3xl font-bold text-emerald-600 mt-2">-</h3>
            <p class="text-xs text-slate-400 mt-2">Shipments</p>
        </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- RFQ Status Distribution -->
        <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-800">RFQ Status Distribution</h3>
                <p class="text-xs text-slate-500 mt-0.5">Current state of all active RFQs</p>
            </div>
            <div class="p-6" style="height: 300px;">
                <canvas id="rfqStatusChart"></canvas>
            </div>
        </div>

        <!-- Order Status Flow -->
        <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-800">Purchase Order Status</h3>
                <p class="text-xs text-slate-500 mt-0.5">PO lifecycle distribution</p>
            </div>
            <div class="p-6" style="height: 300px;">
                <canvas id="poStatusChart"></canvas>
            </div>
        </div>

        <!-- Shipment Tracking -->
        <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-800">Shipment Status</h3>
                <p class="text-xs text-slate-500 mt-0.5">Logistics overview</p>
            </div>
            <div class="p-6" style="height: 300px;">
                <canvas id="shipmentStatusChart"></canvas>
            </div>
        </div>

        <!-- Inventory Levels -->
        <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
                <h3 class="text-base font-bold text-slate-800">Warehouse Inventory Health</h3>
                <p class="text-xs text-slate-500 mt-0.5">Stock levels by warehouse</p>
            </div>
            <div class="p-6" style="height: 300px;">
                <canvas id="inventoryChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Recent Activity Table -->
    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
                <h3 class="text-base font-bold text-slate-800">Recent Transactions</h3>
                <p class="text-xs text-slate-500 mt-0.5">Latest system activities</p>
            </div>
            <a href="audit-logs.jsp"
               class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                View All Logs
            </a>
        </div>
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
            </thead>
            <tbody id="recentActivityTableBody" class="divide-y divide-slate-100">
            <tr>
                <td colspan="4" class="px-6 py-10 text-center text-slate-500">Loading recent activities...</td>
            </tr>
            </tbody>
        </table>
    </div>
</main>

<script src="${pageContext.request.contextPath}/assets/js/admin-overview.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>

</body>
</html>
