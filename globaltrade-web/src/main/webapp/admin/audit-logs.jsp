<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Logs - Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-100 min-h-screen flex font-sans antialiased text-slate-800">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs</h1>
            <p class="text-sm text-slate-500 mt-1">Complete system activity and security audit trail.</p>
        </div>
        <button onclick="fetchAuditTrail()"
                class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm text-sm">
            <i class="fa-solid fa-rotate"></i>
            Refresh
        </button>
    </header>

    <div class="space-y-8">
        <!-- Stat Cards (Customs UI style) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p class="text-sm font-medium text-slate-500">Total Events</p>
                <h3 class="text-3xl font-bold text-slate-800 mt-2" id="summaryTotalCount">0</h3>
                <p class="text-xs text-slate-400 mt-1">Logged checkpoints</p>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p class="text-sm font-medium text-slate-500">Cleared / Approved</p>
                <h3 class="text-3xl font-bold text-emerald-600 mt-2" id="summaryClearedCount">0</h3>
                <p class="text-xs text-slate-400 mt-1">Successful actions</p>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p class="text-sm font-medium text-slate-500">Rejected / Failed</p>
                <h3 class="text-3xl font-bold text-red-600 mt-2" id="summaryRejectedCount">0</h3>
                <p class="text-xs text-slate-400 mt-1">Rejected actions</p>
            </div>
        </div>

        <!-- Search and Filter Bar -->
        <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-4">
            <div class="flex-1 min-w-[240px] relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <i class="fa-solid fa-search"></i>
                </span>
                <input type="text" id="auditSearchInput" placeholder="Search by user, status or remarks..." class="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
            </div>

            <div class="w-48">
                <select id="auditStatusFilter" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
                    <option value="">All Events</option>
                    <option value="cleared">Cleared / Success</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
        </div>

        <!-- Table Section -->
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                    <tr class="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                        <th class="py-4 px-6">Timestamp</th>
                        <th class="py-4 px-6">User</th>
                        <th class="py-4 px-6">Status</th>
                        <th class="py-4 px-6">Event</th>
                        <th class="py-4 px-6">Remarks</th>
                    </tr>
                    </thead>
                    <tbody id="auditTableBody" class="divide-y divide-slate-100 text-sm">
                    <!-- Dynamic Rows Rendered Here -->
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
<script src="${pageContext.request.contextPath}/assets/js/audit-logs-admin.js"></script>

</html>

