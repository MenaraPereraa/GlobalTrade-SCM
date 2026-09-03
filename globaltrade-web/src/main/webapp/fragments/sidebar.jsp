<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<aside class="w-64 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 h-screen sticky top-0 p-6 flex flex-col justify-between hidden md:flex border-r border-slate-800 shrink-0">
    <div class="space-y-8 overflow-y-auto">
        <div class="flex items-center space-x-3">
            <div class="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/40">
                GT
            </div>
            <span class="text-white font-bold text-lg tracking-tight">Global Trade Portal</span>
        </div>

        <nav class="space-y-1" id="sidebarMenu">
            <!-- Dynamic menu items will be injected here -->
        </nav>
    </div>

    <div class="space-y-4 pt-4">
        <div class="border-t border-slate-800 pt-4 flex items-center gap-3 px-2">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-semibold"
                 id="userInitials">
                GT
            </div>
            <div class="leading-tight">
                <p class="text-sm font-semibold text-white" id="sidebarUsername">User</p>
                <p class="text-xs text-slate-500" id="sidebarUserRole">Staff</p>
            </div>
        </div>

        <button onclick="logout()"
                class="w-full bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-lg transition-colors duration-150 font-semibold text-left flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Logout</span>
        </button>
    </div>
</aside>

<script>
    document.addEventListener("DOMContentLoaded", () => {
        const rawRole = typeof getCurrentUserRole === 'function' ? getCurrentUserRole() : 'Admin';
        const role = rawRole ? rawRole.toUpperCase().replace(/[\s_]+/g, '') : '';
        const username = typeof getCurrentUsername === 'function' ? getCurrentUsername() : 'User';

        if (username) {
            const userEl = document.getElementById("sidebarUsername");
            if (userEl) userEl.textContent = username;

            const initialsEl = document.getElementById("userInitials");
            if (initialsEl) initialsEl.textContent = username.substring(0, 2).toUpperCase();
        }

        const roleEl = document.getElementById("sidebarUserRole");
        if (roleEl) roleEl.textContent = rawRole ? rawRole.replace(/_/g, " ") : "Staff";

        const menuContainer = document.getElementById("sidebarMenu");
        if (!menuContainer) return;

        function stripExtension(name) {
            return name.replace(/\.jsp$/i, '');
        }

        function baseNameWithHash(pathOrHref) {
            const [pathPart, hashPart] = pathOrHref.split('#');
            const segments = pathPart.split('/').filter(Boolean);
            const last = segments[segments.length - 1] || '';
            const base = stripExtension(last);
            return hashPart ? (base + '#' + hashPart) : base;
        }

        function isActiveLink(hrefTail) {
            const current = baseNameWithHash(window.location.pathname + window.location.hash);
            const target = baseNameWithHash(hrefTail);
            return current === target && target !== '';
        }

        function linkClasses(hrefTail) {
            return isActiveLink(hrefTail)
                ? 'group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-600/15 text-white font-medium border-l-2 border-indigo-500 whitespace-nowrap'
                : 'group flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors font-medium whitespace-nowrap';
        }

        function iconClasses(hrefTail) {
            return isActiveLink(hrefTail)
                ? 'w-5 h-5 text-indigo-400 shrink-0'
                : 'w-5 h-5 text-slate-500 group-hover:text-indigo-400 shrink-0';
        }

        let menuHTML = '';
        const ctx = '${pageContext.request.contextPath}';

        // 1. ADMIN
        if (role === "ADMIN" || role === "SUPERADMIN" || role === "ADMINISTRATOR") {
            menuHTML += `
                <div class="flex items-center gap-2 px-2 py-3 mt-4">
                    <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Admin Management</span>
                </div>
                <a href="` + ctx + `/admin/admin-dashboard.jsp" class="\${linkClasses('admin-dashboard.jsp')}">
                    <svg class="\${iconClasses('admin-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                    <span class="truncate">Dashboard</span>
                </a>
                <a href="` + ctx + `/admin/staff-management.jsp" class="\${linkClasses('staff-management.jsp')}">
                    <svg class="\${iconClasses('staff-management.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    <span class="truncate">Staff & Roles</span>
                </a>
                <a href="` + ctx + `/warehouses.jsp" class="\${linkClasses('warehouses.jsp')}">
                    <svg class="\${iconClasses('warehouses.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    <span class="truncate">Warehouses & Hubs</span>
                </a>
                <a href="` + ctx + `/coordinator/vendor-approvals.jsp" class="\${linkClasses('vendor-approvals.jsp')}">
                    <svg class="\${iconClasses('vendor-approvals.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span class="truncate">Vendor Approvals</span>
                </a>
                <a href="` + ctx + `/admin/audit-logs.jsp" class="\${linkClasses('audit-logs.jsp')}">
                    <svg class="\${iconClasses('audit-logs.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                    <span class="truncate">Audit Logs</span>
                </a>
                <a href="` + ctx + `/admin/nfr-metrics.jsp" class="\${linkClasses('nfr-metrics.jsp')}">
                    <svg class="\${iconClasses('nfr-metrics.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    <span class="truncate">NFR Metrics</span>
                </a>
            `;
        }

        // 2. WAREHOUSE MANAGER
        else if (role === "WAREHOUSEMANAGER") {
            menuHTML += `
                <div class="flex items-center gap-2 px-2 py-3 mt-4">
                    <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Warehouse Menu</span>
                </div>
                <a href="` + ctx + `/warehouse-dashboard.jsp" class="\${linkClasses('warehouse-dashboard.jsp')}">
                    <svg class="\${iconClasses('warehouse-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4v8H3zM10 3h4v18h-4zM17 8h4v13h-4z"/></svg>
                    <span class="truncate">Overview</span>
                </a>
                <a href="` + ctx + `/inventory-dashboard.jsp" class="\${linkClasses('inventory-dashboard.jsp')}">
                    <svg class="\${iconClasses('inventory-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10l-8-4V7m8 14V11"/></svg>
                    <span class="truncate">Inventory</span>
                </a>
                <a href="` + ctx + `/logistics-dashboard.jsp" class="\${linkClasses('logistics-dashboard.jsp')}">
                    <svg class="\${iconClasses('logistics-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>
                    <span class="truncate">Logistics</span>
                </a>
                <a href="` + ctx + `/stock-movements.jsp" class="\${linkClasses('stock-movements.jsp')}">
                    <svg class="\${iconClasses('stock-movements.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>
                    <span class="truncate">Stock Movements</span>
                </a>
                <a href="` + ctx + `/low-stock.jsp" class="\${linkClasses('low-stock.jsp')}">
                    <svg class="\${iconClasses('low-stock.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>
                    <span class="truncate">Stock Alert</span>
                </a>
            `;
        }

        // 3. CUSTOM AGENT
        else if (role === "CUSTOMAGENT" || role === "CUSTOM_AGENT") {
            menuHTML += `
                <div class="flex items-center gap-2 px-2 py-3 mt-4">
                    <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Customs Menu</span>
                </div>
                <a href="` + ctx + `/custom/arrivals.jsp" class="\${linkClasses('arrivals.jsp')}">
                    <svg class="\${iconClasses('arrivals.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                    <span class="truncate">Customs Arrivals</span>
                </a>
                <a href="` + ctx + `/custom/declarations.jsp" class="\${linkClasses('declarations.jsp')}">
                    <svg class="\${iconClasses('declarations.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                    <span class="truncate">Declarations</span>
                </a>
                <a href="` + ctx + `/custom/history.jsp" class="\${linkClasses('history.jsp')}">
                    <svg class="\${iconClasses('history.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span class="truncate">Customs History</span>
                </a>
            `;
        }

        // 4. VENDOR REPRESENTATIVE
        else if (role === "VENDORREPRESENTATIVE" || role === "VENDOR_REP" || role === "VENDOR") {
            menuHTML += `
                <div class="flex items-center gap-2 px-2 py-3 mt-4">
                    <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Vendor Menu</span>
                </div>
                <a href="` + ctx + `/vendor/vendor-dashboard.jsp" class="\${linkClasses('vendor-dashboard.jsp')}">
                    <svg class="\${iconClasses('vendor-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4v8H3zM10 3h4v18h-4zM17 8h4v13h-4z"/></svg>
                    <span class="truncate">Dashboard Overview</span>
                </a>
                <a href="` + ctx + `/vendor/active-rfqs.jsp" class="\${linkClasses('active-rfqs.jsp')}">
                    <svg class="\${iconClasses('active-rfqs.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                    <span class="truncate">Active RFQs</span>
                </a>
                <a href="` + ctx + `/vendor/replenishment-requests.jsp" class="\${linkClasses('replenishment-requests.jsp')}">
                    <svg class="\${iconClasses('replenishment-requests.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg>
                    <span class="truncate">Replenishment Requests</span>
                </a>
                <a href="` + ctx + `/vendor/vendor-orders.jsp" class="\${linkClasses('vendor-orders.jsp')}">
                    <svg class="\${iconClasses('vendor-orders.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m3.536 3.536L15 15m-3-3v5m-3-5v2"/></svg>
                    <span class="truncate">Vendor Orders</span>
                </a>
            `;
        }

        // 5. COORDINATOR
        else if (role === "COORDINATOR") {
            menuHTML += `
                <div class="flex items-center gap-2 px-2 py-3 mt-4">
                    <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Coordinator Menu</span>
                </div>
                <a href="` + ctx + `/coordinator/coordinator-dashboard.jsp" class="\${linkClasses('coordinator-dashboard.jsp')}">
                    <svg class="\${iconClasses('coordinator-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    <span class="truncate">Overview Dashboard</span>
                </a>
                <a href="` + ctx + `/coordinator/central-demand-pool.jsp" class="\${linkClasses('central-demand-pool.jsp')}">
                    <svg class="\${iconClasses('central-demand-pool.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    <span class="truncate">Central Demand Pool</span>
                </a>
                <a href="` + ctx + `/coordinator/rfq-management.jsp" class="\${linkClasses('rfq-management.jsp')}">
                    <svg class="\${iconClasses('rfq-management.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                    <span class="truncate">RFQ Management</span>
                </a>
                <a href="` + ctx + `/coordinator/shipments-dashboard.jsp" class="\${linkClasses('shipments-dashboard.jsp')}">
                    <svg class="\${iconClasses('shipments-dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
                    <span class="truncate">Shipments & Receive</span>
                </a>
                <a href="` + ctx + `/coordinator/warehouse-replenishment.jsp" class="\${linkClasses('warehouse-replenishment.jsp')}">
                    <svg class="\${iconClasses('warehouse-replenishment.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m8-14l-8 4m0 10l-8-4V7m8 14V11"/></svg>
                    <span class="truncate">Warehouse Stock Alerts</span>
                </a>
            `;
        }

        // 6. CUSTOMER (Updated with My Dashboard & My Orders)
        else if (role === "CUSTOMER") {
            menuHTML += `
                <div class="flex items-center gap-2 px-2 py-3 mt-4">
                    <span class="text-xs font-bold uppercase text-slate-400 tracking-wider">Customer Menu</span>
                </div>
                <a href="` + ctx + `/customer/dashboard.jsp" class="\${linkClasses('dashboard.jsp')}">
                    <svg class="\${iconClasses('dashboard.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    <span class="truncate">My Dashboard</span>
                </a>
                <a href="` + ctx + `/customer/my-orders.jsp" class="\${linkClasses('my-orders.jsp')}">
                    <svg class="\${iconClasses('my-orders.jsp')}" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                    <span class="truncate">My Orders</span>
                </a>
            `;
        }

        menuContainer.innerHTML = menuHTML;
    });
</script>