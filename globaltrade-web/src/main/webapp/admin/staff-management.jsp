<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff & Roles</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col justify-between">
    <div>
        <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Staff & Roles</h1>
                <p class="text-sm text-slate-500 mt-1">Create staff accounts and assign roles.</p>
            </div>
            <button onclick="openCreateStaffModal()"
                    class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 shadow-sm font-medium">
                + Create Staff Account
            </button>
        </header>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div class="w-full sm:w-72 relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </span>
                <input type="text" id="searchInput" oninput="filterStaff()" placeholder="Search by username or email..."
                       class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div class="w-full sm:w-64">
                <select id="roleFilter" onchange="filterStaff()"
                        class="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Roles</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Custom Agent">Custom Agent</option>
                    <option value="Vendor Representative">Vendor Representative</option>
                </select>
            </div>
        </div>

        <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                <tr>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Username</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
                </thead>
                <tbody id="staffTableBody" class="divide-y divide-slate-100"></tbody>
            </table>
        </div>
    </div>

    <div id="paginationContainer" class="hidden flex items-center justify-between px-2 pt-4">
        <p class="text-sm text-slate-500">Showing <span id="pageInfo" class="font-medium text-slate-800">0</span></p>
        <div class="flex gap-2">
            <button id="prevBtn" onclick="previousPage()" class="px-4 py-2 bg-white hover:bg-slate-50 rounded-lg text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-sm font-medium shadow-sm">&larr; Previous</button>
            <button id="nextBtn" onclick="nextPage()" class="px-4 py-2 bg-white hover:bg-slate-50 rounded-lg text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-sm font-medium shadow-sm">Next &rarr;</button>
        </div>
    </div>
</main>

<!-- Create Staff Modal -->
<div id="createStaffModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h2 class="text-xl font-bold text-slate-800 mb-4">Create Staff Account</h2>
        <form id="createStaffForm" onsubmit="submitCreateStaff(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input type="text" id="staffUsername" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input type="email" id="staffEmail" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input type="password" id="staffPassword" required placeholder="Ex: Pass@123" class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Select Role</label>
                <select id="staffRole" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Coordinator">Coordinator</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Custom Agent">Custom Agent</option>
                    <option value="Vendor Representative">Vendor Representative</option>
                </select>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeCreateStaffModal()" class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">Cancel</button>
                <button type="submit" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">Create</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Staff Modal -->
<div id="editStaffModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h2 class="text-xl font-bold text-slate-800 mb-4">Edit Staff Account</h2>
        <form id="editStaffForm" onsubmit="submitEditStaff(event)" class="space-y-4">
            <input type="hidden" id="editUserId">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input type="text" id="editStaffUsername" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Email (Cannot be changed)</label>
                <input type="email" id="editStaffEmail" disabled class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select id="editStaffRole" required class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Coordinator">Coordinator</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Custom Agent">Custom Agent</option>
                    <option value="Vendor Representative">Vendor Representative</option>
                </select>
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeEditStaffModal()" class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">Cancel</button>
                <button type="submit" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">Update</button>
            </div>
        </form>
    </div>
</div>

<!-- View Warehouses Modal -->
<div id="viewWarehousesModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h2 class="text-xl font-bold text-slate-800 mb-1">Assigned Warehouses</h2>
        <p class="text-sm text-slate-500 mb-4">Warehouses managed by <span id="viewTargetName" class="font-semibold"></span>.</p>
        <div id="viewWarehouseList" class="space-y-2 max-h-64 overflow-y-auto mb-4"></div>
        <div class="flex justify-end pt-4 border-t border-slate-100">
            <button type="button" onclick="closeViewWarehousesModal()" class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">Close</button>
        </div>
    </div>
</div>

<!-- Assign Warehouses Modal -->
<div id="assignWarehousesModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h2 class="text-xl font-bold text-slate-800 mb-1">Assign Warehouses</h2>
        <p class="text-sm text-slate-500 mb-4">Select which warehouses <span id="assignTargetName" class="font-semibold"></span> can manage.</p>
        <div id="warehouseCheckboxList" class="space-y-2 max-h-64 overflow-y-auto mb-4"></div>
        <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onclick="closeAssignWarehousesModal()" class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm">Cancel</button>
            <button onclick="submitAssignWarehouses()" class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">Save</button>
        </div>
    </div>
</div>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/user-management.js"></script>
</body>
</html>