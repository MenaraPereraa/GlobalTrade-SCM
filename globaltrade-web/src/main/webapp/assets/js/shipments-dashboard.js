let allShipments = [];
let filteredShipments = [];
let currentShipmentPage = 1;
const itemsPerShipmentPage = 10;

let allWarehouses = [];
let eligibleOrders = [];
let activeTrackingShipmentId = null;

const SHIPMENT_STATUS_STYLES = {
    PENDING: 'bg-slate-50 text-slate-600 border-slate-200',
    PRODUCT_LOADING: 'bg-orange-50 text-orange-600 border-orange-200',
    DISPATCHED: 'bg-blue-50 text-blue-600 border-blue-200',
    IN_TRANSIT: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    CUSTOMS_CLEARANCE: 'bg-amber-50 text-amber-600 border-amber-200',
    DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    DELAYED: 'bg-red-50 text-red-600 border-red-200'
};

document.addEventListener("DOMContentLoaded", () => {
    fetchShipments();

    document.getElementById('shipmentSearchInput')?.addEventListener('input', filterShipmentsTable);
    document.getElementById('shipmentStatusSelect')?.addEventListener('change', filterShipmentsTable);
    document.getElementById('createShipmentForm')?.addEventListener('submit', handleCreateShipmentSubmit);
});

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Accept': 'application/json'
    };
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 w-80 bg-white border border-slate-100 rounded-xl p-4 shadow-xl shadow-slate-200/50 transform translate-y-2 opacity-0 transition-all duration-300 relative overflow-hidden`;

    let borderColor = 'border-b-4 border-emerald-500';
    let iconBg = 'bg-emerald-50 text-emerald-600';
    let iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>`;

    if (type === 'error') {
        borderColor = 'border-b-4 border-red-500';
        iconBg = 'bg-red-50 text-red-600';
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>`;
    } else if (type === 'warning') {
        borderColor = 'border-b-4 border-amber-500';
        iconBg = 'bg-amber-50 text-amber-600';
        iconSvg = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>`;
    }

    toast.classList.add(...borderColor.split(' '));
    toast.innerHTML = `
        <div class="p-2 rounded-lg ${iconBg} shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${iconSvg}</svg>
        </div>
        <div class="flex-1 min-w-0 pr-2">
            <h4 class="text-sm font-bold text-slate-800">${title}</h4>
            <p class="text-xs text-slate-500 mt-0.5">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

async function fetchShipments() {
    const tableBody = document.getElementById('shipmentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center text-slate-400 italic">Loading shipments...</td></tr>`;

    try {
        const url = window.location.origin + "/globaltrade/api/coordinator/shipments";
        const response = await fetchWithAuth(url, { method: 'GET', headers: { 'Authorization': 'Bearer ' + getCookie('accessToken'), 'Accept': 'application/json', 'Content-Type': 'application/json' } });

        if (!response.ok) throw new Error('Failed to fetch shipments (status ' + response.status + ')');

        const data = await response.json();
        allShipments = Array.isArray(data) ? data : [];

        updateSummary(allShipments);
        populateStatusFilterOptions(allShipments);
        filterShipmentsTable();

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-6 text-center text-red-400 italic">Failed to load shipments.</td></tr>`;
        showToast('Couldn’t load shipments', error.message, 'error');
    }
}

function updateSummary(shipments) {
    const active = shipments.filter(s => {
        const st = s.status || s.currentStatus;
        return st && st !== 'DELIVERED' && st !== 'DELAYED';
    }).length;

    const delayed = shipments.filter(s => (s.status || s.currentStatus) === 'DELAYED').length;
    const delivered = shipments.filter(s => (s.status || s.currentStatus) === 'DELIVERED').length;

    setText('summaryActiveCount', active);
    setText('summaryDelayedCount', delayed);
    setText('summaryDeliveredCount', delivered);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function populateStatusFilterOptions(shipments) {
    const select = document.getElementById('shipmentStatusSelect');
    if (!select) return;

    const currentValue = select.value;
    const statuses = [...new Set(shipments.map(s => s.status || s.currentStatus).filter(Boolean))].sort();

    select.innerHTML = '<option value="">All Statuses</option>';
    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status.replace(/_/g, ' ');
        select.appendChild(option);
    });
    select.value = currentValue;
}

