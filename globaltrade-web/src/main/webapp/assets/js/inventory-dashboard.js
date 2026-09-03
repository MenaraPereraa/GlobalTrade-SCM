const PRODUCT_API = window.location.origin + "/globaltrade/api/products";
const INVENTORY_API = window.location.origin + "/globaltrade/api/inventory";
const WAREHOUSE_API = window.location.origin + "/globaltrade/api/warehouses";

let inventoryData = [];
let warehousesData = [];
let currentPage = 1;
const rowsPerPage = 10;
let currentStatusFilter = 'ALL';
let currentWarehouseFilter = 'ALL';

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
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function openAddProductModal() {
    document.getElementById('addProductModal').classList.remove('hidden');
    document.getElementById('globalProductSku').value = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
}

function closeAddProductModal() {
    document.getElementById('addProductModal').classList.add('hidden');
}

// Pending Inbound count එක API එකෙන් fetch කරලා badge එක update කරන function එක
async function updatePendingInboundBadge() {
    try {
        const response = await fetchWithAuth(`${WAREHOUSE_API}/transfers/pending`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (response.ok) {
            const transfers = await response.json();
            const badge = document.getElementById('pendingInboundBadge');

            if (badge) {
                if (transfers && transfers.length > 0) {
                    badge.textContent = transfers.length;
                    badge.classList.remove('hidden'); // count එකක් තියෙනවා නම් පෙන්වන්න
                } else {
                    badge.classList.add('hidden'); // නැත්නම් hide කරන්න
                }
            }
        }
    } catch (error) {
        console.error('Error updating pending inbound badge:', error);
    }
}

async function openPendingInboundModal() {
    const modal = document.getElementById('pendingInboundModal');
    if (modal) modal.classList.remove('hidden');

    try {
        const response = await fetchWithAuth(`${WAREHOUSE_API}/transfers/pending`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (response.ok) {
            const transfers = await response.json();
            renderPendingTransfersList(transfers);
        }
    } catch (error) {
        console.error('Error fetching pending transfers:', error);
        showToast('Error', 'Failed to load pending inbound transfers.', 'error');
    }
}

function closePendingInboundModal() {
    const modal = document.getElementById('pendingInboundModal');
    if (modal) modal.classList.add('hidden');
}

async function fetchPendingInboundTransfers() {
    const container = document.getElementById('pendingInboundListContainer');
    if (container) {
        container.innerHTML = `<div class="p-4 text-xs text-slate-400 text-center">Loading pending transfers...</div>`;
    }

    try {
        const response = await fetchWithAuth(`${WAREHOUSE_API}/transfers/pending`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) throw new Error('Failed to fetch pending transfers');
        const transfers = await response.json();
        renderPendingTransfersList(transfers);
    } catch (error) {
        console.error('Error fetching pending transfers:', error);
        if (container) {
            container.innerHTML = `<div class="p-4 text-xs text-rose-500 text-center">Failed to load pending transfers.</div>`;
        }
    }
}

function renderPendingTransfersList(transfers) {
    const container = document.getElementById('pendingInboundListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!transfers || transfers.length === 0) {
        container.innerHTML = `<div class="p-4 text-xs text-slate-400 text-center">No pending inbound transfers found.</div>`;
        return;
    }

    transfers.forEach(tx => {
        // Extract product and warehouse details safely based on common backend entity mappings
        const productName = tx.product?.name || tx.productName || 'Product';
        const productSku = tx.product?.sku || tx.sku || '';
        const sourceWhName = tx.sourceWarehouse?.name || tx.sourceWarehouseName || 'Unknown Warehouse';
        const dispatchedDate = tx.dispatchedAt || tx.dispatchedDate || 'N/A';
        const targetWhId = tx.destinationWarehouse?.warehouseId || tx.targetWarehouseId || 1;
        const prodId = tx.product?.productId || tx.productId;

        const itemHtml = `
            <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm mb-3">
                <div>
                    <h4 class="text-sm font-bold text-slate-800">${productName} <span class="text-xs text-slate-400 font-mono">(${productSku})</span></h4>
                    <p class="text-xs text-slate-500 mt-0.5">From: ${sourceWhName} | Date: ${dispatchedDate}</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <span class="block text-[10px] font-bold text-slate-400 uppercase">Incoming Qty</span>
                        <span class="text-sm font-extrabold text-blue-600">${tx.quantity}</span>
                    </div>
                    <button onclick="confirmReceiveTransfer(${tx.transferId}, ${targetWhId}, ${prodId}, ${tx.quantity})"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition">
                        Receive
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

async function confirmReceiveTransfer(transferId, targetWarehouseId, productId, quantity) {
    try {
        const response = await fetchWithAuth(`${WAREHOUSE_API}/receive-transfer?transferId=${transferId}&targetWarehouseId=${targetWarehouseId}&productId=${productId}&quantity=${quantity}`, {
            method: 'POST',
            headers: { "Accept": "application/json" }
        });

        if (response.ok) {
            showToast('Success', 'Transfer stock received and real-time inventory updated!');
            openPendingInboundModal();
            fetchInventoryData();
            updatePendingInboundBadge();
        } else {
            const err = await response.text();
            showToast('Error', err || 'Failed to receive transfer stock.', 'error');
        }
    } catch (error) {
        console.error('Error receiving transfer:', error);
        showToast('Error', 'Server connection error.', 'error');
    }
}



async function openReceiveStockModal() {
    const modal = document.getElementById('receiveStockModal');
    if (modal) {
        modal.classList.remove('hidden');
        loadProductsForVendorDropdown();
        loadWarehousesForVendorDropdown();
        fetchPendingInboundTransfers();
    }
}

function closeReceiveStockModal() {
    const modal = document.getElementById('receiveStockModal');
    if (modal) modal.classList.add('hidden');
}

async function loadProductsForVendorDropdown() {
    try {
        const response = await fetchWithAuth(PRODUCT_API, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (response.ok) {
            const products = await response.json();
            const select = document.getElementById('vendorProductSelect');
            if (select) {
                select.innerHTML = `<option value="">-- Select SKU --</option>`;
                products.forEach(p => {
                    select.innerHTML += `<option value="${p.productId}">${p.sku} - ${p.name}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error loading products for vendor receive:', error);
    }
}

async function loadWarehousesForVendorDropdown() {
    try {
        const response = await fetchWithAuth(WAREHOUSE_API, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (response.ok) {
            const warehouses = await response.json();
            const select = document.getElementById('vendorWarehouseSelect');
            if (select) {
                select.innerHTML = '';
                warehouses.forEach(wh => {
                    select.innerHTML += `<option value="${wh.warehouseId}">${wh.name} (WH-${wh.warehouseId})</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error loading warehouses for vendor modal:', error);
    }
}

async function submitReceiveFromVendor(event) {
    event.preventDefault();

    const productId = document.getElementById('vendorProductSelect').value;
    const quantity = document.getElementById('vendorReceiveQuantity').value;
    const warehouseId = document.getElementById('vendorWarehouseId').value || '1';

    if (!productId || !quantity) {
        showToast('Error', 'Please select a product and enter a valid quantity.', 'error');
        return;
    }

    try {
        const response = await fetchWithAuth(`${WAREHOUSE_API}/${warehouseId}/receive?productId=${productId}&quantity=${quantity}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Success', 'Stock received successfully!');
            closeReceiveStockModal();
            fetchInventoryData();
        } else {
            const errorMsg = await response.text();
            showToast('Error', 'Failed to receive stock: ' + errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error', 'Server connection error.', 'error');
    }
}

async function openDispatchStockModal() {
    const modal = document.getElementById('dispatchStockModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('dispatchProductSelect').value = '';
        const selectedText = document.getElementById('customDropdownSelectedText');
        if(selectedText) {
            selectedText.textContent = '-- Select SKU --';
            selectedText.classList.add('text-slate-400');
            selectedText.classList.remove('text-slate-800');
        }
        const searchInput = document.getElementById('customDropdownSearch');
        if(searchInput) searchInput.value = '';

        if (!inventoryData || inventoryData.length === 0) {
            try {
                const response = await fetchWithAuth(INVENTORY_API, {
                    method: "GET",
                    headers: { "Accept": "application/json" }
                });
                if (response.ok) {
                    inventoryData = await response.json();
                }
            } catch (error) {
                console.error('Error fetching inventory inside modal:', error);
            }
        }

        populateCustomDropdownOptions(inventoryData);
        const menu = document.getElementById('customDropdownMenu');
        if(menu) menu.classList.add('hidden');

        await loadTargetWarehouses();
        handleActionTypeChange();
    }
}

function closeDispatchStockModal() {
    const modal = document.getElementById('dispatchStockModal');
    if(modal) modal.classList.add('hidden');
    const menu = document.getElementById('customDropdownMenu');
    if(menu) menu.classList.add('hidden');
}

async function loadWarehousesDropdown() {
    try {
        const response = await fetchWithAuth(WAREHOUSE_API, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (response.ok) {
            warehousesData = await response.json();
            const select = document.getElementById('warehouseFilterSelect');
            if (select) {
                let optionsHtml = `<option value="ALL">All Assigned Warehouses</option>`;
                warehousesData.forEach(wh => {
                    optionsHtml += `<option value="${wh.warehouseId}">${wh.name} [${wh.code || 'WH-' + wh.warehouseId}]</option>`;
                });
                select.innerHTML = optionsHtml;
            }
        }
    } catch (error) {
        console.error('Error loading warehouses dropdown:', error);
    }
}

async function loadTargetWarehouses() {
    try {
        const response = await fetchWithAuth(WAREHOUSE_API, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });
        if (response.ok) {
            const warehouses = await response.json();
            warehousesData = warehouses;
            const select = document.getElementById('dispatchTargetWarehouse');
            if (select) {
                select.innerHTML = '';
                warehouses.forEach(wh => {
                    select.innerHTML += `<option value="${wh.warehouseId}">${wh.name} (WH-${wh.warehouseId})</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error loading target warehouses:', error);
    }
}

function handleActionTypeChange() {
    const actionType = document.getElementById('dispatchActionType').value;
    const targetWhContainer = document.getElementById('targetWarehouseContainer');

    if (targetWhContainer) {
        if (actionType === 'TRANSFER') {
            targetWhContainer.style.display = 'block';
        } else {
            targetWhContainer.style.display = 'none';
        }
    }
}

const dispatchActionTypeSelect = document.getElementById('dispatchActionType');
if (dispatchActionTypeSelect) {
    dispatchActionTypeSelect.addEventListener('change', handleActionTypeChange);
}

function toggleCustomDropdown(event) {
    event.stopPropagation();
    const menu = document.getElementById('customDropdownMenu');
    if(!menu) return;
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
        const searchInput = document.getElementById('customDropdownSearch');
        if(searchInput) searchInput.focus();
    }
}

function populateCustomDropdownOptions(items) {
    const listContainer = document.getElementById('customDropdownOptionsList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!items || items.length === 0) {
        listContainer.innerHTML = `<div class="px-3 py-2 text-xs text-slate-400 text-center">No products found</div>`;
        return;
    }

    items.forEach(item => {
        const product = item.product || item;
        if (product) {
            const sku = product.sku || 'N/A';
            const name = product.name || 'N/A';
            const qtyOnHand = item.quantityOnHand !== undefined ? item.quantityOnHand : 0;
            const whId = item.warehouseId || (item.warehouse ? item.warehouse.warehouseId : 1);

            const matchedWh = warehousesData.find(w => String(w.warehouseId) === String(whId));
            const whName = matchedWh ? matchedWh.name : `WH-${whId}`;

            const div = document.createElement('div');
            div.className = "px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg cursor-pointer transition flex items-center justify-between";
            div.innerHTML = `<span class="font-medium">${sku} - ${name} <span class="text-slate-400">(${whName})</span></span> <span class="text-emerald-600 font-bold">Stock: ${qtyOnHand}</span>`;

            div.onclick = (e) => {
                e.stopPropagation();
                document.getElementById('dispatchProductSelect').value = sku;
                const selectedText = document.getElementById('customDropdownSelectedText');
                selectedText.textContent = `${sku} - ${name} [Stock: ${qtyOnHand}]`;
                selectedText.classList.remove('text-slate-400');
                selectedText.classList.add('text-slate-800');
                document.getElementById('customDropdownMenu').classList.add('hidden');
            };

            listContainer.appendChild(div);
        }
    });
}

function filterCustomDropdownOptions(query) {
    const q = query.toLowerCase();
    const filtered = inventoryData.filter(item => {
        const product = item.product || item;
        const name = product && product.name ? product.name.toLowerCase() : '';
        const sku = product && product.sku ? product.sku.toLowerCase() : '';
        return name.includes(q) || sku.includes(q);
    });
    populateCustomDropdownOptions(filtered);
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('customDropdownMenu');
    const trigger = document.getElementById('customDropdownTrigger');
    if (dropdown && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

async function submitDispatchStock(event) {
    event.preventDefault();

    const sku = document.getElementById('dispatchProductSelect').value;
    const quantityInput = document.getElementById('dispatchQuantity').value;
    const quantity = parseInt(quantityInput);
    const actionType = document.getElementById('dispatchActionType').value;

    let targetWarehouseId = '1';
    if (actionType === 'TRANSFER' && document.getElementById('dispatchTargetWarehouse')) {
        targetWarehouseId = document.getElementById('dispatchTargetWarehouse').value;
    }

    const remarksField = document.getElementById('dispatchRemarks');
    const remarks = remarksField ? remarksField.value : '';

    if (!sku) {
        showToast('Error', 'Please select a product SKU.', 'error');
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        showToast('Error', 'Please enter a valid quantity greater than 0.', 'error');
        return;
    }

    const inventoryItem = inventoryData.find(item => {
        const p = item.product || item;
        return p && p.sku === sku;
    });

    if (!inventoryItem) {
        showToast('Error', 'Selected inventory item not found in data.', 'error');
        return;
    }

    const availableQty = inventoryItem.quantityOnHand !== undefined ? inventoryItem.quantityOnHand : 0;

    if (quantity > availableQty) {
        showToast('Error', `Cannot dispatch ${quantity}. Only ${availableQty} available in this warehouse!`, 'error');
        return;
    }

    const productObj = inventoryItem.product || inventoryItem;
    const sourceWarehouseId = inventoryItem.warehouseId || (inventoryItem.warehouse ? inventoryItem.warehouse.warehouseId : 1);
    const productId = productObj.productId;

    try {
        let endpoint = '';
        let successMessage = '';

        if (actionType === 'TRANSFER_TO_MAIN' || actionType === 'TRANSFER') {
            if (String(sourceWarehouseId) === String(targetWarehouseId)) {
                showToast('Error', 'Source and target warehouses cannot be the same for transfer.', 'error');
                return;
            }
            endpoint = `${WAREHOUSE_API}/${sourceWarehouseId}/transfer?targetWarehouseId=${targetWarehouseId}&productId=${productId}&quantity=${quantity}`;
            successMessage = 'Stock transferred successfully!';
        } else if (actionType === 'DAMAGE') {
            endpoint = `${INVENTORY_API}/adjust?warehouseId=${sourceWarehouseId}&productId=${productId}&quantity=${quantity}&reason=${encodeURIComponent(remarks)}`;
            successMessage = 'Damage reported and stock adjusted successfully!';
        } else {
            endpoint = `${INVENTORY_API}/dispatch?warehouseId=${sourceWarehouseId}&productId=${productId}&quantity=${quantity}`;
            successMessage = 'Stock dispatched successfully!';
        }

        const response = await fetchWithAuth(endpoint, {
            method: 'POST',
            headers: { "Accept": "application/json" }
        });

        if (response.ok) {
            showToast('Success', successMessage);
            closeDispatchStockModal();
            const form = document.getElementById('dispatchStockForm');
            if (form) form.reset();
            fetchInventoryData();
            updatePendingInboundBadge(); // Stock transfer එකක් කළ විට වෙනත් warehouse එකකට request එක යන නිසා badge එක update කිරීමට
        } else {
            const errText = await response.text();
            showToast('Error', errText || 'Failed to process action.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error', 'Server connection error.', 'error');
    }
}

async function fetchInventoryData() {
    try {
        const response = await fetchWithAuth(INVENTORY_API, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (response.ok) {
            const data = await response.json();
            inventoryData = Array.isArray(data) ? data.sort((a, b) => {
                const prodA = a.product || a;
                const prodB = b.product || b;
                const idA = prodA ? prodA.productId : 0;
                const idB = prodB ? prodB.productId : 0;
                return idB - idA;
            }) : [];

            currentPage = 1;
            renderInventoryTable();
        } else {
            const errText = await response.text();
            console.error('Failed to fetch inventory:', errText);
            showToast('Error', 'Failed to fetch inventory stock levels.', 'error');
        }
    } catch (error) {
        console.error('Network or Server Error:', error);
        showToast('Error', 'Server connection error.', 'error');
    }
}

function filterByStatus(status) {
    currentStatusFilter = status;
    currentPage = 1;
    renderInventoryTable();
}

function applyInventoryFilters() {
    currentPage = 1;
    renderInventoryTable();
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchInput = document.getElementById('inventorySearchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const warehouseSelect = document.getElementById('warehouseFilterSelect');
    currentWarehouseFilter = warehouseSelect ? warehouseSelect.value : 'ALL';

    let filtered = inventoryData.filter(item => {
        const product = item.product || item;
        const title = product && product.name ? product.name.toLowerCase() : '';
        const sku = product && product.sku ? product.sku.toLowerCase() : '';
        const matchesSearch = title.includes(searchQuery) || sku.includes(searchQuery);

        const itemWhId = String(item.warehouseId || (item.warehouse ? item.warehouse.warehouseId : ''));
        const matchesWarehouse = (currentWarehouseFilter === 'ALL' || itemWhId === String(currentWarehouseFilter));

        const qtyOnHand = item.quantityOnHand !== undefined ? item.quantityOnHand : 0;
        const threshold = item.reorderThreshold !== undefined && item.reorderThreshold !== null ? item.reorderThreshold : 10;

        const isLowStock = qtyOnHand <= threshold;
        const matchesStatus = (currentStatusFilter === 'ALL' || (currentStatusFilter === 'LOW_STOCK' && isLowStock));

        return matchesSearch && matchesWarehouse && matchesStatus;
    });

    const emptyState = document.getElementById('inventoryEmptyState');
    if (!filtered || filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        updatePaginationUI(0, 0, 0);
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
    const paginatedData = filtered.slice(startIndex, endIndex);

    paginatedData.forEach((item, index) => {
        const actualIndex = startIndex + index + 1;
        const product = item.product || item;
        const title = product ? product.name : 'N/A';
        const sku = product ? product.sku : 'N/A';

        const threshold = item.reorderThreshold !== undefined && item.reorderThreshold !== null ? item.reorderThreshold : 10;
        const qtyOnHand = item.quantityOnHand !== undefined ? item.quantityOnHand : 0;

        const whId = item.warehouseId || (item.warehouse ? item.warehouse.warehouseId : '');
        const matchedWh = warehousesData.find(w => String(w.warehouseId) === String(whId));
        const warehouseName = (item.warehouse && item.warehouse.name) ? item.warehouse.name : (matchedWh ? matchedWh.name : (whId ? `Warehouse ${whId}` : 'Main Warehouse'));

        const isLowStock = qtyOnHand <= threshold;

        let statusBadge = isLowStock
            ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">Low Stock Alert</span>`
            : `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Normal</span>`;

        const row = `
            <tr>
                <td class="px-6 py-4 text-sm text-slate-500">${actualIndex}</td>
                <td class="px-6 py-4">
                    <div class="text-sm font-bold text-slate-800">${title}</div>
                </td>
                <td class="px-6 py-4 text-xs text-slate-400 font-mono">${sku}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-700">${warehouseName}</td>
                <td class="px-6 py-4 text-base font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-800'}">
                    ${qtyOnHand}
                </td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editCatalog('${sku}')"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-xs font-medium transition shadow-sm">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Edit Catalog
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    updatePaginationUI(startIndex + 1, endIndex, totalItems);
}

function updatePaginationUI(start, end, total) {
    const info = document.getElementById('inventoryTableInfo');
    if (info) info.textContent = `Showing ${start}-${end} of ${total} items`;

    const prevBtn = document.getElementById('inventoryPrevBtn');
    const nextBtn = document.getElementById('inventoryNextBtn');

    if (prevBtn) prevBtn.disabled = (currentPage <= 1);
    if (nextBtn) nextBtn.disabled = (end >= total);
}

function changeInventoryPage(direction) {
    currentPage += direction;
    renderInventoryTable();
}

function editCatalog(sku) {
    showToast('Catalog', `Opening catalog editor for SKU: ${sku}`);
}

window.addEventListener('DOMContentLoaded', () => {
    loadWarehousesDropdown();
    fetchInventoryData();
    updatePendingInboundBadge();

    setInterval(updatePendingInboundBadge, 30000);
});