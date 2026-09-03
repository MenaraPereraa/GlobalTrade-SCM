<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Warehouses</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<div id="toastContainer" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Warehouse Locations</h1>
            <p class="text-sm text-slate-500 mt-1">Manage your facilities and storage capacity.</p>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="fetchWarehouses()"
                    class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
                </svg>
                Refresh
            </button>
            <button onclick="openModal()"
                    class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors duration-150 font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Add Warehouse
            </button>
        </div>
    </header>

    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div class="relative flex-1">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" id="warehouseSearchInput" oninput="applyWarehouseFilters()"
                   placeholder="Search by warehouse name..."
                   class="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
        </div>
        <div class="relative sm:w-56" id="countryFilterWrapper">
            <button type="button" id="countryFilterButton" onclick="toggleCountryDropdown()"
                    class="w-full flex items-center justify-between gap-2 py-2.5 px-3.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                <span class="flex items-center gap-2 truncate">
                    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M6 4v16l6-4 6 4V4"/>
                    </svg>
                    <span id="countryFilterLabel" class="truncate">All Countries</span>
                </span>
                <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            <div id="countryDropdownPanel" class="hidden absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                <div class="p-2 border-b border-slate-100">
                    <input type="text" id="countryDropdownSearch" oninput="renderCountryDropdownList()"
                           placeholder="Search country code..." autocomplete="off"
                           class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                </div>
                <ul id="countryDropdownList" class="max-h-56 overflow-y-auto py-1 text-sm">
                </ul>
            </div>
        </div>
    </div>

    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Country Code</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity</th>
            </tr>
            </thead>
            <tbody id="warehouseTableBody" class="divide-y divide-slate-100">
            </tbody>
        </table>

        <div id="warehousePagination" class="hidden items-center justify-between px-6 py-4 border-t border-slate-100">
            <p id="paginationInfo" class="text-sm text-slate-500"></p>
            <div class="flex items-center gap-2">
                <button id="prevPageBtn" onclick="goToPage(currentPage - 1)"
                        class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition">
                    Previous
                </button>
                <button id="nextPageBtn" onclick="goToPage(currentPage + 1)"
                        class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition">
                    Next
                </button>
            </div>
        </div>

        <div id="warehouseEmptyState" class="hidden flex-col items-center justify-center py-16 px-6 text-center">
            <div class="p-3 rounded-full bg-slate-100 mb-3">
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 21V8l9-5 9 5v13M9 21v-6h6v6"/>
                </svg>
            </div>
            <p id="warehouseEmptyTitle" class="text-slate-500 font-medium">No warehouses yet</p>
            <p id="warehouseEmptySubtitle" class="text-sm text-slate-400 mt-1">Add your first warehouse to get started.</p>
        </div>
    </div>
</main>

<div id="warehouseModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div class="flex items-center justify-between mb-1">
            <h2 class="text-xl font-bold text-slate-800">Add New Warehouse</h2>
            <button type="button" onclick="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="text-sm text-slate-500 mb-6">Enter the details for the new facility.</p>

        <form id="warehouseForm" onsubmit="saveWarehouse(event)" class="space-y-4">
            <div>
                <label for="warehouseName" class="block text-sm font-medium text-slate-700 mb-1.5">Warehouse Name</label>
                <input type="text" id="warehouseName" required placeholder="e.g. North Distribution Center"
                       class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="warehouseCountryCode" class="block text-sm font-medium text-slate-700 mb-1.5">Country Code</label>
                    <input type="text" id="warehouseCountryCode" required maxlength="5" placeholder="LK"
                           class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                </div>
                <div>
                    <label for="warehouseCapacity" class="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
                    <input type="number" id="warehouseCapacity" required placeholder="1000" min="0"
                           class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onclick="closeModal()"
                        class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-150 font-medium text-sm">
                    Cancel
                </button>
                <button type="submit"
                        class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors duration-150 font-medium text-sm">
                    Save Warehouse
                </button>
            </div>
        </form>
    </div>
</div>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/warehouse-dashboard.js"></script>
</body>
</html>
