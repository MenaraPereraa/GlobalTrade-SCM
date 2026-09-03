<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipments â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-100 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full">
    <header class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Shipments & Route Logistics</h1>
            <p class="text-sm text-slate-500 mt-1">Manage transport modes (Sea Freight / Air Cargo), tracking stages, and customs agent documentation.</p>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="fetchShipments()"
                    class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors duration-150 font-medium shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
                </svg>
                Refresh
            </button>
            <button onclick="openCreateShipmentModal()"
                    class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors duration-150 font-medium shadow-sm shadow-indigo-600/20">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Create Shipment
            </button>
        </div>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Active Shipments</p>
            <h3 id="summaryActiveCount" class="text-3xl font-bold text-slate-800 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">In transit or in customs</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Delayed</p>
            <h3 id="summaryDelayedCount" class="text-3xl font-bold text-red-500 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Past their ETA, still open</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-sm text-slate-500 font-medium">Delivered</p>
            <h3 id="summaryDeliveredCount" class="text-3xl font-bold text-emerald-500 mt-3">â€”</h3>
            <p class="text-xs text-slate-400 mt-1">Completed shipments</p>
        </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Search</label>
                <input type="text" id="shipmentSearchInput" placeholder="Shipment #, order #, or carrier..."
                       class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <select id="shipmentStatusSelect"
                        class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">All Statuses</option>
                </select>
            </div>
        </div>
    </div>

    <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
            <tr>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Shipment #</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order #</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transport Mode</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customs Doc</th>
                <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
            </thead>
            <tbody id="shipmentsTableBody" class="divide-y divide-slate-100"></tbody>
        </table>
        <div id="shipmentPagination" class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100"></div>
    </div>

    <!-- Tracking & Status Update Modal -->
    <div id="trackingModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-100">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h3 class="text-base font-bold text-slate-800">Shipment Progress & Tracking</h3>
                    <p id="trackingModalSubtitle" class="text-xs text-slate-500 mt-0.5">Manage freight progress and status updates.</p>
                </div>
                <button onclick="closeTrackingModal()" class="text-slate-400 hover:text-slate-600 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Current Transport Mode</label>
                    <div id="modalTransportMode" class="text-sm font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">Sea Freight</div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Update Shipment Status</label>
                    <select id="updateStatusSelect" class="w-full text-sm bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="PRODUCT_LOADING">Product Loading</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="IN_TRANSIT">In Transit (Sea/Air)</option>
                        <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="DELAYED">Delayed</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Customs Agent Document (PDF/Image)</label>
                    <input type="file" id="customsDocFileInput" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 border border-slate-200 rounded-xl cursor-pointer"/>
                    <div id="modalCustomsDocArea" class="mt-2 text-xs text-slate-500"></div>
                </div>
            </div>
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button onclick="closeTrackingModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onclick="submitStatusUpdateWithDoc()" class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Status & Progress</button>
            </div>
        </div>
    </div>

    <!-- Create Shipment Modal -->
    <div id="createShipmentModal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-1">
                <h2 class="text-xl font-bold text-slate-800">Create Shipment</h2>
                <button type="button" onclick="closeCreateShipmentModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <p class="text-sm text-slate-500 mb-5">Dispatch an approved order and hand it off to a carrier.</p>

            <form id="createShipmentForm" class="space-y-4">

                <div class="relative">
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Order</label>
                    <input type="hidden" id="shipmentOrderId" required>
                    <button type="button" id="orderSelectBtn" onclick="toggleOrderDropdown()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-left text-slate-500 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                        <span id="orderSelectLabel">Select approved order...</span>
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <div id="orderDropdownMenu" class="hidden absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2">
                        <input type="text" id="orderSearchInput" onkeyup="filterOrdersList()" placeholder="Type to search order..." class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                        <div id="orderListContainer" class="max-h-48 overflow-y-auto divide-y divide-slate-100"></div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Carrier</label>
                    <input type="text" id="shipmentCarrierInput" required placeholder="e.g. Maersk Line"
                           class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="relative">
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Origin Hub</label>
                        <input type="hidden" id="shipmentOriginId" required>
                        <button type="button" id="originSelectBtn" onclick="toggleOriginDropdown()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-left text-slate-500 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                            <span id="originSelectLabel">Select origin warehouse...</span>
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="originDropdownMenu" class="hidden absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2">
                            <input type="text" id="originSearchInput" onkeyup="filterOriginList()" placeholder="Type to search warehouse..." class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                            <div id="originListContainer" class="max-h-48 overflow-y-auto divide-y divide-slate-100"></div>
                        </div>
                    </div>

                    <div class="relative">
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Destination Hub</label>
                        <input type="hidden" id="shipmentDestinationId" required>
                        <button type="button" id="destinationSelectBtn" onclick="toggleDestinationDropdown()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-left text-slate-500 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                            <span id="destinationSelectLabel">Select destination warehouse...</span>
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="destinationDropdownMenu" class="hidden absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2">
                            <input type="text" id="destinationSearchInput" onkeyup="filterDestinationList()" placeholder="Type to search warehouse..." class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                            <div id="destinationListContainer" class="max-h-48 overflow-y-auto divide-y divide-slate-100"></div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Dispatch Date</label>
                        <input type="date" id="shipmentDispatchDateInput" required
                               class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">ETA</label>
                        <input type="date" id="shipmentEtaInput" required
                               class="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onclick="closeCreateShipmentModal()"
                            class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                        Cancel
                    </button>
                    <button type="submit" id="createShipmentSubmitBtn"
                            class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors duration-150">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        Create Shipment
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Route Optimization Engine Modal -->
    <div id="routeOptimizationModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <h3 class="text-lg font-bold text-slate-800">Route Optimization Engine</h3>
                    </div>
                    <p id="routeOptimizationSubtitle" class="text-xs text-slate-500 mt-0.5">Analyzing optimal carriers and lanes for PO: â€”</p>
                </div>
                <button onclick="closeRouteOptimizationModal()" class="text-slate-400 hover:text-slate-600 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-6 bg-slate-50/30 grid grid-cols-1 md:grid-cols-3 gap-4" id="routeOptionsContainer"></div>
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <button onclick="closeRouteOptimizationModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">Close</button>
            </div>
        </div>
    </div>

    <div id="toastContainer" class="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none"></div>

</main>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>

<script src="${pageContext.request.contextPath}/assets/js/shipments-dashboard.js"></script>
</body>
</html>
