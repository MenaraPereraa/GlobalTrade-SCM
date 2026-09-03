<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inbound & Outbound Logistics</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Inbound & Outbound Logistics</h1>
            <p class="text-sm text-slate-500 mt-1">Monitor shipments, supplier deliveries, and customer orders.</p>
        </div>
        <div>
            <button onclick="fetchLogistics()"
                    class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
                </svg>
                Refresh
            </button>
        </div>
    </header>

    <div class="flex gap-2 mb-6 border-b border-slate-200">
        <button id="tabInbound" onclick="switchTab('inbound')"
                class="px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-x border-slate-200 bg-white text-indigo-600 shadow-sm transition">
            Inbound Shipments
        </button>
        <button id="tabOutbound" onclick="switchTab('outbound')"
                class="px-5 py-2.5 rounded-t-xl text-sm font-semibold border border-transparent bg-transparent text-slate-500 hover:text-slate-800 transition">
            Outbound Orders
        </button>
    </div>

    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">

        <div id="statusLegend" class="flex flex-wrap gap-2 w-full lg:w-auto"></div>

        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
            <div id="hubFilterWrapper" class="relative w-full sm:w-56">
                <button type="button" onclick="toggleHubDropdown()"
                        class="w-full py-2.5 px-3.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between transition">
                    <span id="hubFilterLabel" class="truncate">All Hubs</span>
                    <svg class="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
                <div id="hubDropdownPanel" class="hidden absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div class="p-2 border-b border-slate-100">
                        <div class="relative">
                            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <input type="text" id="hubDropdownSearch" oninput="renderHubDropdownList()"
                                   placeholder="Search hub..."
                                   class="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                    </div>
                    <ul id="hubDropdownList" class="max-h-60 overflow-y-auto text-sm divide-y divide-slate-50"></ul>
                </div>
            </div>

            <div class="relative w-full sm:w-44">
                <select id="logisticsStatusFilter" onchange="onFilterChange()"
                        class="w-full py-2.5 px-3.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                    <option value="">All statuses</option>
                </select>
            </div>

            <div class="relative flex-1 sm:w-64">
                <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" id="logisticsSearchInput" oninput="onFilterChange()"
                       placeholder="Search PO or supplier..."
                       class="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
            </div>
        </div>
    </div>

    <!-- Logistics Table & Pagination Container -->
    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span id="logisticsResultCount" class="text-xs font-semibold text-slate-500 uppercase tracking-wider"></span>
        </div>
        <table class="min-w-full divide-y divide-slate-200">
            <thead id="logisticsTableHead" class="bg-slate-50"></thead>
            <tbody id="logisticsTableBody" class="divide-y divide-slate-100"></tbody>
        </table>

        <!-- Pagination Footer (Added here) -->
        <div id="logisticsPagination" class="hidden items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-white">
            <span id="logisticsPaginationInfo" class="text-xs text-slate-500 font-medium">Showing 0-0 of 0 items</span>
            <div class="flex items-center gap-2">
                <button id="logisticsPrevBtn" onclick="goToLogisticsPage(currentPage - 1)"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Previous
                </button>
                <button id="logisticsNextBtn" onclick="goToLogisticsPage(currentPage + 1)"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    Next
                </button>
            </div>
        </div>
    </div>
</main>

<!-- Modals -->
<div id="verifyModal" class="hidden fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h3 id="verifyModalTitle" class="text-lg font-bold text-slate-800 mb-4">Verify Shipment</h3>
        <form onsubmit="submitVerify(event)" class="space-y-4">
            <input type="hidden" id="verifyShipmentId">
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Expected Qty</label>
                <input type="text" id="verifyExpectedQty" disabled class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Received Qty</label>
                <input type="number" id="verifyReceivedQty" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Notes</label>
                <textarea id="verifyNotes" rows="3" class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModals()" class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm">Confirm Verify</button>
            </div>
        </form>
    </div>
</div>

<div id="dispatchModal" class="hidden fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h3 id="dispatchModalTitle" class="text-lg font-bold text-slate-800 mb-4">Dispatch Order</h3>
        <form onsubmit="submitDispatch(event)" class="space-y-4">
            <input type="hidden" id="dispatchOrderId">
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Carrier</label>
                <input type="text" id="dispatchCarrier" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tracking Number</label>
                <input type="text" id="dispatchTracking" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Scheduled Delivery Date</label>
                <input type="date" id="dispatchDate" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModals()" class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm">Confirm Dispatch</button>
            </div>
        </form>
    </div>
</div>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/logistics-dashboard.js"></script>
</body>
</html>
