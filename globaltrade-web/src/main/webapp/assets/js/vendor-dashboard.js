let currentVendor = null;
let allReplenishmentRequests = [];
let allEvaluations = [];

const RECENT_REQUESTS_LIMIT = 3;

const REQUEST_STATUS_STYLES = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    FULFILLED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200'
};

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardOverview();
});

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
}

async function loadDashboardOverview() {
    await fetchVendorProfile();
    await fetchReplenishmentRequests();
    await fetchEvaluations();
    renderQuickActions();
}

async function fetchVendorProfile() {
    try {
        const url = window.location.origin + "/globaltrade/api/vendors/profile";
        const response = await fetchWithAuth(url, { method: 'GET', headers: authHeaders() });

        if (!response.ok) throw new Error('Failed to load vendor profile (status ' + response.status + ')');

        currentVendor = await response.json();

        const nameEl = document.getElementById('vendorCompanyName');
        if (nameEl) nameEl.textContent = currentVendor.vendorName ?? currentVendor.name ?? 'Vendor Portal';

        const statusEl = document.getElementById('summaryVendorStatus');
        const metaEl = document.getElementById('summaryVendorMeta');

        const vendorStatus = currentVendor.status || currentVendor.companyStatus || currentVendor.accountStatus || 'ACTIVE';
        if (statusEl) statusEl.textContent = vendorStatus;

        if (metaEl) {
            metaEl.textContent = currentVendor.countryCode ? `Registered in ${currentVendor.countryCode}` : (currentVendor.email || 'Verified Vendor');
        }

    } catch (error) {
        console.error('Error loading vendor profile:', error);
        const nameEl = document.getElementById('vendorCompanyName');
        if (nameEl) nameEl.textContent = 'Vendor Portal';
    }
}
async function fetchReplenishmentRequests() {
    const listEl = document.getElementById('recentRequestsList');
    if (listEl) listEl.innerHTML = renderRequestsLoadingState();

    try {
        const url = window.location.origin + "/globaltrade/api/vendors/replenishment-requests";
        const response = await fetchWithAuth(url, { method: 'GET', headers: authHeaders() });

        if (!response.ok) throw new Error('Failed to fetch requests (status ' + response.status + ')');

        const data = await response.json();
        allReplenishmentRequests = Array.isArray(data) ? data : [];

        updatePendingSummary(allReplenishmentRequests);
        renderRecentRequestsPreview(allReplenishmentRequests);

    } catch (error) {
        console.error('Error:', error);
        if (listEl) listEl.innerHTML = renderRequestsErrorState();
    }
}

function updatePendingSummary(requests) {
    const countEl = document.getElementById('summaryPendingCount');
    if (countEl) {
        const pending = requests.filter(r => r.status === 'PENDING').length;
        countEl.textContent = pending;
    }
}

function renderRecentRequestsPreview(requests) {
    const listEl = document.getElementById('recentRequestsList');
    if (!listEl) return;

    if (!requests.length) {
        listEl.innerHTML = renderRequestsEmptyState();
        return;
    }

    const recent = [...requests]
        .sort((a, b) => new Date(toComparableDate(b.createdAt)) - new Date(toComparableDate(a.createdAt)))
        .slice(0, RECENT_REQUESTS_LIMIT);

    listEl.innerHTML = recent.map(request => {
        const statusClasses = REQUEST_STATUS_STYLES[request.status] || 'bg-slate-50 text-slate-600 border-slate-200';
        const warehouseName = request.warehouse ? request.warehouse.name : '—';
        const createdAt = request.createdAt ? formatTimestamp(request.createdAt) : '—';

        const actionHtml = request.status === 'PENDING'
            ? `
            <button onclick="fulfillRequest(${request.requestId})"
                    class="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Fulfill
            </button>
        `
            : '';

        return `
        <div class="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors duration-150">
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-slate-800">#${request.requestId}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusClasses}">${request.status ?? '—'}</span>
                </div>
                <p class="text-sm text-slate-500 mt-0.5 truncate">${warehouseName} · Product <span class="font-mono">${request.productId ?? '—'}</span> · Qty <span class="font-mono">${request.quantity ?? '—'}</span></p>
                <p class="text-xs text-slate-400 mt-0.5">${createdAt}</p>
            </div>
            ${actionHtml}
        </div>
    `;
    }).join('');
}

