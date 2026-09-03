<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Overview” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <script>
        const CONTEXT_PATH = '${pageContext.request.contextPath}';
    </script>
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
            <p class="text-sm text-slate-500 mt-1">A snapshot of vendor activity across the platform.</p>
        </div>
        <button onclick="loadAdminOverview()"
                class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Total Users</p>
            <h3 id="statTotalUsers" class="text-3xl font-bold text-slate-800 mt-3 animate-pulse opacity-50">-</h3>
            <p id="statTotalUsersMeta" class="text-xs text-slate-400 mt-1">&nbsp;</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Active Vendors</p>
            <h3 id="statActiveVendors" class="text-3xl font-bold text-indigo-600 mt-3 animate-pulse opacity-50">-</h3>
            <p id="statActiveVendorsMeta" class="text-xs text-slate-400 mt-1">&nbsp;</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Pending Approvals</p>
            <h3 id="statPendingVendors" class="text-3xl font-bold text-amber-600 mt-3 animate-pulse opacity-50">-</h3>
            <p id="statPendingVendorsMeta" class="text-xs text-slate-400 mt-1">&nbsp;</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">System Errors</p>
            <h3 id="statSystemErrors" class="text-3xl font-bold text-emerald-600 mt-3 animate-pulse opacity-50">0</h3>
            <p id="statSystemErrorsMeta" class="text-xs text-slate-400 mt-1">&nbsp;</p>
        </div>
    </div>

    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
                <h3 class="text-base font-bold text-slate-800">Recent Vendor Registrations</h3>
                <p class="text-xs text-slate-500 mt-0.5">Newly registered vendor accounts pending review.</p>
            </div>
            <a href="vendor-approvals.jsp"
               class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                View All
            </a>
        </div>
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor Name</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
            </thead>
            <tbody id="recentVendorsTableBody" class="divide-y divide-slate-100">
            <tr>
                <td colspan="5" class="px-6 py-10 text-center text-slate-500">Loading recent registrations...</td>
            </tr>
            </tbody>
        </table>
    </div>
</main>

<script src="${pageContext.request.contextPath}/assets/js/admin-overview.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>

</body>
</html>

