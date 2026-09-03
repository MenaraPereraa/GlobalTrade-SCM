let allOrders = [];
let filteredOrders = [];
let currentOrderPage = 1;
const itemsPerOrderPage = 10;

let productsList = [];
let vendorsList = [];

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

document.addEventListener("DOMContentLoaded", () => {
    fetchPurchaseOrders();
    fetchVendors();
    fetchProducts();

    const refreshBtn = document.querySelector("button.flex.items-center.gap-2");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            fetchPurchaseOrders();
        });
    }

    const searchInput = document.querySelector("input[placeholder*='Search']");
    if (searchInput) {
        searchInput.disabled = false;
        searchInput.placeholder = "Search by Order ID...";
        searchInput.addEventListener("input", filterOrdersTable);
    }
});

async function fetchPurchaseOrders() {
    const tbody = document.getElementById("purchaseOrdersTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-slate-400 italic">Loading purchase orders...</td></tr>`;
    }

    try {
        const url = window.location.origin + "/globaltrade/api/purchase-orders";

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

        const data = await response.json();
        allOrders = Array.isArray(data) ? [...data].reverse() : [];
        filterOrdersTable();

    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        allOrders = [];
        showOrderEmptyState();
    }
}

async function fetchVendors() {
    try {
        const url = window.location.origin + "/globaltrade/api/vendors";

        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            vendorsList = await response.json();
        } else {
            vendorsList = [];
        }
    } catch (e) {
        vendorsList = [];
    }
    renderVendorList(vendorsList);
}

function renderVendorList(items) {
    const listContainer = document.getElementById("vendorList");
    if (!listContainer) return;

    if (!items || items.length === 0) {
        listContainer.innerHTML = `<div class="p-2 text-xs text-slate-400 italic">No vendors found</div>`;
        return;
    }

    let html = '';
    items.forEach(v => {
        // මෙතැනදී බහුලව භාවිත වන සියලුම ID නම් පරීක්ෂා කරයි
        const vId = v.vendorId !== undefined ? v.vendorId : (v.id !== undefined ? v.id : v.supplier_id);
        const vName = v.vendorName || v.name || v.supplierName || 'Unknown Vendor';

        html += `
            <div onclick="selectVendor(${vId}, '${vName.replace(/'/g, "\\'")}')" 
                 class="p-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors flex items-center">
                <span class="font-medium">${vName}</span>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}


function filterVendors() {
    const searchInput = document.getElementById("vendorSearchInput");
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const filtered = vendorsList.filter(v => (v.vendorName || v.name || '').toLowerCase().includes(query));
    renderVendorList(filtered);
}

function toggleVendorDropdown() {
    const menu = document.getElementById("vendorDropdownMenu");
    const productMenu = document.getElementById("productDropdownMenu");
    if (productMenu) productMenu.classList.add("hidden");
    if (menu) menu.classList.toggle("hidden");
}

function selectVendor(id, name) {
    const vendorInput = document.getElementById("poVendorId");
    if (vendorInput) {
        vendorInput.value = id;
        vendorInput.dispatchEvent(new Event('change'));
    }

    const label = document.getElementById("vendorSelectLabel");
    if (label) {
        label.innerText = name;
        label.classList.remove("text-slate-500");
        label.classList.add("text-slate-900", "font-medium");
    }
    toggleVendorDropdown();
}
async function fetchProducts() {
    try {
        const url = window.location.origin + "/globaltrade/api/products";
        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            productsList = await response.json();
        } else {
            productsList = [];
        }
    } catch (e) {
        productsList = [];
    }
    renderProductList(productsList);
}

