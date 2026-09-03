<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warehouse Stock Alerts & Replenishment â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<jsp:include page="/fragments/sidebar.jsp" />

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Warehouse Stock Alerts & Replenishment</h1>
            <p class="text-sm text-slate-500 mt-1">Monitor low-stock warehouses and trigger replenishment requests.</p>
        </div>
        <button onclick="loadLowStockAlerts()"
                class="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm text-sm">
            Refresh
        </button>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Critical Alerts</p>
            <h3 id="criticalCount" class="text-3xl font-bold text-red-600 mt-3">0</h3>
            <p class="text-xs text-slate-400 mt-1">At or below minimum stock</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Low Stock Items</p>
            <h3 id="lowStockCount" class="text-3xl font-bold text-amber-600 mt-3">0</h3>
            <p class="text-xs text-slate-400 mt-1">At or below reorder threshold</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Warehouses Affected</p>
            <h3 id="warehouseAffectedCount" class="text-3xl font-bold text-slate-800 mt-3">0</h3>
            <p class="text-xs text-slate-400 mt-1">Distinct warehouses in list</p>
        </div>
    </div>

    <!-- Search + Filter Bar -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input type="text" id="stockSearchInput" placeholder="Search by warehouse or product name..."
               class="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
        <select id="stockStatusFilter"
                class="sm:w-48 py-2.5 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
            <option value="">All Statuses</option>
            <option value="CRITICAL">Critical</option>
            <option value="LOW">Low Stock</option>
        </select>
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty on Hand</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Level</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
            </thead>
            <tbody id="lowStockTableBody" class="divide-y divide-slate-100">
            <tr>
                <td colspan="7" class="px-6 py-10 text-center text-slate-400">Loading warehouse status...</td>
            </tr>
            </tbody>
        </table>
    </div>
</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/warehouse-replenishment.js"></script>
</body>
</html>

