<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Purchase Orders â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 flex min-h-screen">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 overflow-y-auto">
    <div class="max-w-7xl mx-auto space-y-6">

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-slate-900">Purchase Orders Management</h1>
                <p class="text-sm text-slate-500">Create and monitor procurement orders issued to global vendors.</p>
            </div>
            <button onclick="openCreateOrderModal()" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-600/30 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                Create Order
            </button>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-4" id="statusTabs">
            <button onclick="filterOrders('ALL')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white transition-all tab-btn" data-status="ALL">All Orders</button>
            <button onclick="filterOrders('PENDING')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all tab-btn" data-status="PENDING">Pending</button>
            <button onclick="filterOrders('APPROVED')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all tab-btn" data-status="APPROVED">Approved</button>
            <button onclick="filterOrders('SHIPPED')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all tab-btn" data-status="SHIPPED">Shipped</button>
            <button onclick="filterOrders('COMPLETED')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all tab-btn" data-status="COMPLETED">Completed</button>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                    <tr class="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                        <th class="px-6 py-4 font-semibold">Order ID</th>
                        <th class="px-6 py-4 font-semibold">Vendor Name</th>
                        <th class="px-6 py-4 font-semibold">Order Date</th>
                        <th class="px-6 py-4 font-semibold">Total Amount</th>
                        <th class="px-6 py-4 font-semibold">Status</th>
                        <th class="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody id="purchaseOrdersTableBody" class="divide-y divide-slate-100">
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</main>

<div id="createOrderModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">

        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 class="font-bold text-slate-900 text-lg">Create New Purchase Order</h3>
            <button type="button" onclick="closeCreateOrderModal()" class="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>

        <form id="createOrderForm" onsubmit="submitPurchaseOrder(event)" class="space-y-4">

            <div class="relative">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Vendor</label>
                <input type="hidden" id="poVendorId" required>

                <button type="button" id="vendorSelectBtn" onclick="toggleVendorDropdown()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-left text-slate-500 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <span id="vendorSelectLabel">Search & select vendor from database...</span>
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>

                <div id="vendorDropdownMenu" class="hidden absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2">
                    <input type="text" id="vendorSearchInput" onkeyup="filterVendors()" placeholder="Type to search vendor..." class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <div id="vendorList" class="max-h-48 overflow-y-auto divide-y divide-slate-100">
                    </div>
                </div>
            </div>

            <div class="relative">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Product</label>
                <input type="hidden" id="poProductId" required>

                <button type="button" id="productSelectBtn" onclick="toggleProductDropdown()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-left text-slate-500 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <span id="productSelectLabel">Search & select product from database...</span>
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>

                <div id="productDropdownMenu" class="hidden absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2">
                    <input type="text" id="productSearchInput" onkeyup="filterProducts()" placeholder="Type to search product..." class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <div id="productList" class="max-h-48 overflow-y-auto divide-y divide-slate-100">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity</label>
                    <input type="number" id="poQty" min="1" value="1" required class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Price ($)</label>
                    <input type="number" step="0.01" id="poPrice" readonly class="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none cursor-not-allowed">
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Destination Address</label>
                <textarea id="poDestinationAddress" required rows="2" placeholder="Enter delivery address..." class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onclick="closeCreateOrderModal()" class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm">Save Order</button>
            </div>

        </form>
    </div>
</div>

<div id="viewOrderModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 class="font-bold text-slate-900 text-lg">Purchase Order Details</h3>
            <button type="button" onclick="closeViewOrderModal()" class="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>
        <div class="space-y-3 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Order ID:</span><span id="viewModalOrderId" class="font-semibold text-slate-900"></span></div>
            <div class="flex justify-between"><span class="text-slate-500">Status:</span><span id="viewModalStatus" class="font-semibold text-slate-900"></span></div>
            <div class="flex justify-between"><span class="text-slate-500">Total Amount:</span><span id="viewModalTotal" class="font-semibold text-slate-900"></span></div>
            <div><span class="text-slate-500 block mb-1">Destination Address:</span><p id="viewModalAddress" class="p-2.5 bg-slate-50 rounded-xl text-slate-700 border border-slate-100"></p></div>
        </div>
        <div class="flex justify-end pt-4 border-t border-slate-100">
            <button type="button" onclick="closeViewOrderModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold">Close</button>
        </div>
    </div>
</div>

<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none"></div>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/purchase-orders.js"></script>
</body>
</html>
