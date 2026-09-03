const TAG_BASE = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap';

const SHIPMENT_STATUSES = {
    PENDING:     { label: 'Pending',     style: 'bg-slate-50 text-slate-600 border-slate-200' },
    CONFIRMED:   { label: 'Confirmed',   style: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    IN_TRANSIT:  { label: 'In Transit',  style: 'bg-blue-50 text-blue-600 border-blue-200' },
    CUSTOMS:     { label: 'Customs',     style: 'bg-amber-50 text-amber-600 border-amber-200' },
    DELIVERED:   { label: 'Delivered',   style: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    CANCELLED:   { label: 'Cancelled',   style: 'bg-red-50 text-red-600 border-red-200' }
};

let activeTab = 'inbound';
let allShipments = [];
let filteredShipments = [];
let hubList = [];
let hubFilter = '';
let statusFilter = '';
let searchTerm = '';
let currentPage = 1;
const PAGE_SIZE = 10;

function setLogisticsEmptyState(visible, title, subtitle) {
    const emptyState = document.getElementById('logisticsEmptyState');
    if (emptyState) {
        emptyState.classList.toggle('hidden', !visible);
        emptyState.classList.toggle('flex', visible);
    }

    const titleEl = document.getElementById('logisticsEmptyTitle');
    const subtitleEl = document.getElementById('logisticsEmptySubtitle');
    if (titleEl && title) titleEl.textContent = title;
    if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;

    const pagination = document.getElementById('logisticsPagination');
    if (pagination && visible) {
        pagination.classList.add('hidden');
        pagination.classList.remove('flex');
    }
}

async function fetchLogistics() {
    const tableBody = document.getElementById('logisticsTableBody');
    if (!tableBody) return;

    setLogisticsEmptyState(false);
    closeHubDropdown();
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="px-6 py-10 text-center text-slate-500">
                <div class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span class="text-sm font-medium">Loading ${activeTab} shipments data...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const endpoint = activeTab === 'inbound'
            ? '/globaltrade/api/shipments/inbound'
            : '/globaltrade/api/shipments/outbound';

        const response = await fetchWithAuth(endpoint, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getCookie('accessToken'), 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend Error Status:", response.status);
            console.error("Backend Error Details:", errorText);
            throw new Error('Failed to fetch shipment data.');
        }

        allShipments = await response.json();
        allShipments = Array.isArray(allShipments) ? allShipments : [];

        hubList = [...new Set(allShipments.map(i => activeTab === 'inbound' ? i.destinationHub : i.originHub).filter(Boolean))].sort();

        renderTableHead();
        populateHubFilterOptions();
        populateStatusFilterOptions();
        applyLogisticsFilters();

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-10 text-center">
                    <span class="text-sm font-medium text-red-500">Error loading shipment data. Please try again.</span>
                </td>
            </tr>
        `;
    }
}

function switchTab(tab) {
    if (activeTab === tab) return;
    activeTab = tab;
    hubFilter = '';
    statusFilter = '';
    searchTerm = '';
    currentPage = 1;

    const searchInput = document.getElementById('logisticsSearchInput');
    if (searchInput) searchInput.value = '';

    const btnInbound = document.getElementById('tabInbound');
    const btnOutbound = document.getElementById('tabOutbound');

    if (tab === 'inbound') {
        if (btnInbound) btnInbound.className = 'px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-x border-slate-200 bg-white text-indigo-600 shadow-sm transition';
        if (btnOutbound) btnOutbound.className = 'px-5 py-2.5 rounded-t-xl text-sm font-semibold border border-transparent bg-transparent text-slate-500 hover:text-slate-800 transition';
    } else {
        if (btnOutbound) btnOutbound.className = 'px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-x border-slate-200 bg-white text-indigo-600 shadow-sm transition';
        if (btnInbound) btnInbound.className = 'px-5 py-2.5 rounded-t-xl text-sm font-semibold border border-transparent bg-transparent text-slate-500 hover:text-slate-800 transition';
    }

    if (searchInput) {
        searchInput.placeholder = tab === 'inbound' ? 'Search tracking or carrier...' : 'Search order or tracking...';
    }

    fetchLogistics();
}

function renderLegend() {
    const legend = document.getElementById('statusLegend');
    if (!legend) return;
    legend.innerHTML = Object.values(SHIPMENT_STATUSES)
        .map(s => `<span class="${TAG_BASE} ${s.style}">${s.label}</span>`)
        .join('');
}

function populateHubFilterOptions() {
    renderHubDropdownList();
    updateHubFilterLabel();
}

function updateHubFilterLabel() {
    const label = document.getElementById('hubFilterLabel');
    if (!label) return;
    if (!hubFilter) {
        label.textContent = 'All Hubs';
    } else {
        label.textContent = hubList.includes(hubFilter) ? hubFilter : 'All Hubs';
    }
}

function toggleHubDropdown() {
    const panel = document.getElementById('hubDropdownPanel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        renderHubDropdownList();
        const searchInput = document.getElementById('hubDropdownSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    } else {
        closeHubDropdown();
    }
}

function closeHubDropdown() {
    const panel = document.getElementById('hubDropdownPanel');
    if (panel) panel.classList.add('hidden');
}

function renderHubDropdownList() {
    const list = document.getElementById('hubDropdownList');
    if (!list) return;

    const searchInput = document.getElementById('hubDropdownSearch');
    const term = (searchInput?.value ?? '').trim().toLowerCase();

    const matchingHubs = term
        ? hubList.filter(h => h.toLowerCase().includes(term))
        : hubList;

    const allRow = `
        <li>
            <button type="button" onclick="selectHubFilter('')"
                    class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between ${!hubFilter ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}">
                <span>All Hubs</span>
                ${!hubFilter ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
        </li>
    `;

    const rows = matchingHubs.map(h => {
        const isSelected = hubFilter === h;
        return `
            <li>
                <button type="button" onclick="selectHubFilter('${h}')"
                        class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between ${isSelected ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}">
                    <span>${h}</span>
                    ${isSelected ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
                </button>
            </li>
        `;
    }).join('');

    const noMatches = matchingHubs.length === 0
        ? '<li class="px-3.5 py-3 text-sm text-slate-400 text-center">No matching hubs</li>'
        : '';

    list.innerHTML = (term ? '' : allRow) + rows + noMatches;
}

function selectHubFilter(hub) {
    hubFilter = hub;
    updateHubFilterLabel();
    closeHubDropdown();
    applyLogisticsFilters();
}

document.addEventListener('click', function (event) {
    const wrapper = document.getElementById('hubFilterWrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        closeHubDropdown();
    }
});

function populateStatusFilterOptions() {
    const select = document.getElementById('logisticsStatusFilter');
    if (!select) return;
    select.innerHTML = '<option value="">All statuses</option>' +
        Object.entries(SHIPMENT_STATUSES).map(([key, s]) => `<option value="${key}">${s.label}</option>`).join('');
    select.value = '';
}

function onFilterChange() {
    statusFilter = document.getElementById('logisticsStatusFilter')?.value ?? '';
    searchTerm = document.getElementById('logisticsSearchInput')?.value ?? '';
    applyLogisticsFilters();
}

function applyLogisticsFilters() {
    filteredShipments = allShipments.filter(item => {
        const hMatch = hubFilter ? (activeTab === 'inbound' ? item.destinationHub === hubFilter : item.originHub === hubFilter) : true;
        const sMatch = statusFilter ? item.currentStatus === statusFilter : true;
        const term = searchTerm.toLowerCase();
        const tMatch = term ? ((item.trackingNumber ?? '').toLowerCase().includes(term) || (item.carrierName ?? '').toLowerCase().includes(term)) : true;

        return hMatch && sMatch && tMatch;
    });

    currentPage = 1;
    renderLogisticsPage();
}

function renderTableHead() {
    const head = document.getElementById('logisticsTableHead');
    if (!head) return;

    const th = 'px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider';

    if (activeTab === 'inbound') {
        head.innerHTML = `
            <tr>
                <th class="${th}">Shipment ID</th>
                <th class="${th}">Carrier</th>
                <th class="${th}">Tracking No</th>
                <th class="${th}">Origin Hub</th>
                <th class="${th}">Destination Hub</th>
                <th class="${th}">ETA</th>
                <th class="${th}">Status</th>
            </tr>
        `;
    } else {
        head.innerHTML = `
            <tr>
                <th class="${th}">Order ID / Shipment</th>
                <th class="${th}">Carrier</th>
                <th class="${th}">Tracking No</th>
                <th class="${th}">Origin Hub</th>
                <th class="${th}">Destination Hub</th>
                <th class="${th}">ETA</th>
                <th class="${th}">Status</th>
            </tr>
        `;
    }
}

function renderLogisticsPage() {
    const tableBody = document.getElementById('logisticsTableBody');
    const pagination = document.getElementById('logisticsPagination');
    if (!tableBody) return;

    if (filteredShipments.length === 0) {
        tableBody.innerHTML = '';
        if (allShipments.length === 0) {
            setLogisticsEmptyState(true, `No ${activeTab} shipments`, `Add ${activeTab} shipment data to view them here.`);
        } else {
            setLogisticsEmptyState(true, 'No matching shipments', 'Try a different search term, hub, or status filter.');
        }
        return;
    }

    setLogisticsEmptyState(false);

    const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredShipments.slice(startIndex, startIndex + PAGE_SIZE);

    tableBody.innerHTML = pageItems.map(item => {
        const statusInfo = SHIPMENT_STATUSES[item.currentStatus] ?? SHIPMENT_STATUSES.PENDING;
        return `
            <tr class="hover:bg-slate-50 transition-colors duration-150">
                <td class="px-6 py-4 font-mono text-sm font-semibold text-slate-800">#${item.shipmentId ?? item.orderId ?? ''}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${item.carrierName ?? ''}</td>
                <td class="px-6 py-4 font-mono text-sm text-indigo-600 font-medium">${item.trackingNumber ?? ''}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${item.originHub ?? ''}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${item.destinationHub ?? ''}</td>
                <td class="px-6 py-4 font-mono text-sm text-slate-500">${formatDate(item.eta)}</td>
                <td class="px-6 py-4"><span class="${TAG_BASE} ${statusInfo.style}">${statusInfo.label}</span></td>
            </tr>
        `;
    }).join('');

    if (pagination) {
        pagination.classList.remove('hidden');
        pagination.classList.add('flex');

        const infoEl = document.getElementById('logisticsResultCount');
        if (infoEl) {
            const rangeStart = startIndex + 1;
            const rangeEnd = Math.min(startIndex + PAGE_SIZE, filteredShipments.length);
            infoEl.textContent = `Showing ${rangeStart}-${rangeEnd} of ${filteredShipments.length} items`;
        }

        const prevBtn = document.getElementById('logisticsPrevBtn');
        const nextBtn = document.getElementById('logisticsNextBtn');
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }
}

function goToLogisticsPage(page) {
    currentPage = page;
    renderLogisticsPage();
}

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toISOString().replace('T', ' ').slice(0, 16);
}

window.fetchLogistics = fetchLogistics;
window.switchTab = switchTab;
window.onFilterChange = onFilterChange;
window.goToLogisticsPage = goToLogisticsPage;
window.toggleHubDropdown = toggleHubDropdown;
window.selectHubFilter = selectHubFilter;
window.renderHubDropdownList = renderHubDropdownList;

window.addEventListener('load', function () {
    renderLegend();
    if (document.getElementById('logisticsTableBody')) {
        fetchLogistics();
    }
});