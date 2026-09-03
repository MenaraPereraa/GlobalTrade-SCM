<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Central Demand Pool - Global Trade</title>
    <!-- Tailwind CSS CDN -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 flex min-h-screen overflow-hidden">

<!-- Sidebar Fragment -->
<%@ include file="../fragments/sidebar.jsp" %>

<!-- Main Content Area -->
<div class="flex-1 flex flex-col overflow-y-auto">
    <main class="flex-1 p-8">
        <div class="max-w-6xl mx-auto space-y-6">

            <!-- Page Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">Central Demand Pool</h1>
                    <p class="text-sm text-slate-500 mt-0.5">Review pending warehouse requisitions and generate sourcing RFQs.</p>
                </div>
                <button onclick="loadDemandPoolData()" class="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all">
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Refresh
                </button>
            </div>

            <!-- Table Container with Pagination Support -->
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th class="py-3.5 px-6">REQ ID & DATE</th>
                            <th class="py-3.5 px-6">FACILITY</th>
                            <th class="py-3.5 px-6">SKU / ITEM</th>
                            <th class="py-3.5 px-6">SUGGESTED QTY</th>
                            <th class="py-3.5 px-6">TRIGGER SOURCE</th>
                            <th class="py-3.5 px-6 text-right">ACTION</th>
                        </tr>
                        </thead>
                        <tbody id="demandPoolTableBody" class="divide-y divide-slate-100 text-sm">
                        <!-- Paginated Data injected here -->
                        </tbody>
                    </table>
                </div>
                <!-- Pagination Footer injected dynamically -->
            </div>

        </div>
    </main>
</div>

<!-- External JavaScript File link -->
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/central-demand-pool.js"></script>
</body>
</html>
