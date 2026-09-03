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
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

async function fetchWithAuth(url, options = {}) {
    let response = await fetch(url, options);

    if (response.status === 401) {
        console.warn('Access token expired. Attempting to refresh token...');

        const refreshResponse = await fetch('/globaltrade/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (refreshResponse.ok) {
            console.log('Token refreshed successfully. Retrying original request...');

            const newAccessToken = getCookie('accessToken');
            options.headers = {
                ...options.headers,
                'Authorization': 'Bearer ' + newAccessToken
            };

            response = await fetch(url, options);
        } else {
            console.error('Refresh token also expired. Redirecting to login...');
            window.location.href = '/globaltrade/app/login.jsp';
            return response;
        }
    }

    return response;
}


let allWarehouses = [];
let filteredWarehouses = [];
let countryOptions = [];
let selectedCountryCode = '';
let currentPage = 1;
const PAGE_SIZE = 10;

function setEmptyState(visible, title, subtitle) {
    const emptyState = document.getElementById('warehouseEmptyState');
    if (emptyState) {
        emptyState.classList.toggle('hidden', !visible);
        emptyState.classList.toggle('flex', visible);
    }

    const titleEl = document.getElementById('warehouseEmptyTitle');
    const subtitleEl = document.getElementById('warehouseEmptySubtitle');
    if (titleEl && title) titleEl.textContent = title;
    if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;

    const pagination = document.getElementById('warehousePagination');
    if (pagination && visible) {
        pagination.classList.add('hidden');
        pagination.classList.remove('flex');
    }
}

function capacityBadgeClasses(capacity) {
    const value = Number(capacity) || 0;
    if (value >= 5000) {
        return 'bg-indigo-50 text-indigo-600';
    } else if (value >= 1000) {
        return 'bg-emerald-50 text-emerald-600';
    }
    return 'bg-amber-50 text-amber-600';
}

function renderLoadingRow() {
    return `
        <tr>
            <td colspan="4" class="px-6 py-10 text-center text-slate-500">
                <div class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span class="text-sm font-medium">Loading warehouses...</span>
                </div>
            </td>
        </tr>
    `;
}

function renderErrorRow() {
    return `
        <tr>
            <td colspan="4" class="px-6 py-10 text-center">
                <div class="flex flex-col items-center justify-center gap-1">
                    <span class="text-sm font-medium text-red-500">Error loading warehouse data.</span>
                    <button onclick="fetchWarehouses()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1">Try again</button>
                </div>
            </td>
        </tr>
    `;
}

function renderWarehouseRow(warehouse, displayIndex) {
    const name = warehouse.name ?? '';
    const countryCode = warehouse.countryCode ?? '';
    const capacity = warehouse.capacity ?? '';
    const badgeClasses = capacityBadgeClasses(capacity);

    return `
        <tr class="hover:bg-slate-50 transition-colors duration-150">
            <td class="px-6 py-4 text-sm text-slate-500 font-medium">${displayIndex}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="p-1.5 rounded-lg bg-indigo-50 shrink-0">
                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 21V8l9-5 9 5v13M9 21v-6h6v6"/>
                        </svg>
                    </div>
                    <span class="text-sm font-semibold text-slate-800">${name}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 font-mono uppercase">${countryCode}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses}">${capacity} units</span>
            </td>
        </tr>
    `;
}

