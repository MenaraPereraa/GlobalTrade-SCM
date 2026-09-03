// Warehouses Admin Management
const CONTEXT_PATH = '${pageContext.request.contextPath}';
let warehouses = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    requireRole(['ADMIN', 'SUPER_ADMIN']);
    loadWarehouses();
});

// Load warehouses from backend
async function loadWarehouses() {
    try {
        const response = await fetchWithAuth('/globaltrade/api/admin/warehouses');
        
        if (!response.ok) {
            throw new Error('Failed to load warehouses');
        }
        
        warehouses = await response.json();
        renderWarehouses();
        renderWarehousesTable();
    } catch (error) {
        console.error('Error loading warehouses:', error);
        showError('Failed to load warehouses');
    }
}

// Render warehouse cards
function renderWarehouses() {
    const container = document.getElementById('warehousesContainer');
    
    if (warehouses.length === 0) {
        container.innerHTML = '<div class="col-span-full py-10 text-center text-slate-500">No warehouses found</div>';
        return;
    }
    
    container.innerHTML = warehouses.map(wh => `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 hover:shadow-lg transition">
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h3 class="text-lg font-bold text-white">${escapeHtml(wh.name)}</h3>
                    <p class="text-sm text-slate-400">${escapeHtml(wh.location)}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${wh.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300'}">
                    ${wh.status}
                </span>
            </div>
            <div class="space-y-2 text-sm mb-4">
                <div class="flex justify-between text-slate-400">
                    <span>Capacity:</span>
                    <span class="font-semibold text-white">${formatNumber(wh.capacity)} units</span>
                </div>
                <div class="flex justify-between text-slate-400">
                    <span>Current Stock:</span>
                    <span class="font-semibold text-white">${formatNumber(wh.currentStock)} units</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full" style="width: ${(wh.currentStock / wh.capacity) * 100}%"></div>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editWarehouse(${wh.id})" class="flex-1 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition">Edit</button>
                <button onclick="deleteWarehouse(${wh.id})" class="flex-1 text-sm bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 py-2 rounded-lg transition">Delete</button>
            </div>
        </div>
    `).join('');
}

// Render warehouses table
function renderWarehousesTable() {
    const tableBody = document.getElementById('warehousesTableBody');
    
    if (warehouses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="py-10 px-6 text-center text-slate-500">No warehouses found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = warehouses.map(wh => `
        <tr class="hover:bg-slate-800/30 transition">
            <td class="py-4 px-6 font-medium">${escapeHtml(wh.name)}</td>
            <td class="py-4 px-6 text-slate-400">${escapeHtml(wh.location)}</td>
            <td class="py-4 px-6">${formatNumber(wh.capacity)} units</td>
            <td class="py-4 px-6">${formatNumber(wh.currentStock)} units</td>
            <td class="py-4 px-6">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${wh.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300'}">
                    ${wh.status}
                </span>
            </td>
            <td class="py-4 px-6 text-right">
                <button onclick="editWarehouse(${wh.id})" class="text-indigo-400 hover:text-indigo-300 mr-4 transition">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button onclick="deleteWarehouse(${wh.id})" class="text-rose-400 hover:text-rose-300 transition">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal handlers
function openAddWarehouseModal() {
    document.getElementById('warehouseForm').reset();
    document.getElementById('modalTitle').textContent = 'Add Warehouse';
    document.getElementById('warehouseModal').classList.remove('hidden');
}

function closeAddWarehouseModal() {
    document.getElementById('warehouseModal').classList.add('hidden');
}

function editWarehouse(id) {
    const warehouse = warehouses.find(w => w.id === id);
    if (warehouse) {
        document.getElementById('modalTitle').textContent = 'Edit Warehouse';
        document.getElementById('warehouseName').value = warehouse.name;
        document.getElementById('warehouseLocation').value = warehouse.location;
        document.getElementById('warehouseCapacity').value = warehouse.capacity;
        document.getElementById('warehouseModal').classList.remove('hidden');
        document.getElementById('warehouseModal').dataset.warehouseId = id;
    }
}

async function handleSaveWarehouse(event) {
    event.preventDefault();
    
    const name = document.getElementById('warehouseName').value.trim();
    const location = document.getElementById('warehouseLocation').value.trim();
    const capacity = parseInt(document.getElementById('warehouseCapacity').value);
    
    if (!name || !location || !capacity) {
        showError('Please fill in all fields');
        return;
    }
    
    const warehouseId = document.getElementById('warehouseModal').dataset.warehouseId;
    const url = warehouseId 
        ? `/globaltrade/api/admin/warehouses/${warehouseId}`
        : '/globaltrade/api/admin/warehouses';
    
    const method = warehouseId ? 'PUT' : 'POST';
    
    try {
        const response = await fetchWithAuth(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, location, capacity })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save warehouse');
        }
        
        closeAddWarehouseModal();
        loadWarehouses();
        showSuccess('Warehouse saved successfully');
    } catch (error) {
        console.error('Error saving warehouse:', error);
        showError('Failed to save warehouse');
    }
}

async function deleteWarehouse(id) {
    if (!confirm('Are you sure you want to delete this warehouse?')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`/globaltrade/api/admin/warehouses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete warehouse');
        }
        
        loadWarehouses();
        showSuccess('Warehouse deleted successfully');
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        showError('Failed to delete warehouse');
    }
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    alert(`Error: ${message}`);
}

function showSuccess(message) {
    alert(`Success: ${message}`);
}

// Logout function
function logoutAdmin() {
    logout();
}
