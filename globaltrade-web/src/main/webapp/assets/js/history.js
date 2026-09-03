let allHistory = [];
let filteredHistory = [];
let currentHistoryPage = 1;
const itemsPerHistoryPage = 10;

document.addEventListener("DOMContentLoaded", () => {
    fetchHistory();
    const searchInput = document.getElementById("historySearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filterHistoryTable);
    }
});

function renderHistoryLoading() {
    return `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-500">Loading history logs...</td></tr>`;
}

function renderHistoryEmpty() {
    return `<tr><td colspan="7" class="px-6 py-14 text-center text-slate-500">
        <div class="flex flex-col items-center gap-2">
            <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <span class="text-slate-500 font-medium">No cleared customs history records found.</span>
            <span class="text-sm text-slate-400">Shipments that have successfully cleared customs will appear here.</span>
        </div>
    </td></tr>`;
}

function renderHistoryError() {
    return `<tr><td colspan="7" class="px-6 py-10 text-center text-red-500">
        <div class="flex flex-col items-center gap-2">
            <svg class="w-8 h-8 text-red-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
            <span>Error loading history.</span>
            <button onclick="fetchHistory()" class="underline font-medium hover:text-red-700">Retry</button>
        </div>
    </td></tr>`;
}

function renderHistoryRow(item) {
    const poRef = item.poReference || 'PO-—';
    const clearanceRef = item.clearanceId || 'CLR-—';
    const vendorName = item.vendorName || 'Unknown Vendor';
    const productName = item.productName || 'Unknown Product';
    const route = item.route || 'Unknown → Unknown';
    const submittedDate = item.submittedDate || '—';
    const reviewedDate = item.reviewedDate || '—';
    const status = item.status || 'CLEARED';
    const outcome = item.outcome || 'Cleared';

    // Badge colors for Cleared items
    let statusColor = 'bg-emerald-100 text-emerald-800';
    let outcomeColor = 'bg-emerald-100 text-emerald-800';

    return `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 text-sm text-slate-800">
                <div class="font-semibold text-slate-900">${poRef}</div>
                <div class="text-xs text-slate-400 font-mono">${clearanceRef}</div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
                <div class="font-semibold text-slate-900">${vendorName}</div>
                <div class="text-xs text-slate-500">${productName}</div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">${route}</td>
            <td class="px-6 py-4 text-sm text-slate-500">${submittedDate}</td>
            <td class="px-6 py-4 text-sm text-slate-500">${reviewedDate}</td>
            <td class="px-6 py-4 text-sm">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full ${statusColor}">${status}</span>
            </td>
            <td class="px-6 py-4 text-sm">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full ${outcomeColor}">${outcome}</span>
            </td>
        </tr>
    `;
}

async function fetchHistory() {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = renderHistoryLoading();

    try {
        const url = window.location.origin + "/globaltrade/api/customs/history";

        console.log("Fetching history from:", url);

        let response;
        if (typeof fetchWithAuth === 'function') {
            response = await fetchWithAuth(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } else {
            const token = typeof getCookie === 'function' ? getCookie('accessToken') : '';
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': token ? 'Bearer ' + token : '',
                    'Content-Type': 'application/json'
                }
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Response error:", response.status, errorText);
            throw new Error(`Failed to fetch history logs: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("History response:", result);

        let rawList = [];
        if (Array.isArray(result)) {
            rawList = result;
        } else if (result.data && Array.isArray(result.data)) {
            rawList = result.data;
        }

        // --- මෙතැනදී CLEARED හෝ APPROVED වූ රෙකෝඩ්ස් පමණක් ෆිල්ටර් කර ගනී ---
        allHistory = rawList.filter(item => {
            const status = (item.status || '').toUpperCase();
            const outcome = (item.outcome || '').toLowerCase();
            return status.includes('CLEAR') || status.includes('APPROVED') ||
                outcome.includes('clear') || outcome.includes('approved');
        });

        console.log(`Found ${allHistory.length} cleared history records`);
        filterHistoryTable();
    } catch (error) {
        console.error("Error fetching customs history:", error);
        tableBody.innerHTML = renderHistoryError();
    }
}

function filterHistoryTable() {
    const searchInput = document.getElementById("historySearchInput");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    if (!searchText) {
        filteredHistory = [...allHistory];
    } else {
        filteredHistory = allHistory.filter(item => {
            const po = (item.poReference || '').toLowerCase();
            const clearance = (item.clearanceId || '').toLowerCase();
            const vendor = (item.vendorName || '').toLowerCase();
            const product = (item.productName || '').toLowerCase();
            const status = (item.status || '').toLowerCase();
            const outcome = (item.outcome || '').toLowerCase();

            return po.includes(searchText) ||
                clearance.includes(searchText) ||
                vendor.includes(searchText) ||
                product.includes(searchText) ||
                status.includes(searchText) ||
                outcome.includes(searchText);
        });
    }

    currentHistoryPage = 1;
    renderHistoryTable();
}

function renderHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    if (!filteredHistory || !filteredHistory.length) {
        tableBody.innerHTML = renderHistoryEmpty();
        return;
    }

    const start = (currentHistoryPage - 1) * itemsPerHistoryPage;
    const paginated = filteredHistory.slice(start, start + itemsPerHistoryPage);
    tableBody.innerHTML = paginated.map(renderHistoryRow).join('');
}

window.fetchHistory = fetchHistory;
window.filterHistoryTable = filterHistoryTable;