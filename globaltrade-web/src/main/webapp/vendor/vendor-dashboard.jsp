<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Overview â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight" id="vendorCompanyName">Vendor Portal</h1>
            <p class="text-sm text-slate-500 mt-1">A quick look at what needs your attention today.</p>
        </div>
        <button onclick="loadDashboardOverview()"
                class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Pending Requests</p>
            <h3 id="summaryPendingCount" class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Awaiting fulfillment</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Latest Score</p>
            <h3 id="summaryLatestScore" class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p id="summaryLatestScoreMeta" class="text-xs text-slate-400 mt-1">Composite performance average</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Company Status</p>
            <h3 id="summaryVendorStatus" class="text-xl font-bold text-slate-800 mt-3">â€”</h3>
            <p id="summaryVendorMeta" class="text-xs text-slate-400 mt-1">â€”</p>
        </div>
    </div>

    <!-- Quick Actions / Alerts -->
    <section class="mb-8">
        <div id="quickActionsContainer" class="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <!-- populated by JS -->
        </div>
    </section>

    <!-- Equal Height Grid for Lower Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        <!-- Recent Replenishment Requests -->
        <section class="lg:col-span-3 flex flex-col h-full">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800">Recent Replenishment Requests</h2>
            </div>
            <div id="recentRequestsList" class="bg-white shadow-sm rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden flex-1">
                <!-- populated by JS -->
            </div>
        </section>

        <!-- Latest Evaluation -->
        <section class="lg:col-span-2 flex flex-col h-full">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800">Latest Evaluation</h2>
            </div>
            <div id="latestEvaluationCard" class="flex-1 flex flex-col">
                <!-- populated by JS -->
            </div>
        </section>

    </div>
    <div id="toastContainer" class="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none"></div>

</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/vendor-dashboard.js"></script>
</body>
</html>