async function fulfillRequest(requestId) {
    try {
        const url = window.location.origin + `/globaltrade/api/vendors/replenishment-requests/${requestId}/fulfill`;
        const response = await fetchWithAuth(url, { method: 'PUT', headers: authHeaders() });

        if (!response.ok) throw new Error('Failed to update request (status ' + response.status + ')');

        showToast('Success', 'Replenishment request marked as shipped/fulfilled.', 'success');

        await fetchReplenishmentRequests();
        renderQuickActions();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

function scoreBar(label, value) {
    const pct = Math.max(0, Math.min(100, Math.round((value ?? 0) * (value <= 1 ? 100 : 1))));
    return `
    <div>
        <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>${label}</span>
            <span class="font-mono font-medium text-slate-700">${pct}%</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-1.5 rounded-full bg-indigo-500" style="width:${pct}%"></div>
        </div>
    </div>
`;
}

function compositeScore(evaluation) {
    const raw = (
        (evaluation.onTimeDeliveryRate ?? 0) +
        (evaluation.qualityScore ?? 0) +
        (evaluation.fulfillmentAccuracy ?? 0)
    ) / 3;
    return Math.round(raw <= 1 ? raw * 100 : raw);
}

async function fetchEvaluations() {
    const cardEl = document.getElementById('latestEvaluationCard');
    if (cardEl) {
        cardEl.innerHTML = `
        <div class="flex items-center justify-center gap-2 py-10 text-slate-500 bg-white rounded-2xl border border-slate-200 h-full">
            <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span class="text-sm font-medium">Loading...</span>
        </div>
    `;
    }

    try {
        const url = window.location.origin + "/globaltrade/api/vendors/evaluations";
        const response = await fetchWithAuth(url, { method: 'GET', headers: authHeaders() });

        if (!response.ok) throw new Error('Failed to fetch evaluations (status ' + response.status + ')');

        allEvaluations = await response.json();
        updateLatestScoreSummary(allEvaluations);
        renderLatestEvaluationCard(allEvaluations);

    } catch (error) {
        console.error('Error:', error);
        if (cardEl) {
            cardEl.innerHTML = `
            <div class="flex flex-col items-center justify-center gap-1 py-10 bg-white rounded-2xl border border-slate-200 h-full">
                <span class="text-sm font-medium text-red-500">Error loading evaluation.</span>
                <button onclick="loadDashboardOverview()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1">Try again</button>
            </div>
        `;
        }
    }
}

function updateLatestScoreSummary(evaluations) {
    const scoreEl = document.getElementById('summaryLatestScore');
    const metaEl = document.getElementById('summaryLatestScoreMeta');
    if (!scoreEl) return;

    if (!evaluations.length) {
        scoreEl.textContent = '—';
        if (metaEl) metaEl.textContent = 'No evaluations yet';
        return;
    }

    scoreEl.textContent = compositeScore(evaluations[0]) + '%';
    if (metaEl) metaEl.textContent = evaluations[0].evaluationDate ? `As of ${evaluations[0].evaluationDate}` : 'Composite performance average';
}

function renderLatestEvaluationCard(evaluations) {
    const cardEl = document.getElementById('latestEvaluationCard');
    if (!cardEl) return;

    if (!evaluations.length) {
        cardEl.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-slate-200 text-center px-6 h-full">
            <div class="p-3 rounded-full bg-slate-100 mb-3">
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
                </svg>
            </div>
            <p class="text-slate-500 font-medium">No evaluations yet</p>
            <p class="text-sm text-slate-400 mt-1">Your performance history will appear here once evaluated.</p>
        </div>
    `;
        return;
    }

    const latest = evaluations[0];
    const composite = compositeScore(latest);

    cardEl.innerHTML = `
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
        <div>
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-semibold text-slate-800">${latest.evaluationDate ?? '—'}</span>
                <span class="text-sm font-mono font-bold text-indigo-600">${composite}%</span>
            </div>
            <div class="space-y-4">
                ${scoreBar('On-Time Delivery', latest.onTimeDeliveryRate)}
                ${scoreBar('Quality', latest.qualityScore)}
                ${scoreBar('Fulfillment Accuracy', latest.fulfillmentAccuracy)}
            </div>
        </div>
    </div>
`;
}

function renderQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    if (!container) return;

    const items = [];
    const pendingCount = allReplenishmentRequests.filter(r => r.status === 'PENDING').length;

    if (pendingCount > 0) {
        items.push(quickActionItem({
            title: `${pendingCount} replenishment request${pendingCount === 1 ? '' : 's'} awaiting fulfillment`,
            description: 'Warehouses are waiting on stock. Review and mark them fulfilled.',
            ctaText: 'Review requests',
            ctaHref: `${window.CONTEXT_PATH || ''}/vendor/replenishment-requests.jsp`
        }));
    }

    if (allEvaluations.length && compositeScore(allEvaluations[0]) < 80) {
        items.push(quickActionItem({
            title: `Latest performance score is ${compositeScore(allEvaluations[0])}%`,
            description: 'Your most recent evaluation is below target. Check what’s driving it down.',
            ctaText: 'View evaluation',
            ctaHref: `${window.CONTEXT_PATH || ''}/vendor/performance-history.jsp`
        }));
    }

    if (currentVendor && currentVendor.status && currentVendor.status !== 'ACTIVE') {
        items.push(quickActionItem({
            title: `Company status: ${currentVendor.status}`,
            description: 'Your vendor account needs attention before requests can be processed normally.',
            ctaText: null,
            ctaHref: null
        }));
    }

    if (!items.length) {
        container.innerHTML = quickActionItem({
            title: 'You’re all caught up',
            description: 'No pending requests or performance alerts right now.',
            ctaText: null,
            ctaHref: null
        });
        return;
    }

    container.innerHTML = items.join('');
}

function quickActionItem({title, description, ctaText, ctaHref}) {
    const cta = ctaText
        ? `<a href="${ctaHref}" class="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">${ctaText}</a>`
        : '';

    return `
    <div class="flex items-center justify-between gap-4 px-5 py-4">
        <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">${title}</p>
            <p class="text-xs text-slate-500 mt-0.5">${description}</p>
        </div>
        ${cta}
    </div>
`;
}

function renderRequestsLoadingState() {
    return `
    <div class="flex items-center justify-center gap-2 py-10 text-slate-500 h-full bg-white rounded-2xl border border-slate-200">
        <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span class="text-sm font-medium">Loading requests...</span>
    </div>
`;
}

function renderRequestsEmptyState() {
    return `
    <div class="flex flex-col items-center justify-center py-14 text-center px-6 h-full bg-white rounded-2xl border border-slate-200">
        <div class="p-3 rounded-full bg-slate-100 mb-3">
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
        </div>
        <p class="text-slate-500 font-medium">No replenishment requests</p>
        <p class="text-sm text-slate-400 mt-1">Requests from warehouses will show up here automatically.</p>
    </div>
`;
}

function renderRequestsErrorState() {
    return `
    <div class="flex flex-col items-center justify-center gap-1 py-10 h-full bg-white rounded-2xl border border-slate-200">
        <span class="text-sm font-medium text-red-500">Error loading requests.</span>
        <button onclick="loadDashboardOverview()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1">Try again</button>
    </div>
`;
}

function toComparableDate(timestamp) {
    if (Array.isArray(timestamp)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = timestamp;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
    }
    return timestamp || 0;
}

function formatTimestamp(timestamp) {
    if (Array.isArray(timestamp)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = timestamp;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
    }

    if (typeof timestamp === "string") {
        return timestamp.replace("T", " ").substring(0, 19);
    }

    return timestamp || "N/A";
}

window.CONTEXT_PATH = typeof CONTEXT_PATH !== 'undefined' ? CONTEXT_PATH : '';
window.loadDashboardOverview = loadDashboardOverview;
window.fulfillRequest = fulfillRequest;