async function fetchWarehouses() {
    const tableBody = document.getElementById('warehouseTableBody');
    if (!tableBody) return;

    setEmptyState(false);
    closeCountryDropdown();
    tableBody.innerHTML = renderLoadingRow();

    try {
        const response = await fetchWithAuth('/globaltrade/api/warehouses', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getCookie('accessToken'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch warehouse data. Status: ' + response.status);
        }

        const data = await response.json();
        allWarehouses = Array.isArray(data) ? data.slice().reverse() : [];

        populateCountryOptions(allWarehouses);
        applyWarehouseFilters();

    } catch (error) {
        console.error('Error:', error);
        setEmptyState(false);
        tableBody.innerHTML = renderErrorRow();
    }
}

function populateCountryOptions(warehouses) {
    countryOptions = Array.from(
        new Set(
            warehouses
                .map(w => (w.countryCode ?? '').trim().toUpperCase())
                .filter(code => code.length > 0)
        )
    ).sort();

    if (selectedCountryCode && !countryOptions.includes(selectedCountryCode)) {
        selectedCountryCode = '';
    }

    updateCountryFilterLabel();
    renderCountryDropdownList();
}

function updateCountryFilterLabel() {
    const label = document.getElementById('countryFilterLabel');
    if (label) label.textContent = selectedCountryCode || 'All Countries';
}

function toggleCountryDropdown() {
    const panel = document.getElementById('countryDropdownPanel');
    if (!panel) return;

    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        renderCountryDropdownList();
        const searchInput = document.getElementById('countryDropdownSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    } else {
        closeCountryDropdown();
    }
}

function closeCountryDropdown() {
    const panel = document.getElementById('countryDropdownPanel');
    if (panel) panel.classList.add('hidden');
}

function renderCountryDropdownList() {
    const list = document.getElementById('countryDropdownList');
    if (!list) return;

    const searchInput = document.getElementById('countryDropdownSearch');
    const term = (searchInput?.value ?? '').trim().toUpperCase();

    const matchingCodes = term
        ? countryOptions.filter(code => code.includes(term))
        : countryOptions;

    const allCountriesRow = `
        <li>
            <button type="button" onclick="selectCountryCode('')"
                    class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between ${!selectedCountryCode ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}">
                <span>All Countries</span>
                ${!selectedCountryCode ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
        </li>
    `;

    const codeRows = matchingCodes.map(code => `
        <li>
            <button type="button" onclick="selectCountryCode('${code}')"
                    class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between font-mono ${selectedCountryCode === code ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}">
                <span>${code}</span>
                ${selectedCountryCode === code ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
            </button>
        </li>
    `).join('');

    const noMatches = matchingCodes.length === 0
        ? '<li class="px-3.5 py-3 text-sm text-slate-400 text-center">No matching country codes</li>'
        : '';

    list.innerHTML = (term ? '' : allCountriesRow) + codeRows + noMatches;
}

function selectCountryCode(code) {
    selectedCountryCode = code;
    updateCountryFilterLabel();
    closeCountryDropdown();
    applyWarehouseFilters();
}

document.addEventListener('click', function (event) {
    const wrapper = document.getElementById('countryFilterWrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        closeCountryDropdown();
    }
});

function applyWarehouseFilters() {
    const searchInput = document.getElementById('warehouseSearchInput');
    const searchTerm = (searchInput?.value ?? '').trim().toLowerCase();

    filteredWarehouses = allWarehouses.filter(warehouse => {
        const name = (warehouse.name ?? '').toLowerCase();
        const code = (warehouse.countryCode ?? '').trim().toUpperCase();

        const matchesSearch = !searchTerm || name.includes(searchTerm);
        const matchesCountry = !selectedCountryCode || code === selectedCountryCode;

        return matchesSearch && matchesCountry;
    });

    currentPage = 1;
    renderPage();
}

function renderPage() {
    const tableBody = document.getElementById('warehouseTableBody');
    const pagination = document.getElementById('warehousePagination');
    if (!tableBody) return;

    if (filteredWarehouses.length === 0) {
        tableBody.innerHTML = '';
        if (allWarehouses.length === 0) {
            setEmptyState(true, 'No warehouses yet', 'Add your first warehouse to get started.');
        } else {
            setEmptyState(true, 'No matching warehouses', 'Try a different search term or country filter.');
        }
        return;
    }

    setEmptyState(false);

    const totalPages = Math.max(1, Math.ceil(filteredWarehouses.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredWarehouses.slice(startIndex, startIndex + PAGE_SIZE);

    tableBody.innerHTML = pageItems
        .map((warehouse, i) => renderWarehouseRow(warehouse, startIndex + i + 1))
        .join('');

    if (pagination) {
        pagination.classList.remove('hidden');
        pagination.classList.add('flex');

        const infoEl = document.getElementById('paginationInfo');
        if (infoEl) {
            const rangeStart = startIndex + 1;
            const rangeEnd = Math.min(startIndex + PAGE_SIZE, filteredWarehouses.length);
            infoEl.textContent = `Showing ${rangeStart}-${rangeEnd} of ${filteredWarehouses.length}`;
        }

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }
}

function goToPage(page) {
    currentPage = page;
    renderPage();
}

async function saveWarehouse(event) {
    event.preventDefault();

    const newWarehouse = {
        name: document.getElementById('warehouseName').value,
        countryCode: document.getElementById('warehouseCountryCode').value,
        capacity: parseInt(document.getElementById('warehouseCapacity').value)
    };

    try {
        const response = await fetchWithAuth('/globaltrade/api/warehouses', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getCookie('accessToken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newWarehouse)
        });

        if (response.ok) {
            closeModal();
            document.getElementById('warehouseForm').reset();
            fetchWarehouses();
            showToast('Success', 'Warehouse added successfully!', 'success');
        } else {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            showToast('Error', 'Failed to add warehouse: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error', 'An error occurred while saving.', 'error');
    }
}

function openModal() {
    const modal = document.getElementById('warehouseModal');
    if (modal) modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('warehouseModal');
    if (modal) modal.classList.add('hidden');
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

function initMovementChart() {
    const canvas = document.getElementById('movementChart');
    if (!canvas || typeof Chart === 'undefined') return;

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Inbound',
                    data: [120, 190, 150, 220, 180, 90, 60],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#6366f1'
                },
                {
                    label: 'Outbound',
                    data: [90, 140, 130, 170, 160, 70, 40],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function initCapacityChart() {
    const canvas = document.getElementById('capacityChart');
    if (!canvas || typeof Chart === 'undefined') return;

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Warehouse A', 'Warehouse B', 'Warehouse C', 'Warehouse D'],
            datasets: [{
                data: [85, 62, 91, 74],
                backgroundColor: ['#6366f1', '#10b981', '#fbbf24', '#cbd5e1'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.saveWarehouse = saveWarehouse;
window.fetchWarehouses = fetchWarehouses;
window.applyWarehouseFilters = applyWarehouseFilters;
window.toggleCountryDropdown = toggleCountryDropdown;
window.selectCountryCode = selectCountryCode;
window.renderCountryDropdownList = renderCountryDropdownList;
window.goToPage = goToPage;

window.onload = function () {
    fetchWarehouses();
    initMovementChart();
    initCapacityChart();
};