<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customs Audit Trail â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Customs Audit Trail</h1>
            <p class="text-sm text-slate-500 mt-1">Compliance record of every customs clearance and rejection.</p>
        </div>
        <button onclick="fetchAuditTrail()"
                class="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
            Refresh
        </button>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Total Events</p>
            <h3 id="summaryTotalCount" class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Logged checkpoints</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Cleared</p>
            <h3 id="summaryClearedCount" class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Declarations approved</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Rejected</p>
            <h3 id="summaryRejectedCount" class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Declarations rejected</p>
        </div>
    </div>

    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div class="relative flex-1">
            <input type="text" id="auditSearchInput"
                   placeholder="Search by status or remarks..."
                   class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
        </div>
        <div class="flex items-center gap-2 sm:w-52">
            <select id="auditStatusFilter"
                    class="w-full py-2.5 px-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                <option value="">All Events</option>
                <option value="cleared">Cleared</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>
    </div>

    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
            </tr>
            </thead>
            <tbody id="auditTableBody" class="divide-y divide-slate-100">
            </tbody>
        </table>
    </div>
</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/customs-audit-trail.js"></script>
</body>
</html>