function renderProductList(items) {
    const listContainer = document.getElementById("productList");
    if (!listContainer) return;

    if (!items || items.length === 0) {
        listContainer.innerHTML = `<div class="p-2 text-xs text-slate-400 italic">No products found</div>`;
        return;
    }

    let html = '';
    items.forEach(p => {
        const pId = p.productId || p.id || p.product_id;
        const pTitle = p.productName || p.title;
        const pPrice = p.price || p.unitPrice || 0;

        html += `
            <div onclick="selectProduct(${pId}, '${pTitle.replace(/'/g, "\\'")}', ${pPrice})" 
                 class="p-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors flex items-center">
                <span class="font-medium">${pTitle}</span>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

function filterProducts() {
    const searchInput = document.getElementById("productSearchInput");
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const filtered = productsList.filter(p => (p.productName || p.title || '').toLowerCase().includes(query));
    renderProductList(filtered);
}

function toggleProductDropdown() {
    const menu = document.getElementById("productDropdownMenu");
    const vendorMenu = document.getElementById("vendorDropdownMenu");
    if (vendorMenu) vendorMenu.classList.add("hidden");
    if (menu) menu.classList.toggle("hidden");
}

function selectProduct(id, title, price) {
    document.getElementById("poProductId").value = id;
    const label = document.getElementById("productSelectLabel");
    if (label) {
        label.innerText = title;
        label.classList.remove("text-slate-500");
        label.classList.add("text-slate-900", "font-medium");
    }

    const priceInput = document.getElementById("poPrice");
    if (priceInput) priceInput.value = Number(price).toFixed(2);
    toggleProductDropdown();
}

let currentFilterStatus = 'ALL';

function filterOrders(status) {
    currentFilterStatus = status;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-status') === status) {
            btn.className = "px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white transition-all tab-btn";
        } else {
            btn.className = "px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all tab-btn";
        }
    });
    filterOrdersTable();
}

function filterOrdersTable() {
    const searchInput = document.querySelector("input[placeholder*='Search']");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    filteredOrders = allOrders.filter(o => {
        const orderId = (o.orderId || o.id || "").toString().toLowerCase();

        const searchMatch = orderId.includes(searchText);
        const statusMatch = currentFilterStatus === 'ALL' || o.status === currentFilterStatus;

        return searchMatch && statusMatch;
    });

    currentOrderPage = 1;
    renderOrdersTable();
}

function renderOrdersTable() {
    const tbody = document.getElementById("purchaseOrdersTableBody");
    if (!tbody) return;

    if (!filteredOrders || filteredOrders.length === 0) {
        showOrderEmptyState();
        return;
    }

    const totalPages = Math.ceil(filteredOrders.length / itemsPerOrderPage);
    if (currentOrderPage > totalPages) currentOrderPage = totalPages || 1;

    const start = (currentOrderPage - 1) * itemsPerOrderPage;
    const end = start + itemsPerOrderPage;
    const paginatedOrders = filteredOrders.slice(start, end);

    tbody.innerHTML = paginatedOrders.map(o => {
        let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        if (o.status === 'PENDING') badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
        else if (o.status === 'APPROVED' || o.status === 'CONFIRMED') badgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
        else if (o.status === 'SHIPPED') badgeClass = 'bg-purple-50 text-purple-700 border-purple-100';
        else if (o.status === 'COMPLETED') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';

        const formattedDate = o.orderDate ? formatTimestamp(o.orderDate) : 'N/A';
        const orderIdVal = o.orderId || o.id;
        const vendorName = o.vendor ? (o.vendor.vendorName || o.vendor.name || o.vendor.supplierName || 'N/A') : 'N/A';

        return `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-semibold text-slate-900">${orderIdVal}</td>
                <td class="px-6 py-4 font-medium text-slate-800">${vendorName}</td>
                <td class="px-6 py-4 text-slate-600">${formattedDate}</td>
                <td class="px-6 py-4 font-medium text-slate-900">${Number(o.totalAmount || 0).toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}">
                        ${o.status || 'UNKNOWN'}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewOrderDetails('${orderIdVal}')" class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">View &rarr;</button>
                </td>
            </tr>
        `;
    }).join('');

    renderOrderPaginationControls(totalPages);
}

function renderOrderPaginationControls(totalPages) {
    let paginationContainer = document.getElementById("orderPagination");

    if (!paginationContainer) {
        const parentTable = document.querySelector("table")?.parentElement;
        if (parentTable) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "orderPagination";
            paginationContainer.className = "flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100";
            parentTable.appendChild(paginationContainer);
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
    const startEntry = (currentOrderPage - 1) * itemsPerOrderPage + 1;
    const endEntry = Math.min(currentOrderPage * itemsPerOrderPage, filteredOrders.length);

    paginationContainer.innerHTML = `
        <span class="text-sm text-slate-500">Showing ${startEntry} to ${endEntry} of ${filteredOrders.length} entries</span>
        <div class="flex items-center gap-2">
            <button onclick="changeOrderPage(${currentOrderPage - 1})" ${currentOrderPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span class="text-sm font-medium text-slate-700">Page ${currentOrderPage} of ${totalPages}</span>
            <button onclick="changeOrderPage(${currentOrderPage + 1})" ${currentOrderPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
    `;
}

function changeOrderPage(page) {
    currentOrderPage = page;
    renderOrdersTable();
}

async function submitPurchaseOrder(event) {
    event.preventDefault();

    const vendorIdInput = document.getElementById("poVendorId");
    const productIdInput = document.getElementById("poProductId");
    const qtyInput = document.getElementById("poQty");
    const priceInput = document.getElementById("poPrice");
    const addressInput = document.getElementById("poDestinationAddress");

    const vendorId = vendorIdInput ? vendorIdInput.value.trim() : "";
    const productId = productIdInput ? productIdInput.value.trim() : "";
    const qty = qtyInput ? parseInt(qtyInput.value) : 0;
    const price = priceInput ? parseFloat(priceInput.value) : 0.0;
    const destinationAddress = addressInput ? addressInput.value.trim() : "";

    if (!vendorId) {
        showToast('Action Required', 'Please select a vendor from the list.', 'warning');
        return;
    }
    if (!productId) {
        showToast('Action Required', 'Please select a product from the list.', 'warning');
        return;
    }
    if (!destinationAddress) {
        showToast('Action Required', 'Please enter a destination address.', 'warning');
        return;
    }

    const total = qty * price;

    // Backend Java Entity ආකෘතියට හරියටම ගැළපෙන පරිදි payload එක සකස් කිරීම
    const payload = {
        vendor: {
            vendorId: parseInt(vendorId)
        },
        totalAmount: total,
        status: "PENDING",
        destinationAddress: destinationAddress,
        orderItems: [
            {
                product: {
                    productId: parseInt(productId)
                },
                quantity: qty,
                unitPrice: price
            }
        ]
    };

    console.log("FINAL PAYLOAD TO SEND:", JSON.stringify(payload));

    try {
        const url = window.location.origin + "/globaltrade/api/purchase-orders";
        const response = await fetchWithAuth(url, {
            method: 'POST',
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Saved Successfully', 'Purchase order created successfully!', 'success');
            closeCreateOrderModal();
            fetchPurchaseOrders();
        } else {
            const errText = await response.text();
            showToast('Error Occurred', 'Failed to create purchase order: ' + errText, 'error');
        }
    } catch (e) {
        showToast('Error Occurred', 'Error connecting to server.', 'error');
    }
}

function openCreateOrderModal() {
    const modal = document.getElementById("createOrderModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeCreateOrderModal() {
    const modal = document.getElementById("createOrderModal");
    if (modal) {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
    }
    const productMenu = document.getElementById("productDropdownMenu");
    const vendorMenu = document.getElementById("vendorDropdownMenu");
    if (productMenu) productMenu.classList.add("hidden");
    if (vendorMenu) vendorMenu.classList.add("hidden");
}

async function viewOrderDetails(orderId) {
    try {
        const url = window.location.origin + "/globaltrade/api/purchase-orders/" + orderId;
        const response = await fetchWithAuth(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + getCookie("accessToken"),
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch order details");
        const order = await response.json();
        openViewOrderModal(order);
    } catch (error) {
        console.error("Error:", error);
    }
}

function openViewOrderModal(order) {
    const modal = document.getElementById("viewOrderModal");
    if (modal) {
        document.getElementById("viewModalOrderId").textContent = order.orderId || order.id || 'N/A';
        document.getElementById("viewModalStatus").textContent = order.status || 'N/A';
        document.getElementById("viewModalTotal").textContent = Number(order.totalAmount || 0).toFixed(2);
        document.getElementById("viewModalAddress").textContent = order.destinationAddress || 'N/A';

        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeViewOrderModal() {
    const modal = document.getElementById("viewOrderModal");
    if (modal) {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
    }
}

function formatTimestamp(timestamp) {
    if (Array.isArray(timestamp)) {
        const [year, month, day] = timestamp;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    if (typeof timestamp === "string") {
        return timestamp.replace("T", " ").substring(0, 10);
    }
    return timestamp || "";
}

function showOrderEmptyState() {
    const tbody = document.getElementById("purchaseOrdersTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-16 px-6">
                <div class="flex flex-col items-center justify-center">
                    <p class="text-slate-500 font-medium">No purchase orders found</p>
                    <p class="text-sm text-slate-400 mt-1">Orders created from database will appear here.</p>
                </div>
            </td>
        </tr>
    `;

    const paginationContainer = document.getElementById("orderPagination");
    if (paginationContainer) paginationContainer.classList.add("hidden");
}

window.showToast = showToast;
window.changeOrderPage = changeOrderPage;
window.filterOrders = filterOrders;
window.viewOrderDetails = viewOrderDetails;
window.closeViewOrderModal = closeViewOrderModal;
window.openCreateOrderModal = openCreateOrderModal;
window.closeCreateOrderModal = closeCreateOrderModal;
window.submitPurchaseOrder = submitPurchaseOrder;
window.filterVendors = filterVendors;
window.toggleVendorDropdown = toggleVendorDropdown;
window.selectVendor = selectVendor;
window.filterProducts = filterProducts;
window.toggleProductDropdown = toggleProductDropdown;
window.selectProduct = selectProduct;