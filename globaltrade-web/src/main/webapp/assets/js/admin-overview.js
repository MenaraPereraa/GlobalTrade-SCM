// ---------------------------------------------------------------------------
// Adjust these to match your real backend routes if they differ.
// Every request is assumed to return an array of objects, each with a
// `status` field (mirroring how /api/vendors returns `vendor.status`).
// ---------------------------------------------------------------------------
const API_BASE = (typeof CONTEXT_PATH !== 'undefined' ? CONTEXT_PATH : '') + '/api';

const ENDPOINTS = {
    users: API_BASE + '/users',
    rfqs: API_BASE + '/rfqs',
    purchaseOrders: API_BASE + '/purchase-orders',
    shipments: API_BASE + '/shipments',
    warehouses: API_BASE + '/warehouses',
    auditLogs: API_BASE + '/audit-logs'
};

// Statuses that mean an RFQ / PO is no longer "active" / "pending"
const RFQ_TERMINAL_STATUSES = ['CLOSED', 'AWARDED', 'CANCELLED', 'REJECTED', 'EXPIRED'];
const PO_PENDING_STATUSES = ['PENDING', 'PENDING_APPROVAL', 'AWAITING_APPROVAL'];
const SHIPMENT_IN_TRANSIT_STATUSES = ['IN_TRANSIT', 'SHIPPED', 'DISPATCHED'];

const CHART_COLORS = {
    indigo: '#6366f1',
    amber: '#f59e0b',
    emerald: '#10b981',
    red: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    slate: '#94a3b8'
};

const STATUS_COLOR_MAP = {
    PENDING: CHART_COLORS.amber,
    PENDING_APPROVAL: CHART_COLORS.amber,
    AWAITING_APPROVAL: CHART_COLORS.amber,
    OPEN: CHART_COLORS.indigo,
    ACTIVE: CHART_COLORS.indigo,
    IN_PROGRESS: CHART_COLORS.blue,
    IN_TRANSIT: CHART_COLORS.blue,
    SHIPPED: CHART_COLORS.blue,
    DISPATCHED: CHART_COLORS.blue,
    APPROVED: CHART_COLORS.emerald,
    COMPLETED: CHART_COLORS.emerald,
    DELIVERED: CHART_COLORS.emerald,
    AWARDED: CHART_COLORS.emerald,
    SUCCESS: CHART_COLORS.emerald,
    REJECTED: CHART_COLORS.red,
    CANCELLED: CHART_COLORS.red,
    FAILED: CHART_COLORS.red,
    ERROR: CHART_COLORS.red,
    EXPIRED: CHART_COLORS.slate,
    CLOSED: CHART_COLORS.slate
};

const STATUS_BADGE_STYLES = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-600 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    SUCCESS: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    IN_TRANSIT: 'bg-blue-50 text-blue-600 border-blue-200',
    SHIPPED: 'bg-blue-50 text-blue-600 border-blue-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200',
    FAILED: 'bg-red-50 text-red-600 border-red-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200',
    ERROR: 'bg-red-50 text-red-600 border-red-200'
};

let rfqStatusChart = null;
let poStatusChart = null;
let shipmentStatusChart = null;
let inventoryChart = null;

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Content-Type': 'application/json'
    };
}

async function fetchJSON(url) {
    const response = await fetch(url, { method: 'GET', headers: authHeaders() });
    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status} for ${url}`);
    return response.json();
}

function statusBadge(status) {
    const badgeClasses = STATUS_BADGE_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200';
    return `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClasses}">${status ?? 'Unknown'}</span>`;
}

function groupByStatus(items) {
    const counts = {};
    (items || []).forEach(item => {
        const status = (item.status ?? 'UNKNOWN').toString().toUpperCase();
        counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
}

function colorsForStatuses(statuses) {
    return statuses.map(s => STATUS_COLOR_MAP[s] || CHART_COLORS.slate);
}

function titleCase(status) {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Chart builders — each creates the chart once, then just updates data on
// subsequent refreshes so the canvas doesn't flicker/rebuild every 5s.
// ---------------------------------------------------------------------------
function renderDoughnutChart(existingChart, canvasId, statusCounts) {
    const statuses = Object.keys(statusCounts);
    const labels = statuses.map(titleCase);
    const data = statuses.map(s => statusCounts[s]);
    const colors = colorsForStatuses(statuses);

    if (existingChart) {
        existingChart.data.labels = labels;
        existingChart.data.datasets[0].data = data;
        existingChart.data.datasets[0].backgroundColor = colors;
        existingChart.update();
        return existingChart;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#64748b', font: { size: 11 }, padding: 14, usePointStyle: true }
                }
            }
        }
    });
}

