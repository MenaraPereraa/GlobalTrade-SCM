<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customs Overview &mdash; Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Customs Overview</h1>
            <p class="text-sm text-slate-500 mt-1">Dashboard view of all customs declarations and clearance status.</p>
        </div>
        <button onclick="loadCustomsOverview()"
                class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Total Declarations</p>
            <h3 id="summaryTotalDeclarations" class="text-3xl font-bold text-slate-800 mt-3">&mdash;</h3>
            <p class="text-xs text-slate-400 mt-1">All time records</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Pending Review</p>
            <h3 id="summaryPendingCount" class="text-3xl font-bold text-amber-600 mt-3">&mdash;</h3>
            <p class="text-xs text-slate-400 mt-1">Awaiting clearance</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Cleared</p>
            <h3 id="summaryClearedCount" class="text-3xl font-bold text-emerald-600 mt-3">&mdash;</h3>
            <p class="text-xs text-slate-400 mt-1">Successfully processed</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Rejected</p>
            <h3 id="summaryRejectedCount" class="text-3xl font-bold text-red-600 mt-3">&mdash;</h3>
            <p class="text-xs text-slate-400 mt-1">Declarations rejected</p>
        </div>
    </div>

    <!-- Recent Declarations -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200">
            <h2 class="text-lg font-bold text-slate-800">Recent Declarations</h2>
            <p class="text-sm text-slate-500 mt-1">Latest customs document submissions</p>
        </div>
        <div id="recentDeclarationsContainer" class="divide-y divide-slate-100">
            <div class="px-6 py-8 text-center text-slate-500">
                <p class="text-sm font-medium">Loading declarations...</p>
            </div>
        </div>
    </div>

    <div id="toastContainer" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"></div>
</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/customs-dashboard.js"></script>
</body>
</html>