function filterShipmentsTable() {
    const searchText = (document.getElementById('shipmentSearchInput')?.value || '').toLowerCase().trim();
    const selectedStatus = document.getElementById('shipmentStatusSelect')?.value || '';

    filteredShipments = allShipments.filter(shipment => {
        const shipmentIdStr = String(shipment.shipmentId ?? '').toLowerCase();
        const resolvedOrderId = shipment.orderId ?? (shipment.order ? (shipment.order.orderId || shipment.order.id) : null);
        const orderIdStr = String(resolvedOrderId ?? '').toLowerCase();
        const carrier = (shipment.carrierName || '').toLowerCase();
        const status = shipment.status || shipment.currentStatus || '';

        const searchMatch = !searchText || shipmentIdStr.includes(searchText) || orderIdStr.includes(searchText) || carrier.includes(searchText);
        const statusMatch = !selectedStatus || status === selectedStatus;

        return searchMatch && statusMatch;
    });

    currentShipmentPage = 1;
    renderShipmentsTable();
}

function renderShipmentsTable() {
    const tableBody = document.getElementById('shipmentsTableBody');
    if (!tableBody) return;

    if (!filteredShipments.length) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-16 px-6"><p class="text-slate-500 font-medium">No shipments found</p></td></tr>`;
        renderShipmentPaginationControls(0);
        return;
    }

    const totalPages = Math.ceil(filteredShipments.length / itemsPerShipmentPage);
    if (currentShipmentPage > totalPages) currentShipmentPage = totalPages || 1;

    const start = (currentShipmentPage - 1) * itemsPerShipmentPage;
    const end = start + itemsPerShipmentPage;
    const paginatedShipments = filteredShipments.slice(start, end);

    tableBody.innerHTML = paginatedShipments.map(shipment => {
        const shipmentStatus = shipment.status || shipment.currentStatus || 'PRODUCT_LOADING';
        const statusClasses = SHIPMENT_STATUS_STYLES[shipmentStatus] || 'bg-slate-50 text-slate-600 border-slate-200';

        const transportMode = shipment.transportMode ? shipment.transportMode.replace('_', ' ') : 'SEA FREIGHT';
        const routeDesc = `${shipment.originHubName ?? shipment.originHub ?? 'Origin'} ➔ ${shipment.destinationHubName ?? shipment.destinationHub ?? 'Dest'}`;

        const customsDoc = shipment.customsDocPath || shipment.customsDocumentPath;
        const customsHtml = customsDoc
            ? `<a href="${window.location.origin}/globaltrade/uploads/${customsDoc}" target="_blank" class="text-indigo-600 hover:underline font-semibold text-xs flex items-center gap-1">📄 View Doc</a>`
            : `<span class="text-slate-400 text-xs italic">Pending</span>`;

        const resolvedOrderId = shipment.orderId ?? (shipment.order ? (shipment.order.id || shipment.order.orderId) : null);

        return `
            <tr class="hover:bg-slate-50 transition-colors duration-150">
                <td class="px-6 py-4 text-sm font-semibold text-slate-800">#${shipment.shipmentId}</td>
                <td class="px-6 py-4 text-sm text-slate-600">#${resolvedOrderId ?? '—'}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-700">${transportMode}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${routeDesc}</td>
                <td class="px-6 py-4 text-sm">${customsHtml}</td>
                <td class="px-6 py-4"><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClasses}">${shipmentStatus.replace(/_/g, ' ')}</span></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="openTrackingModal(${shipment.shipmentId})" class="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                        Track / Update
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    renderShipmentPaginationControls(totalPages);
}

function renderShipmentPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("shipmentPagination");
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        paginationContainer.classList.add("hidden");
        return;
    }

    paginationContainer.classList.remove("hidden");
    const startEntry = (currentShipmentPage - 1) * itemsPerShipmentPage + 1;
    const endEntry = Math.min(currentShipmentPage * itemsPerShipmentPage, filteredShipments.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredShipments.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeShipmentPage(${currentShipmentPage - 1})" ${currentShipmentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentShipmentPage} of ${totalPages}</span>
            <button onclick="changeShipmentPage(${currentShipmentPage + 1})" ${currentShipmentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changeShipmentPage(page) {
    currentShipmentPage = page;
    renderShipmentsTable();
}

function openTrackingModal(shipmentId) {
    activeTrackingShipmentId = shipmentId;
    const shipment = allShipments.find(s => s.shipmentId === shipmentId);
    if (!shipment) return;

    const modal = document.getElementById('trackingModal');
    const subtitle = document.getElementById('trackingModalSubtitle');
    const modeEl = document.getElementById('modalTransportMode');
    const statusSelect = document.getElementById('updateStatusSelect');
    const docArea = document.getElementById('modalCustomsDocArea');
    const fileInput = document.getElementById('customsDocFileInput');

    if (fileInput) fileInput.value = '';
    if (subtitle) subtitle.textContent = `Manage freight progress, status updates, and customs documentation for Shipment #${shipmentId}.`;
    if (modeEl) modeEl.textContent = shipment.transportMode ? shipment.transportMode.replace('_', ' ') : 'Sea Freight';
    if (statusSelect) statusSelect.value = shipment.status || shipment.currentStatus || 'PRODUCT_LOADING';

    const customsDoc = shipment.customsDocPath || shipment.customsDocumentPath;
    if (docArea) {
        if (customsDoc) {
            docArea.innerHTML = `<a href="${window.location.origin}/globaltrade/uploads/${customsDoc}" target="_blank" class="text-indigo-600 hover:underline font-semibold flex items-center gap-1">View current uploaded document</a>`;
        } else {
            docArea.innerHTML = `<span class="text-slate-400 italic">No document uploaded yet.</span>`;
        }
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeTrackingModal() {
    const modal = document.getElementById('trackingModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    activeTrackingShipmentId = null;
}

async function submitStatusUpdateWithDoc() {
    if (!activeTrackingShipmentId) return;

    const statusSelect = document.getElementById('updateStatusSelect');
    const fileInput = document.getElementById('customsDocFileInput');
    const newStatus = statusSelect ? statusSelect.value : '';

    const formData = new FormData();
    formData.append('status', newStatus);
    if (fileInput && fileInput.files[0]) {
        formData.append('customsDocument', fileInput.files[0]);
    }

    try {
        const url = window.location.origin + `/globaltrade/api/coordinator/shipments/${activeTrackingShipmentId}/update-progress`;
        const response = await fetchWithAuth(url, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + getCookie('accessToken') },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to update shipment progress');

        showToast('Success', `Shipment #${activeTrackingShipmentId} progress updated successfully.`);
        closeTrackingModal();
        await fetchShipments();

    } catch (error) {
        showToast('Update Failed', error.message, 'error');
    }
}

function openRouteOptimizationModal(poNumber, orderId) {
    const modal = document.getElementById('routeOptimizationModal');
    const subtitle = document.getElementById('routeOptimizationSubtitle');
    const container = document.getElementById('routeOptionsContainer');

    if (subtitle) subtitle.textContent = `Analyzing optimal carriers and lanes for PO: ${poNumber || orderId}`;
    if (container) {
        container.innerHTML = `<div class="col-span-3 text-center py-10 text-slate-400 italic">Analyzing optimal transport options...</div>`;
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    fetchOptimizedRoutes(orderId);
}

function closeRouteOptimizationModal() {
    const modal = document.getElementById('routeOptimizationModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function fetchOptimizedRoutes(orderId) {
    const container = document.getElementById('routeOptionsContainer');
    if (!container) return;

    try {
        const url = `${window.location.origin}/globaltrade/api/customs/routes/optimize/${orderId || 1}`;
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getCookie('accessToken'), 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to fetch route options');

        const options = await response.json();
        renderRouteOptions(options);

    } catch (error) {
        console.error('Error fetching routes:', error);
        const sampleOptions = [
            { type: "Economical", mode: "SEA FREIGHT", price: 400.00, transitDays: 17, carrier: "Evergreen", route: "Ningbo → Colombo", tag: "LOWEST COST", borderStyle: "border-slate-200", badgeBg: "bg-emerald-500 text-white" },
            { type: "Balanced Choice", mode: "SEA FREIGHT", price: 650.00, transitDays: 12, carrier: "COSCO", route: "Ningbo → Colombo", tag: "AI RECOMMENDED", recommended: true, borderStyle: "border-indigo-500 shadow-md ring-2 ring-indigo-500/20", badgeBg: "bg-indigo-600 text-white" },
            { type: "Express", mode: "AIR FREIGHT", price: 2500.00, transitDays: 2, carrier: "Qatar Airways Cargo", route: "Ningbo → Colombo", tag: "QUICKEST TRANSIT", borderStyle: "border-slate-200", badgeBg: "bg-sky-500 text-white" }
        ];
        renderRouteOptions(sampleOptions);
    }
}

function renderRouteOptions(options) {
    const container = document.getElementById('routeOptionsContainer');
    if (!container) return;

    container.innerHTML = options.map(opt => {
        const isRecommended = opt.recommended || opt.tag === 'AI RECOMMENDED';
        const cardBorder = isRecommended ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20 bg-white' : 'border-slate-200 bg-white';
        const badgeColor = opt.tag === 'LOWEST COST' ? 'bg-emerald-600 text-white' : (opt.tag === 'QUICKEST TRANSIT' ? 'bg-sky-600 text-white' : 'bg-indigo-600 text-white');

        return `
            <div class="${cardBorder} rounded-2xl p-5 border relative flex flex-col justify-between transition-all">
                ${opt.tag ? `<div class="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${badgeColor} shadow-sm">${opt.tag}</div>` : ''}
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <h4 class="text-sm font-bold text-slate-800">${opt.type}</h4>
                    </div>
                    <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">${opt.mode || 'SEA FREIGHT'}</p>
                    
                    <div class="my-4">
                        <span class="text-2xl font-black text-slate-900">$${Number(opt.price).toFixed(2)}</span>
                        <div class="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>${opt.transitDays} Days Transit</span>
                        </div>
                    </div>

                    <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 text-xs space-y-1">
                        <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Carrier / Route</p>
                        <p class="font-bold text-slate-800">${opt.carrier}</p>
                        <p class="text-slate-600">${opt.route}</p>
                    </div>
                </div>

                <button onclick="selectOptimizedRoute('${opt.type}', '${opt.carrier}')" class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white ${isRecommended ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20' : 'bg-slate-800 hover:bg-slate-900'} transition">
                    Select Route
                </button>
            </div>
        `;
    }).join('');
}

function selectOptimizedRoute(routeType, carrierName) {
    showToast('Route Selected', `You have selected the ${routeType} route powered by ${carrierName}.`, 'success');
    closeRouteOptimizationModal();
}

// Window bindings
window.changeShipmentPage = changeShipmentPage;
window.openTrackingModal = openTrackingModal;
window.closeTrackingModal = closeTrackingModal;
window.submitStatusUpdateWithDoc = submitStatusUpdateWithDoc;
window.openRouteOptimizationModal = openRouteOptimizationModal;
window.closeRouteOptimizationModal = closeRouteOptimizationModal;
window.selectOptimizedRoute = selectOptimizedRoute;