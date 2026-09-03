<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>RFQ Management — Global Trade Portal</title>
    <!-- Tailwind CSS CDN loaded before configuration to prevent ReferenceError -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: { extend: { fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] } } }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body class="bg-slate-100 text-slate-800 overflow-x-hidden min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<main class="flex-1 p-8 max-w-7xl mx-auto w-full overflow-y-auto">

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">RFQ Management</h1>
            <p class="text-sm text-slate-500 mt-0.5">Manage and track Request for Quotations, review vendor bids, and optimize logistics lanes.</p>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="openCreateRfqModal()" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-sm transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                Create New RFQ
            </button>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="relative w-full md:w-96">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
                <input type="text" id="rfqSearchInput" placeholder="Search RFQ by ID, Cargo, or Port..." class="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"/>
            </div>
            <div class="flex items-center gap-3 w-full md:w-auto justify-end">
                <select id="rfqStatusSelect" class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-700">
                    <option value="">All Statuses</option>
                </select>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 flex flex-col">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                <tr class="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th class="py-4 px-6">RFQ ID / Cargo</th>
                    <th class="py-4 px-6">Route / Lane</th>
                    <th class="py-4 px-6">Volume / Mode</th>
                    <th class="py-4 px-6">Bids Received</th>
                    <th class="py-4 px-6">Status</th>
                    <th class="py-4 px-6 text-right">Actions</th>
                </tr>
                </thead>
                <tbody id="rfqTableBody" class="divide-y divide-slate-100 text-sm">
                </tbody>
            </table>
        </div>

        <div id="rfqPagination" class="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
        </div>
    </div>

</main>

<!-- Control Tower / Lifecycle Modal -->
<div id="lifecycleModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg>
                </div>
                <div>
                    <h2 class="font-bold text-slate-900 text-base leading-tight">Global Trade Control Tower</h2>
                    <p class="text-slate-400 text-xs mt-0.5" id="modalLifecycleTitle">LIFECYCLE TRACKING</p>
                </div>
            </div>
            <button onclick="closeLifecycleModal()" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div id="lifecycleStepsWrapper" class="flex-1 overflow-y-auto p-6 space-y-4">
        </div>
    </div>
</div>

<!-- Evaluate Bids / Route Configuration Modal -->
<div id="evaluateModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
                <h2 class="font-bold text-slate-900 text-base leading-tight">Vendor Quotations & Route Engine</h2>
                <p class="text-slate-400 text-xs mt-0.5" id="modalRfqSubtitle">Review quotations & configure transport route</p>
            </div>
            <button onclick="closeEvaluateModal()" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Submitted Vendor Bids</h3>
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                        <tr class="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                            <th class="px-5 py-3">Vendor Name</th>
                            <th class="px-5 py-3">Unit Price</th>
                            <th class="px-5 py-3">Lead Time</th>
                            <th class="px-5 py-3">Remarks</th>
                            <th class="px-5 py-3">Quotation Document</th>
                            <th class="px-5 py-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody id="modalBidsTableBody" class="text-sm divide-y divide-slate-100">
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="routeSelectionSection" class="hidden pt-4 border-t border-slate-100">
                <div class="mb-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">AI Logistics Route Optimizer</h3>
                    <p class="text-xs text-slate-500" id="routeEngineSubtitle">Select optimized route mode for fulfillment</p>
                </div>
                <div id="routeOptionsGrid" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                </div>
            </div>
        </div>
        <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end">
            <button onclick="closeEvaluateModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition">Close</button>
        </div>
    </div>
</div>

<!-- Universal PDF Document Viewer Modal -->
<div id="universalPdfModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-white w-11/12 max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <h3 id="universalPdfModalTitle" class="font-bold text-sm tracking-wide">Document Viewer</h3>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="closeUniversalPdfModal()" class="text-slate-400 hover:text-white p-1 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
        <div class="flex-1 bg-slate-100 p-4 overflow-auto">
            <iframe id="universalPdfIframe" src="" class="w-full h-full rounded-xl border border-slate-300 bg-white shadow-inner"></iframe>
        </div>
        <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
            <button onclick="closeUniversalPdfModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition">Close Viewer</button>
        </div>
    </div>
</div>

<!-- Toast Container for Notifications -->
<div id="toastContainer" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"></div>

<script>
    const pageContextPath = '${pageContext.request.contextPath}';
</script>

<!-- Scripts with cache-busting -->
<script src="${pageContext.request.contextPath}/assets/js/auth-client.js?v=2"></script>
<script src="${pageContext.request.contextPath}/assets/js/rfq-management.js?v=4"></script>

<!-- Add these libraries for PDF generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

</body>
</html>