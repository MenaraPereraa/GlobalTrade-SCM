let allShipments = [];
let filteredShipments = [];
let currentShipmentPage = 1;
const itemsPerShipmentPage = 10;

document.addEventListener("DOMContentLoaded", () => {
    loadCoordinatorData();

    document.getElementById('shipmentSearchInput')?.addEventListener('input', filterAndRenderShipments);
    document.getElementById('shipmentStatusFilter')?.addEventListener('change', filterAndRenderShipments);
});

async function loadCoordinatorData() {
    await Promise.all([
        fetchShipmentsOverview(),
        fetchSystemExceptions(),
        fetchCustomsStatus()
    ]);
}

async function fetchShipmentsOverview() {
    const tableBody = document.getElementById("shipmentsTableBody");
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">Loading shipments...</td></tr>`;
    }

    try {
        const url = window.location.origin + "/globaltrade/api/coordinator/shipments";
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

        const shipments = await response.json();
        allShipments = Array.isArray(shipments) ? shipments : [];
        filterAndRenderShipments();

    } catch (error) {
        console.error("Error fetching shipments:", error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500 italic">Failed to load shipments data.</td></tr>`;
        }
    }
}

function filterAndRenderShipments() {
    const searchQuery = (document.getElementById('shipmentSearchInput')?.value || '').toLowerCase().trim();
    const statusQuery = document.getElementById('shipmentStatusFilter')?.value || '';

    filteredShipments = allShipments.filter(s => {
        const tracking = (s.trackingNumber || s.trackingNo || '').toLowerCase();
        const carrier = (s.carrierName || s.carrier || '').toLowerCase();
        const status = (s.currentStatus || s.status || '').toUpperCase();

        const matchesSearch = !searchQuery || tracking.includes(searchQuery) || carrier.includes(searchQuery);
        const matchesStatus = !statusQuery || status === statusQuery;

        return matchesSearch && matchesStatus;
    });

    currentShipmentPage = 1;
    renderShipmentsTable();
}

function renderShipmentsTable() {
    const tableBody = document.getElementById("shipmentsTableBody");
    if (!tableBody) return;

    if (!filteredShipments || filteredShipments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">No shipments found.</td></tr>`;
        renderShipmentPaginationControls(0);
        return;
    }

    const totalPages = Math.ceil(filteredShipments.length / itemsPerShipmentPage);
    if (currentShipmentPage > totalPages) currentShipmentPage = totalPages || 1;

    const start = (currentShipmentPage - 1) * itemsPerShipmentPage;
    const end = start + itemsPerShipmentPage;
    const paginatedShipments = filteredShipments.slice(start, end);

    tableBody.innerHTML = paginatedShipments.map(s => {
        let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        const status = (s.currentStatus || s.status || '').toUpperCase();

        if (status === 'IN_TRANSIT') badgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
        else if (status === 'DELIVERED') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        else if (status === 'CUSTOMS') badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
        else if (status === 'PENDING') badgeClass = 'bg-purple-50 text-purple-700 border-purple-100';

        const origin = s.originHub || s.origin || '';
        const destination = s.destinationHub || s.destination || '';
        const routeText = (origin && destination) ? `${origin} &rarr; ${destination}` : (destination || 'N/A');

        return `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-semibold text-slate-900">${s.trackingNumber || s.trackingNo || 'N/A'}</td>
                <td class="px-6 py-4 text-slate-600 text-sm">${routeText}</td>
                <td class="px-6 py-4 text-slate-600 font-medium">${s.carrierName || s.carrier || 'N/A'}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}">
                        ${status || 'UNKNOWN'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    renderShipmentPaginationControls(totalPages);
}

function renderShipmentPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("shipmentPagination");

    if (!paginationContainer) {
        const tableWrapper = document.getElementById("shipmentsTableBody")?.closest(".bg-white, div");
        if (tableWrapper) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "shipmentPagination";
            paginationContainer.className = "px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-white";
            tableWrapper.parentNode.appendChild(paginationContainer);
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

async function fetchSystemExceptions() {
    const container = document.getElementById("exceptionsContainer");
    if (!container) return;

    try {
        const url = window.location.origin + "/globaltrade/api/coordinator/exceptions";
        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch exceptions");
        const exceptions = await response.json();

        if (!exceptions || exceptions.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Exceptions</span>
                    <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">0 Active</span>
                </div>
                <p class="text-xs text-slate-400 italic text-center py-2">No system exceptions found.</p>
            `;
            return;
        }

        container.innerHTML = `
            <div class="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-100 mb-3">
                <span class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Failed Operations</span>
                <span class="px-2.5 py-1 bg-amber-200/70 text-amber-800 rounded-lg text-xs font-bold">${exceptions.length} Issues</span>
            </div>
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                ${exceptions.map(ex => `
                    <div class="p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-xs hover:bg-slate-50 transition">
                        <div class="min-w-0 pr-2">
                            <p class="text-xs font-bold text-slate-800 truncate">${ex.title || ex.actionPerformed || 'Action Failed'}</p>
                            <p class="text-[11px] text-slate-400">Entity: ${ex.entityName || 'System'} (#${ex.entityId || 'N/A'})</p>
                        </div>
                        <span class="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-[10px] font-semibold uppercase shrink-0">FAIL</span>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error("Error fetching exceptions:", error);
        container.innerHTML = `<p class="text-red-400 italic text-xs">Failed to load system exceptions.</p>`;
    }
}

async function fetchCustomsStatus() {
    const container = document.getElementById("customsContainer");
    if (!container) return;

    try {
        const url = window.location.origin + "/globaltrade/api/coordinator/customs";
        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch customs status");
        const customsList = await response.json();

        if (!customsList || customsList.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customs Records</span>
                    <span class="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">0 Records</span>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100 mb-3">
                <span class="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Customs Trackings</span>
                <span class="px-2.5 py-1 bg-blue-200/70 text-blue-800 rounded-lg text-xs font-bold">${customsList.length} Total</span>
            </div>
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                ${customsList.map(c => {
            const status = (c.status || c.customsStatus || 'PENDING').toUpperCase();
            let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
            if (status === 'APPROVED') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
            else if (status === 'REJECTED') badgeBg = 'bg-red-50 text-red-700 border-red-100';
            else if (status === 'PENDING') badgeBg = 'bg-amber-50 text-amber-700 border-amber-100';

            return `
                        <div class="p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-xs hover:bg-slate-50 transition">
                            <div class="min-w-0 pr-2">
                                <p class="text-xs font-bold text-slate-800">Shipment #${c.shipmentId || c.id || 'N/A'}</p>
                                <p class="text-[11px] text-slate-400">Hub / Ref check</p>
                            </div>
                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeBg} uppercase shrink-0">${status}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

    } catch (error) {
        console.error("Error fetching customs status:", error);
        container.innerHTML = `<p class="text-red-400 italic text-xs">Failed to load customs status.</p>`;
    }
}

window.changeShipmentPage = changeShipmentPage;