document.addEventListener("DOMContentLoaded", function () {
    requireAuth();

    const userRole = getCurrentUserRole();
    if (!userRole) {
        window.location.href = 'login.jsp';
        return;
    }

    const normalizedRole = String(userRole).toUpperCase().replace(/^ROLE_/, '').replace(/[\s_]+/g, '');

    if (normalizedRole === "ADMIN" || normalizedRole === "SUPERADMIN") {
        window.location.href = 'admin/admin-dashboard.jsp';
        return;
    }

    if (normalizedRole !== "ADMIN" && normalizedRole !== "SUPERADMIN") {
        redirectBasedOnRole(userRole);
        return;
    }

    const container = document.getElementById("dashboardContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div onclick="navigateTo('warehouse')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏢</div>
                <div class="text-center">
                    <h2 class="text-lg font-bold text-slate-800">Warehouse</h2>
                    <p class="text-sm font-medium text-slate-500">Manage stocks & locations</p>
                </div>
                <span class="text-xs text-indigo-600 font-semibold">Access Module →</span>
            </div>

            <div onclick="navigateTo('coordinator')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
                <div class="text-center">
                    <h2 class="text-lg font-bold text-slate-800">Coordinator</h2>
                    <p class="text-sm font-medium text-slate-500">Operations & scheduling</p>
                </div>
                <span class="text-xs text-blue-600 font-semibold">Access Module →</span>
            </div>

            <div onclick="navigateTo('customs')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛃</div>
                <div class="text-center">
                    <h2 class="text-lg font-bold text-slate-800">Customs Agent</h2>
                    <p class="text-sm font-medium text-slate-500">Clearances & compliance</p>
                </div>
                <span class="text-xs text-amber-600 font-semibold">Access Module →</span>
            </div>

            <div onclick="navigateTo('vendor')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
                <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🚚</div>
                <div class="text-center">
                    <h2 class="text-lg font-bold text-slate-800">Vendor</h2>
                    <p class="text-sm font-medium text-slate-500">Replenishment & performance</p>
                </div>
                <span class="text-xs text-emerald-600 font-semibold">Access Module →</span>
            </div>
        </div>
    `;
});

function navigateTo(module) {
    switch (module) {
        case 'warehouse':
            window.location.href = 'warehouse-dashboard.jsp';
            break;
        case 'coordinator':
            window.location.href = 'coordinator/coordinator-dashboard.jsp';
            break;
        case 'customs':
            window.location.href = 'custom/customs-dashboard.jsp';
            break;
        case 'vendor':
            window.location.href = 'vendor/vendor-dashboard.jsp';
            break;
    }
}