<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory & Stock Levels</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Inventory & Stock Levels</h1>
            <p class="text-sm text-slate-500 mt-1">Monitor real-time stock quantities and warehouse allocations.</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
            <button onclick="fetchInventoryData()"
                    class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
                </svg>
                Refresh
            </button>

            <!-- Pending Inbound Button with nice color theme -->
            <button onclick="openPendingInboundModal()"
                    class="relative flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 px-4 py-2.5 rounded-lg hover:bg-sky-100 transition-colors duration-150 font-medium shadow-sm">
                <svg class="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                Pending Inbound
                <span id="pendingInboundBadge" class="hidden absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">0</span>
            </button>

            <button onclick="openReceiveStockModal()"
                    class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-colors duration-150 font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Receive Stock
            </button>
            <button onclick="openDispatchStockModal()"
                    class="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg hover:bg-amber-700 shadow-sm shadow-amber-600/20 transition-colors duration-150 font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4m16 0l-6-6m6 6l-6 6"/>
                </svg>
                Dispatch Stock
            </button>
            <button onclick="openAddProductModal()"
                    class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors duration-150 font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Add Product
            </button>
        </div>
    </header>

    <!-- Filter Section with Search & Assigned Warehouse Dropdown -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
            <!-- Search bar -->
            <div class="relative flex-1">
                <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" id="inventorySearchInput" oninput="applyInventoryFilters()"
                       placeholder="Search product title or SKU..."
                       class="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
            </div>

            <!-- Assigned Warehouse Filter Dropdown -->
            <div class="w-full sm:w-64">
                <select id="warehouseFilterSelect" onchange="applyInventoryFilters()"
                        class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                    <option value="ALL">All Assigned Warehouses</option>
                </select>
            </div>
        </div>

        <div class="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button type="button" onclick="filterByStatus('ALL')"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                All Stock
            </button>
            <button type="button" onclick="filterByStatus('LOW_STOCK')"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                Low Stock Alerts
            </button>
        </div>
    </div>

    <!-- Inventory Table -->
    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                <tr>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Title</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU / Barcode</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse Name</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity on Hand</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
                </thead>
                <tbody id="inventoryTableBody" class="divide-y divide-slate-100"></tbody>
            </table>
        </div>

        <div id="inventoryEmptyState" class="hidden py-12 text-center text-slate-400 text-sm">
            No inventory items found.
        </div>

        <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <div class="text-sm text-slate-500" id="inventoryTableInfo">
                Showing 0-0 of 0 items
            </div>
            <div class="flex items-center gap-2">
                <button id="inventoryPrevBtn" onclick="changeInventoryPage(-1)"
                        class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    Previous
                </button>
                <button id="inventoryNextBtn" onclick="changeInventoryPage(1)"
                        class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    Next
                </button>
            </div>
        </div>
    </div>
</main>

<div id="toastContainer" class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

<!-- Modals -->
<div id="addProductModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-1">
            <h2 class="text-xl font-bold text-slate-800">Add New Global Product</h2>
            <button type="button" onclick="closeAddProductModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="text-sm text-slate-500 mb-6">Create a master product available across the entire system.</p>

        <form id="addProductForm" onsubmit="submitGlobalProduct(event)" class="space-y-4">
            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Product Title</label>
                <input type="text" id="globalProductTitle" required placeholder="e.g. Wireless Headphone"
                       class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Unit Price (LKR)</label>
                    <input type="number" step="0.01" id="globalProductPrice" required placeholder="0.00"
                           class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">SKU / Barcode</label>
                    <input type="text" id="globalProductSku" required readonly
                           class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
                </div>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea id="globalProductDescription" rows="2" placeholder="Product description..."
                          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeAddProductModal()"
                        class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                    Cancel
                </button>
                <button type="submit"
                        class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium text-sm">
                    Save Product
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 1. Pending Inbound Modal -->
<div id="pendingInboundModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
                Pending Inbound Transfers
            </h2>
            <button type="button" onclick="closePendingInboundModal()" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="text-sm text-slate-500 mb-4">Review and accept incoming stock transfers dispatched from other warehouses.</p>

        <div id="pendingInboundListContainer" class="max-h-64 overflow-y-auto space-y-2">
            <div class="p-4 text-xs text-slate-400 text-center">Loading pending transfers...</div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100 mt-6">
            <button type="button" onclick="closePendingInboundModal()"
                    class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                Close
            </button>
        </div>
    </div>
</div>

<!-- 2. Receive Stock From Vendor Modal -->
<div id="receiveStockModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Receive Stock From Vendor
            </h2>
            <button type="button" onclick="closeReceiveStockModal()" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="text-sm text-slate-500 mb-4">Receive new stock directly from vendors using purchase order references.</p>

        <form id="receiveStockForm" onsubmit="submitReceiveFromVendor(event)" class="space-y-4">
            <input type="hidden" id="vendorWarehouseId" value="1">

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Select Product SKU</label>
                <select id="vendorProductSelect" required class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">-- Select SKU --</option>
                </select>
            </div>

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Received Quantity</label>
                <input type="number" id="vendorReceiveQuantity" min="1" required placeholder="Qty"
                       class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">PO Reference Number (GRN Remarks)</label>
                <input type="text" id="vendorPoReference" placeholder="e.g. PO-2026-001"
                       class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeReceiveStockModal()"
                        class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                    Cancel
                </button>
                <button type="submit"
                        class="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-medium text-sm">
                    Confirm Receipt
                </button>
            </div>
        </form>
    </div>
</div>

<div id="dispatchStockModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2.5">
                <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4m16 0l-6-6m6 6l-6 6"/>
                    </svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800">Dispatch & Adjust</h2>
            </div>
            <button type="button" onclick="closeDispatchStockModal()" class="text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="text-sm text-slate-500 mb-4">Manage stock dispatch, transfers and adjustments.</p>

        <form id="dispatchStockForm" onsubmit="submitDispatchStock(event)" class="space-y-4">
            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Action Type</label>
                <select id="dispatchActionType" onchange="handleActionTypeChange()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="DISPATCH">Dispatch Out</option>
                    <option value="TRANSFER">Transfer to Main WH</option>
                    <option value="DAMAGE">Report Damage</option>
                </select>
            </div>

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Select Product</label>
                <input type="hidden" id="dispatchProductSelect" required>
                <div class="relative">
                    <div id="customDropdownTrigger" onclick="toggleCustomDropdown(event)"
                         class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-amber-500">
                        <span id="customDropdownSelectedText" class="text-slate-400">-- Select SKU --</span>
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                    <div id="customDropdownMenu" class="hidden absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <div class="p-2 border-b border-slate-100 sticky top-0 bg-white">
                            <input type="text" id="customDropdownSearch" oninput="filterCustomDropdownOptions(this.value)"
                                   placeholder="Search SKU or Name..."
                                   class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500">
                        </div>
                        <div id="customDropdownOptionsList" class="p-1"></div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Quantity to Remove</label>
                <input type="number" id="dispatchQuantity" min="1" required placeholder="Enter positive number"
                       class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>

            <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                <textarea id="dispatchRemarks" rows="2" placeholder="Add optional notes or reasons..."
                          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeDispatchStockModal()"
                        class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">
                    Cancel
                </button>
                <button type="submit"
                        class="px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm font-medium text-sm w-full">
                    Execute Action
                </button>
            </div>
        </form>
    </div>
</div>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>

<script src="${pageContext.request.contextPath}/assets/js/inventory-dashboard.js"></script>
</body>
</html>
