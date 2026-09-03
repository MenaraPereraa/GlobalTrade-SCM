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
            <td colspan="4" class="px-6 py-10 text-center text-slate-500">
                <div class="flex items-center justify-center gap-2">
                    <span class="text-sm font-medium">Loading audit trail...</span>
                </div>
            </td>
        </tr>
    `;
}

function renderEmptyRow(hasAnyEvents) {
    const title = hasAnyEvents ? 'No matching events' : 'No audit events yet';
    const subtitle = hasAnyEvents
        ? 'Try a different search term or event filter.'
        : 'Customs clearance and rejection events will appear here automatically.';

    return `
        <tr>
            <td colspan="4" class="px-6 py-14 text-center">
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
            <td colspan="4" class="px-6 py-10 text-center">
                <div class="flex flex-col items-center justify-center gap-1 max-w-md mx-auto">
                    <span class="text-sm font-medium text-red-500">Couldn't load the audit trail.</span>
                    <span class="text-xs text-slate-400">${message}</span>
                    <button onclick="fetchAuditTrail()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2">Try again</button>
                </div>
            </td>
        </tr>
    `;
}

function renderAuditRow(event) {
    const kind = auditEventKind(event.actionPerformed);
    const badgeClasses = EVENT_BADGE_STYLES[kind];

    let formattedDate = '—';
    if (event.timestamp) {
        const dateObj = new Date(event.timestamp);
        formattedDate = dateObj.toLocaleString();
    }

    const statusValue = event.status ?? '—';
    const remarks = event.entityName ? `${event.entityName}` : '—';

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4 text-sm text-slate-500">${formattedDate}</td>
            <td class="px-6 py-4">
                <span class="text-sm font-semibold text-slate-800">${statusValue}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses}">${event.actionPerformed ?? 'Event'}</span>
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
    if (clearedEl) clearedEl.textContent = events.filter(e => auditEventKind(e.actionPerformed) === 'cleared').length;
    if (rejectedEl) rejectedEl.textContent = events.filter(e => auditEventKind(e.actionPerformed) === 'rejected').length;
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
            parentTable.appendChild(paginationContainer);
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

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startItem} to ${endItem} of ${totalItems} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeAuditPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentPage} of ${totalPages}</span>
            <button onclick="changeAuditPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
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
        const statusStr = String(event.status ?? '').toLowerCase();
        const actionStr = (event.actionPerformed ?? '').toLowerCase();
        const entityNameStr = (event.entityName ?? '').toLowerCase();

        const matchesSearch = !searchTerm || statusStr.includes(searchTerm) || actionStr.includes(searchTerm) || entityNameStr.includes(searchTerm);
        const matchesStatus = !statusFilter || auditEventKind(event.actionPerformed) === statusFilter;

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
            throw new Error(`Failed to fetch audit trail (status ${response.status})`);
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