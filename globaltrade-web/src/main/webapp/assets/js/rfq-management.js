let allRFQs = [];
let filteredRFQs = [];
let currentRFQPage = 1;
let activeSelectedRfqId = null;
const itemsPerRFQPage = 10;
let countdownInterval;
let currentPdfBlobUrl = null;

function getDummyRouteOptions() {
    return [
        {
            key: 'economical',
            badge: 'LOWEST COST',
            badgeClass: 'bg-emerald-100 text-emerald-700',
            cardClass: 'border-slate-200',
            buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            icon: '<span class="p-2 bg-amber-50 text-amber-600 rounded-xl text-sm">🪙</span>',
            name: 'Economical',
            mode: 'SEA_FREIGHT',
            modeLabel: 'SEA FREIGHT',
            cost: 400,
            transitDays: 17,
            carrier: 'Evergreen',
            lane: 'Ningbo → Colombo'
        },
        {
            key: 'balanced',
            badge: 'AI RECOMMENDED',
            badgeClass: 'bg-indigo-600 text-white',
            cardClass: 'border-slate-200',
            buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            icon: '<span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm">⚖️</span>',
            name: 'Balanced Choice',
            mode: 'SEA_FREIGHT',
            modeLabel: 'SEA FREIGHT',
            cost: 650,
            transitDays: 12,
            carrier: 'COSCO',
            lane: 'Ningbo → Colombo'
        },
        {
            key: 'express',
            badge: 'QUICKEST TRANSIT',
            badgeClass: 'bg-blue-100 text-blue-700',
            cardClass: 'border-slate-200',
            buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
            icon: '<span class="p-2 bg-blue-50 text-blue-600 rounded-xl text-sm">✈️</span>',
            name: 'Express',
            mode: 'AIR_FREIGHT',
            modeLabel: 'AIR FREIGHT',
            cost: 2500,
            transitDays: 2,
            carrier: 'Qatar Airways Cargo',
            lane: 'Ningbo → Colombo'
        }
    ];
}

const STATUS_BADGE_STYLES = {
    'OPEN': 'bg-blue-50 text-blue-600 border-blue-200',
    'NEW': 'bg-blue-50 text-blue-600 border-blue-200',
    'PENDING': 'bg-blue-50 text-blue-600 border-blue-200',
    'BIDDING': 'bg-amber-50 text-amber-600 border-amber-200',
    'ACCEPTED': 'bg-purple-50 text-purple-600 border-purple-200',
    'CONFIRMED': 'bg-purple-50 text-purple-600 border-purple-200',
    'ROUTE_PLANNED': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'DISPATCHED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'IN_TRANSIT': 'bg-blue-50 text-blue-600 border-blue-200',
    'DELIVERED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'CANCELLED': 'bg-red-50 text-red-600 border-red-200'
};

function statusBadgeClass(status) {
    const key = String(status || '').toUpperCase();
    return STATUS_BADGE_STYLES[key] || 'bg-slate-50 text-slate-600 border-slate-200';
}

function statusBadgeLabel(status) {
    return String(status || 'PENDING').replace(/_/g, ' ');
}

document.addEventListener("DOMContentLoaded", () => {
    fetchRFQs();
    document.getElementById('rfqSearchInput')?.addEventListener('input', filterRFQTable);
    document.getElementById('rfqStatusSelect')?.addEventListener('change', filterRFQTable);

    // Listen for localStorage changes from vendor side
    window.addEventListener('storage', function(e) {
        if (e.key && (e.key.startsWith('vendor_dispatched_') || e.key.startsWith('rfq_status_'))) {
            console.log('Dispatch status changed in localStorage:', e.key, e.newValue);
            filterRFQTable();
        }
    });
});

function populateStatusFilterOptions(rfqs) {
    const select = document.getElementById('rfqStatusSelect');
    if (!select) return;
    const currentValue = select.value;
    const statuses = [...new Set(rfqs.map(r => r.status).filter(Boolean))].sort();
    select.innerHTML = '<option value="">All Statuses</option>';
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = statusBadgeLabel(status);
        select.appendChild(option);
    });
    select.value = currentValue;
}

async function fetchRFQs() {
    try {
        const url = window.location.origin + "/globaltrade/api/coordinator/rfq";
        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {"Authorization": "Bearer " + getCookie("accessToken"), "Accept": "application/json"}
        });

        if (!response.ok) throw new Error("HTTP Error! Status: " + response.status);

        const data = await response.json();
        allRFQs = Array.isArray(data) ? [...data].reverse() : [];
        populateStatusFilterOptions(allRFQs);
        filterRFQTable();
    } catch (error) {
        console.error("Error fetching RFQs:", error);
        showRFQEmptyState();
    }
}

function filterRFQTable() {
    const searchText = (document.getElementById('rfqSearchInput')?.value || '').toLowerCase().trim();
    const selectedStatus = document.getElementById('rfqStatusSelect')?.value || '';

    filteredRFQs = allRFQs.filter(rfq => {
        const id = String(rfq.rfqId || rfq.id || "").toLowerCase();
        const productName = String(rfq.productName || rfq.product?.productName || rfq.product?.name || rfq.productId || "").toLowerCase();
        const status = rfq.status || "";

        const searchMatch = !searchText || id.includes(searchText) || productName.includes(searchText) || status.toLowerCase().includes(searchText);
        const statusMatch = !selectedStatus || status === selectedStatus;
        return searchMatch && statusMatch;
    });

    currentRFQPage = 1;
    renderRFQTable();
}

