let allVendors = [];
let filteredVendors = [];
let currentVendorPage = 1;
const itemsPerVendorPage = 10;

const VENDOR_STATUS_STYLES = {
    PENDING: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    ACTIVE: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    APPROVED: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    REJECTED: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' }
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof requireRole === 'function') {
        requireRole(['ADMIN', 'COORDINATOR']);
    }
    ensureToastContainer();
    fetchVendors();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filterVendorTable);
    }

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", filterVendorTable);
    }
});

function ensureToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }
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

function showConfirmToast(title, message, onConfirm) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex flex-col w-80 bg-white border border-slate-100 rounded-xl p-4 shadow-xl shadow-slate-200/50 transform translate-y-2 opacity-0 transition-all duration-300 relative overflow-hidden border-b-4 border-amber-500`;

    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <div class="flex-1 min-w-0 pr-2">
                <h4 class="text-sm font-bold text-slate-800">${title}</h4>
                <p class="text-xs text-slate-500 mt-0.5">${message}</p>
            </div>
        </div>
        <div class="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
            <button id="cancelToastBtn" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition">
                Cancel
            </button>
            <button id="okToastBtn" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-semibold rounded-lg transition">
                Confirm
            </button>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);

    const removeToast = () => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('#okToastBtn').addEventListener('click', () => {
        removeToast();
        onConfirm();
    });

    toast.querySelector('#cancelToastBtn').addEventListener('click', () => {
        removeToast();
    });
}

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
}

function renderLoadingRow() {
    return `
        <tr>
            <td colspan="6" class="px-6 py-10 text-center text-slate-500">
                <span class="text-sm font-medium">Loading vendor requests...</span>
            </td>
        </tr>
    `;
}

async function fetchVendors() {
    const tableBody = document.getElementById("vendorTableBody");
    if (tableBody) tableBody.innerHTML = renderLoadingRow();

    try {
        const url = window.location.origin + "/globaltrade/api/vendors";

        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: authHeaders()
        });

        if (!response.ok) {
            throw new Error("HTTP Error! Status: " + response.status);
        }

        const data = await response.json();
        allVendors = Array.isArray(data) ? [...data].reverse() : [];

        updateVendorCounts(allVendors);
        filterVendorTable();

    } catch (error) {
        console.error("Error fetching vendors:", error);
        showVendorEmptyState("Failed to load vendor data.", true);
    }
}

function filterVendorTable() {
    const searchInput = document.getElementById("searchInput");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const statusFilter = document.getElementById("statusFilter");
    const statusValue = statusFilter ? statusFilter.value : "";

    filteredVendors = allVendors.filter(vendor => {
        const name = vendor.vendorName?.toLowerCase() || "";
        const email = vendor.contactEmail?.toLowerCase() || "";
        const country = vendor.countryCode?.toLowerCase() || "";
        const status = vendor.status?.toLowerCase() || "";

        const matchesSearch = !searchText || name.includes(searchText) || email.includes(searchText) || country.includes(searchText) || status.includes(searchText);
        const matchesStatus = !statusValue || vendor.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    currentVendorPage = 1;
    renderVendorTable();
}

function renderVendorRow(v) {
    const style = VENDOR_STATUS_STYLES[v.status] || VENDOR_STATUS_STYLES.PENDING;
    const isPending = v.status === 'PENDING' || v.status === 'ACTIVE' || !v.status;

    const actions = isPending
        ? `
            <button onclick="updateVendorStatus(${v.vendorId}, 'APPROVED')"
                    class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                Approve
            </button>
            <button onclick="updateVendorStatus(${v.vendorId}, 'REJECTED')"
                    class="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors">
                Reject
            </button>
        `
        : `<span class="text-xs text-slate-400 italic">Reviewed</span>`;

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4 text-sm font-medium text-slate-500">#${v.vendorId}</td>
            <td class="px-6 py-4 text-sm font-semibold text-slate-800">${v.vendorName || "N/A"}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${v.contactEmail || "N/A"}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${v.countryCode || "N/A"}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}">
                    <span class="w-1.5 h-1.5 rounded-full ${style.dot}"></span>
                    ${v.status || "PENDING"}
                </span>
            </td>
            <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">${actions}</td>
        </tr>
    `;
}

