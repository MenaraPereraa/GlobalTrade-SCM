let allDeclarations = [];
let filteredDeclarations = [];
let currentDeclPage = 1;
const itemsPerDeclPage = 10;
let currentStatusFilter = "";

const DECLARATION_STATUS_STYLES = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200'
};

const DECLARATION_TYPE_STYLES = {
    IMPORT: 'bg-indigo-50 text-indigo-600',
    EXPORT: 'bg-purple-50 text-purple-600'
};

document.addEventListener("DOMContentLoaded", () => {
    fetchDeclarations();

    const searchInput = document.querySelector("input[placeholder*='Search']");
    if (searchInput) {
        searchInput.addEventListener("input", filterDeclarationsTable);
    }
});

function renderLoadingRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center text-slate-500">
                <div class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span class="text-sm font-medium">Loading declarations...</span>
                </div>
            </td>
        </tr>
    `;
}

function renderEmptyRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-14 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="p-3 rounded-full bg-slate-100 mb-3">
                        <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                    </div>
                    <p class="text-slate-500 font-medium">No declarations found</p>
                    <p class="text-sm text-slate-400 mt-1">Declarations created from Customs Clearance will show up here.</p>
                </div>
            </td>
        </tr>
    `;
}

function renderErrorRow() {
    return `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center">
                <div class="flex flex-col items-center justify-center gap-1">
                    <span class="text-sm font-medium text-red-500">Error loading declarations.</span>
                    <button onclick="fetchDeclarations()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1">Try again</button>
                </div>
            </td>
        </tr>
    `;
}

function renderDeclarationRow(doc) {
    const statusClasses = DECLARATION_STATUS_STYLES[doc.status] || 'bg-slate-50 text-slate-600 border-slate-200';
    const typeClasses = DECLARATION_TYPE_STYLES[doc.declarationType] || 'bg-slate-50 text-slate-600';

    const shipmentId = doc.shipmentId || doc.shipment?.shipmentId || 'N/A';

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4">
                <div class="flex items-center gap-2.5">
                    <div class="p-1.5 rounded-lg bg-slate-100 shrink-0">
                        <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                        </svg>
                    </div>
                    <span class="text-sm font-semibold text-slate-800">#${doc.documentId}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">${shipmentId !== 'N/A' ? '#' + shipmentId : 'N/A'}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeClasses}">${doc.declarationType}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClasses}">${doc.status}</span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-500">${doc.clearanceDate ?? '—'}</td>
        </tr>
    `;
}

async function fetchDeclarations() {
    const tableBody = document.getElementById('declarationsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = renderLoadingRow();

    try {
        const url = window.location.origin + "/globaltrade/api/customs/documents";
        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getCookie('accessToken'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch declarations (status ${response.status})`);

        allDeclarations = await response.json();
        filterDeclarationsTable();
    } catch (error) {
        console.error('Error Details:', error);
        tableBody.innerHTML = renderErrorRow();
    }
}

function setStatusFilter(status) {
    currentStatusFilter = status;

    document.querySelectorAll('.status-filter-chip').forEach(btn => {
        const btnStatus = btn.getAttribute('data-status');
        if (btnStatus === status) {
            btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
            btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
            btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
        }
    });

    filterDeclarationsTable();
}

function filterDeclarationsTable() {
    const searchInput = document.querySelector("input[placeholder*='Search']");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    filteredDeclarations = allDeclarations.filter(doc => {
        const docId = doc.documentId ? doc.documentId.toString() : "";
        const shipmentId = doc.shipmentId ? doc.shipmentId.toString() : (doc.shipment?.shipmentId ? doc.shipment.shipmentId.toString() : "");
        const type = doc.declarationType?.toLowerCase() || "";
        const status = doc.status?.toUpperCase() || "";

        const matchesStatus = currentStatusFilter === "" || status === currentStatusFilter;
        const matchesSearch = docId.includes(searchText) || shipmentId.includes(searchText) || type.includes(searchText) || status.toLowerCase().includes(searchText);

        return matchesStatus && matchesSearch;
    });

    currentDeclPage = 1;
    renderDeclarationsTable();
}

function renderDeclarationsTable() {
    const tableBody = document.getElementById('declarationsTableBody');
    if (!tableBody) return;

    if (!filteredDeclarations || filteredDeclarations.length === 0) {
        tableBody.innerHTML = renderEmptyRow();
        renderDeclPaginationControls(0);
        return;
    }

    const totalPages = Math.ceil(filteredDeclarations.length / itemsPerDeclPage);
    if (currentDeclPage > totalPages) currentDeclPage = totalPages || 1;

    const start = (currentDeclPage - 1) * itemsPerDeclPage;
    const end = start + itemsPerDeclPage;
    const paginatedItems = filteredDeclarations.slice(start, end);

    tableBody.innerHTML = paginatedItems.map(renderDeclarationRow).join('');
    renderDeclPaginationControls(totalPages);
}

function renderDeclPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("declarationsPagination");

    if (!paginationContainer) {
        const parentTable = document.querySelector("table")?.parentElement;
        if (parentTable) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "declarationsPagination";
            paginationContainer.className = "flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100";
            parentTable.appendChild(paginationContainer);
        } else {
            return;
        }
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        paginationContainer.classList.add("hidden");
        return;
    }

    paginationContainer.classList.remove("hidden");
    const startEntry = (currentDeclPage - 1) * itemsPerDeclPage + 1;
    const endEntry = Math.min(currentDeclPage * itemsPerDeclPage, filteredDeclarations.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredDeclarations.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeDeclPage(${currentDeclPage - 1})" ${currentDeclPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentDeclPage} of ${totalPages}</span>
            <button onclick="changeDeclPage(${currentDeclPage + 1})" ${currentDeclPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changeDeclPage(page) {
    currentDeclPage = page;
    renderDeclarationsTable();
}

window.fetchDeclarations = fetchDeclarations;
window.setStatusFilter = setStatusFilter;
window.changeDeclPage = changeDeclPage;