<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Registration - Global Trade Portal</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
</head>
<body class="bg-gradient-to-br from-indigo-50 via-white to-slate-50 min-h-screen flex items-center justify-center p-4">

<div class="w-full max-w-lg">
    <!-- Logo / Header -->
    <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-slate-800 tracking-tight mb-2">Global Trade Portal</h1>
        <p class="text-slate-500">Vendor Registration</p>
    </div>

    <!-- Registration Card -->
    <div class="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Create Vendor Account</h2>
        <p class="text-sm text-slate-500 mb-8">Register your business to start trading. Your account will be reviewed before activation.</p>

        <form id="signupForm" class="space-y-5">
            <!-- Vendor Name -->
            <div>
                <label for="vendorName" class="block text-sm font-semibold text-slate-700 mb-2">Business Name *</label>
                <input type="text" id="vendorName" name="vendorName" placeholder="Your company name"
                       class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                       required>
            </div>

            <!-- Contact Email -->
            <div>
                <label for="contactEmail" class="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                <input type="email" id="contactEmail" name="contactEmail" placeholder="your@email.com"
                       class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                       required>
            </div>

            <!-- Category -->
            <div>
                <label for="category" class="block text-sm font-semibold text-slate-700 mb-2">Business Category</label>
                <select id="category" name="category"
                        class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                    <option value="">Select a category...</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Trading">Trading</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Services">Services</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <!-- Country Code -->
            <div>
                <label for="countryCode" class="block text-sm font-semibold text-slate-700 mb-2">Country Code *</label>
                <input type="text" id="countryCode" name="countryCode" placeholder="e.g. LK, US, SG"
                       maxlength="3"
                       class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition uppercase"
                       required>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="submitBtn"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2">
                <span id="submitText">Register Vendor</span>
                <span id="submitSpinner" class="hidden">
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </span>
            </button>

            <!-- Login Link -->
            <div class="pt-4 border-t border-slate-100 text-center">
                <p class="text-sm text-slate-600">Already have an account? <a href="${pageContext.request.contextPath}/login.jsp" class="font-semibold text-indigo-600 hover:text-indigo-700 transition">Login here</a></p>
            </div>
        </form>
    </div>

    <!-- Info Section -->
    <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg p-4 border border-slate-100 text-center">
            <div class="text-2xl font-bold text-indigo-600 mb-2">1</div>
            <p class="text-xs text-slate-600">Fill the form with your business details</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-slate-100 text-center">
            <div class="text-2xl font-bold text-indigo-600 mb-2">2</div>
            <p class="text-xs text-slate-600">Wait for approval from coordinators</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-slate-100 text-center">
            <div class="text-2xl font-bold text-indigo-600 mb-2">3</div>
            <p class="text-xs text-slate-600">Start trading once activated</p>
        </div>
    </div>
</div>

<!-- Toast Container -->
<div id="toastContainer" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"></div>

<script>
    const CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/vendor-signup.js"></script>
</body>
</html>

