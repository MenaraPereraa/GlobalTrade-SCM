const API_VENDORS_PATH = '/globaltrade/api/vendors';

const STATUS_DOT_STYLES = {
    PENDING: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    ACTIVE: 'bg-emerald-500',
    REJECTED: 'bg-red-500'
};

const STATUS_BADGE_STYLES = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-600 border-red-200'
};

function authHeaders() {
    return {
        'Authorization': 'Bearer ' + getCookie('accessToken'),
        'Content-Type': 'application/json'
    };
}

function statusBadge(status) {
    const badgeClasses = STATUS_BADGE_STYLES[status] || 'bg-slate-50 text-slate-600 border-slate-200';
    const dotClasses = STATUS_DOT_STYLES[status] || 'bg-slate-400';
    return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClasses}">
            <span class="w-1.5 h-1.5 rounded-full ${dotClasses}"></span>
            ${status ?? 'Unknown'}
        </span>
    `;
}

function renderRecentVendorRow(vendor) {
    const isPending = vendor.status === 'PENDING';
    const actionHtml = isPending
        ? `<a href="/coordinator/vendor-approvals.jsp" class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">Review</a>`
        : `<a href="/coordinator/vendor-approvals.jsp" class="text-slate-500 hover:text-slate-700 font-semibold text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">Details</a>`;

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4 text-sm font-semibold text-slate-800">${vendor.vendorName ?? '—'}</td>
            <td class="px-6 py-4 text-sm text-slate-500">${vendor.contactEmail ?? '—'}</td>
            <td class="px-6 py-4 text-sm text-slate-600 font-mono uppercase">${vendor.countryCode ?? '—'}</td>
            <td class="px-6 py-4">${statusBadge(vendor.status)}</td>
            <td class="px-6 py-4 text-right">${actionHtml}</td>
        </tr>
    `;
}

function renderEmptyRecentVendors() {
    return `<tr><td colspan="5" class="px-6 py-14 text-center"><p class="text-slate-500 font-medium">No vendor registrations yet</p></td></tr>`;
}

function renderErrorRecentVendors() {
    return `<tr><td colspan="5" class="px-6 py-10 text-center"><p class="text-sm text-red-500 font-medium">Couldn't load vendor registrations.</p></td></tr>`;
}

function updateStatCards(vendors) {
    const activeEl = document.getElementById('statActiveVendors');
    const pendingEl = document.getElementById('statPendingVendors');
    const totalUsersEl = document.getElementById('statTotalUsers');
    const systemErrorsEl = document.getElementById('statSystemErrors');

    const activeCount = vendors.filter(v => v.status === 'ACTIVE' || v.status === 'APPROVED').length;
    const pendingCount = vendors.filter(v => v.status === 'PENDING').length;

    if (activeEl) activeEl.textContent = activeCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (totalUsersEl) totalUsersEl.textContent = vendors.length;
    if (systemErrorsEl) systemErrorsEl.textContent = '0';
}

async function loadAdminOverview() {
    const tableBody = document.getElementById('recentVendorsTableBody');
    if (!tableBody) return;

    try {
        const url = (typeof CONTEXT_PATH !== 'undefined' ? CONTEXT_PATH : '') + API_VENDORS_PATH;
        const response = await fetch(url, { method: 'GET', headers: authHeaders() });

        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const vendors = await response.json();
        updateStatCards(vendors);
        const recent = [...vendors].sort((a, b) => (b.vendorId ?? 0) - (a.vendorId ?? 0)).slice(0, 5);

        tableBody.innerHTML = recent.length ? recent.map(renderRecentVendorRow).join('') : renderEmptyRecentVendors();
    } catch (error) {
        console.error('Error loading admin overview:', error);
        tableBody.innerHTML = renderErrorRecentVendors();
    }
}

window.loadAdminOverview = loadAdminOverview;