function renderRFQTable() {
    const tableBody = document.getElementById("rfqTableBody");
    if (!tableBody) return;

    syncDispatchStatusFromLocalStorage();

    if (!filteredRFQs || filteredRFQs.length === 0) {
        showRFQEmptyState();
        return;
    }

    const totalPages = Math.ceil(filteredRFQs.length / itemsPerRFQPage);
    if (currentRFQPage > totalPages) currentRFQPage = totalPages || 1;

    const start = (currentRFQPage - 1) * itemsPerRFQPage;
    const end = start + itemsPerRFQPage;
    const paginatedRFQs = filteredRFQs.slice(start, end);

    tableBody.innerHTML = paginatedRFQs.map(rfq => {
        const rfqId = rfq.rfqId || rfq.id || "N/A";
        const productName = (rfq.productName || rfq.product?.productName || rfq.product?.name || rfq.productId || "N/A").replace(/'/g, "\\'");
        const qty = rfq.requestedQuantity || rfq.quantity || "N/A";
        let status = rfq.status || "PENDING";
        const bidsCount = rfq.bidsCount || rfq.totalBids || 0;

        // Get the SINGLE PO number from the RFQ data (generated once on coordinator side)
        const poNumber = rfq.poNumber || rfq.poReference || `PO-${8550000 + Number(rfqId)}`;

        // Get tracking from localStorage (set by vendor)
        let tracking = localStorage.getItem(`vendor_tracking_${rfqId}`) || rfq.trackingNumber || '';

        if (localStorage.getItem(`vendor_dispatched_${rfqId}`) === 'true' ||
            localStorage.getItem(`rfq_status_${rfqId}`) === 'DISPATCHED') {
            status = 'DISPATCHED';
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors duration-150">
                <td class="px-6 py-4">
                    <div>
                        <div class="font-semibold text-slate-800 text-sm">#${rfqId}</div>
                        <div class="text-xs text-slate-500 truncate max-w-[180px]">${productName}</div>
                        <div class="text-[10px] text-indigo-500 font-mono">📄 ${poNumber}</div>
                        ${tracking ? `<div class="text-[10px] text-emerald-600 font-mono">📦 ${tracking}</div>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">${rfq.origin || 'Ningbo'} → ${rfq.destination || 'Colombo'}</td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-700">${qty} units</div>
                    <div class="text-xs text-slate-400">${rfq.transportMode || 'SEA'}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-600 border-blue-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        ${bidsCount} bids
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(status)}">
                        <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                        ${statusBadgeLabel(status)}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="openLifecycleModal(${rfqId}, '${status}', '${productName}')"
                                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-sm text-xs font-semibold hover:bg-slate-800 transition-colors">
                            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg>
                            Control Tower
                        </button>
                        <button onclick="viewRfqBids(${rfqId}, '${status}')"
                                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl shadow-sm text-xs font-semibold hover:bg-indigo-700 transition-colors">
                            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                ${status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'ROUTE_PLANNED' || status === 'LOADED_TO_PLANE' || status === 'DEPARTED_HARBOR' || status === 'FULFILLED' || status === 'DISPATCHED'
            ? '<path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>'}
                            </svg>
                            ${status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'ROUTE_PLANNED' || status === 'LOADED_TO_PLANE' || status === 'DEPARTED_HARBOR' || status === 'FULFILLED' || status === 'DISPATCHED' ? 'Configure Route' : 'View Bids'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderRFQPaginationControls(totalPages);
}

// ============================================================
// SYNC DISPATCH STATUS FROM LOCALSTORAGE
// ============================================================
function syncDispatchStatusFromLocalStorage() {
    let synced = 0;
    allRFQs.forEach(rfq => {
        const rfqId = rfq.rfqId || rfq.id;
        if (rfqId) {
            const isDispatched = localStorage.getItem(`vendor_dispatched_${rfqId}`) === 'true' ||
                localStorage.getItem(`rfq_status_${rfqId}`) === 'DISPATCHED';
            if (isDispatched) {
                rfq.status = 'DISPATCHED';
                const tracking = localStorage.getItem(`vendor_tracking_${rfqId}`);
                if (tracking) {
                    rfq.trackingNumber = tracking;
                }
                synced++;
            }

            const routeData = localStorage.getItem(`rfq_route_${rfqId}`);
            if (routeData) {
                try {
                    const parsed = JSON.parse(routeData);
                    if (parsed.mode && !rfq.transportMode) {
                        rfq.transportMode = parsed.mode;
                    }
                    if (parsed.carrierName && !rfq.carrier) {
                        rfq.carrier = parsed.carrierName;
                    }
                } catch(e) {}
            }
        }
    });
    return synced;
}

function syncDispatchStatus() {
    const synced = syncDispatchStatusFromLocalStorage();
    renderRFQTable();
    showToast(`Synced ${synced} orders with dispatch status.`, 'success');
}

function openLifecycleModal(rfqId, status = 'OPEN', product = 'Product') {
    const modal = document.getElementById('lifecycleModal');
    const modalTitle = document.getElementById('modalLifecycleTitle');

    // Get the RFQ data
    let currentRfq = allRFQs.find(r => (r.rfqId || r.id) == rfqId) || {};

    // Get the SINGLE PO number from the RFQ (generated once on coordinator side)
    const poNumber = currentRfq.poNumber || currentRfq.poReference || `PO-${8550000 + Number(rfqId)}`;

    // Get tracking from localStorage (set by vendor)
    let trackingNumber = localStorage.getItem(`vendor_tracking_${rfqId}`) || currentRfq.trackingNumber || 'BOL-292416';

    // Check dispatch status from localStorage
    let currentStatus = String(status || 'OPEN').trim().toUpperCase();
    if (localStorage.getItem(`vendor_dispatched_${rfqId}`) === 'true' ||
        localStorage.getItem(`rfq_status_${rfqId}`) === 'DISPATCHED') {
        currentStatus = 'DISPATCHED';
    }

    if (modalTitle) {
        modalTitle.textContent = `${poNumber} / RFQ-${rfqId}`;
    }

    const stepsContainer = document.getElementById('lifecycleStepsWrapper');
    if (!stepsContainer) return;

    const savedRouteData = JSON.parse(sessionStorage.getItem(`rfq_route_${rfqId}`) || '{}');

    const isRoutePlanned = currentStatus === 'ROUTE_PLANNED' || currentStatus === 'CONFIRMED' || currentStatus === 'IN_PROGRESS' || currentStatus === 'DISPATCHED' || !!savedRouteData.mode || !!currentRfq.transportMode;
    const isDispatched = currentStatus === 'DISPATCHED' || currentStatus === 'IN_TRANSIT' || currentStatus === 'DELIVERED' || currentStatus === 'FULFILLED' || !!trackingNumber;

    const carrierName = isRoutePlanned ? (savedRouteData.carrierName || currentRfq?.carrier || 'COSCO') : 'Not Selected Yet';
    const transportModeText = isRoutePlanned ? (savedRouteData.mode || currentRfq?.transportMode || 'SEA_FREIGHT') : 'Pending Selection';

    const vendorName = currentRfq.vendorName || 'Global Supplies Inc';
    const requestedQty = currentRfq.requestedQuantity || currentRfq.quantity || 200;

    const customsDocUrl = currentRfq.customsDocumentUrl || currentRfq.customsDocUrl || '';
    const isCustomsCleared = isDispatched && (!!customsDocUrl || currentRfq.customsStatus === 'CLEARED' || currentRfq.customsStatus === 'UPLOADED');

    const step3Bg = isRoutePlanned ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white';
    const step3Icon = isRoutePlanned ? '✓' : '3';
    const step3TextClass = isRoutePlanned ? 'text-slate-700 font-semibold' : 'text-blue-600 font-bold';
    const step3Label = isRoutePlanned ? 'Route Planned' : 'Route Pending';

    const step4Bg = isDispatched ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500';
    const step4Icon = isDispatched ? '✓' : '4';
    const step4TextClass = isDispatched ? 'text-slate-700 font-semibold' : 'text-slate-400 font-medium';
    const step4Label = isDispatched ? 'Dispatch / Transit' : 'Transit Pending';

    stepsContainer.innerHTML = `
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span id="transitStatusDot" class="w-2.5 h-2.5 rounded-full ${isDispatched ? 'bg-emerald-500' : 'bg-blue-500'}"></span>
                <span class="font-bold text-slate-700 text-xs">Live Status Auto-Sync Active</span>
            </div>
            <span class="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg shadow-sm">${isDispatched ? 'Synced' : 'Waiting for Route / Dispatch'}</span>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div class="flex items-center justify-between relative max-w-xl mx-auto">
                <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
                
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">✓</div>
                    <span class="text-[11px] font-semibold text-slate-700 mt-1.5">Evaluate Bids</span>
                </div>
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">✓</div>
                    <span class="text-[11px] font-semibold text-slate-700 mt-1.5">Vendor Ack</span>
                </div>
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full ${step3Bg} flex items-center justify-center font-bold text-xs shadow-sm">${step3Icon}</div>
                    <span class="text-[11px] ${step3TextClass} mt-1.5">${step3Label}</span>
                </div>
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full ${step4Bg} flex items-center justify-center font-bold text-xs shadow-sm">${step4Icon}</div>
                    <span class="text-[11px] ${step4TextClass} mt-1.5">${step4Label}</span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 space-y-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">✓</span>
                    <span class="font-semibold text-slate-800 text-sm">1. Vendor Bid Evaluation</span>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-600 border-emerald-200">COMPLETED</span>
            </div>
            <p class="text-xs text-slate-500 pl-10">Evaluated multiple vendor bids for <strong class="text-slate-700">${requestedQty} Units</strong> of ${product} and selected optimal supplier.</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 space-y-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">✓</span>
                    <span class="font-semibold text-slate-800 text-sm">2. Formal PO & Vendor Acknowledgment</span>
                </div>
                <button onclick="openUniversalPdfModal('Purchase Order', 'po', ${rfqId})" class="px-3.5 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-xs rounded-xl transition shadow-sm">View Official PO</button>
            </div>
            <p class="text-xs text-slate-500 pl-10">Vendor (<strong class="text-slate-700">${vendorName}</strong>) acknowledged and confirmed readiness for <strong class="text-slate-700">${requestedQty} Units</strong> of ${product}.</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 space-y-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-full ${isRoutePlanned ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center shrink-0 font-bold text-xs">${isRoutePlanned ? '✓' : '3'}</span>
                    <span class="font-semibold text-slate-800 text-sm">3. AI Route Optimization Engine</span>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${isRoutePlanned ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}">${isRoutePlanned ? 'CONFIRMED' : 'PENDING ROUTE'}</span>
            </div>
            <div class="ml-10 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${isRoutePlanned ? 'bg-emerald-500' : 'bg-blue-500'}"></span>
                    <strong class="text-slate-900">${isRoutePlanned ? 'Route Confirmed' : 'Route Selection Required'}</strong>
                </div>
                <p class="text-slate-500">
                    ${isRoutePlanned
        ? `Carrier: <span class="font-semibold text-slate-800">${carrierName}</span> | Mode: <span class="font-semibold text-slate-800">${transportModeText}</span>`
        : 'Please configure and select a shipping route to proceed.'}
                </p>
            </div>
        </div>

        <div class="bg-white rounded-2xl border-2 ${isDispatched ? 'border-emerald-100' : 'border-slate-200'} shadow-sm px-5 py-4 space-y-4 relative overflow-hidden">
            <span class="absolute top-0 right-0 ${isDispatched ? 'bg-emerald-600' : 'bg-slate-400'} text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wide">
                ${isDispatched ? 'GOODS DISPATCHED / IN TRANSIT' : 'PENDING DISPATCH'}
            </span>
            <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full ${isDispatched ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center shrink-0 text-sm">🚢</span>
                <span class="font-semibold text-slate-800 text-sm">4. Shipment & Customs Documents</span>
            </div>
            
            <div class="ml-10 space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Tracking No.</p>
                        <p class="font-bold text-slate-900 text-sm font-mono">${isDispatched ? trackingNumber : 'Not Assigned Yet'}</p>
                    </div>
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Shipment Status</p>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isDispatched ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${isDispatched ? 'bg-emerald-500' : 'bg-blue-500'}"></span> 
                            <span>${isDispatched ? 'DISPATCHED' : 'PENDING'}</span>
                        </span>
                    </div>
                </div>

                <div class="pt-2">
                    <p class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Attached Documents for ${product}</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-bold text-slate-900">Purchase Order</span>
                                    <span class="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Official</span>
                                </div>
                                <p class="text-[11px] text-slate-500">Official PO for ${requestedQty} units of ${product}.</p>
                            </div>
                            <button onclick="openUniversalPdfModal('Purchase Order', 'po', ${rfqId})" class="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm">View PO PDF</button>
                        </div>

                        <div class="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-bold text-indigo-900">Import Permit</span>
                                    <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-semibold">Auto</span>
                                </div>
                                <p class="text-[11px] text-slate-500">Compliance & license for ${product}.</p>
                            </div>
                            <button onclick="openUniversalPdfModal('Import Permit', 'import_permit', ${rfqId})" class="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm">View Permit PDF</button>
                        </div>

                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-bold text-slate-900">Invoice</span>
                                    <span class="text-[10px] ${isDispatched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded font-semibold">
                                        ${isDispatched ? 'Uploaded' : 'Pending'}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500">${isDispatched ? 'Commercial invoice document.' : 'Awaiting vendor dispatch upload.'}</p>
                            </div>
                            ${isDispatched
        ? `<button onclick="openUniversalPdfModal('Commercial Invoice', 'invoice', ${rfqId})" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm">View Invoice PDF</button>`
        : `<button disabled class="w-full py-1.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">Pending Dispatch</button>`
    }
                        </div>

                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-bold text-slate-900">Bill of Lading</span>
                                    <span class="text-[10px] ${isDispatched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded font-semibold">
                                        ${isDispatched ? 'Uploaded' : 'Pending'}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500">${isDispatched ? 'Official Bill of Lading receipt.' : 'Awaiting shipment receipt.'}</p>
                            </div>
                            ${isDispatched
        ? `<button onclick="openUniversalPdfModal('Bill of Lading', 'bol', ${rfqId})" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm">View BOL PDF</button>`
        : `<button disabled class="w-full py-1.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">Pending Dispatch</button>`
    }
                        </div>

                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-bold text-slate-900">Customs Clearance</span>
                                    <span class="text-[10px] ${isCustomsCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} px-2 py-0.5 rounded font-semibold">
                                        ${isCustomsCleared ? 'Cleared' : 'Pending'}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500">${isCustomsCleared ? 'Customs release documentation available.' : 'Waiting for customs agent upload.'}</p>
                            </div>
                            ${isCustomsCleared
        ? `<button onclick="openUniversalPdfModal('Customs Clearance', '${customsDocUrl || 'customs'}', ${rfqId})" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm">View PDF</button>`
        : `<button disabled class="w-full py-1.5 bg-slate-200 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">Pending Upload</button>`
    }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function selectRoute(rfqId, mode, carrier) {
    const routeData = {
        rfqId: rfqId,
        carrierName: carrier,
        mode: mode,
        selectedAt: new Date().toISOString()
    };
    sessionStorage.setItem(`rfq_route_${rfqId}`, JSON.stringify(routeData));

    let currentRfq = allRFQs.find(r => (r.rfqId || r.id) == rfqId);
    if (currentRfq) {
        currentRfq.status = 'CONFIRMED';
        currentRfq.transportMode = mode;
        currentRfq.carrier = carrier;
    }

    showToast('Route Selected', `Route confirmed with ${carrier} (${mode})!`);
    closeEvaluateModal();
    renderRFQTable();
}

function startAutoUpdateSimulation() {
    let timeLeft = 5;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('autoSyncTimer');
        const statusText = document.getElementById('transitStatusText');
        const statusDot = document.getElementById('transitStatusDot');

        if (timeLeft <= 0) {
            timeLeft = 5;
            if (statusText) statusText.innerText = "GPS Updated (" + new Date().toLocaleTimeString() + ")";
            if (statusDot) {
                statusDot.classList.toggle('bg-emerald-500');
                statusDot.classList.toggle('bg-indigo-500');
            }
        }
        if (timerEl) timerEl.innerText = "Next sync in " + timeLeft + "s";
    }, 1000);
}

function closeLifecycleModal() {
    if (countdownInterval) clearInterval(countdownInterval);
    const modal = document.getElementById("lifecycleModal");
    if (modal) {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
    }
}

function renderRFQPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("rfqPagination");
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        paginationContainer.classList.add("hidden");
        return;
    }

    paginationContainer.classList.remove("hidden");
    paginationContainer.className = "flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100";

    const startEntry = (currentRFQPage - 1) * itemsPerRFQPage + 1;
    const endEntry = Math.min(currentRFQPage * itemsPerRFQPage, filteredRFQs.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredRFQs.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeRFQPage(${currentRFQPage - 1})" ${currentRFQPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentRFQPage} of ${totalPages}</span>
            <button onclick="changeRFQPage(${currentRFQPage + 1})" ${currentRFQPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changeRFQPage(page) {
    currentRFQPage = page;
    renderRFQTable();
}

function showRFQEmptyState() {
    const tableBody = document.getElementById("rfqTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-14 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="p-3 rounded-full bg-slate-100 mb-3"><svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                    <p class="text-slate-500 font-medium">No RFQ records found</p>
                    <p class="text-sm text-slate-400 mt-1">Active RFQs will appear here.</p>
                </div>
            </td>
        </tr>
    `;
    document.getElementById("rfqPagination")?.classList.add("hidden");
}

async function viewRfqBids(rfqId, status = '') {
    console.log('viewRfqBids called with rfqId:', rfqId, 'status:', status);

    activeSelectedRfqId = rfqId;
    const modal = document.getElementById("evaluateModal");
    const subtitle = document.getElementById("modalRfqSubtitle");
    const tableBody = document.getElementById("modalBidsTableBody");
    const routeSection = document.getElementById("routeSelectionSection");

    if (subtitle) {
        subtitle.textContent = `Review quotations & configure transport route for RFQ #${rfqId}`;
    }

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-10 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span class="text-sm text-slate-500">Loading vendor bids...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    if (status === 'ACCEPTED' || status === 'CONFIRMED' || status === 'ROUTE_PLANNED' || status === 'IN_PROGRESS') {
        if (routeSection) {
            routeSection.classList.remove("hidden");
            renderRouteOptions(rfqId);
        }
    } else {
        if (routeSection) routeSection.classList.add("hidden");
    }

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }

    try {
        const url = window.location.origin + `/globaltrade/api/coordinator/rfq/${rfqId}/bids`;
        console.log('Fetching bids from:', url);

        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const bids = await response.json();
        console.log('Received bids:', bids);

        if (Array.isArray(bids)) {
            renderModalBids(bids);
        } else {
            console.error('Bids is not an array:', bids);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-10 text-center text-sm text-red-500">
                            Unexpected data format received from server.
                        </td>
                    </tr>
                `;
            }
        }
    } catch (error) {
        console.error("Error fetching bids:", error);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-10 text-center">
                        <div class="flex flex-col items-center gap-2">
                            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                            </svg>
                            <span class="text-sm font-medium text-slate-700">Could not load bids</span>
                            <span class="text-xs text-slate-400">${error.message || 'Please try again'}</span>
                            <button onclick="viewRfqBids(${rfqId}, '${status}')" 
                                    class="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition">
                                Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function renderRouteOptions(rfqId) {
    const subtitle = document.getElementById('routeEngineSubtitle');
    const grid = document.getElementById('routeOptionsGrid');
    if (!grid) return;

    if (subtitle) subtitle.textContent = `Analyzing optimal carriers and lanes for RFQ #${rfqId}`;
    const options = getDummyRouteOptions();

    grid.innerHTML = options.map(option => `
        <div class="relative bg-white border-2 ${option.cardClass} rounded-2xl p-5 flex flex-col justify-between">
            <span class="absolute top-4 right-4 ${option.badgeClass} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">${option.badge}</span>
            <div>
                <div class="flex items-center gap-2 mb-2">
                    ${option.icon}
                    <div>
                        <h5 class="font-bold text-slate-900 text-sm">${option.name}</h5>
                        <p class="text-[11px] text-slate-400 uppercase font-semibold">${option.modeLabel}</p>
                    </div>
                </div>
                <div class="my-3">
                    <div class="text-2xl font-extrabold text-slate-900">$${option.cost.toFixed(2)}</div>
                    <div class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">⏱ ${option.transitDays} Days Transit</div>
                </div>
                <div class="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Carrier / Route</p>
                    <p class="font-semibold text-slate-800 text-xs">${option.carrier}</p>
                    <p class="text-slate-500 text-xs">${option.lane}</p>
                </div>
            </div>
            <button onclick="selectRoute(${rfqId}, '${option.mode}', '${option.carrier}')" class="w-full py-2.5 ${option.buttonClass} font-bold text-xs rounded-xl transition shadow-sm">Select Route</button>
        </div>
    `).join('');
}

function cleanFilename(filename) {
    if (!filename) return '';
    let cleaned = filename;
    if (cleaned.includes('/')) cleaned = cleaned.substring(cleaned.lastIndexOf('/') + 1);
    if (cleaned.includes('\\')) cleaned = cleaned.substring(cleaned.lastIndexOf('\\') + 1);
    cleaned = cleaned.replace(/\\/g, '');
    cleaned = cleaned.replace(/['"]/g, '');
    cleaned = cleaned.replace(/\.\./g, '');
    cleaned = cleaned.replace(/\.\.\//g, '');
    cleaned = cleaned.replace(/\.\.\\/g, '');
    cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');
    return cleaned;
}

// ============================================================
// GENERATE DOCUMENT HTML - uses the shared PO number
// ============================================================
function generateDocumentHtml(title, docType, rfq, rfqId) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const productName = rfq.productName || rfq.product?.productName || rfq.product?.name || 'Standard Industrial Item';
    const quantity = rfq.requestedQuantity || rfq.quantity || 200;
    const unitPrice = rfq.unitPrice || 120.00;
    const totalAmount = (quantity * unitPrice).toFixed(2);
    const vendorName = rfq.vendorName || 'Global Trade Vendor';

    // Use the SAME PO number from the RFQ (generated once on coordinator side)
    const poNumber = rfq.poNumber || rfq.poReference || `PO-${8550000 + Number(rfqId || 25)}`;
    const rfqNumber = `RFQ-${rfqId || 'N/A'}`;

    let docTypeLabel = title || 'Document';
    let docCode = docType?.toUpperCase() || 'DOC';

    const origin = rfq.origin || 'Ningbo';
    const destination = rfq.destination || 'Colombo Port';
    const vessel = rfq.vessel || 'MAERSK COLUMBUS';
    const containerNo = rfq.containerNo || `MSKU${String(rfqId || Date.now()).slice(-4)}${String(Math.floor(Math.random() * 9) + 1)}`;

    // Get tracking from localStorage (set by vendor)
    const trackingNumber = localStorage.getItem(`vendor_tracking_${rfqId}`) || rfq.trackingNumber || 'BOL-292416';

    let additionalContent = '';

    if (docType === 'po') {
        additionalContent = `
            <div style="background: #eff6ff; padding: 16px 20px; border-radius: 12px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #1e40af;">
                    <strong>✓ Purchase Order Confirmed</strong><br>
                    This purchase order is legally binding. Delivery must be completed within the specified lead time.
                </p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">PO Number</label><div style="font-size: 14px; font-weight: 600;">${poNumber}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Payment Terms</label><div style="font-size: 14px; font-weight: 600;">${rfq.paymentTerms || 'Net 30'}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Delivery Terms</label><div style="font-size: 14px; font-weight: 600;">${rfq.deliveryTerms || 'FOB'}</div></div>
            </div>
        `;
    } else if (docType === 'import_permit') {
        additionalContent = `
            <div style="background: #f0fdf4; padding: 16px 20px; border-radius: 12px; border-left: 4px solid #22c55e; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #166534;">
                    <strong>✓ Import Permit Approved</strong><br>
                    Valid for 30 days from date of issue. All customs duties are responsibility of the importer.
                </p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Permit Number</label><div style="font-size: 14px; font-weight: 600;">IMP-${String(rfqId || Date.now()).slice(-6)}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Valid Until</label><div style="font-size: 14px; font-weight: 600;">${new Date(now.getTime() + 30*24*60*60*1000).toLocaleDateString()}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">HS Code</label><div style="font-size: 14px; font-weight: 600;">${rfq.hsCode || '8471.30.00'}</div></div>
            </div>
        `;
    } else if (docType === 'invoice') {
        additionalContent = `
            <div style="background: #fef3c7; padding: 16px 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #92400e;">
                    <strong>✓ Commercial Invoice</strong><br>
                    This invoice is for customs clearance and accounting purposes.
                </p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Invoice Number</label><div style="font-size: 14px; font-weight: 600;">INV-${String(rfqId || Date.now()).slice(-6)}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Invoice Date</label><div style="font-size: 14px; font-weight: 600;">${dateStr}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Currency</label><div style="font-size: 14px; font-weight: 600;">USD</div></div>
            </div>
        `;
    } else if (docType === 'bol') {
        additionalContent = `
            <div style="background: #f0fdf4; padding: 16px 20px; border-radius: 12px; border-left: 4px solid #22c55e; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #166534;">
                    <strong>✓ Bill of Lading</strong><br>
                    This document serves as a receipt of goods and a contract of carriage.
                </p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">BOL Number</label><div style="font-size: 14px; font-weight: 600;">${trackingNumber}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Vessel / Flight</label><div style="font-size: 14px; font-weight: 600;">${vessel}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Container No</label><div style="font-size: 14px; font-weight: 600;">${containerNo}</div></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 10px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Port of Loading</label><div style="font-size: 14px; font-weight: 600;">${origin}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Port of Discharge</label><div style="font-size: 14px; font-weight: 600;">${destination}</div></div>
            </div>
        `;
    } else if (docType === 'customs') {
        additionalContent = `
            <div style="background: #f0fdf4; padding: 16px 20px; border-radius: 12px; border-left: 4px solid #22c55e; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #166534;">
                    <strong>✓ Customs Clearance</strong><br>
                    All goods have been cleared by customs. Duties and taxes have been paid or secured.
                </p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Clearance Number</label><div style="font-size: 14px; font-weight: 600;">CLR-${String(rfqId || Date.now()).slice(-6)}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Customs Broker</label><div style="font-size: 14px; font-weight: 600;">${rfq.broker || 'Global Customs Services'}</div></div>
                <div><label style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Clearance Date</label><div style="font-size: 14px; font-weight: 600;">${dateStr}</div></div>
            </div>
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${docTypeLabel}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 30px; 
            background: #f8fafc;
            color: #0f172a;
        }
        .document-container {
            max-width: 794px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header-left h1 {
            font-size: 22px;
            color: #1e293b;
            font-weight: 700;
        }
        .header-left p {
            color: #64748b;
            font-size: 13px;
            margin-top: 2px;
        }
        .header-right {
            text-align: right;
        }
        .badge {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 4px 14px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .doc-status {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            margin-top: 4px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin: 15px 0;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        .info-item label {
            display: block;
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .info-item value {
            display: block;
            font-size: 14px;
            color: #0f172a;
            font-weight: 600;
            margin-top: 2px;
        }
        .table-container {
            margin: 15px 0;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead {
            background: #f1f5f9;
        }
        th {
            text-align: left;
            padding: 10px 14px;
            font-size: 10px;
            text-transform: uppercase;
            color: #475569;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        td {
            padding: 10px 14px;
            border-top: 1px solid #e2e8f0;
            font-size: 13px;
            color: #0f172a;
        }
        td:last-child, th:last-child {
            text-align: right;
        }
        .total-row td {
            font-weight: 700;
            background: #f8fafc;
            border-top: 2px solid #4f46e5;
        }
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 60px;
            color: rgba(79, 70, 229, 0.04);
            font-weight: 900;
            pointer-events: none;
            z-index: 0;
            letter-spacing: 8px;
        }
        .content { position: relative; z-index: 1; }
        @media print {
            body { background: white; padding: 20px; }
            .document-container { box-shadow: none; padding: 20px; }
            .watermark { display: none; }
        }
    </style>
</head>
<body>
    <div class="watermark">${docCode}</div>
    <div class="document-container">
        <div class="content">
            <div class="header">
                <div class="header-left">
                    <h1>🌍 GLOBAL TRADE PORTAL</h1>
                    <p>${docTypeLabel} — Official Document</p>
                </div>
                <div class="header-right">
                    <span class="badge">${docCode}</span>
                    <div class="doc-status">✓ GENERATED</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase;">Document Type</label><div style="font-size: 14px; font-weight: 600;">${docTypeLabel}</div></div>
                <div><label style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase;">Reference No</label><div style="font-size: 14px; font-weight: 600;">${poNumber}</div></div>
                <div><label style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase;">Date</label><div style="font-size: 14px; font-weight: 600;">${dateStr}</div></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 10px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <div><label style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase;">Issued To (Vendor)</label><div style="font-size: 14px; font-weight: 600;">${vendorName}</div></div>
                <div><label style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase;">Route/Lane</label><div style="font-size: 14px; font-weight: 600;">${origin} → ${destination}</div></div>
            </div>

            ${additionalContent}

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th style="text-align:center;">Qty</th>
                            <th style="text-align:right;">Unit Price</th>
                            <th style="text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${productName}</strong></td>
                            <td style="text-align:center;">${quantity}</td>
                            <td style="text-align:right;">$${Number(unitPrice).toFixed(2)}</td>
                            <td style="text-align:right;">$${totalAmount}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right;"><strong>TOTAL AMOUNT</strong></td>
                            <td style="text-align:right;"><strong>$${totalAmount}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center;">
                    This is a system-generated secure document via Global Trade Portal. Valid without physical signature.
                </p>
            </div>

            <div class="footer">
                <div>
                    <div><strong>Generated:</strong> ${dateStr} at ${timeStr}</div>
                    <div style="margin-top: 2px;">Document ID: ${poNumber}-${Date.now().toString().slice(-6)}</div>
                </div>
                <div>
                    <div>&copy; ${now.getFullYear()} Global Trade Portal</div>
                    <div style="margin-top: 2px; color: #cbd5e1;">All rights reserved</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================
// GENERATE PDF FROM HTML
// ============================================================
async function generatePdfFromHtml(htmlContent) {
    return new Promise((resolve, reject) => {
        try {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = htmlContent;
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '794px';
            tempContainer.style.background = 'white';
            tempContainer.style.padding = '40px';
            tempContainer.style.zIndex = '-9999';
            document.body.appendChild(tempContainer);

            html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: tempContainer.scrollHeight,
                windowHeight: tempContainer.scrollHeight
            }).then(canvas => {
                document.body.removeChild(tempContainer);

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = 210;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                let heightLeft = pdfHeight;
                let position = 0;
                const pageHeight = 297;

                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }

                const pdfBlob = pdf.output('blob');
                resolve(pdfBlob);
            }).catch(err => {
                document.body.removeChild(tempContainer);
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
}

// ============================================================
// DOWNLOAD PDF
// ============================================================
function downloadCurrentPdf() {
    if (currentPdfBlobUrl) {
        const link = document.createElement('a');
        link.href = currentPdfBlobUrl;
        link.download = 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        showToast('Error', 'No PDF available to download. Please generate the document first.', 'error');
    }
}

// ============================================================
// openUniversalPdfModal
// ============================================================
async function openUniversalPdfModal(title, docTypeOrUrl, rfqId) {
    const modal = document.getElementById("universalPdfModal");
    const iframe = document.getElementById("universalPdfIframe");
    const titleEl = document.getElementById("universalPdfModalTitle");

    if (!modal || !iframe) return;

    if (titleEl) titleEl.textContent = title || 'Document Viewer';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    iframe.src = 'about:blank';
    iframe.style.display = 'block';

    const systemDocs = ['po', 'import_permit', 'invoice', 'bol', 'customs'];

    if (systemDocs.includes(docTypeOrUrl)) {
        try {
            let rfq = allRFQs.find(r => (r.rfqId || r.id) == rfqId) || {};

            const htmlContent = generateDocumentHtml(title, docTypeOrUrl, rfq, rfqId);

            if (typeof html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
                try {
                    const pdfBlob = await generatePdfFromHtml(htmlContent);
                    currentPdfBlobUrl = URL.createObjectURL(pdfBlob);
                    iframe.src = currentPdfBlobUrl;

                    const footer = modal.querySelector('.flex.justify-end');
                    if (footer) {
                        const existingBtn = footer.querySelector('.download-pdf-btn');
                        if (existingBtn) existingBtn.remove();

                        const downloadBtn = document.createElement('button');
                        downloadBtn.className = 'download-pdf-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm mr-2';
                        downloadBtn.innerHTML = '⬇️ Download PDF';
                        downloadBtn.onclick = downloadCurrentPdf;
                        footer.prepend(downloadBtn);
                    }

                    return;
                } catch (pdfError) {
                    console.warn('PDF generation failed, showing HTML view:', pdfError);
                }
            }

            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlUrl = URL.createObjectURL(htmlBlob);
            iframe.src = htmlUrl;

        } catch (error) {
            console.error("Error generating document:", error);
            showToast('Error', 'Could not generate document.', 'error');
            iframe.src = 'about:blank';
        }
    } else {
        let fileName = cleanFilename(docTypeOrUrl);
        if (!fileName) {
            showToast('Error', 'Invalid document path.', 'error');
            return;
        }

        try {
            const encodedFileName = encodeURIComponent(fileName);
            const pdfUrl = `${window.location.origin}/globaltrade/api/uploads/${encodedFileName}`;

            const response = await fetchWithAuth(pdfUrl, {
                method: "GET",
                headers: {
                    "Accept": "application/pdf"
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load document. Status: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            iframe.src = blobUrl;

        } catch (error) {
            console.error("Error loading PDF blob:", error);
            showToast('Error', 'Could not load PDF document.', 'error');
            iframe.src = 'about:blank';
        }
    }
}

// ============================================================
// MARK GOODS AS DISPATCHED - Called from vendor side
// ============================================================
async function markGoodsDispatched(rfqId, trackingNumber = null) {
    try {
        const token = getCookie('accessToken');
        const url = window.location.origin + `/globaltrade/api/coordinator/rfq/${rfqId}/dispatch`;

        const payload = {
            status: 'DISPATCHED',
            trackingNumber: trackingNumber || `BOL-${String(rfqId).padStart(6, '0')}${String(Date.now()).slice(-4)}`,
            dispatchedAt: new Date().toISOString()
        };

        const response = await fetchWithAuth(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Failed to mark as dispatched. Status: ${response.status}`);
        }

        const result = await response.json();

        let rfq = allRFQs.find(r => (r.rfqId || r.id) == rfqId);
        if (rfq) {
            rfq.status = 'DISPATCHED';
            rfq.trackingNumber = payload.trackingNumber;
        }

        localStorage.setItem(`vendor_dispatched_${rfqId}`, 'true');
        localStorage.setItem(`rfq_status_${rfqId}`, 'DISPATCHED');
        localStorage.setItem(`vendor_tracking_${rfqId}`, payload.trackingNumber);

        showToast('Success', 'Goods marked as dispatched successfully! Status updated to DISPATCHED.', 'success');

        renderRFQTable();

        const modal = document.getElementById('lifecycleModal');
        if (modal && !modal.classList.contains('hidden')) {
            openLifecycleModal(rfqId, 'DISPATCHED', rfq?.productName || 'Product');
        }

        return result;
    } catch (error) {
        console.error("Error marking goods as dispatched:", error);
        showToast('Error', 'Failed to mark goods as dispatched: ' + error.message, 'error');
        throw error;
    }
}

// ============================================================
// UPDATE TRACKING NUMBER - Called from vendor side
// ============================================================
async function updateTrackingNumber(rfqId, trackingNumber) {
    try {
        const token = getCookie('accessToken');
        const url = window.location.origin + `/globaltrade/api/coordinator/rfq/${rfqId}/tracking`;

        const response = await fetchWithAuth(url, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ trackingNumber: trackingNumber })
        });

        if (!response.ok) {
            throw new Error(`Failed to update tracking. Status: ${response.status}`);
        }

        let rfq = allRFQs.find(r => (r.rfqId || r.id) == rfqId);
        if (rfq) {
            rfq.trackingNumber = trackingNumber;
        }

        localStorage.setItem(`vendor_tracking_${rfqId}`, trackingNumber);

        showToast('Success', 'Tracking number updated successfully!', 'success');
        renderRFQTable();

        return await response.json();
    } catch (error) {
        console.error("Error updating tracking:", error);
        showToast('Error', 'Failed to update tracking number: ' + error.message, 'error');
        throw error;
    }
}

// ============================================================
// GENERATE DISPATCH DOCUMENTS - Called from vendor side
// ============================================================
async function generateDispatchDocuments(rfqId) {
    try {
        const docs = ['invoice', 'bol', 'customs'];
        const results = [];

        for (const docType of docs) {
            const title = docType === 'invoice' ? 'Commercial Invoice' :
                docType === 'bol' ? 'Bill of Lading' : 'Customs Clearance';
            await openUniversalPdfModal(title, docType, rfqId);
            results.push(docType);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        showToast('Success', 'All dispatch documents generated successfully!', 'success');
        return results;
    } catch (error) {
        console.error("Error generating dispatch documents:", error);
        showToast('Error', 'Failed to generate all dispatch documents.', 'error');
        throw error;
    }
}

function syncDispatchStatus() {
    const synced = syncDispatchStatusFromLocalStorage();
    renderRFQTable();
    showToast(`Synced ${synced} orders with dispatch status.`, 'success');
    return synced;
}

async function previewPdfFromEndpoint(pdfPath) {
    if (!pdfPath) {
        showToast('No Document', 'No PDF document available for this bid.', 'error');
        return;
    }

    const fileName = pdfPath.split('/').pop().split('\\').pop().trim();

    if (!fileName) {
        showToast('Error', 'Invalid filename.', 'error');
        return;
    }

    const modal = document.getElementById("universalPdfModal");
    const iframe = document.getElementById("universalPdfIframe");
    const titleEl = document.getElementById("universalPdfModalTitle");

    if (titleEl) {
        titleEl.textContent = `Quotation Document: ${fileName}`;
    }

    try {
        const encodedFileName = encodeURIComponent(fileName);
        const pdfUrl = `${window.location.origin}/globaltrade/api/uploads/${encodedFileName}`;

        const response = await fetchWithAuth(pdfUrl, {
            method: "GET",
            headers: {
                "Accept": "*/*"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load document. Status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (iframe && modal) {
            iframe.src = blobUrl;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

    } catch (error) {
        console.error("Error loading PDF blob:", error);
        showToast('Error', 'Could not load PDF securely or file not found.', 'error');
    }
}

function renderModalBids(bids) {
    const tableBody = document.getElementById("modalBidsTableBody");
    if (!tableBody) {
        console.error("modalBidsTableBody not found");
        return;
    }

    if (!bids || bids.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-10 text-center text-sm text-slate-400">
                    <div class="flex flex-col items-center">
                        <svg class="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span class="font-medium">No bids submitted yet for this RFQ</span>
                        <span class="text-xs text-slate-400 mt-0.5">Vendor quotations will appear here once submitted.</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = bids.map(bid => {
        const vendorName = escapeHtml(bid.vendorName || bid.vendor?.vendorName || 'Unknown Vendor');
        const unitPrice = bid.offeredUnitPrice ?? bid.offeredPrice ?? 0;
        const leadTime = bid.leadTime || bid.deliveryDays || 'N/A';
        const remarks = bid.remarks || bid.note || '';
        const status = bid.status || 'PENDING';
        const responseId = bid.responseId || bid.id || '';

        let pdfPath = bid.quotationPdfPath || bid.quotationUrl || bid.pdfPath || bid.documentUrl || '';
        if (pdfPath) {
            pdfPath = cleanFilename(pdfPath);
        }

        const formattedPrice = `$${Number(unitPrice).toFixed(2)}`;

        const statusColors = {
            'PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
            'ACCEPTED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'REJECTED': 'bg-red-50 text-red-600 border-red-200',
            'WITHDRAWN': 'bg-slate-50 text-slate-500 border-slate-200'
        };
        const statusColor = statusColors[status] || statusColors.PENDING;

        return `
            <tr class="hover:bg-slate-50/60 transition-colors duration-150">
                <td class="px-5 py-3">
                    <span class="font-semibold text-slate-800 text-sm">${vendorName}</span>
                </td>
                <td class="px-5 py-3">
                    <span class="font-mono font-semibold text-slate-900 text-sm">${formattedPrice}</span>
                    <span class="text-slate-400 text-xs"> / unit</span>
                </td>
                <td class="px-5 py-3">
                    <span class="text-sm text-slate-600">${leadTime} days</span>
                </td>
                <td class="px-5 py-3">
                    <span class="text-sm text-slate-500 ${remarks ? '' : 'text-slate-300'}">${remarks || '—'}</span>
                </td>
                <td class="px-5 py-3">
                    ${pdfPath ? `
                        <button type="button" 
                                class="view-quotation-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition border border-indigo-200"
                                data-pdf-path="${escapeHtml(pdfPath)}"
                                data-vendor="${vendorName}">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            View PDF
                        </button>
                    ` : `
                        <span class="text-xs text-slate-400 italic">No document</span>
                    `}
                </td>
                <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        ${status !== 'ACCEPTED' && status !== 'REJECTED' ? `
                            <button type="button"
                                    class="accept-bid-btn px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-sm"
                                    data-response-id="${escapeHtml(responseId)}"
                                    data-vendor="${vendorName}">
                                Accept
                            </button>
                            <button type="button"
                                    class="reject-bid-btn px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition border border-red-200"
                                    data-response-id="${escapeHtml(responseId)}">
                                Reject
                            </button>
                        ` : `
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}">
                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                ${status}
                            </span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.querySelectorAll('.view-quotation-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const pdfPath = this.getAttribute('data-pdf-path');
            previewPdfFromEndpoint(pdfPath);
        });
    });

    tableBody.querySelectorAll('.accept-bid-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const responseId = this.getAttribute('data-response-id');
            const vendorName = this.getAttribute('data-vendor');
            if (confirm(`Accept bid from ${vendorName}? This will notify the vendor and enable route selection.`)) {
                acceptVendorBid(responseId, activeSelectedRfqId);
            }
        });
    });

    tableBody.querySelectorAll('.reject-bid-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const responseId = this.getAttribute('data-response-id');
            if (confirm('Reject this bid?')) {
                rejectVendorBid(responseId, activeSelectedRfqId);
            }
        });
    });
}

async function acceptVendorBid(responseId, rfqId) {
    try {
        const url = window.location.origin + `/globaltrade/api/coordinator/rfq/bids/${responseId}/accept`;
        const response = await fetchWithAuth(url, {
            method: "POST",
            headers: {"Authorization": "Bearer " + getCookie("accessToken"), "Accept": "application/json"}
        });
        if (!response.ok) throw new Error("Failed to accept bid");

        showToast('Bid accepted', 'Email notification sent to vendor and route selection is now enabled.');

        const targetRfqId = rfqId || activeSelectedRfqId;
        if (targetRfqId) {
            const bidsUrl = window.location.origin + `/globaltrade/api/coordinator/rfq/${targetRfqId}/bids`;
            const bidsResp = await fetchWithAuth(bidsUrl, {
                method: "GET",
                headers: {"Authorization": "Bearer " + getCookie("accessToken"), "Accept": "application/json"}
            });
            if (bidsResp.ok) {
                const bids = await bidsResp.json();
                renderModalBids(bids);
            }
            renderRouteOptions(targetRfqId);
        }

        const routeSection = document.getElementById("routeSelectionSection");
        if (routeSection) {
            routeSection.classList.remove("hidden");
        }
        fetchRFQs();
    } catch (error) {
        showToast('Couldn\'t accept bid', error.message, 'error');
    }
}

async function rejectVendorBid(responseId, rfqId) {
    try {
        const url = window.location.origin + `/globaltrade/api/coordinator/rfq/bids/${responseId}/reject`;
        const response = await fetchWithAuth(url, {
            method: "POST",
            headers: {"Authorization": "Bearer " + getCookie("accessToken"), "Accept": "application/json"}
        });
        if (!response.ok) throw new Error("Failed to reject bid");

        showToast('Bid rejected', 'The vendor has been notified of the rejection.');

        const targetRfqId = rfqId || activeSelectedRfqId;
        if (targetRfqId) {
            const bidsUrl = window.location.origin + `/globaltrade/api/coordinator/rfq/${targetRfqId}/bids`;
            const bidsResp = await fetchWithAuth(bidsUrl, {
                method: "GET",
                headers: {"Authorization": "Bearer " + getCookie("accessToken"), "Accept": "application/json"}
            });
            if (bidsResp.ok) {
                const bids = await bidsResp.json();
                renderModalBids(bids);
            }
        }
        fetchRFQs();
    } catch (error) {
        showToast('Couldn\'t reject bid', error.message, 'error');
    }
}

async function selectFreightRoute(requestId, mode) {
    try {
        const url = window.location.origin + `/globaltrade/api/coordinator/replenishment-requests/${requestId}/transport-mode?transportMode=${mode}`;
        const response = await fetchWithAuth(url, {
            method: "PUT",
            headers: {"Authorization": "Bearer " + getCookie("accessToken"), "Accept": "application/json"}
        });
        if (!response.ok) throw new Error("Failed to update route");

        showToast('Route selected', `Status updated to Route Planned/In-Transit.`);
        closeEvaluateModal();

        await fetchRFQs();
        openLifecycleModal(requestId, 'ROUTE_PLANNED');
    } catch (error) {
        showToast('Couldn\'t select route', error.message, 'error');
    }
}

function closeUniversalPdfModal() {
    const modal = document.getElementById("universalPdfModal");
    const iframe = document.getElementById("universalPdfIframe");
    if (modal) {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
    }
    if (iframe) {
        iframe.src = '';
    }
    const footer = modal?.querySelector('.flex.justify-end');
    if (footer) {
        const btn = footer.querySelector('.download-pdf-btn');
        if (btn) btn.remove();
    }
    if (currentPdfBlobUrl) {
        URL.revokeObjectURL(currentPdfBlobUrl);
        currentPdfBlobUrl = null;
    }
}

function closeEvaluateModal() {
    const modal = document.getElementById("evaluateModal");
    if (modal) {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
    }
}

function openCreateRfqModal() {
    showToast('Coming Soon', 'RFQ creation feature is being developed.');
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-start gap-3 w-80 bg-white border border-slate-100 rounded-xl p-4 shadow-xl shadow-slate-200/50 transform translate-y-2 opacity-0 transition-all duration-300 relative overflow-hidden';

    const iconSvg = type === 'error'
        ? `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`
        : `<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>`;
    const iconBg = type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600';
    const borderColor = type === 'error' ? 'border-b-4 border-red-500' : 'border-b-4 border-emerald-500';

    toast.classList.add(...borderColor.split(' '));
    toast.innerHTML = `
        <div class="p-2 rounded-lg ${iconBg} shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${iconSvg}</svg></div>
        <div class="flex-1 min-w-0 pr-2">
            <h4 class="text-sm font-bold text-slate-800">${title}</h4>
            <p class="text-xs text-slate-500 mt-0.5">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

async function fetchWithAuth(url, options = {}) {
    const token = getCookie('accessToken');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return fetch(url, options);
}

// ============================================================
// EXPOSE FUNCTIONS
// ============================================================
window.markGoodsDispatched = markGoodsDispatched;
window.updateTrackingNumber = updateTrackingNumber;
window.generateDispatchDocuments = generateDispatchDocuments;
window.syncDispatchStatus = syncDispatchStatus;

window.changeRFQPage = changeRFQPage;
window.viewRfqBids = viewRfqBids;
window.acceptVendorBid = acceptVendorBid;
window.rejectVendorBid = rejectVendorBid;
window.closeEvaluateModal = closeEvaluateModal;
window.openUniversalPdfModal = openUniversalPdfModal;
window.closeUniversalPdfModal = closeUniversalPdfModal;
window.openLifecycleModal = openLifecycleModal;
window.closeLifecycleModal = closeLifecycleModal;
window.showToast = showToast;
window.selectRoute = selectRoute;
window.selectFreightRoute = selectFreightRoute;
window.fetchRFQs = fetchRFQs;
window.renderModalBids = renderModalBids;
window.renderRouteOptions = renderRouteOptions;
window.filterRFQTable = filterRFQTable;
window.renderRFQTable = renderRFQTable;
window.showRFQEmptyState = showRFQEmptyState;
window.openCreateRfqModal = openCreateRfqModal;
window.startAutoUpdateSimulation = startAutoUpdateSimulation;
window.previewPdfFromEndpoint = previewPdfFromEndpoint;
window.cleanFilename = cleanFilename;
window.getCookie = getCookie;
window.fetchWithAuth = fetchWithAuth;
window.generateDocumentHtml = generateDocumentHtml;
window.generatePdfFromHtml = generatePdfFromHtml;
window.downloadCurrentPdf = downloadCurrentPdf;