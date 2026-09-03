let rawStockItems = [];
let filteredStockItems = [];

const STATUS_BADGE_STYLES = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
    LOW: 'bg-amber-50 text-amber-700 border-amber-200'
};

const STATUS_DOT_STYLES = {
    CRITICAL: 'bg-red-500',
    LOW: 'bg-amber-500'
};

document.addEventListener("DOMContentLoaded", () => {
    loadLowStockAlerts();

    document.getElementById('stockSearchInput')?.addEventListener('input', applyStockFilters);
    document.getElementById('stockStatusFilter')?.addEventListener('change', applyStockFilters);

    ensureNotificationContainers();
});

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Accept': 'application/json'
    };
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

function computeSeverity(item) {
    const qty = item.quantityOnHand ?? 0;
    const minLevel = item.minStockLevel ?? 0;
    const reorderLevel = item.reorderThreshold ?? 0;

    if (qty <= minLevel) return 'CRITICAL';
    if (qty <= reorderLevel) return 'LOW';
    return 'LOW';
}

async function loadLowStockAlerts() {
    const tbody = document.getElementById("lowStockTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">Loading warehouse status...</td></tr>`;

    try {
        const url = window.location.origin + "/globaltrade/api/inventory/low-stock";
        const response = await fetch(url, {
            method: "GET",
            headers: authHeaders(),
            credentials: 'include'
        });

        if (!response.ok) throw new Error("Failed to fetch low stock alerts (status " + response.status + ")");

        const data = await response.json();
        rawStockItems = Array.isArray(data) ? data : [];

        updateSummaryCards(rawStockItems);
        applyStockFilters();

    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-red-500">Failed to load stock alerts.</td></tr>`;
    }
}

function updateSummaryCards(items) {
    const criticalEl = document.getElementById('criticalCount');
    const lowEl = document.getElementById('lowStockCount');
    const warehouseEl = document.getElementById('warehouseAffectedCount');

    const criticalCount = items.filter(item => computeSeverity(item) === 'CRITICAL').length;
    const lowCount = items.length - criticalCount;

    const warehouseNames = new Set(
        items.map(item => item.warehouse ? item.warehouse.name : null).filter(Boolean)
    );

    if (criticalEl) criticalEl.textContent = criticalCount;
    if (lowEl) lowEl.textContent = lowCount;
    if (warehouseEl) warehouseEl.textContent = warehouseNames.size;
}

