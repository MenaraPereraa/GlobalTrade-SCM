let allRequests = [];
let filteredRequests = [];
let currentRequestPage = 1;
const requestsPerPage = 10;
let selectedRequestId = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchReplenishmentRequests();

    const searchInput = document.getElementById('requestSearchInput');
    const statusSelect = document.getElementById('requestStatusSelect');
    const dateFrom = document.getElementById('requestDateFrom');
    const dateTo = document.getElementById('requestDateTo');

    if (searchInput) searchInput.addEventListener('input', filterRequests);
    if (statusSelect) statusSelect.addEventListener('change', filterRequests);
    if (dateFrom) dateFrom.addEventListener('change', filterRequests);
    if (dateTo) dateTo.addEventListener('change', filterRequests);
});

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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

async function fetchReplenishmentRequests() {
    const tableBody = document.getElementById('requestsTableBody');
    if (tableBody) tableBody.innerHTML = renderLoadingRow();

    try {
        const url = window.location.origin + "/globaltrade/api/vendors/replenishment-requests";
        const response = await fetchWithAuth(url, { method: 'GET', headers: authHeaders() });

        if (!response.ok) throw new Error('Failed to fetch replenishment requests (status ' + response.status + ')');

        const data = await response.json();

        allRequests = Array.isArray(data) ? data.sort((a, b) => (b.requestId ?? 0) - (a.requestId ?? 0)) : [];

        updateRequestStats(allRequests);
        populateStatusDropdown(allRequests);
        filterRequests();

    } catch (error) {
        console.error('Error:', error);
        if (tableBody) tableBody.innerHTML = renderErrorRow();
    }
}

function updateRequestStats(requests) {
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const fulfilled = requests.filter(r => r.status === 'FULFILLED').length;
    const cancelled = requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length;

    setText('statCountPending', pending);
    setText('statCountFulfilled', fulfilled);
    setText('statCountCancelled', cancelled);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function populateStatusDropdown(requests) {
    const select = document.getElementById('requestStatusSelect');
    if (!select) return;

    const currentVal = select.value;
    const statuses = [...new Set(requests.map(r => r.status))];

    select.innerHTML = `<option value="">All Statuses</option>` +
        statuses.map(s => `<option value="${s}" ${s === currentVal ? 'selected' : ''}>${s}</option>`).join('');
}

function filterRequests() {
    const searchInput = document.getElementById('requestSearchInput');
    const statusSelect = document.getElementById('requestStatusSelect');
    const dateFrom = document.getElementById('requestDateFrom');
    const dateTo = document.getElementById('requestDateTo');

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusFilter = statusSelect ? statusSelect.value : '';
    const fromDate = dateFrom && dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo && dateTo.value ? new Date(dateTo.value) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999);

    filteredRequests = allRequests.filter(req => {
        const reqIdStr = String(req.requestId ?? '');
        const warehouseName = (req.warehouse?.name ?? req.warehouse?.warehouseName ?? '').toLowerCase();
        const productIdStr = String(req.productId ?? '');

        const matchesQuery = !query || reqIdStr.includes(query) || warehouseName.includes(query) || productIdStr.includes(query);
        const matchesStatus = !statusFilter || req.status === statusFilter;

        let matchesDate = true;
        if (req.createdAt) {
            const reqDate = new Date(req.createdAt);
            if (fromDate && reqDate < fromDate) matchesDate = false;
            if (toDate && reqDate > toDate) matchesDate = false;
        }

        return matchesQuery && matchesStatus && matchesDate;
    });

    currentRequestPage = 1;
    renderRequestsTable();
}

function clearRequestFilters() {
    const searchInput = document.getElementById('requestSearchInput');
    const statusSelect = document.getElementById('requestStatusSelect');
    const dateFrom = document.getElementById('requestDateFrom');
    const dateTo = document.getElementById('requestDateTo');

    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    filterRequests();
}

