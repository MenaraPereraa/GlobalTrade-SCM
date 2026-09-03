<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Global Trade - Customer Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex h-screen overflow-hidden">

<!-- Include Sidebar -->
<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 flex flex-col overflow-y-auto">
    <header class="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
        <h1 class="text-xl font-bold text-white">Customer Portal</h1>
        <div class="text-sm text-slate-400">B2B Storefront</div>
    </header>

    <div class="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Live Catalog -->
        <div class="lg:col-span-2 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold text-white">Live Catalog</h2>
                    <p class="text-xs text-slate-400">Warehouse availability refreshed in real time</p>
                </div>
                <button onclick="loadCatalog()" class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition">Refresh</button>
            </div>

            <div id="catalogGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Dynamic products rendered via JS -->
            </div>
        </div>

        <!-- Right: Order Summary / Cart -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-fit sticky top-6">
            <div>
                <h2 class="text-lg font-semibold text-white mb-4">Order Summary</h2>
                <div id="cartItemsList" class="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                    <p class="text-sm text-slate-500">Your cart is empty.</p>
                </div>
            </div>

            <div class="border-t border-slate-800 pt-4 space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-slate-400">Subtotal</span>
                    <span id="cartSubtotal" class="font-medium">$0.00</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-400">Shipping</span>
                    <span class="font-medium">$0.00</span>
                </div>
                <div class="flex justify-between text-base font-bold border-t border-slate-800/60 pt-2">
                    <span>Total</span>
                    <span id="cartTotal" class="text-indigo-400">$0.00</span>
                </div>
                <button onclick="placeOrder()" class="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20">
                    Place Order
                </button>
            </div>
        </div>
    </div>
</main>

<script>
    let cart = [];
    const ctx = '${pageContext.request.contextPath}';

    function getCurrentUsername() { return "customer1"; }
    function getCurrentUserRole() { return "CUSTOMER"; }

    async function loadCatalog() {
        try {
            const res = await fetch(`${ctx}/api/inventory/catalog`);
            const products = await res.json();
            const grid = document.getElementById("catalogGrid");
            grid.innerHTML = "";

            if(!products || products.length === 0) {
                grid.innerHTML = `<p class="text-sm text-slate-500 col-span-2">No products available in catalog.</p>`;
                return;
            }

            products.forEach(p => {
                grid.innerHTML += `
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                            <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">\${p.sku}</span>
                            <h3 class="font-bold text-white mt-2">\${p.name}</h3>
                            <p class="text-xs text-slate-400 mt-1">\${p.description || 'No description'}</p>
                        </div>
                        <div class="mt-4 flex items-end justify-between">
                            <div>
                                <span class="text-lg font-bold text-white">$\${p.price.toFixed(2)}</span>
                                <p class="text-[11px] text-slate-500">Available: \${p.availableQty} units</p>
                            </div>
                            <button onclick="addToCart('\${p.sku}', '\${p.name}', \${p.price}, \${p.availableQty})"
                                class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg font-semibold transition">
                                Add to cart
                            </button>
                        </div>
                    </div>
                `;
            });
        } catch (e) {
            console.error("Failed to load catalog", e);
        }
    }

    function addToCart(sku, name, price, maxQty) {
        const existing = cart.find(item => item.sku === sku);
        if (existing) {
            if (existing.qty < maxQty) existing.qty++;
            else alert("Exceeds available stock!");
        } else {
            cart.push({ sku, name, price, qty: 1, maxQty });
        }
        renderCart();
    }

    function renderCart() {
        const list = document.getElementById("cartItemsList");
        if (cart.length === 0) {
            list.innerHTML = `<p class="text-sm text-slate-500">Your cart is empty.</p>`;
            document.getElementById("cartSubtotal").textContent = "$0.00";
            document.getElementById("cartTotal").textContent = "$0.00";
            return;
        }

        list.innerHTML = "";
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price * item.qty;
            list.innerHTML += `
                <div class="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-sm">
                    <div>
                        <p class="font-medium text-white">\${item.name}</p>
                        <p class="text-xs text-slate-400">$\${item.price} x \${item.qty}</p>
                    </div>
                    <button onclick="removeFromCart('\${item.sku}')" class="text-red-400 hover:text-red-300 text-xs font-bold px-2">✕</button>
                </div>
            `;
        });
        document.getElementById("cartSubtotal").textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById("cartTotal").textContent = `$${subtotal.toFixed(2)}`;
    }

    function removeFromCart(sku) {
        cart = cart.filter(item => item.sku !== sku);
        renderCart();
    }

    async function placeOrder() {
        if (cart.length === 0) return alert("Cart is empty!");

        const payload = {
            customerName: getCurrentUsername(),
            items: cart.map(i => ({ sku: i.sku, quantity: i.qty, unitPrice: i.price }))
        };

        const res = await fetch(`${ctx}/api/orders/place`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Order placed successfully! Status: PENDING");
            cart = [];
            renderCart();
            loadCatalog();
        } else {
            alert("Failed to place order.");
        }
    }

    document.addEventListener("DOMContentLoaded", loadCatalog);
</script>
</body>
</html>