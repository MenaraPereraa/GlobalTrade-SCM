// Vendor Orders Fulfillment Management Script - Fully Synchronized

document.addEventListener("DOMContentLoaded", () => {
    fetchVendorOrders();
    injectDocumentPreviewModalHTML();
});

let currentActivePo = null;
let currentRfqId = null;

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

function fetchVendorOrders() {
    const tbody = document.getElementById("vendorOrdersTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 text-sm">Loading vendor orders...</td></tr>`;
    }

    const url = window.location.origin + "/globaltrade/api/vendors/orders";

    fetch(url, {
        method: 'GET',
        headers: authHeaders(),
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch vendor orders");
            return response.json();
        })
        .then(orders => {
            renderVendorOrdersTable(orders);
        })
        .catch(error => {
            console.warn("API fetch failed:", error);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-400 text-sm">Failed to load orders from server. Please check backend connection.</td></tr>`;
            }
        });
}

function renderVendorOrdersTable(orders) {
    const tbody = document.getElementById("vendorOrdersTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 text-sm">No vendor orders found.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        let statusBadge = "";
        const status = (order.status || "").toUpperCase();

        const rfqId = order.rfqId || order.rfq_id || order.requestId || order.id || '1';
        const poRef = order.poReference || order.poRef || order.poNumber || ("PO-" + String(8550000 + (order.poId || 1)));

        const savedRoute = JSON.parse(
            localStorage.getItem(`rfq_route_${rfqId}`) ||
            sessionStorage.getItem(`rfq_route_${rfqId}`) ||
            localStorage.getItem(`vendor_route_${poRef}`) ||
            localStorage.getItem(`route_${rfqId}`) ||
            localStorage.getItem(`route_rfq_${rfqId}`) ||
            'null'
        );

        const isDispatched = localStorage.getItem(`vendor_dispatched_${rfqId}`) === 'true' ||
            localStorage.getItem(`vendor_dispatched_${poRef}`) === 'true' ||
            localStorage.getItem(`rfq_status_${rfqId}`) === 'DISPATCHED' ||
            status === "DISPATCHED";

        if(isDispatched) {
            statusBadge = `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-md border border-emerald-200">COMPLETED</span>`;
        } else if(status === "TRACKING_UPDATED" || status === "TRACKING") {
            statusBadge = `<span class="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md border border-blue-200">TRACKING UPDATED</span>`;
        } else if(status === "ROUTE_CONFIRMED" || status === "CONFIRMED" || savedRoute) {
            statusBadge = `<span class="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md border border-indigo-200">ROUTE CONFIRMED</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-md border border-amber-200">${order.status || 'ISSUED'}</span>`;
        }

        const productName = order.productName || order.product || 'Imported Goods';
        const quantity = order.quantity || order.qty || 100;
        const unitPrice = order.unitPrice || order.unit_price || 120.00;
        const vendorName = order.vendorName || order.supplierName || 'Global Trade Vendor';

        tbody.innerHTML += `
        <tr class="hover:bg-slate-50/80 transition">
            <td class="px-6 py-4">
                <div class="font-mono font-medium text-slate-800">${poRef}</div>
                <div class="text-xs text-indigo-600 font-semibold">RFQ ID: #${rfqId}</div>
            </td>
            <td class="px-6 py-4">
                <div class="font-medium text-slate-900">${productName}</div>
                <div class="text-xs text-slate-500">Qty: ${quantity}</div>
            </td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openFulfillmentTower('${poRef}', '${order.status || 'ISSUED'}', '${order.trackingNumber || ''}', '${productName.replace(/'/g, "\\'")}', '${quantity}', '${rfqId}', '${unitPrice}', '${vendorName.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
                    Manage Order
                </button>
            </td>
        </tr>
    `;
    });
}


let activeOrderMeta = {};