function renderInventoryChart(warehouses) {
    const labels = (warehouses || []).map(w => w.name ?? w.warehouseName ?? 'Unknown');
    const data = (warehouses || []).map(w => w.capacity ?? 0);

    if (inventoryChart) {
        inventoryChart.data.labels = labels;
        inventoryChart.data.datasets[0].data = data;
        inventoryChart.update();
        return;
    }

    const ctx = document.getElementById('inventoryChart').getContext('2d');
    inventoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Capacity (units)',
                data: data,
                backgroundColor: CHART_COLORS.indigo,
                borderRadius: 6,
                maxBarThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------
function updateStatCards({ users, rfqs, purchaseOrders, shipments }) {
    const totalUsersEl = document.getElementById('statTotalUsers');
    const activeRFQsEl = document.getElementById('statActiveRFQs');
    const pendingOrdersEl = document.getElementById('statPendingOrders');
    const inTransitEl = document.getElementById('statInTransit');

    if (totalUsersEl) totalUsersEl.textContent = users ? users.length : '-';

    if (activeRFQsEl) {
        const activeCount = (rfqs || []).filter(r =>
            !RFQ_TERMINAL_STATUSES.includes((r.status ?? '').toString().toUpperCase())
        ).length;
        activeRFQsEl.textContent = rfqs ? activeCount : '-';
    }

    if (pendingOrdersEl) {
        const pendingCount = (purchaseOrders || []).filter(po =>
            PO_PENDING_STATUSES.includes((po.status ?? '').toString().toUpperCase())
        ).length;
        pendingOrdersEl.textContent = purchaseOrders ? pendingCount : '-';
    }

    if (inTransitEl) {
        const inTransitCount = (shipments || []).filter(s =>
            SHIPMENT_IN_TRANSIT_STATUSES.includes((s.status ?? '').toString().toUpperCase())
        ).length;
        inTransitEl.textContent = shipments ? inTransitCount : '-';
    }
}

// ---------------------------------------------------------------------------
// Recent activity table
// ---------------------------------------------------------------------------
function renderActivityRow(log) {
    const timestamp = log.timestamp ?? log.createdAt ?? log.eventTime;
    const timeStr = timestamp ? new Date(timestamp).toLocaleString() : '—';

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4 text-sm font-semibold text-slate-800">${log.activity ?? log.action ?? log.description ?? '—'}</td>
            <td class="px-6 py-4 text-sm text-slate-500">${log.user ?? log.username ?? log.performedBy ?? '—'}</td>
            <td class="px-6 py-4 text-sm text-slate-500">${timeStr}</td>
            <td class="px-6 py-4">${statusBadge((log.status ?? 'INFO').toString().toUpperCase())}</td>
        </tr>
    `;
}

function renderEmptyActivity() {
    return `<tr><td colspan="4" class="px-6 py-10 text-center text-slate-500 font-medium">No recent activity.</td></tr>`;
}

function renderErrorActivity() {
    return `<tr><td colspan="4" class="px-6 py-10 text-center text-sm text-red-500 font-medium">Couldn't load recent activity.</td></tr>`;
}

function updateActivityTable(logs) {
    const tableBody = document.getElementById('recentActivityTableBody');
    if (!tableBody) return;

    if (!logs) {
        tableBody.innerHTML = renderErrorActivity();
        return;
    }

    const recent = [...logs]
        .sort((a, b) => new Date(b.timestamp ?? b.createdAt ?? 0) - new Date(a.timestamp ?? a.createdAt ?? 0))
        .slice(0, 8);

    tableBody.innerHTML = recent.length ? recent.map(renderActivityRow).join('') : renderEmptyActivity();
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------
async function loadAdminOverview() {
    const results = await Promise.allSettled([
        fetchJSON(ENDPOINTS.users),
        fetchJSON(ENDPOINTS.rfqs),
        fetchJSON(ENDPOINTS.purchaseOrders),
        fetchJSON(ENDPOINTS.shipments),
        fetchJSON(ENDPOINTS.warehouses),
        fetchJSON(ENDPOINTS.auditLogs)
    ]);

    const [usersRes, rfqsRes, poRes, shipmentsRes, warehousesRes, logsRes] = results;

    const users = usersRes.status === 'fulfilled' ? usersRes.value : null;
    const rfqs = rfqsRes.status === 'fulfilled' ? rfqsRes.value : null;
    const purchaseOrders = poRes.status === 'fulfilled' ? poRes.value : null;
    const shipments = shipmentsRes.status === 'fulfilled' ? shipmentsRes.value : null;
    const warehouses = warehousesRes.status === 'fulfilled' ? warehousesRes.value : null;
    const logs = logsRes.status === 'fulfilled' ? logsRes.value : null;

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error('Admin overview fetch failed:', Object.values(ENDPOINTS)[i], r.reason);
        }
    });

    updateStatCards({ users, rfqs, purchaseOrders, shipments });

    if (rfqs) rfqStatusChart = renderDoughnutChart(rfqStatusChart, 'rfqStatusChart', groupByStatus(rfqs));
    if (purchaseOrders) poStatusChart = renderDoughnutChart(poStatusChart, 'poStatusChart', groupByStatus(purchaseOrders));
    if (shipments) shipmentStatusChart = renderDoughnutChart(shipmentStatusChart, 'shipmentStatusChart', groupByStatus(shipments));
    if (warehouses) renderInventoryChart(warehouses);

    updateActivityTable(logs);
}

window.loadAdminOverview = loadAdminOverview;

document.addEventListener('DOMContentLoaded', loadAdminOverview);