let allStaff = [];
let filteredStaff = [];
let allWarehousesCache = [];
let assignTargetUserId = null;
let currentPage = 1;
const pageSize = 10;

document.addEventListener('DOMContentLoaded', function () {
    requireRole(['Admin']);
    fetchStaff();
});

function renderStaffRow(user) {
    const roleName = user.roles && user.roles.length ? user.roles[0].roleName : '—';
    const isManager = roleName === 'Warehouse Manager';

    let actionButtons = `
        <button onclick="openEditStaff(${user.userId})" class="text-slate-600 hover:text-indigo-600 text-sm font-medium mr-3">
            <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
        </button>
    `;

    if (isManager) {
        actionButtons += `
            <button onclick="openViewWarehousesModal(${user.userId}, '${user.username}')" class="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-3">
                <i class="fa-solid fa-eye mr-1"></i>View
            </button>
            <button onclick="openAssignWarehousesModal(${user.userId}, '${user.username}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                <i class="fa-solid fa-warehouse mr-1"></i>Assign/Edit
            </button>
        `;
    }

    return `
        <tr class="hover:bg-slate-50">
            <td class="px-6 py-4 text-sm font-semibold text-slate-800">${user.username}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${user.email}</td>
            <td class="px-6 py-4 text-sm text-slate-600">${roleName}</td>
            <td class="px-6 py-4">${actionButtons}</td>
        </tr>
    `;
}

async function fetchStaff() {
    const tableBody = document.getElementById('staffTableBody');
    try {
        const response = await fetchWithAuth('/globaltrade/api/admin/staff', { method: 'GET' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch staff');
        }
        allStaff = await response.json();
        filteredStaff = [...allStaff];
        currentPage = 1;
        renderTableWithPagination();
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-10 text-center text-red-500">Error loading staff: ${error.message}</td></tr>`;
    }
}

function filterStaff() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedRole = document.getElementById('roleFilter').value;

    filteredStaff = allStaff.filter(user => {
        const usernameMatch = user.username && user.username.toLowerCase().includes(searchQuery);
        const emailMatch = user.email && user.email.toLowerCase().includes(searchQuery);
        const matchesSearch = usernameMatch || emailMatch;

        const roleName = user.roles && user.roles.length ? user.roles[0].roleName : '';
        const matchesRole = !selectedRole || roleName === selectedRole;

        return matchesSearch && matchesRole;
    });

    currentPage = 1;
    renderTableWithPagination();
}