function renderRequestsTable() {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;

    if (!filteredRequests.length) {
        tableBody.innerHTML = renderEmptyRow();
        removeRequestPagination();
        return;
    }

    const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
    if (currentRequestPage > totalPages) currentRequestPage = totalPages || 1;

    const start = (currentRequestPage - 1) * requestsPerPage;
    const end = start + requestsPerPage;
    const paginated = filteredRequests.slice(start, end);

    tableBody.innerHTML = paginated.map(req => {
        const statusBadge = renderStatusBadge(req.status);
        const isPending = req.status === 'PENDING';

        // Mark Shipped ඉවත් කර, Review කිරීමට පමණක් බොත්තම සීමා කර ඇත
        const actionButtons = isPending ? `
            <div class="flex items-center gap-2">
                <button onclick="openReviewModal(${req.requestId})" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Review Details</button>
            </div>
        ` : `<span class="text-xs text-slate-400 font-medium">Handled via RFQ</span>`;

        const whName = req.warehouse?.name ?? req.warehouse?.warehouseName ?? '—';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-sm font-semibold text-slate-800">#${req.requestId ?? '—'}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${whName}</td>
                <td class="px-6 py-4 text-sm text-slate-600 font-mono">${req.productId ?? '—'}</td>
                <td class="px-6 py-4 text-sm text-slate-600 text-right font-mono">${req.quantity ?? 0}</td>
                <td class="px-6 py-4 text-sm">${statusBadge}</td>
                <td class="px-6 py-4 text-sm text-slate-500">${req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}</td>
                <td class="px-6 py-4 text-sm">${actionButtons}</td>
            </tr>
        `;
    }).join('');

    renderRequestPagination(totalPages);
}

function renderStatusBadge(status) {
    if (status === 'FULFILLED') {
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Fulfilled</span>';
    }
    if (status === 'PENDING') {
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Pending</span>';
    }
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">${status || 'UNKNOWN'}</span>`;
}

function renderRequestPagination(totalPages) {
    let container = document.getElementById('requestPaginationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'requestPaginationContainer';
        container.className = 'flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200';
        const tableWrapper = document.getElementById('requestsTableBody').closest('div.bg-white');
        if (tableWrapper) tableWrapper.appendChild(container);
    }

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="text-sm text-slate-500">
            Page <span class="font-semibold text-slate-700">${currentRequestPage}</span> of <span class="font-semibold text-slate-700">${totalPages}</span>
        </div>
        <div class="flex items-center gap-2">
            <button onclick="changeRequestPage(${currentRequestPage - 1})" ${currentRequestPage === 1 ? 'disabled' : ''}
                class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
            </button>
            <button onclick="changeRequestPage(${currentRequestPage + 1})" ${currentRequestPage === totalPages ? 'disabled' : ''}
                class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
            </button>
        </div>
    `;
}

function removeRequestPagination() {
    const container = document.getElementById('requestPaginationContainer');
    if (container) container.remove();
}

function changeRequestPage(page) {
    const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentRequestPage = page;
        renderRequestsTable();
    }
}

function openReviewModal(requestId) {
    selectedRequestId = requestId;
    const req = allRequests.find(r => r.requestId === requestId);
    if (!req) return;

    document.getElementById('reviewRequestId').textContent = '#' + req.requestId;
    document.getElementById('reviewWarehouse').textContent = req.warehouse?.name ?? req.warehouse?.warehouseName ?? '—';
    document.getElementById('reviewProductId').textContent = req.productId || '—';
    document.getElementById('reviewQuantity').textContent = req.quantity || 0;
    document.getElementById('reviewRequested').textContent = req.createdAt ? new Date(req.createdAt).toLocaleString() : '—';

    document.getElementById('requestReviewModal').classList.remove('hidden');
    document.getElementById('requestReviewModal').classList.add('flex');
}

function closeReviewModal() {
    selectedRequestId = null;
    document.getElementById('requestReviewModal').classList.remove('flex');
    document.getElementById('requestReviewModal').classList.add('hidden');
}

async function confirmRejectFromModal() {
    if (!selectedRequestId) return;
    const id = selectedRequestId;
    closeReviewModal();

    try {
        const url = window.location.origin + `/globaltrade/api/vendors/replenishment-requests/${id}/reject`;
        const response = await fetchWithAuth(url, { method: 'PUT', headers: authHeaders() });

        if (!response.ok) throw new Error('Failed to reject request');

        showToast('Rejected', 'Replenishment request has been rejected.', 'warning');
        await fetchReplenishmentRequests();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

function renderLoadingRow() {
    return `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-500">Loading replenishment requests...</td></tr>`;
}

function renderEmptyRow() {
    return `<tr><td colspan="7" class="px-6 py-14 text-center text-slate-500 font-medium">No replenishment requests found.</td></tr>`;
}

function renderErrorRow() {
    return `<tr><td colspan="7" class="px-6 py-10 text-center text-red-500 font-medium">Error loading requests. <button onclick="fetchReplenishmentRequests()" class="underline ml-1">Try again</button></td></tr>`;
}

window.fetchReplenishmentRequests = fetchReplenishmentRequests;
window.filterRequests = filterRequests;
window.clearRequestFilters = clearRequestFilters;
window.changeRequestPage = changeRequestPage;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.confirmRejectFromModal = confirmRejectFromModal;