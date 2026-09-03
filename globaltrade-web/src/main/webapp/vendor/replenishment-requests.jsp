<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Replenishment Requests & Orders â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <script>
        tailwind.config = {
            theme: { extend: { fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] } } }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<div class="flex-1 flex flex-col min-w-0">

    <header class="sticky top-0 z-30 bg-[#0f1629] h-16 flex items-center px-8 gap-4 shadow-md shrink-0">
        <div class="flex-1">
            <p class="text-xs text-slate-500 font-medium">Vendor Portal</p>
            <h2 class="text-white font-bold text-sm leading-tight">Replenishment Requests & Orders</h2>
        </div>
        <button onclick="fetchReplenishmentRequests()"
                class="flex items-center gap-2 bg-white/8 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white px-4 py-2 rounded-xl font-semibold text-xs transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh
        </button>
    </header>

    <main class="flex-1 p-8 max-w-7xl mx-auto w-full">
        <nav class="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <span class="hover:text-slate-600 cursor-pointer transition">Vendor Dashboard</span>
            <svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            <span class="text-slate-600 font-medium">Replenishment Requests</span>
        </nav>

        <div class="flex items-start justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Replenishment Requests</h1>
                <p class="text-slate-500 text-sm mt-1">Track incoming inventory requests and order statuses from connected warehouses.</p>
            </div>
            <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-xl">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Direct Shipped Feature Replaced with RFQ Bidding Flow
            </div>
        </div>

        <!-- Status Summary Strip -->
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending / Review</p>
                    <span id="statCountPending" class="text-xl font-bold text-amber-500 mt-1 block">â€”</span>
                </div>
                <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fulfilled / Accepted</p>
                    <span id="statCountFulfilled" class="text-xl font-bold text-emerald-500 mt-1 block">â€”</span>
                </div>
                <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancelled / Rejected</p>
                    <span id="statCountCancelled" class="text-xl font-bold text-rose-500 mt-1 block">â€”</span>
                </div>
                <div class="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
                    <input type="text" id="requestSearchInput" placeholder="Request #, warehouse, or product ID..."
                           class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select id="requestStatusSelect"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                        <option value="">All Statuses</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
                    <input type="date" id="requestDateFrom"
                           class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
                    <input type="date" id="requestDateTo"
                           class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                </div>
            </div>
            <div class="flex justify-end mt-4">
                <button onclick="clearRequestFilters()" class="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">Clear filters</button>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                    <th class="px-6 py-3.5 text-left">Request #</th>
                    <th class="px-6 py-3.5 text-left">Warehouse</th>
                    <th class="px-6 py-3.5 text-left">Product ID</th>
                    <th class="px-6 py-3.5 text-right">Quantity</th>
                    <th class="px-6 py-3.5 text-left">Status</th>
                    <th class="px-6 py-3.5 text-left">Requested Date</th>
                    <th class="px-6 py-3.5 text-right">Action / Flow</th>
                </tr>
                </thead>
                <tbody id="requestsTableBody" class="divide-y divide-slate-100"></tbody>
            </table>
        </div>

        <!-- Review Modal -->
        <div id="requestReviewModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-1">Review Request <span id="reviewRequestId"></span></h3>
                <p class="text-sm text-slate-500 mb-5">Inspect request details. Vendor fulfillment is handled via RFQ bidding and procurement channels.</p>
                <dl class="space-y-3 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div class="flex justify-between"><dt class="text-slate-500">Warehouse</dt><dd id="reviewWarehouse" class="font-medium text-slate-800"></dd></div>
                    <div class="flex justify-between"><dt class="text-slate-500">Product ID</dt><dd id="reviewProductId" class="font-medium text-slate-800 font-mono"></dd></div>
                    <div class="flex justify-between"><dt class="text-slate-500">Quantity</dt><dd id="reviewQuantity" class="font-medium text-slate-800 font-mono"></dd></div>
                    <div class="flex justify-between"><dt class="text-slate-500">Requested</dt><dd id="reviewRequested" class="font-medium text-slate-800"></dd></div>
                </dl>
                <div class="flex items-center justify-end gap-3">
                    <button onclick="closeReviewModal()" class="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">Close</button>
                    <button onclick="confirmRejectFromModal()" class="px-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition">Reject Request</button>
                </div>
            </div>
        </div>

        <div id="toastContainer" class="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none"></div>
    </main>
</div>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>

<script src="${pageContext.request.contextPath}/assets/js/replenishment-requests.js"></script>
</body>
</html>

