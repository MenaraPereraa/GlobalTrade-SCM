<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customs Declarations â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Customs Declarations Management</h1>
            <p class="text-sm text-slate-500 mt-1">All import/export declarations across shipments.</p>
        </div>
        <button onclick="fetchDeclarations()"
                class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <!-- Status Filter -->
    <div id="declarationStatusFilters" class="mb-6 flex flex-wrap gap-2">
        <button type="button" onclick="setStatusFilter('')" data-status=""
                class="status-filter-chip inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-indigo-600 text-white border-indigo-600">
            All
        </button>
        <button type="button" onclick="setStatusFilter('PENDING')" data-status="PENDING"
                class="status-filter-chip inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-slate-600 border-slate-200">
            Pending
        </button>
        <button type="button" onclick="setStatusFilter('APPROVED')" data-status="APPROVED"
                class="status-filter-chip inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-slate-600 border-slate-200">
            Approved
        </button>
        <button type="button" onclick="setStatusFilter('REJECTED')" data-status="REJECTED"
                class="status-filter-chip inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white text-slate-600 border-slate-200">
            Rejected
        </button>
    </div>

    <!-- Search -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
        <div class="relative flex-1">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="Search by doc ID, shipment ID, type, or status..."
                   class="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
        </div>
    </div>

    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doc ID</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Shipment ID</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Declaration Type</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Clearance Date</th>
            </tr>
            </thead>
            <tbody id="declarationsTableBody" class="divide-y divide-slate-100">
            <!-- Rows injected by declarations.js -->
            </tbody>
        </table>
    </div>
</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/declarations.js"></script>
</body>
</html>
