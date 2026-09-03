let allArrivals = [];
let filteredArrivals = [];
let currentArrivalPage = 1;
const itemsPerArrivalPage = 10;

document.addEventListener("DOMContentLoaded", () => {
    fetchArrivals();
    const searchInput = document.getElementById("arrivalSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filterArrivalsTable);
    }
});

function renderArrivalsLoading() {
    return `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-500">Loading arrivals...</td></tr>`;
}

function renderArrivalsEmpty() {
    return `<tr><td colspan="5" class="px-6 py-14 text-center text-slate-500">No cargo is awaiting customs review.</td></tr>`;
}

function renderArrivalsError() {
    return `<tr><td colspan="5" class="px-6 py-10 text-center text-red-500">Error loading arrivals. <button onclick="fetchArrivals()" class="underline">Retry</button></td></tr>`;
}

function renderArrivalRow(item) {
    const poRef = item.poId != null ? `#${item.poId}` : '—';
    const vendorName = item.vendorName || '—';
    const productName = item.productName || '—';
    const route = 'Ningbo → Colombo';
    const tracking = item.trackingNumber || item.tracking_number || '—';
    const shipmentId = item.shipmentId;
    const currentStatus = item.status || 'ARRIVED_AT_PORT';

    const isCleared = currentStatus === 'CUSTOMS_CLEARED' || currentStatus === 'CLEARED';

    return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 text-sm font-semibold text-slate-800">${poRef}</td>
            <td class="px-6 py-4 text-sm text-slate-600">
                <div class="font-medium text-slate-900">${vendorName}</div>
                <div class="text-xs text-slate-500">${productName}</div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-500">${route}</td>
            <td class="px-6 py-4 text-sm font-mono text-slate-600">${tracking}</td>
            <td class="px-6 py-4 text-right flex items-center justify-end gap-2">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full ${isCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                    ${isCleared ? 'CLEARED' : currentStatus}
                </span>
                <button onclick="openCustomsModal(${shipmentId})" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm">
                    Review / Action
                </button>
            </td>
        </tr>
    `;
}

function openCustomsModal(shipmentId) {
    const item = allArrivals.find(i => i.shipmentId === shipmentId);
    if (!item) return;

    const existingModal = document.getElementById('customsActionModal');
    if (existingModal) existingModal.remove();

    const poRefDisplay = item.poId != null ? `PO-${item.poId}` : '—';
    const tracking = item.trackingNumber || item.tracking_number || '—';
    const routeText = 'Ningbo -> Colombo';
    const vendorName = item.vendorName || '—';
    const productName = item.productName || '—';
    const quantity = item.quantity != null ? item.quantity : 1;
    const isCleared = item.status === 'CUSTOMS_CLEARED' || item.status === 'CLEARED' || item.status === 'IN_TRANSIT';
    const shipmentStatus = isCleared ? 'CLEARED' : (item.status || 'ARRIVED_AT_PORT');

    const modalHTML = `
        <div id="customsActionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div class="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 transform transition-all my-8">

                <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-bold tracking-wide">Customs Arrival Review</h3>
                        <p class="text-xs text-slate-400 font-mono mt-0.5">${poRefDisplay} | ${tracking}</p>
                    </div>
                    <button onclick="closeCustomsModal()" class="text-slate-400 hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span class="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Vendor</span>
                            <span class="text-sm font-semibold text-slate-800 truncate block mt-0.5">${vendorName}</span>
                        </div>
                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span class="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Product</span>
                            <span class="text-sm font-semibold text-slate-800 truncate block mt-0.5">${productName} (${quantity} units)</span>
                        </div>
                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span class="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Route</span>
                            <span class="text-sm font-semibold text-slate-800 truncate block mt-0.5">${routeText}</span>
                        </div>
                        <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span class="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Shipment Status</span>
                            <span class="text-sm font-semibold text-emerald-600 truncate block mt-0.5">${shipmentStatus}</span>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Required Documents</h4>
                        <div class="space-y-2.5">
                            <div class="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/10">
                                <div>
                                    <h5 class="text-xs font-extrabold text-slate-900 tracking-wide">COMMERCIAL INVOICE</h5>
                                    <span class="text-[11px] font-medium text-emerald-600">Verified</span>
                                </div>
                                <button onclick="viewDocument('Commercial Invoice', '${poRefDisplay}', ${shipmentId})" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-xs font-semibold rounded-lg shadow-2xs transition">View</button>
                            </div>

                            <div class="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/10">
                                <div>
                                    <h5 class="text-xs font-extrabold text-slate-900 tracking-wide">PURCHASE ORDER</h5>
                                    <span class="text-[11px] font-medium text-emerald-600">Verified</span>
                                </div>
                                <button onclick="viewDocument('Purchase Order', '${poRefDisplay}', ${shipmentId})" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-xs font-semibold rounded-lg shadow-2xs transition">View</button>
                            </div>

                            <div class="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/10">
                                <div>
                                    <h5 class="text-xs font-extrabold text-slate-900 tracking-wide">CUSTOMS PERMIT</h5>
                                    <span class="text-[11px] font-medium text-emerald-600">Verified</span>
                                </div>
                                <button onclick="viewDocument('Customs Permit', '${poRefDisplay}', ${shipmentId})" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-xs font-semibold rounded-lg shadow-2xs transition">View</button>
                            </div>

                            <div class="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/10">
                                <div>
                                    <h5 class="text-xs font-extrabold text-slate-900 tracking-wide">BILL OF LADING</h5>
                                    <span class="text-[11px] font-medium text-emerald-600">Verified (${tracking})</span>
                                </div>
                                <button onclick="viewDocument('Bill of Lading', '${poRefDisplay}', ${shipmentId})" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-xs font-semibold rounded-lg shadow-2xs transition">View</button>
                            </div>

                            <div class="flex items-center justify-between p-3.5 rounded-xl border ${isCleared ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-200 bg-slate-50/50 opacity-75'}">
                                <div>
                                    <h5 class="text-xs font-extrabold text-slate-900 tracking-wide">CUSTOMS CLEARANCE CERTIFICATE</h5>
                                    <span class="text-[11px] font-medium ${isCleared ? 'text-indigo-600' : 'text-amber-600 font-semibold'}">
                                        ${isCleared ? 'Available' : 'Pending Clearance...'}
                                    </span>
                                </div>
                                ${isCleared
        ? `<button onclick="viewDocument('Customs Clearance Certificate', '${poRefDisplay}', ${shipmentId})" class="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-xs font-semibold rounded-lg shadow-2xs transition">View</button>`
        : `<button disabled class="px-3 py-1.5 bg-slate-200 text-slate-400 text-xs font-semibold rounded-lg cursor-not-allowed">Pending</button>`
    }
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">Review Notes / Remarks</label>
                        <textarea id="customsReviewNotes" rows="2" class="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500" placeholder="Optional clearance remarks..."></textarea>
                    </div>
                </div>

                <div class="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                    <button onclick="submitCustomsAction(${shipmentId}, 'APPROVED')" class="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs flex items-center gap-1.5">
                        Clear Shipment & Forward to Warehouse
                    </button>
                    <button onclick="submitCustomsAction(${shipmentId}, 'REJECTED')" class="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-2xs flex items-center gap-1.5">
                        Reject Clearance
                    </button>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function fetchArrivals() {
    try {
        const tableBody = document.getElementById('arrivalsTableBody');
        if (tableBody) tableBody.innerHTML = renderArrivalsLoading();

        const url = window.location.origin + "/globaltrade/api/customs/shipments/in-customs";

        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Failed to fetch arrivals (status ${response.status})`);

        const rawData = await response.json();

        // Include IN_TRANSIT so that items forwarded to the main warehouse still show up in the table
        allArrivals = rawData.filter(item => {
            const st = (item.status || "").toUpperCase();
            return st === 'DISPATCHED' || st === 'CUSTOMS' || st === 'ARRIVED_AT_PORT' || st === 'IN_CUSTOMS' || st === 'CUSTOMS_CLEARED' || st === 'CLEARED' || st === 'IN_TRANSIT';
        });

        filteredArrivals = [...allArrivals];

        const pendingCountEl = document.getElementById('pendingCount');
        const docsCountEl = document.getElementById('documentsCount');
        if (pendingCountEl) pendingCountEl.innerText = allArrivals.length;
        if (docsCountEl) docsCountEl.innerText = allArrivals.length * 2;

        renderArrivalsTable();
    } catch (error) {
        console.error('Error Details:', error);
        const tableBody = document.getElementById('arrivalsTableBody');
        if (tableBody) tableBody.innerHTML = renderArrivalsError();
    }
}

function filterArrivalsTable() {
    const searchInput = document.getElementById("arrivalSearchInput");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    filteredArrivals = allArrivals.filter(item => {
        const po = (item.poId != null ? String(item.poId) : "").toLowerCase();
        const vendor = (item.vendorName || "").toLowerCase();
        const product = (item.productName || "").toLowerCase();
        const tracking = (item.trackingNumber || item.tracking_number || "").toLowerCase();

        return po.includes(searchText)
            || vendor.includes(searchText)
            || product.includes(searchText)
            || tracking.includes(searchText)
            || "ningbo -> colombo".includes(searchText);
    });

    currentArrivalPage = 1;
    renderArrivalsTable();
}

function renderArrivalsTable() {
    const tableBody = document.getElementById('arrivalsTableBody');
    if (!tableBody) return;

    if (!filteredArrivals.length) {
        tableBody.innerHTML = renderArrivalsEmpty();
        return;
    }

    const start = (currentArrivalPage - 1) * itemsPerArrivalPage;
    const paginated = filteredArrivals.slice(start, start + itemsPerArrivalPage);
    tableBody.innerHTML = paginated.map(renderArrivalRow).join('');
}

function viewDocument(docName, poRef, shipmentId) {
    const item = allArrivals.find(i => i.shipmentId === shipmentId);
    if (!item) {
        alert(`Could not load details for ${docName}`);
        return;
    }

    if (docName === 'Customs Clearance Certificate' || docName === 'Clearance Certificate') {
        const isCleared = item.status === 'CUSTOMS_CLEARED' || item.status === 'CLEARED' || item.status === 'IN_TRANSIT';
        if (!isCleared) {
            alert("Customs Clearance Certificate is pending until the shipment is cleared.");
            return;
        }
        showUnifiedDocumentModal(docName, item);
        return;
    }

    showUnifiedDocumentModal(docName, item);
}

function closeCustomsModal() {
    const modal = document.getElementById('customsActionModal');
    if (modal) modal.remove();
}

async function submitCustomsAction(shipmentId, actionType) {
    const notes = document.getElementById('customsReviewNotes')?.value || '';
    try {
        if (actionType === 'APPROVED') {
            // First call the backend endpoint to forward to main warehouse (which performs stock inbound and sets status to IN_TRANSIT)
            const forwardUrl = window.location.origin + `/globaltrade/api/customs/shipments/${shipmentId}/forward-warehouse`;
            const forwardResponse = await fetchWithAuth(forwardUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!forwardResponse.ok) throw new Error("Failed to forward shipment to warehouse");

            const item = allArrivals.find(i => i.shipmentId === shipmentId);
            if (item) {
                item.status = 'IN_TRANSIT';
            }

            closeCustomsModal();
            renderArrivalsTable();
            fetchArrivals();

            if (item) {
                showUnifiedDocumentModal('Customs Clearance Certificate', item);
            }
        } else {
            // Handle REJECTED action
            const actualStatus = 'CUSTOMS_REJECTED';
            const url = window.location.origin + `/globaltrade/api/customs/shipments/${shipmentId}/status?status=${actualStatus}&notes=${encodeURIComponent(notes)}`;

            const response = await fetchWithAuth(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error("Failed to update status in database");

            const item = allArrivals.find(i => i.shipmentId === shipmentId);
            if (item) {
                item.status = actualStatus;
            }

            closeCustomsModal();
            renderArrivalsTable();
            fetchArrivals();
        }
    } catch (error) {
        console.error('Error updating shipment status:', error);
        alert('Failed to process shipment action and save to database.');
    }
}

function showUnifiedDocumentModal(docName, item) {
    const existingModal = document.getElementById('documentViewerModal');
    if (existingModal) existingModal.remove();

    if (!document.getElementById('printStyleFix')) {
        const style = document.createElement('style');
        style.id = 'printStyleFix';
        style.innerHTML = `
            @media print {
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
                body * {
                    visibility: hidden !important;
                }
                #documentViewerModal, #documentViewerModal * {
                    visibility: visible !important;
                }
                #documentViewerModal {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: white !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 999999 !important;
                }
                #documentViewerModal > div {
                    box-shadow: none !important;
                    border: none !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    max-height: 100% !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const poRefDisplay = item.poId != null ? `PO-${item.poId}` : '—';
    const tracking = item.trackingNumber || item.tracking_number || '—';
    const vendorName = item.vendorName || '—';
    const productName = item.productName || '—';
    const quantity = item.quantity != null ? Number(item.quantity) : 100;

    const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : 2.50;
    const subtotal = quantity * unitPrice;
    const shippingCost = item.shippingCost != null ? Number(item.shippingCost) : 0.00;
    const totalAmount = subtotal + shippingCost;
    const currentDate = new Date().toLocaleDateString();

    const modalHTML = `
        <div id="documentViewerModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 transform transition-all my-8 flex flex-col max-h-[90vh]">

                <div class="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <span class="text-xs font-bold tracking-wide">${docName} (${poRefDisplay})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.print()" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Download PDF
                        </button>
                        <button onclick="document.getElementById('documentViewerModal').remove()" class="text-slate-400 hover:text-white transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>

                <div class="p-8 space-y-5 bg-white text-slate-800 overflow-y-auto flex-1 font-sans text-xs">
                    
                    <div class="flex justify-between items-start border-b border-slate-200 pb-4">
                        <div>
                            <h3 class="text-base font-black tracking-wider text-slate-900 uppercase">GLOBAL TRADE PORTAL</h3>
                            <p class="text-[11px] text-slate-500">Official Document & Trade Management Hub</p>
                        </div>
                        <div class="text-right">
                            <span class="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold tracking-widest uppercase mb-1">VERIFIED / CLEARED</span>
                            <p class="text-[11px] text-slate-500">Date: <span class="font-semibold text-slate-800">${currentDate}</span></p>
                        </div>
                    </div>

                    <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-4">
                        <div>
                            <span class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reference / Tracking:</span>
                            <span class="font-mono font-semibold text-slate-900 mt-0.5 block">${poRefDisplay} | ${tracking}</span>
                        </div>
                        <div>
                            <span class="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supplier / Vendor:</span>
                            <span class="font-semibold text-slate-900 mt-0.5 block">${vendorName}</span>
                        </div>
                    </div>

                    <div class="overflow-hidden rounded-xl border border-slate-200">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider border-b border-slate-200">
                                    <th class="px-3.5 py-2.5 font-semibold">Item Description</th>
                                    <th class="px-3.5 py-2.5 font-semibold text-center">Qty</th>
                                    <th class="px-3.5 py-2.5 font-semibold text-right">Unit Price</th>
                                    <th class="px-3.5 py-2.5 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-slate-700">
                                <tr>
                                    <td class="px-3.5 py-3 font-medium text-slate-900">${productName}</td>
                                    <td class="px-3.5 py-3 text-center">${quantity}</td>
                                    <td class="px-3.5 py-3 text-right">$${unitPrice.toFixed(2)}</td>
                                    <td class="px-3.5 py-3 text-right font-semibold text-slate-900">$${subtotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="flex justify-end">
                        <div class="w-60 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                            <div class="flex justify-between text-slate-500">
                                <span>Subtotal:</span>
                                <span class="font-mono font-medium text-slate-800">$${subtotal.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-slate-500">
                                <span>Shipping / Duty:</span>
                                <span class="font-mono font-medium text-slate-800">$${shippingCost.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                                <span>Total Amount:</span>
                                <span class="font-mono text-indigo-600">$${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-slate-600">
                        <div><b>STATUS:</b> Approved | <b>TERMS:</b> Net 30</div>
                        <div><b>TERMS & CONDITIONS:</b> This is a system-generated secure document. Valid without physical signature.</div>
                    </div>

                    <div class="pt-2 text-center border-t border-slate-100">
                        <p class="text-[10px] text-slate-400 italic">Prepared By Global Trade Procurement Team — Authorized Signatory</p>
                    </div>
                </div>

                <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0 no-print">
                    <button onclick="document.getElementById('documentViewerModal').remove()" class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm">
                        Close Viewer
                    </button>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.fetchArrivals = fetchArrivals;
window.openCustomsModal = openCustomsModal;
window.closeCustomsModal = closeCustomsModal;
window.submitCustomsAction = submitCustomsAction;
window.showUnifiedDocumentModal = showUnifiedDocumentModal;
window.viewDocument = viewDocument;