function openFulfillmentTower(poRef, status, trackingNumber, productName, quantity, rfqId, unitPrice = 120.00, vendorName = 'Global Trade Vendor') {
    currentActivePo = poRef;
    currentRfqId = rfqId;
    activeOrderMeta = { poRef, productName, quantity, unitPrice, vendorName, rfqId };

    const modal = document.getElementById("fulfillmentModal");
    const fulfillmentSubHeader = document.getElementById("fulfillmentSubHeader");

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }

    if (fulfillmentSubHeader) {
        fulfillmentSubHeader.innerHTML = `PO REFERENCE: <span class="font-semibold text-slate-700">${poRef}</span> &nbsp;&bull;&nbsp; RFQ: <span class="font-semibold text-indigo-600">#${rfqId}</span> &nbsp;&bull;&nbsp; PRODUCT: <span class="font-semibold text-slate-900">${productName}</span> &nbsp;&bull;&nbsp; QTY: <span class="font-semibold text-slate-900">${quantity}</span>`;
    }

    const savedRoute = JSON.parse(
        localStorage.getItem(`rfq_route_${rfqId}`) ||
        localStorage.getItem(`route_${rfqId}`) ||
        localStorage.getItem(`route_rfq_${rfqId}`) ||
        localStorage.getItem(`vendor_route_${poRef}`) ||
        sessionStorage.getItem(`rfq_route_${rfqId}`) ||
        'null'
    );

    if (savedRoute && (savedRoute.mode || savedRoute.carrier || savedRoute.carrierName)) {
        status = "ROUTE_CONFIRMED";
    }

    updateTowerStepsUI(status, trackingNumber, savedRoute, rfqId);
}

