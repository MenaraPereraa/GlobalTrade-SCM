<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warehouses & Hubs - Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-100 min-h-screen flex font-sans antialiased text-slate-800">

<div class="flex h-screen overflow-hidden w-full">

    <!-- Sidebar Include -->
    <%@ include file="../fragments/sidebar.jsp" %>

    <main class="flex-1 flex flex-col overflow-y-auto">

        <!-- Top Navbar -->
        <header class="h-20 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div>
                <h2 class="text-xl font-bold text-slate-800 tracking-tight">Warehouses & Hubs</h2>
                <p class="text-xs text-slate-500 mt-0.5">Manage warehouse locations and distribution hubs.</p>
            </div>
            <div class="flex items-center gap-4">
                <button onclick="openAddWarehouseModal()" class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-sm">
                    <i class="fa-solid fa-plus"></i>
                    Add Warehouse
                </button>
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    AD
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <div class="p-8 space-y-8 max-w-7xl mx-auto w-full">

            <!-- Warehouses Grid Cards -->
            <div id="warehousesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Dynamic Content Loading State -->
                <div class="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading warehouses...
                </div>
            </div>

            <!-- Warehouses Table -->
            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div class="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-bold text-slate-800">All Warehouses</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Complete directory of all storage and distribution facilities.</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                            <th class="py-4 px-6">Warehouse Name</th>
                            <th class="py-4 px-6">Location</th>
                            <th class="py-4 px-6">Capacity</th>
                            <th class="py-4 px-6">Current Stock</th>
                            <th class="py-4 px-6">Status</th>
                            <th class="py-4 px-6 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody id="warehousesTableBody" class="divide-y divide-slate-100 text-sm">
                        <tr>
                            <td colspan="6" class="py-10 px-6 text-center text-slate-500">
                                <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading data...
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </main>
</div>

<!-- Add/Edit Warehouse Modal -->
<div id="warehouseModal" class="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h3 id="modalTitle" class="text-lg font-bold text-slate-800 mb-6">Add Warehouse</h3>
        <form id="warehouseForm" onsubmit="handleSaveWarehouse(event)">
            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Warehouse Name</label>
                    <input type="text" id="warehouseName" required class="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <input type="text" id="warehouseLocation" required class="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Capacity (units)</label>
                    <input type="number" id="warehouseCapacity" required class="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                </div>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition shadow-sm">Save</button>
                <button type="button" onclick="closeAddWarehouseModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold transition">Cancel</button>
            </div>
        </form>
    </div>
</div>

<script src="${pageContext.request.contextPath}/assets/js/warehouses-admin.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>

</body>
</html>

