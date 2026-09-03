<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warehouse Overview</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
</head>
<body class="bg-slate-100 min-h-screen flex">

<div id="toastContainer" class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
            <p class="text-sm text-slate-500 mt-1">Here's what's happening across your warehouses today.</p>
        </div>
        <span class="text-sm text-slate-500 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm w-fit">
            Welcome back, <span class="font-semibold text-slate-700">Warehouse Manager</span>
        </span>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Total Warehouses</p>
                <div class="p-2 rounded-lg bg-indigo-50">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 21V8l9-5 9 5v13M9 21v-6h6v6"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mt-3">4</h3>
            <p class="text-xs text-slate-400 mt-1">All facilities operational</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Active Stock Items</p>
                <div class="p-2 rounded-lg bg-indigo-50">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10l-8-4V7m8 14V11"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-indigo-600 mt-3">1,280</h3>
            <p class="text-xs text-slate-400 mt-1">Across all categories</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Pending Shipments</p>
                <div class="p-2 rounded-lg bg-amber-50">
                    <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-amber-600 mt-3">12</h3>
            <p class="text-xs text-slate-400 mt-1">Awaiting dispatch</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div class="flex items-center justify-between">
                <p class="text-sm text-slate-500 font-medium">Capacity Used</p>
                <div class="p-2 rounded-lg bg-emerald-50">
                    <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
                    </svg>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-emerald-600 mt-3">78%</h3>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div class="bg-emerald-500 h-1.5 rounded-full" style="width: 78%"></div>
            </div>
        </div>

    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-base font-semibold text-slate-800">Stock Movement Trend</h2>
                    <p class="text-xs text-slate-400 mt-0.5">Inbound vs outbound, last 7 days</p>
                </div>
                <div class="flex items-center gap-4 text-xs">
                    <span class="flex items-center gap-1.5 text-slate-500"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>Inbound</span>
                    <span class="flex items-center gap-1.5 text-slate-500"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Outbound</span>
                </div>
            </div>
            <div class="h-72">
                <canvas id="movementChart"></canvas>
            </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">Capacity by Warehouse</h2>
            <p class="text-xs text-slate-400 mt-0.5 mb-4">Current utilization</p>
            <div class="h-56 flex items-center justify-center">
                <canvas id="capacityChart"></canvas>
            </div>
            <ul class="mt-4 space-y-2 text-sm">
                <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2 text-slate-600"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>Warehouse A</span>
                    <span class="font-medium text-slate-800">85%</span>
                </li>
                <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2 text-slate-600"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Warehouse B</span>
                    <span class="font-medium text-slate-800">62%</span>
                </li>
                <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2 text-slate-600"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Warehouse C</span>
                    <span class="font-medium text-slate-800">91%</span>
                </li>
                <li class="flex items-center justify-between">
                    <span class="flex items-center gap-2 text-slate-600"><span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>Warehouse D</span>
                    <span class="font-medium text-slate-800">74%</span>
                </li>
            </ul>
        </div>

    </div>
</main>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/warehouse-dashboard.js"></script>



</body>
</html>