function renderVendorTable() {
    const tableBody = document.getElementById("vendorTableBody");
    if (!tableBody) return;

    if (!filteredVendors || filteredVendors.length === 0) {
        showVendorEmptyState("No vendor requests found.");
        return;
    }

    const totalPages = Math.ceil(filteredVendors.length / itemsPerVendorPage);
    if (currentVendorPage > totalPages) currentVendorPage = totalPages || 1;

    const start = (currentVendorPage - 1) * itemsPerVendorPage;
    const end = start + itemsPerVendorPage;
    const paginatedVendors = filteredVendors.slice(start, end);

    tableBody.innerHTML = paginatedVendors.map(renderVendorRow).join('');
    renderVendorPaginationControls(totalPages);
}

function updateVendorCounts(vendors) {
    const pendingCount = vendors.filter(v => v.status === 'PENDING' || v.status === 'ACTIVE' || !v.status).length;
    const approvedCount = vendors.filter(v => v.status === 'APPROVED').length;
    const totalCount = vendors.length;

    const pendingEl = document.getElementById("pendingCount");
    const approvedEl = document.getElementById("approvedCount");
    const totalEl = document.getElementById("totalCount");

    if (pendingEl) pendingEl.textContent = pendingCount;
    if (approvedEl) approvedEl.textContent = approvedCount;
    if (totalEl) totalEl.textContent = totalCount;
}

function renderVendorPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("vendorPagination");
    const tableWrapper = document.querySelector("table")?.closest(".bg-white");

    if (!paginationContainer && tableWrapper) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "vendorPagination";
        paginationContainer.className = "flex items-center justify-between px-6 py-4 border-t border-slate-100";
        tableWrapper.appendChild(paginationContainer);
    }
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        paginationContainer.classList.add("hidden");
        return;
    }

    paginationContainer.classList.remove("hidden");
    const startEntry = (currentVendorPage - 1) * itemsPerVendorPage + 1;
    const endEntry = Math.min(currentVendorPage * itemsPerVendorPage, filteredVendors.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry}-${endEntry} of ${filteredVendors.length}</span>
        <div class="flex items-center gap-2">
            <button onclick="changeVendorPage(${currentVendorPage - 1})" ${currentVendorPage === 1 ? 'disabled' : ''}
                    class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                Previous
            </button>
            <span class="text-sm font-medium text-slate-700">Page ${currentVendorPage} of ${totalPages}</span>
            <button onclick="changeVendorPage(${currentVendorPage + 1})" ${currentVendorPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                Next
            </button>
        </div>
    `;
}

function changeVendorPage(page) {
    currentVendorPage = page;
    renderVendorTable();
}

async function updateVendorStatus(vendorId, newStatus) {
    const actionText = newStatus === 'APPROVED' ? 'approve' : 'reject';

    showConfirmToast(
        "Are you sure?",
        `Do you really want to ${actionText} this vendor?`,
        async () => {
            try {
                const url = `${window.location.origin}/globaltrade/api/vendors/${vendorId}/status?status=${newStatus}`;

                const response = await fetchWithAuth(url, {
                    method: "PUT",
                    headers: authHeaders()
                });

                if (!response.ok) {
                    throw new Error("Failed to update vendor status.");
                }

                showToast('Success', `Vendor has been successfully ${newStatus.toLowerCase()}d.`, 'success');
                await fetchVendors();

            } catch (error) {
                console.error("Error updating vendor status:", error);
                showToast('Error', error.message || 'Error updating vendor status.', 'error');
            }
        }
    );
}

function showVendorEmptyState(message, isError = false) {
    const tableBody = document.getElementById("vendorTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="px-6 py-16 text-center">
                <p class="${isError ? 'text-red-500' : 'text-slate-500'} font-medium">${message}</p>
                <p class="text-sm text-slate-400 mt-1">Vendor registrations will appear here.</p>
                ${isError ? `<button onclick="fetchVendors()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2">Try again</button>` : ''}
            </td>
        </tr>
    `;

    const paginationContainer = document.getElementById("vendorPagination");
    if (paginationContainer) paginationContainer.classList.add("hidden");
}

window.changeVendorPage = changeVendorPage;
window.updateVendorStatus = updateVendorStatus;
window.fetchVendors = fetchVendors;
window.filterVendorTable = filterVendorTable;