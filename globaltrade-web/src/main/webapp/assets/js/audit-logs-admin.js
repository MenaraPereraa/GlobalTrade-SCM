const API_PATH = '/customs/audit-logs';

let allAuditEvents = [];
let currentPage = 1;
const rowsPerPage = 10;

function auditEventKind(actionPerformed) {
    const value = (actionPerformed ?? '').toLowerCase();
    if (value.includes('approve') || value.includes('clear')) return 'cleared';
    if (value.includes('reject')) return 'rejected';
    return 'other';
}

const EVENT_BADGE_STYLES = {
    cleared: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    other: 'bg-slate-50 text-slate-600 border-slate-200'
};

function renderLoadingRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center text-slate-500">
                <div class="flex items-center justify-center gap-2">
                    <i class="fa-solid fa-circle-notch fa-spin text-indigo-600"></i>
                    <span class="text-sm font-medium">Loading audit logs...</span>
                </div>
            </td>
        </tr>
    `;
}

function renderEmptyRow(hasAnyEvents) {
    const title = hasAnyEvents ? 'No matching audit logs' : 'No audit logs yet';
    const subtitle = hasAnyEvents
        ? 'Try a different search term or event filter.'
        : 'System audit logs will appear here automatically.';

    return `
        <tr>
            <td colspan="5" class="px-6 py-14 text-center">
                <div class="flex flex-col items-center justify-center">
                    <p class="text-slate-500 font-medium">${title}</p>
                    <p class="text-sm text-slate-400 mt-1">${subtitle}</p>
                </div>
            </td>
        </tr>
    `;
}

function renderErrorRow(message) {
    return `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center">
                <div class="flex flex-col items-center justify-center gap-1 max-w-md mx-auto">
                    <span class="text-sm font-medium text-red-500">Couldn't load audit logs.</span>
                    <span class="text-xs text-slate-400">${message}</span>
                    <button onclick="fetchAuditTrail()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2">Try again</button>
                </div>
            </td>
        </tr>
    `;
}

function renderAuditRow(event) {
    const kind = auditEventKind(event.actionPerformed || event.eventType);
    const badgeClasses = EVENT_BADGE_STYLES[kind];

    let formattedDate = '—';
    if (event.timestamp) {
        const dateObj = new Date(event.timestamp);
        formattedDate = dateObj.toLocaleString();
    }

    const userDisplay = event.username || (event.user ? event.user.username : null) || 'System';
    const statusValue = event.status ?? 'SUCCESS';
    const actionDisplay = event.actionPerformed || event.eventType || 'ACTIVITY';
    const remarks = event.entityName || event.description || '—';

    const statusBadgeClass = statusValue === 'SUCCESS'
        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
        : 'bg-rose-50 text-rose-600 border-rose-200';

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4 text-sm text-slate-500">${formattedDate}</td>
            <td class="px-6 py-4 font-medium text-slate-800 text-sm">${userDisplay}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass}">${statusValue}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses}">${actionDisplay}</span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">${remarks}</td>
        </tr>
    `;
}

function updateSummary(events) {
    const totalEl = document.getElementById('summaryTotalCount');
    const clearedEl = document.getElementById('summaryClearedCount');
    const rejectedEl = document.getElementById('summaryRejectedCount');

    if (totalEl) totalEl.textContent = events.length;
    if (clearedEl) clearedEl.textContent = events.filter(e => auditEventKind(e.actionPerformed || e.eventType) === 'cleared').length;
    if (rejectedEl) rejectedEl.textContent = events.filter(e => auditEventKind(e.actionPerformed || e.eventType) === 'rejected').length;
}

function renderPagination(totalItems) {
    let paginationContainer = document.getElementById('auditPagination');

    if (!paginationContainer) {
        const tableBody = document.querySelector('#auditTableBody');
        const parentTable = tableBody ? tableBody.closest('table')?.parentElement : null;
        if (parentTable) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'auditPagination';
            paginationContainer.className = 'px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between';
            parentTable.parentElement.appendChild(paginationContainer);
        } else {
            return;
        }
    }

    if (totalItems === 0) {
        paginationContainer.innerHTML = '';
        paginationContainer.classList.add('hidden');
        return;
    }

    paginationContainer.classList.remove('hidden');
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    if (currentPage < 1) currentPage = 1;

    const startItem = (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, totalItems);

    const prevPageNum = currentPage - 1;
    const nextPageNum = currentPage + 1;

    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    paginationContainer.innerHTML =
        '<span class="text-sm text-slate-500">Showing ' + startItem + ' to ' + endItem + ' of ' + totalItems + ' entries</span>' +
        '<div class="flex items-center gap-2">' +
        '<button onclick="changeAuditPage(' + prevPageNum + ')" ' + prevDisabled + ' class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>' +
        '<span class="text-sm font-medium text-slate-700">Page ' + currentPage + ' of ' + totalPages + '</span>' +
        '<button onclick="changeAuditPage(' + nextPageNum + ')" ' + nextDisabled + ' class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>' +
        '</div>';
}

function changeAuditPage(newPage) {
    currentPage = newPage;
    executeAuditFilters();
}

function executeAuditFilters() {
    const tableBody = document.getElementById('auditTableBody');
    if (!tableBody) return;

    const searchTerm = (document.getElementById('auditSearchInput')?.value ?? '').trim().toLowerCase();
    const statusFilter = document.getElementById('auditStatusFilter')?.value ?? '';

    const filtered = allAuditEvents.filter(event => {
        const userStr = String(event.username || (event.user ? event.user.username : '')).toLowerCase();
        const statusStr = String(event.status ?? '').toLowerCase();
        const actionStr = String(event.actionPerformed || event.eventType || '').toLowerCase();
        const remarksStr = String(event.entityName || event.description || '').toLowerCase();

        const matchesSearch = !searchTerm || userStr.includes(searchTerm) || statusStr.includes(searchTerm) || actionStr.includes(searchTerm) || remarksStr.includes(searchTerm);
        const matchesStatus = !statusFilter || auditEventKind(event.actionPerformed || event.eventType) === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + rowsPerPage);

    tableBody.innerHTML = paginatedItems.length
        ? paginatedItems.map(renderAuditRow).join('')
        : renderEmptyRow(allAuditEvents.length > 0);

    renderPagination(filtered.length);
}

function handleSearchInputEvent() {
    currentPage = 1;
    executeAuditFilters();
}

async function fetchAuditTrail() {
    const tableBody = document.getElementById('auditTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = renderLoadingRow();

    try {
        const url = window.location.origin + "/globaltrade/api" + API_PATH;

        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getCookie('accessToken'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch audit logs (status ${response.status})`);
        }

        allAuditEvents = await response.json();
        currentPage = 1;
        updateSummary(allAuditEvents);
        executeAuditFilters();

    } catch (error) {
        console.error('Error:', error);
        allAuditEvents = [];
        updateSummary(allAuditEvents);
        tableBody.innerHTML = renderErrorRow(error.message);
        renderPagination(0);
    }
}

window.fetchAuditTrail = fetchAuditTrail;
window.changeAuditPage = changeAuditPage;

document.addEventListener("DOMContentLoaded", () => {
    if (typeof requireRole === 'function') {
        requireRole(['ADMIN']);
    }
    fetchAuditTrail();

    const searchInput = document.getElementById('auditSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInputEvent);
    }

    const statusFilter = document.getElementById('auditStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleSearchInputEvent);
    }
});