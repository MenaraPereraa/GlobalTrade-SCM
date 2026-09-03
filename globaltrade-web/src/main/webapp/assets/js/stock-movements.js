let allVendors = [];
let filteredVendors = [];
let currentVendorPage = 1;
const itemsPerVendorPage = 10;

document.addEventListener("DOMContentLoaded", () => {
    fetchVendors();

    const refreshBtn = document.querySelector("button.flex.items-center.gap-2");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            fetchVendors();
        });
    }

    const searchInput = document.querySelector("input[placeholder*='Search']");
    if (searchInput) {
        searchInput.disabled = false;
        searchInput.placeholder = "Search by vendor name, email, or country...";
        searchInput.addEventListener("input", filterVendorTable);
    }
});

async function fetchVendors() {
    try {
        const url = window.location.origin + "/globaltrade/api/vendors";

        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
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
        showVendorEmptyState();
    }
}

function filterVendorTable() {
    const searchInput = document.querySelector("input[placeholder*='Search']");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    filteredVendors = allVendors.filter(vendor => {
        const name = vendor.vendorName?.toLowerCase() || "";
        const email = vendor.contactEmail?.toLowerCase() || "";
        const country = vendor.countryCode?.toLowerCase() || "";
        const status = vendor.status?.toLowerCase() || "";

        return name.includes(searchText) || email.includes(searchText) || country.includes(searchText) || status.includes(searchText);
    });

    currentVendorPage = 1;
    renderVendorTable();
}

function renderVendorTable() {
    const tableBody = document.getElementById("vendorTableBody");
    if (!tableBody) return;

    if (!filteredVendors || filteredVendors.length === 0) {
        showVendorEmptyState();
        return;
    }

    const totalPages = Math.ceil(filteredVendors.length / itemsPerVendorPage);
    if (currentVendorPage > totalPages) currentVendorPage = totalPages || 1;

    const start = (currentVendorPage - 1) * itemsPerVendorPage;
    const end = start + itemsPerVendorPage;
    const paginatedVendors = filteredVendors.slice(start, end);

    tableBody.innerHTML = paginatedVendors.map(v => {
        let statusClass = "bg-amber-100 text-amber-700";
        if (v.status === 'APPROVED') {
            statusClass = "bg-emerald-100 text-emerald-700";
        } else if (v.status === 'REJECTED') {
            statusClass = "bg-red-100 text-red-700";
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-medium text-slate-800">#${v.vendorId}</td>
                <td class="p-4 font-semibold text-slate-800">${v.vendorName || "N/A"}</td>
                <td class="p-4 text-slate-600">${v.contactEmail || "N/A"}</td>
                <td class="p-4 text-slate-600">${v.countryCode || "N/A"}</td>
                <td class="p-4">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${v.status || "PENDING"}
                    </span>
                </td>
                <td class="p-4 text-right space-x-2">
                    <button onclick="updateVendorStatus(${v.vendorId}, 'APPROVED')" 
                            class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition">
                        <i class="fa-solid fa-check mr-1"></i> Approve
                    </button>
                    <button onclick="updateVendorStatus(${v.vendorId}, 'REJECTED')" 
                            class="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition">
                        <i class="fa-solid fa-xmark mr-1"></i> Reject
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    renderVendorPaginationControls(totalPages);
}

function updateVendorCounts(vendors) {
    const pendingCount = vendors.filter(v => v.status === 'PENDING').length;
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

    if (!paginationContainer) {
        const parentTable = document.querySelector("table")?.parentElement;
        if (parentTable) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "vendorPagination";
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
    const startEntry = (currentVendorPage - 1) * itemsPerVendorPage + 1;
    const endEntry = Math.min(currentVendorPage * itemsPerVendorPage, filteredVendors.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredVendors.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeVendorPage(${currentVendorPage - 1})" ${currentVendorPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentVendorPage} of ${totalPages}</span>
            <button onclick="changeVendorPage(${currentVendorPage + 1})" ${currentVendorPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changeVendorPage(page) {
    currentVendorPage = page;
    renderVendorTable();
}

async function updateVendorStatus(vendorId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this vendor?`)) return;

    try {
        const url = `${window.location.origin}/globaltrade/api/vendors/${vendorId}/status?status=${newStatus}`;

        const response = await fetchWithAuth(url, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to update vendor status.");
        }

        alert("Vendor status updated successfully!");
        fetchVendors(); // Refresh table and stats

    } catch (error) {
        console.error("Error updating vendor status:", error);
        alert("Error updating vendor status.");
    }
}

function showVendorEmptyState() {
    const tableBody = document.getElementById("vendorTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-16 px-6">
                <div class="flex flex-col items-center justify-center">
                    <p class="text-slate-500 font-medium">No vendor requests found</p>
                    <p class="text-sm text-slate-400 mt-1">Vendor registrations will appear here.</p>
                </div>
            </td>
        </tr>
    `;

    const paginationContainer = document.getElementById("vendorPagination");
    if (paginationContainer) paginationContainer.classList.add("hidden");
}

window.changeVendorPage = changeVendorPage;
window.updateVendorStatus = updateVendorStatus;