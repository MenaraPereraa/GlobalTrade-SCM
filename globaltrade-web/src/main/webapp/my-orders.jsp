<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Global Trade - My Orders</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 flex h-screen overflow-hidden">

<!-- Include Sidebar -->
<%@ include file="fragments/sidebar.jsp" %>

<main class="flex-1 flex flex-col overflow-y-auto">
    <header class="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
        <h1 class="text-xl font-bold text-white">My Orders</h1>
        <div class="text-sm text-slate-400">Customer Order History</div>
    </header>

    <div class="p-8 max-w-7xl w-full mx-auto space-y-6">

        <!-- Top Stats / Action Bar -->
        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
                <h2 class="text-lg font-semibold text-white">Order Records</h2>
                <p class="text-xs text-slate-400">Track your past purchases, shipment statuses, and download invoices</p>
            </div>
            <button onclick="loadMyOrders()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
            </button>
        </div>

        <!-- Orders Table Card -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                    <tr class="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                        <th class="py-4 px-6">Order ID</th>
                        <th class="py-4 px-6">Status</th>
                        <th class="py-4 px-6">Total Amount</th>
                        <th class="py-4 px-6 text-right">Actions / Documents</th>
                    </tr>
                    </thead>
                    <tbody id="ordersTableBody" class="divide-y divide-slate-800/60 text-sm">
                    <!-- Dynamic Orders Rendered Here -->
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</main>

<script>
    const ctx = '${pageContext.request.contextPath}';

    function getCurrentUsername() { return "customer1"; }
    function getCurrentUserRole() { return "CUSTOMER"; }

    async function loadMyOrders() {
        try {
            const res = await fetch(`${ctx}/api/orders/customer?username=` + getCurrentUsername());
            const orders = await res.json();
            const tbody = document.getElementById("ordersTableBody");
            tbody.innerHTML = "";

            if (!orders || orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="py-8 text-center text-slate-500">No orders found in your history.</td>
                    </tr>
                `;
                return;
            }

            orders.forEach(o => {
                let actionButtons = `<span class="text-xs text-slate-500 italic">No actions available</span>`;

                if (o.status === 'SHIPPED') {
                    actionButtons = `
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="previewDoc('delivery-note', '\${o.orderId}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition">Delivery Note</button>
                            <button onclick="previewDoc('invoice', '\${o.orderId}')" class="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 transition font-medium">Invoice</button>
                        </div>
                    `;
                } else if (o.status === 'PENDING') {
                    actionButtons = `<span class="text-xs text-amber-500/80 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">Processing</span>`;
                }

                let statusBadge = '';
                if (o.status === 'SHIPPED') {
                    statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>SHIPPED
                    </span>`;
                } else if (o.status === 'PENDING') {
                    statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>PENDING
                    </span>`;
                } else {
                    statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        \${o.status}
                    </span>`;
                }

                tbody.innerHTML += `
                    <tr class="hover:bg-slate-900/60 transition">
                        <td class="py-4 px-6 font-semibold text-white">\${o.orderId}</td>
                        <td class="py-4 px-6">\${statusBadge}</td>
                        <td class="py-4 px-6 font-medium text-slate-200">$\${o.totalAmount.toFixed(2)}</td>
                        <td class="py-4 px-6 text-right">\${actionButtons}</td>
                    </tr>
                `;
            });
        } catch (e) {
            console.error("Failed to load orders", e);
            document.getElementById("ordersTableBody").innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-red-400">Failed to load orders from server.</td>
                </tr>
            `;
        }
    }

    function previewDoc(type, orderId) {
        alert(`Opening \${type} preview for \${orderId}...`);
        // Implement modal or window popup for PDF/HTML document preview
    }

    document.addEventListener("DOMContentLoaded", loadMyOrders);
</script>
</body>
</html>