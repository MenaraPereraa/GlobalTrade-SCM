<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlobalTrade - Select Workspace</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-slate-50 font-sans min-h-screen flex flex-col items-center justify-center p-6">

<div class="max-w-4xl w-full text-center space-y-8">
    <div class="space-y-2">
        <span class="inline-block bg-indigo-100 text-indigo-700 font-semibold px-3 py-1 rounded-full text-sm">
            GlobalTrade SCM Portal
        </span>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Select Your Workspace</h1>
        <p class="text-slate-500">Please choose your department to proceed to login</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">

        <div onclick="goToLogin('WAREHOUSE_MANAGER')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">&#127970;</div>
            <div class="text-center">
                <h2 class="text-lg font-bold text-slate-800">Warehouse</h2>
                <p class="text-sm font-medium text-slate-500">Manage stocks & locations</p>
            </div>
            <span class="text-xs text-indigo-600 font-semibold">Proceed to Login &rarr;</span>
        </div>

        <div onclick="goToLogin('COORDINATOR')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">&#128203;</div>
            <div class="text-center">
                <h2 class="text-lg font-bold text-slate-800">Coordinator</h2>
                <p class="text-sm font-medium text-slate-500">Operations & scheduling</p>
            </div>
            <span class="text-xs text-blue-600 font-semibold">Proceed to Login &rarr;</span>
        </div>

        <div onclick="goToLogin('CUSTOMS_AGENT')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">&#128707;</div>
            <div class="text-center">
                <h2 class="text-lg font-bold text-slate-800">Customs Agent</h2>
                <p class="text-sm font-medium text-slate-500">Clearances & compliance</p>
            </div>
            <span class="text-xs text-amber-600 font-semibold">Proceed to Login &rarr;</span>
        </div>

        <div onclick="goToLogin('VENDOR_REPRESENTATIVE')" class="cursor-pointer group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 hover:shadow-xl transition-all duration-300 flex flex-col items-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">&#128666;</div>
            <div class="text-center">
                <h2 class="text-lg font-bold text-slate-800">Vendor</h2>
                <p class="text-sm font-medium text-slate-500">Replenishment & performance</p>
            </div>
            <span class="text-xs text-emerald-600 font-semibold">Proceed to Login &rarr;</span>
        </div>

    </div>
</div>

<script>
    function goToLogin(role) {
        window.location.href = 'login.jsp?role=' + encodeURIComponent(role);
    }
</script>

</body>
</html>