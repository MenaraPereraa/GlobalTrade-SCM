<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Active RFQs & Quotations — Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: { extend: { fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] } } }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex">

<%@ include file="../fragments/sidebar.jsp" %>

<div class="flex-1 flex flex-col min-w-0">

    <header class="sticky top-0 z-30 bg-[#0f1629] h-16 flex items-center px-8 gap-4 shadow-md shrink-0">
        <div class="flex-1">
            <p class="text-xs text-slate-500 font-medium">Vendor Portal</p>
            <h2 class="text-white font-bold text-sm leading-tight">Active RFQs & Bidding</h2>
        </div>
        <button onclick="location.reload()"
                class="flex items-center gap-2 bg-white/8 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white px-4 py-2 rounded-xl font-semibold text-xs transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.9-3.7M20 15a8 8 0 01-14.9 3.7"/>
            </svg>
            Refresh Data
        </button>
    </header>

    <main class="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        <nav class="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span class="hover:text-slate-600 cursor-pointer transition">Vendor Dashboard</span>
            <svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            <span class="text-slate-600 font-medium">Active RFQs & Quotations</span>
        </nav>

        <%-- Top Banner Card --%>
        <div class="bg-gradient-to-r from-white to-indigo-50/50 border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Vendor Bidding Dashboard</h1>
                <p class="text-sm text-slate-500 mt-1">Submit your competitive prices for active low-stock RFQs and track your quotation history.</p>
            </div>
            <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-xl">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Direct Shipping Replaced with RFQ Flow
            </div>
        </div>

        <%-- Tabs Navigation --%>
        <div class="flex border-b border-slate-200">
            <button onclick="switchVendorTab('active')" id="tabActiveBtn" class="py-3 px-6 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 transition-colors">
                Active RFQs
            </button>
            <button onclick="switchVendorTab('submitted')" id="tabSubmittedBtn" class="py-3 px-6 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                Submitted Quotations History
            </button>
        </div>

        <%-- Active RFQs Section --%>
        <div id="activeRfqsSection" class="space-y-4 block">
            <div class="flex items-center gap-2 text-amber-600 font-bold text-sm tracking-wide">
                ACTION REQUIRED: OPEN RFQS (LOW STOCK REPLENISHMENT)
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table class="w-full text-left border-collapse">
                    <thead>
                    <tr class="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-100/70">
                        <th class="p-4">RFQ Reference</th>
                        <th class="p-4">Product Details</th>
                        <th class="p-4">Req. Qty</th>
                        <th class="p-4">Target Delivery</th>
                        <th class="p-4 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm" id="activeRfqsTableBody">
                    <%-- Populated via JS --%>
                    </tbody>
                </table>
            </div>
        </div>

        <%-- Submitted Quotations History Section --%>
        <div id="submittedQuotationsSection" class="space-y-4 hidden">
            <div class="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-wide">
                MY SUBMITTED QUOTATIONS HISTORY
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table class="w-full text-left border-collapse">
                    <thead>
                    <tr class="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-100/70">
                        <th class="p-4">RFQ ID</th>
                        <th class="p-4">Unit Price (USD)</th>
                        <th class="p-4">Lead Time</th>
                        <th class="p-4">Remarks</th>
                        <th class="p-4">Quotation PDF</th>
                        <th class="p-4 text-right">Status</th>
                    </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm" id="submittedQuotesTable">
                    <%-- Populated via JS --%>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</div>

<%-- Submit Quotation Modal --%>
<div id="submitModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4">
    <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900">
        <div class="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
            <div>
                <h3 class="text-lg font-bold text-slate-900">Submit Quotation</h3>
                <p class="text-xs text-slate-500" id="modalRfqTitle">Bidding for RFQ</p>
            </div>
            <button type="button" onclick="closeSubmitModal()" class="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
        </div>

        <form id="quotationForm" onsubmit="submitQuotation(event)" class="p-6 space-y-4">
            <input type="hidden" name="rfqId" id="modalRfqId">

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Unit Price (USD) *</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">$</span>
                        <input type="number" step="0.01" name="unitPrice" id="unitPrice" required placeholder="0.00" class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-slate-900 text-sm focus:border-indigo-600 focus:outline-none">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Lead Time (Days) *</label>
                    <input type="number" name="leadTime" id="leadTime" required placeholder="e.g., 7" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-600 focus:outline-none">
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Remarks / Terms (Optional)</label>
                <textarea name="remarks" id="remarks" rows="2" placeholder="e.g., Price valid for 30 days..." class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-600 focus:outline-none"></textarea>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Formal Quotation Document (PDF) *</label>
                <input type="file" name="quotationPdf" id="quotationPdf" accept=".pdf" required class="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer bg-slate-50 border border-slate-300 rounded-xl">
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onclick="closeSubmitModal()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition">Cancel</button>
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition">Submit Bid</button>
            </div>
        </form>
    </div>
</div>

<%-- PDF Viewer Modal --%>
<div id="pdfViewerModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm hidden items-center justify-center z-50 p-4">
    <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden text-slate-900">
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
            <div class="flex items-center gap-2">
                <span class="text-indigo-400 font-bold">📄</span>
                <div>
                    <h3 class="text-base font-bold">Document Viewer</h3>
                    <p class="text-xs text-slate-400">Formal Quotation PDF Preview</p>
                </div>
            </div>
            <button type="button" onclick="closePdfModal()" class="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>
        <div class="flex-1 bg-slate-100 p-2">
            <iframe id="pdfIframe" src="" class="w-full h-full rounded-xl border border-slate-300 bg-white" frameborder="0"></iframe>
        </div>
    </div>
</div>

<div id="toastContainer" class="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none"></div>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/vendor-rfq.js"></script>

</body>
</html>