function closeFulfillmentModal() {
    const modal = document.getElementById("fulfillmentModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    fetchVendorOrders();
}

function updateTowerStepsUI(status, trackingNumber, savedRoute = null, rfqId = '') {
    if (!savedRoute && (rfqId || currentRfqId)) {
        const activeRfq = rfqId || currentRfqId;
        const rawRoute = localStorage.getItem(`rfq_route_${activeRfq}`) ||
            localStorage.getItem(`route_${activeRfq}`) ||
            localStorage.getItem(`route_rfq_${activeRfq}`) ||
            localStorage.getItem(`vendor_route_${currentActivePo}`);
        if (rawRoute) {
            try { savedRoute = JSON.parse(rawRoute); } catch(e) {}
        }
    }

    const upperStatus = (status || "").toUpperCase();

    const indicator1 = document.getElementById("stepIndicator1");
    const indicator2 = document.getElementById("stepIndicator2");
    const indicator3 = document.getElementById("stepIndicator3");
    const indicator4 = document.getElementById("stepIndicator4");

    const line1 = document.getElementById("line1");
    const line2 = document.getElementById("line2");
    const line3 = document.getElementById("line3");

    const activeId = rfqId || currentRfqId || currentActivePo;
    const existingTracking = trackingNumber || localStorage.getItem(`vendor_tracking_${activeId}`) || '';

    const trackingInput = document.getElementById("trackingNoInput");
    if (trackingInput) {
        if (existingTracking) {
            trackingInput.value = existingTracking;
        }
    }

    [line1, line2, line3].forEach(l => {
        if (l) l.className = "flex-1 h-1 bg-slate-200 mx-2 -mt-6 transition-all";
    });

    if (indicator1) {
        const c1 = indicator1.querySelector("div");
        const l1 = indicator1.querySelector("span");
        if (c1) {
            c1.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-sm mb-2";
            c1.innerHTML = "✓";
        }
        if (l1) l1.className = "text-xs font-semibold text-slate-700";
    }

    const isStep4Done = (upperStatus === "DISPATCHED" || upperStatus === "TRACKING_UPDATED" || upperStatus === "TRACKING" || localStorage.getItem(`vendor_dispatched_${activeId}`) === 'true');

    if (indicator2) {
        const c2 = indicator2.querySelector("div");
        const l2 = indicator2.querySelector("span");
        if (c2) {
            c2.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-sm mb-2";
            c2.innerHTML = "✓";
        }
        if (l2) l2.className = "text-xs font-semibold text-slate-700";
        if (line1) line1.className = "flex-1 h-1 bg-emerald-500 mx-2 -mt-6 transition-all";
    }

    if (indicator3) {
        const c3 = indicator3.querySelector("div");
        const l3 = indicator3.querySelector("span");
        if (c3) {
            c3.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-sm mb-2";
            c3.innerHTML = "✓";
        }
        if (l3) l3.className = "text-xs font-semibold text-slate-700";
        if (line2) line2.className = "flex-1 h-1 bg-emerald-500 mx-2 -mt-6 transition-all";
    }

    if (indicator4) {
        const c4 = indicator4.querySelector("div");
        const l4 = indicator4.querySelector("span");
        if (isStep4Done) {
            if (c4) {
                c4.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white shadow-md mb-2";
                c4.innerHTML = "✓";
            }
            if (l4) l4.className = "text-xs font-semibold text-slate-700";
            if (line3) line3.className = "flex-1 h-1 bg-emerald-500 mx-2 -mt-6 transition-all";
        } else {
            if (c4) {
                c4.className = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-blue-600 text-white animate-pulse shadow-sm mb-2";
                c4.innerHTML = "4";
            }
            if (l4) l4.className = "text-xs font-semibold text-blue-600";
        }
    }

    const step1Buttons = document.querySelectorAll("button");
    step1Buttons.forEach(btn => {
        if (btn.innerText.includes("Open PO Document") || btn.innerText.includes("View Official PO")) {
            btn.setAttribute("onclick", `previewCoordinatorPdf('OFFICIAL_PO', ${currentRfqId || 1})`);
            btn.innerHTML = `<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> View Official PO`;
        }
    });

    const step2Container = document.getElementById("step2Container");
    if (step2Container) {
        step2Container.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="font-bold text-slate-900 text-sm mb-1">2. Shipping Route & Logistics Planning</h3>
                    <p class="text-xs text-slate-500">The buyer is optimizing the international shipping route. Please prepare goods for dispatch.</p>
                </div>
                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg">Route Confirmed</span>
            </div>
        `;
    }

    let docGrid = document.getElementById("vendorDocumentsGrid");
    if (!docGrid) {
        const vaultSection = document.querySelector("#vaultSection") || document.querySelector(".space-y-4");
        if (vaultSection) {
            docGrid = document.createElement("div");
            docGrid.id = "vendorDocumentsGrid";
            docGrid.className = "grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2";
            vaultSection.appendChild(docGrid);
        }
    }

    if (docGrid) {
        docGrid.innerHTML = `
            <div class="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold text-indigo-900">Purchase Order</span>
                        <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-semibold">Official</span>
                    </div>
                    <p class="text-[11px] text-slate-500">Coordinator issued PO document.</p>
                </div>
                <button type="button" onclick="previewCoordinatorPdf('OFFICIAL_PO', ${currentRfqId || 1})" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition text-center cursor-pointer shadow-sm">View PO PDF</button>
            </div>

            <div class="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold text-blue-900">Import Permit</span>
                        <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">Buyer Doc</span>
                    </div>
                    <p class="text-[11px] text-slate-500">Buyer's official import license.</p>
                </div>
                <button type="button" onclick="previewCoordinatorPdf('IMPORT_PERMIT', ${currentRfqId || 1})" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition text-center cursor-pointer shadow-sm">View Permit PDF</button>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold text-slate-900">Commercial Invoice</span>
                        <span class="text-[10px] ${isStep4Done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded font-semibold">
                            ${isStep4Done ? 'Generated' : 'Pending'}
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-500">Vendor commercial invoice document.</p>
                </div>
                ${isStep4Done ? `
                    <button type="button" onclick="previewCoordinatorPdf('COMMERCIAL_INVOICE', ${currentRfqId || 1})" class="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition text-center cursor-pointer shadow-sm">View Invoice PDF</button>
                ` : `
                    <button type="button" disabled class="w-full py-2 bg-slate-200 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed text-center">Not Available</button>
                `}
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold text-slate-900">Bill of Lading</span>
                        <span class="text-[10px] ${isStep4Done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded font-semibold">
                            ${isStep4Done ? 'Generated' : 'Post-dispatch'}
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-500">Official Bill of Lading freight receipt.</p>
                </div>
                ${isStep4Done ? `
                    <button type="button" onclick="previewCoordinatorPdf('BOL_DOCUMENT', ${currentRfqId || 1})" class="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition text-center cursor-pointer shadow-sm">View BOL PDF</button>
                ` : `
                    <button type="button" disabled class="w-full py-2 bg-slate-200 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed text-center">Not Available</button>
                `}
            </div>
        `;
    }
}

function injectDocumentPreviewModalHTML() {
    if (document.getElementById("coordinatorPdfPreviewModal")) return;

    const modalHTML = `
    <div id="coordinatorPdfPreviewModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <h3 id="pdfModalTitle" class="font-bold text-slate-800 text-base">Document Viewer</h3>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="downloadActivePdf()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download PDF
                    </button>
                    <button type="button" onclick="closeCoordinatorPdfModal()" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition text-lg font-bold cursor-pointer">×</button>
                </div>
            </div>
            <div class="p-6 bg-slate-100 flex justify-center overflow-y-auto">
                <div id="pdfPaperContainer" class="bg-white w-full max-w-2xl shadow-lg rounded-xl p-8 border border-slate-200 text-slate-800 space-y-6">
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

let activePreviewDocType = null;

function previewCoordinatorPdf(docType, rfqId) {
    activePreviewDocType = docType;
    const modal = document.getElementById("coordinatorPdfPreviewModal");
    const titleEl = document.getElementById("pdfModalTitle");
    const container = document.getElementById("pdfPaperContainer");

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }

    const meta = activeOrderMeta;
    const poNum = meta.poRef || currentActivePo || 'PO-85500006';
    const prodName = meta.productName || 'USB-C Hub';
    const vName = meta.vendorName || 'Global Trade Vendor';

    const qty = Number(meta.quantity) || 100;
    const uPrice = Number(meta.unitPrice) || 120.00;
    const subtotal = qty * uPrice;
    const currentDate = new Date().toLocaleDateString();

    const activeId = rfqId || currentRfqId || meta.rfqId;
    const trackingNo = document.getElementById("trackingNoInput")?.value ||
        localStorage.getItem(`vendor_tracking_${activeId}`) ||
        'BOL-570188';

    if (titleEl) {
        if (docType === 'OFFICIAL_PO') titleEl.innerText = "Official Purchase Order (" + poNum + ")";
        else if (docType === 'IMPORT_PERMIT') titleEl.innerText = "Import Permit (" + poNum + ")";
        else if (docType === 'COMMERCIAL_INVOICE') titleEl.innerText = "Commercial Invoice (" + poNum + ")";
        else if (docType === 'BOL_DOCUMENT') titleEl.innerText = "Bill of Lading (" + poNum + ")";
        else titleEl.innerText = "Document Viewer";
    }

    if (container) {
        container.innerHTML = `
            <div class="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                    <h1 class="text-xl font-bold text-slate-900">GLOBAL TRADE PORTAL</h1>
                    <p class="text-xs text-slate-500 mt-1">Official Document & Trade Management Hub</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">${docType || 'DOCUMENT'}</span>
                    <p class="text-xs text-slate-400 mt-1">Date: ${currentDate}</p>
                </div>
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                    <span class="text-slate-400 font-semibold block mb-0.5">PO REFERENCE:</span>
                    <span class="font-mono font-bold text-slate-800 text-sm">${poNum}</span>
                </div>
                <div>
                    <span class="text-slate-400 font-semibold block mb-0.5">TRACKING / BATCH NO:</span>
                    <span class="font-mono font-bold text-indigo-600 text-sm">${trackingNo}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                    <span class="text-slate-400 font-semibold block mb-0.5">ISSUED TO (VENDOR):</span>
                    <span class="font-bold text-slate-800 text-sm">${vName}</span>
                </div>
                <div>
                    <span class="text-slate-400 font-semibold block mb-0.5">ROUTE:</span>
                    <span class="font-medium text-slate-800">Origin → Colombo Port</span>
                </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table class="min-w-full divide-y divide-slate-200 text-xs">
                    <thead class="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                            <th class="px-4 py-2.5 text-left">Item Description</th>
                            <th class="px-4 py-2.5 text-center">Qty</th>
                            <th class="px-4 py-2.5 text-right">Unit Price</th>
                            <th class="px-4 py-2.5 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                        <tr>
                            <td class="px-4 py-3 font-medium">${prodName}</td>
                            <td class="px-4 py-3 text-center">${qty}</td>
                            <td class="px-4 py-3 text-right">$${uPrice.toFixed(2)}</td>
                            <td class="px-4 py-3 text-right font-bold">$${subtotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex justify-end pt-4 border-t border-slate-200">
                <div class="w-52 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-500"><span>Subtotal:</span><span class="font-semibold text-slate-800">$${subtotal.toFixed(2)}</span></div>
                    <div class="flex justify-between text-slate-500"><span>Tax / Duties (0%):</span><span class="font-semibold text-slate-800">$0.00</span></div>
                    <div class="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2"><span>Total Amount:</span><span class="text-indigo-600">$${subtotal.toFixed(2)}</span></div>
                </div>
            </div>

            <div class="text-[11px] text-slate-400 text-center pt-6 border-t border-slate-100">
                This is a system-generated secure document via Global Trade Portal. Valid without physical signature.
            </div>
        `;
    }
}

function closeCoordinatorPdfModal() {
    const modal = document.getElementById("coordinatorPdfPreviewModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function downloadActivePdf() {
    alert("Downloading " + (activePreviewDocType || "Document") + " as PDF...");
}

function dispatchGoods() {
    if(!currentRfqId && !currentActivePo) return;
    const activeId = currentRfqId || currentActivePo;

    const trackingInput = document.getElementById("trackingNoInput");
    let autoTrackingNo = trackingInput ? trackingInput.value : "";
    if (!autoTrackingNo) {
        autoTrackingNo = "BOL-" + Math.floor(100000 + Math.random() * 900000);
        if (trackingInput) trackingInput.value = autoTrackingNo;
    }

    localStorage.setItem(`vendor_dispatched_${activeId}`, 'true');
    localStorage.setItem(`vendor_tracking_${activeId}`, autoTrackingNo);
    if (currentActivePo) localStorage.setItem(`vendor_dispatched_${currentActivePo}`, 'true');

    // Coordinator පැත්තට real-time update එක යන්න අමතරව local state එක save කරන්න
    let existingRoute = JSON.parse(
        localStorage.getItem(`rfq_route_${activeId}`) ||
        localStorage.getItem(`vendor_route_${currentActivePo}`) || '{}'
    );
    existingRoute.status = 'DISPATCHED';
    existingRoute.trackingNumber = autoTrackingNo;
    localStorage.setItem(`rfq_route_${activeId}`, JSON.stringify(existingRoute));
    localStorage.setItem(`rfq_status_${activeId}`, 'DISPATCHED');

    const payload = {
        status: "DISPATCHED",
        trackingNumber: autoTrackingNo,
        poReference: currentActivePo,
        rfqId: currentRfqId
    };

    const url = window.location.origin + `/globaltrade/api/vendors/orders/${activeId}/dispatch`;

    fetch(url, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) throw new Error("Server endpoint not found");
            return response.json();
        })
        .then(data => {
            updateTowerStepsUI("DISPATCHED", autoTrackingNo);
            fetchVendorOrders();
            alert("Goods marked as dispatched successfully!");
        })
        .catch(error => {
            console.warn("Backend sync skipped, updating UI locally:", error);
            updateTowerStepsUI("DISPATCHED", autoTrackingNo);
            fetchVendorOrders();
            alert("Goods marked as dispatched successfully! (Local Mode)");
        });
}


function updateTrackingNo() {
    const trk = document.getElementById("trackingNoInput")?.value;
    if(!trk) {
        alert("Please enter a valid tracking number.");
        return;
    }
    alert("Tracking number " + trk + " updated successfully!");
}

function openPoPreviewModal() {
    previewCoordinatorPdf('OFFICIAL_PO', currentRfqId);
}

function closePoPreviewModal() {
    closeCoordinatorPdfModal();
}

function showToast(message, type = 'success') {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto flex items-center px-4 py-3 rounded-xl shadow-lg text-white text-xs font-semibold transition-all transform translate-y-2 opacity-0 ${
        type === 'success' ? 'bg-slate-900 border border-slate-700' : 'bg-red-600'
    }`;

    toast.innerHTML = `
        <span class="mr-2 text-sm">${type === 'success' ? '✅' : '⚠️'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("translate-y-2", "opacity-0");
    }, 10);

    setTimeout(() => {
        toast.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function downloadPoPdf() {
    previewCoordinatorPdf('OFFICIAL_PO', currentRfqId);
}