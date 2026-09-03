<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customs History — Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Customs History</h1>
            <p class="text-sm text-slate-500 mt-1">Review all past clearance decisions and what happened to each shipment.</p>
        </div>
        <button onclick="fetchHistory()"
                class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <!-- Search Bar -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <div class="relative flex-1">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" id="historySearchInput" placeholder="Search by PO, clearance ID, vendor, or product..."
                   class="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
        </div>
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PO / Clearance</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor / Product</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviewed</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</th>
            </tr>
            </thead>
            <tbody id="historyTableBody" class="divide-y divide-slate-100">
            <!-- Rows injected dynamically -->
            </tbody>
        </table>
    </div>
</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/history.js"></script>
</body>
</html>