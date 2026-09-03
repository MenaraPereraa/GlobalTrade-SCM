let allLowStockItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
    fetchLowStockItems();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filterTable);
    }

    const warehouseFilter = document.getElementById("warehouseFilter");
    if (warehouseFilter) {
        warehouseFilter.addEventListener("change", filterTable);
    }
});

async function fetchLowStockItems() {
    try {
        const url = window.location.origin + "/globaltrade/api/inventory/low-stock";

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
        allLowStockItems = Array.isArray(data) ? data : [];

        populateWarehouseDropdown(allLowStockItems);
        filterTable();

    } catch (error) {
        console.error("Error fetching low stock items:", error);
        showEmptyState();
    }
}

function populateWarehouseDropdown(items) {
    const warehouseFilter = document.getElementById("warehouseFilter");
    if (!warehouseFilter) return;

    const warehouses = [...new Set(items.map(item => item.warehouse?.name).filter(Boolean))].sort();

    warehouseFilter.innerHTML = '<option value="">All warehouses</option>';
    warehouses.forEach(whName => {
        const option = document.createElement("option");
        option.value = whName;
        option.textContent = whName;
        warehouseFilter.appendChild(option);
    });
}

function filterTable() {
    const searchInput = document.getElementById("searchInput");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const warehouseFilter = document.getElementById("warehouseFilter");
    const selectedWarehouse = warehouseFilter ? warehouseFilter.value : "";

    filteredItems = allLowStockItems.filter(item => {
        const productTitle = (item.product?.name || item.product?.title || "").toLowerCase();
        const warehouseName = item.warehouse?.name || "";

        const matchesSearch = productTitle.includes(searchText);
        const matchesWarehouse = !selectedWarehouse || warehouseName === selectedWarehouse;

        return matchesSearch && matchesWarehouse;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tableBody = document.getElementById("lowStockTableBody");
    if (!tableBody) return;

    if (!filteredItems || filteredItems.length === 0) {
        showEmptyState();
        return;
    }

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedLogs = filteredItems.slice(start, end);

    tableBody.innerHTML = paginatedLogs.map((item, index) => {
        const globalIndex = start + index + 1;
        const productTitle = item.product?.name || item.product?.title || "Unknown Product";
        const warehouseName = item.warehouse?.name || "Unknown Warehouse";
        const qtyOnHand = item.quantityOnHand ?? 0;
        const threshold = item.reorderThreshold ?? 0;

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-sm text-slate-600">${globalIndex}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-800">${productTitle}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${warehouseName}</td>
                <td class="px-6 py-4 text-sm font-bold text-rose-600">${qtyOnHand}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${threshold}</td>
                <td class="px-6 py-4 text-sm font-medium">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                        Low Stock
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById("paginationContainer");
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = `<span class="text-sm text-slate-500">Showing ${filteredItems.length} entries</span>`;
        return;
    }

    const startEntry = (currentPage - 1) * itemsPerPage + 1;
    const endEntry = Math.min(currentPage * itemsPerPage, filteredItems.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredItems.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentPage} of ${totalPages}</span>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changePage(page) {
    currentPage = page;
    renderTable();
}

function showEmptyState() {
    const tableBody = document.getElementById("lowStockTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-16 px-6">
                <div class="flex flex-col items-center justify-center">
                    <div class="p-3 rounded-full bg-emerald-50 mb-3">
                        <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <p class="text-slate-500 font-medium">No low stock items found</p>
                    <p class="text-sm text-slate-400 mt-1">All inventory levels are currently sufficient.</p>
                </div>
            </td>
        </tr>
    `;

    const paginationContainer = document.getElementById("paginationContainer");
    if (paginationContainer) paginationContainer.innerHTML = "";
}

window.changePage = changePage;