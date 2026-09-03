<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Order Hub â€” Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<div class="flex-1 flex flex-col min-w-0">

    <!-- Header -->
    <header class="sticky top-0 z-30 bg-[#0f1629] h-16 flex items-center px-8 gap-4 shadow-md shrink-0">
        <div class="flex-1">
            <p class="text-xs text-slate-400 font-medium">Vendor Portal</p>
            <h2 class="text-white font-bold text-sm leading-tight">Vendor Orders</h2>
        </div>
        <button onclick="fetchVendorOrders()"
                class="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white px-4 py-2 rounded-xl font-semibold text-xs transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh Data
        </button>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 p-8 max-w-7xl mx-auto w-full">

        <!-- View 1: Vendor Order Hub (List) -->
        <div id="orderHubView">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-slate-900">Vendor Order Hub</h1>
                <p class="text-slate-500 text-sm mt-1">Manage incoming Purchase Orders, dispatch goods, and auto-generate Commercial Invoices.</p>
            </div>

            <div class="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
                <table class="min-w-full divide-y divide-slate-200 text-sm">
                    <thead class="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                        <th class="px-6 py-3.5 text-left">PO Reference</th>
                        <th class="px-6 py-3.5 text-left">Product & Qty</th>
                        <th class="px-6 py-3.5 text-left">Lifecycle Status</th>
                        <th class="px-6 py-3.5 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody id="vendorOrdersTableBody" class="divide-y divide-slate-100">
                    <!-- Dynamic rows loaded via JS -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Order Fulfillment Tower Modal -->
        <div id="fulfillmentModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center p-4 z-50 overflow-y-auto">
            <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto relative">

                <!-- Close Button -->
                <button onclick="closeFulfillmentModal()" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>

                <div class="mb-6">
                    <h1 class="text-2xl font-bold text-slate-900">Order Fulfillment Tower</h1>
                    <p id="fulfillmentSubHeader" class="text-slate-500 text-xs mt-0.5 font-mono"></p>
                </div>

                <!-- Steps Progress Bar with Connecting Lines -->
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <div class="flex items-center justify-between relative max-w-2xl mx-auto">
                        <div id="stepIndicator1" class="flex flex-col items-center relative z-10">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-400 mb-2 transition-all">1</div>
                            <span class="text-xs font-semibold text-slate-400">Evaluate Bids</span>
                        </div>
                        <div id="line1" class="flex-1 h-1 bg-slate-200 mx-2 -mt-6 transition-all"></div>
                        <div id="stepIndicator2" class="flex flex-col items-center relative z-10">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-400 mb-2 transition-all">2</div>
                            <span class="text-xs font-semibold text-slate-400">Vendor Ack</span>
                        </div>
                        <div id="line2" class="flex-1 h-1 bg-slate-200 mx-2 -mt-6 transition-all"></div>
                        <div id="stepIndicator3" class="flex flex-col items-center relative z-10">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-400 mb-2 transition-all">3</div>
                            <span class="text-xs font-semibold text-slate-400">Route Plan</span>
                        </div>
                        <div id="line3" class="flex-1 h-1 bg-slate-200 mx-2 -mt-6 transition-all"></div>
                        <div id="stepIndicator4" class="flex flex-col items-center relative z-10">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-400 mb-2 transition-all">4</div>
                            <span class="text-xs font-semibold text-slate-400">Dispatch / Transit</span>
                        </div>
                    </div>
                </div>

                <!-- Steps Detailed Content Boxes -->
                <div class="space-y-6">
                    <!-- Step 1 Box -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 class="font-bold text-slate-900 text-sm mb-3">1. Formal PO Review</h3>
                        <div class="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div class="flex items-center gap-3">
                                <svg class="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                <span class="text-sm font-medium text-slate-800">View Official PO</span>
                            </div>
                            <button onclick="openPoPreviewModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition">Open PO Document</button>
                        </div>
                    </div>

                    <!-- Step 2 Box (Dynamic Route Status: Pre/Post Dispatch) -->
                    <div id="step2Container" class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 id="step2Title" class="font-bold text-slate-900 text-sm mb-1">2. Awaiting Logistics Planning</h3>
                                <p id="step2Desc" class="text-xs text-slate-500">The buyer is actively optimizing the international shipping route. Please prepare the goods for dispatch.</p>
                            </div>
                            <span id="step2Badge" class="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg">Pre-dispatch</span>
                        </div>
                    </div>

                    <!-- Step 3 Box -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 class="font-bold text-slate-900 text-sm mb-3">3. Dispatch Goods & Generate Documents</h3>
                        <div id="dispatchSection">
                            <button onclick="dispatchGoods()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition">
                                Mark Goods Dispatched Successfully
                            </button>
                        </div>
                    </div>

                    <!-- Step 4 Box -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 class="font-bold text-slate-900 text-sm mb-3">4. Document & Tracking Vault</h3>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Live Tracking No.</label>
                                <input type="text" id="trackingNoInput" placeholder="Enter tracking number..." class="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                            </div>
                            <div class="flex items-end">
                                <button onclick="updateTrackingNo()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition">Update Tracking</button>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 mb-4">Once the cargo reaches the destination port, update the shipment status to mark the route progression.</p>

                        <div class="border-t border-slate-100 pt-4" id="vaultSection">
                            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Attached Documents</p>

                            <!-- Cards Grid Layout - à¶¸à·šà¶š JavaScript à¶¸à¶Ÿà·’à¶±à·Š à¶©à¶ºà·’à¶±à¶¸à·’à¶šà·Š à¶½à·™à·ƒ à¶´à·’à¶»à·€à·š -->
                            <div id="vendorDocumentsGrid" class="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                                <!-- Dynamic Cards will load here -->
                            </div>
                        </div>
                    </div>

                </div>

                <div class="mt-6 flex justify-end">
                    <button onclick="closeFulfillmentModal()" class="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition">Close Modal</button>
                </div>
            </div>
        </div>

        <!-- PO Preview Modal (Updated with exact styling from 2nd image) -->
        <div id="poModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 relative">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wide">Purchase Order Viewer</h3>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="downloadPoPdf()" class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Download PDF
                        </button>
                        <button onclick="closePoPreviewModal()" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
                    </div>
                </div>

                <!-- Document Viewer Box -->
                <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm space-y-4 mb-4 min-h-[220px] flex flex-col justify-center items-center">
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full max-w-lg space-y-3">
                        <div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500 text-xs">PO Reference:</span><span id="modalPoRef" class="font-mono font-bold text-xs text-slate-900"></span></div>
                        <div class="flex justify-between border-b border-slate-100 pb-2"><span class="text-slate-500 text-xs">Vendor:</span><span class="text-xs font-medium text-slate-800">Test Business</span></div>
                        <div class="flex justify-between"><span class="text-slate-500 text-xs">Payment Term:</span><span class="text-xs font-medium text-slate-800">Net 30</span></div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button onclick="closePoPreviewModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition">Close</button>
                </div>
            </div>
        </div>

        <div id="toastContainer" class="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none"></div>
    </main>
</div>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/vendor-orders.js"></script>
</body>
</html>