function renderTableWithPagination() {
    const tableBody = document.getElementById('staffTableBody');
    const paginationContainer = document.getElementById('paginationContainer');

    if (filteredStaff.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">No staff accounts found.</td></tr>`;
        paginationContainer.classList.add('hidden');
        return;
    }

    const totalPages = Math.ceil(filteredStaff.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedItems = filteredStaff.slice(start, end);

    tableBody.innerHTML = paginatedItems.map(renderStaffRow).join('');

    if (filteredStaff.length > pageSize) {
        paginationContainer.classList.remove('hidden');
        document.getElementById('pageInfo').textContent = `${start + 1}-${Math.min(end, filteredStaff.length)} of ${filteredStaff.length}`;
        document.getElementById('prevBtn').disabled = currentPage === 1;
        document.getElementById('nextBtn').disabled = currentPage === totalPages;
    } else {
        paginationContainer.classList.add('hidden');
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTableWithPagination();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredStaff.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderTableWithPagination();
    }
}

function openCreateStaffModal() {
    document.getElementById('createStaffModal').classList.remove('hidden');
}

function closeCreateStaffModal() {
    document.getElementById('createStaffModal').classList.add('hidden');
    document.getElementById('createStaffForm').reset();
}

async function submitCreateStaff(event) {
    event.preventDefault();

    const body = {
        username: document.getElementById('staffUsername').value.trim(),
        email: document.getElementById('staffEmail').value.trim(),
        password: document.getElementById('staffPassword').value,
        role: document.getElementById('staffRole').value
    };

    try {
        const response = await fetchWithAuth('/globaltrade/api/admin/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(await response.text() || 'Failed to create staff account');

        closeCreateStaffModal();
        fetchStaff();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function openEditStaff(userId) {
    const user = allStaff.find(u => u.userId === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.userId;
    document.getElementById('editStaffUsername').value = user.username || '';
    document.getElementById('editStaffEmail').value = user.email || '';

    const roleName = user.roles && user.roles.length ? user.roles[0].roleName : '';
    const roleSelect = document.getElementById('editStaffRole');
    if (roleSelect) roleSelect.value = roleName;

    document.getElementById('editStaffModal').classList.remove('hidden');
}

function closeEditStaffModal() {
    document.getElementById('editStaffModal').classList.add('hidden');
    document.getElementById('editStaffForm').reset();
}

async function submitEditStaff(event) {
    event.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editStaffUsername').value.trim();
    const role = document.getElementById('editStaffRole').value;

    try {
        const response = await fetchWithAuth(`/globaltrade/api/admin/staff/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, role })
        });
        if (!response.ok) throw new Error('Failed to update staff account');

        closeEditStaffModal();
        fetchStaff();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function openViewWarehousesModal(userId, username) {
    document.getElementById('viewTargetName').textContent = username;

    let warehouses = [];
    try {
        const res = await fetchWithAuth(`/globaltrade/api/admin/staff/${userId}/warehouses`, { method: 'GET' });
        if (res.ok) {
            warehouses = await res.json();
        }
    } catch (e) {
        console.error(e);
    }

    const container = document.getElementById('viewWarehouseList');
    if (warehouses.length > 0) {
        container.innerHTML = warehouses.map(w => `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span class="font-medium text-slate-800 text-sm">${w.name}</span>
                <span class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">${w.countryCode || ''}</span>
            </div>
        `).join('');
    } else {
        container.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No warehouses assigned to this manager.</p>`;
    }

    document.getElementById('viewWarehousesModal').classList.remove('hidden');
}

function closeViewWarehousesModal() {
    document.getElementById('viewWarehousesModal').classList.add('hidden');
}

async function openAssignWarehousesModal(userId, username) {
    assignTargetUserId = userId;
    document.getElementById('assignTargetName').textContent = username;

    if (allWarehousesCache.length === 0) {
        const response = await fetchWithAuth('/globaltrade/api/warehouses', { method: 'GET' });
        allWarehousesCache = response.ok ? await response.json() : [];
    }

    let assignedIds = new Set();
    try {
        const res = await fetchWithAuth(`/globaltrade/api/admin/staff/${userId}/warehouses`, { method: 'GET' });
        if (res.ok) {
            const userWarehouses = await res.json();
            assignedIds = new Set(userWarehouses.map(w => w.warehouseId));
        }
    } catch (e) {
        console.error(e);
    }

    const list = document.getElementById('warehouseCheckboxList');
    list.innerHTML = allWarehousesCache.map(w => `
        <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" value="${w.warehouseId}" ${assignedIds.has(w.warehouseId) ? 'checked' : ''} class="warehouse-checkbox rounded border-slate-300">
            ${w.name} (${w.countryCode})
        </label>
    `).join('');

    document.getElementById('assignWarehousesModal').classList.remove('hidden');
}

function closeAssignWarehousesModal() {
    document.getElementById('assignWarehousesModal').classList.add('hidden');
    assignTargetUserId = null;
}

async function submitAssignWarehouses() {
    const checked = Array.from(document.querySelectorAll('.warehouse-checkbox:checked')).map(cb => parseInt(cb.value));

    try {
        const response = await fetchWithAuth(`/globaltrade/api/admin/staff/${assignTargetUserId}/warehouses`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ warehouseIds: checked })
        });
        if (!response.ok) throw new Error('Failed to assign warehouses');

        closeAssignWarehousesModal();
        fetchStaff();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

window.openCreateStaffModal = openCreateStaffModal;
window.closeCreateStaffModal = closeCreateStaffModal;
window.submitCreateStaff = submitCreateStaff;
window.openEditStaff = openEditStaff;
window.closeEditStaffModal = closeEditStaffModal;
window.submitEditStaff = submitEditStaff;
window.openViewWarehousesModal = openViewWarehousesModal;
window.closeViewWarehousesModal = closeViewWarehousesModal;
window.openAssignWarehousesModal = openAssignWarehousesModal;
window.closeAssignWarehousesModal = closeAssignWarehousesModal;
window.submitAssignWarehouses = submitAssignWarehouses;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.filterStaff = filterStaff;