function applyStockFilters() {
    const searchTerm = (document.getElementById('stockSearchInput')?.value ?? '').trim().toLowerCase();
    const statusFilter = document.getElementById('stockStatusFilter')?.value ?? '';

    filteredStockItems = rawStockItems.filter(item => {
        const warehouseName = (item.warehouse ? item.warehouse.name : '').toLowerCase();
        const productTitle = (item.product ? item.product.name : '').toLowerCase();
        const severity = computeSeverity(item);

        const matchesSearch = !searchTerm || warehouseName.includes(searchTerm) || productTitle.includes(searchTerm);
        const matchesStatus = !statusFilter || severity === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderStockTable(filteredStockItems);
}

function renderStockTable(items) {
    const tbody = document.getElementById("lowStockTableBody");
    if (!tbody) return;

    if (!items || items.length === 0) {
        const hasAnyItems = rawStockItems.length > 0;
        const message = hasAnyItems
            ? 'No items match your search or filter.'
            : 'No low stock alerts found. All warehouses are well-stocked.';

        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">${message}</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map((item, index) => {
        const severity = computeSeverity(item);
        const badgeClasses = STATUS_BADGE_STYLES[severity];
        const dotClasses = STATUS_DOT_STYLES[severity];
        const statusLabel = severity === 'CRITICAL' ? 'Critical' : 'Low Stock';

        const warehouseName = item.warehouse ? item.warehouse.name : '—';
        const productTitle = item.product ? item.product.name : '—';
        const uniqueKey = item.inventoryId ?? (index + 1);

        return `
            <tr id="stock-row-${uniqueKey}" class="hover:bg-slate-50 transition-all duration-300">
                <td class="px-6 py-4 text-sm text-slate-500 font-medium">#${uniqueKey}</td>
                <td class="px-6 py-4 text-sm font-semibold text-slate-800">${warehouseName}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${productTitle}</td>
                <td class="px-6 py-4 text-sm text-slate-700 text-right font-mono">${item.quantityOnHand ?? '—'}</td>
                <td class="px-6 py-4 text-sm text-slate-500 text-right font-mono">${item.reorderThreshold ?? '—'}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses}">
                        <span class="w-1.5 h-1.5 rounded-full ${dotClasses}"></span>
                        ${statusLabel}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick='confirmTriggerReplenishment(${JSON.stringify(item)}, "${uniqueKey}")'
                            class="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                        Set Reminder
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function ensureNotificationContainers() {
    if (!document.getElementById('customModalContainer')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'customModalContainer';
        document.body.appendChild(modalDiv);
    }
    if (!document.getElementById('toastContainer')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toastContainer';
        toastDiv.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(toastDiv);
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
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function confirmTriggerReplenishment(item, uniqueKey) {
    const modalContainer = document.getElementById('customModalContainer');
    const warehouseName = item.warehouse ? item.warehouse.name : '—';
    const productTitle = item.product ? item.product.name : '—';

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-slate-900">Set Reminder & Request</h3>
                        <p class="text-xs text-slate-500">Send reminder email and dispatch request</p>
                    </div>
                </div>
                
                <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    Are you sure you want to set a reminder and send a replenishment request email for <span class="font-bold text-slate-800">${productTitle}</span> at <span class="font-bold text-slate-800">${warehouseName}</span>?
                </p>

                <div class="flex items-center justify-end gap-2.5 pt-2">
                    <button id="modalCancelBtn" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button id="modalConfirmBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                        Yes, Set Reminder
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalCancelBtn').onclick = () => {
        modalContainer.innerHTML = '';
    };

    document.getElementById('modalConfirmBtn').onclick = async () => {
        modalContainer.innerHTML = '';
        await executeReplenishment(item, warehouseName, productTitle, uniqueKey);
    };
}

async function executeReplenishment(item, warehouseName, productTitle, uniqueKey) {
    try {
        const prodId = item.product ? (item.product.productId ?? item.product.id) : (item.productId ?? null);

        const payload = {
            vendor: item.vendor && item.vendor.vendorId ? item.vendor : { vendorId: 6 },
            warehouse: item.warehouse || null,
            product: prodId ? { productId: prodId } : null,
            quantity: item.reorderThreshold ?? 10,
            status: "PENDING",
            createdByTimer: false
        };

        const url = window.location.origin + "/globaltrade/api/vendors/replenishment-requests";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Backend Error Response:", errorBody);
            throw new Error("Failed to dispatch replenishment request (Status: " + response.status + ")");
        }

        showToast('Reminder Sent Successfully', `Reminder email successfully dispatched and request saved for ${productTitle} at ${warehouseName}.`, 'success');

        // ක්ෂණිකව ලැයිස්තුවෙන් (Table) සහ rawStockItems ලැයිස්තුවෙන් අදාළ අයිතමය ඉවත් කිරීම (Instant Remove)
        rawStockItems = rawStockItems.filter(i => (i.inventoryId ?? '') !== (item.inventoryId ?? ''));

        const rowElement = document.getElementById(`stock-row-${uniqueKey}`);
        if (rowElement) {
            rowElement.style.transition = "all 0.4s ease";
            rowElement.style.transform = "translateX(50px)";
            rowElement.style.opacity = "0";
            setTimeout(() => {
                rowElement.remove();
                applyStockFilters(); // Update summary cards and pagination/empty states
            }, 400);
        } else {
            applyStockFilters();
        }

    } catch (error) {
        console.error("Full Error Details:", error);
        showToast('Error Occurred', "Error: " + error.message, 'error');
    }
}

window.loadLowStockAlerts = loadLowStockAlerts;
window.confirmTriggerReplenishment = confirmTriggerReplenishment;