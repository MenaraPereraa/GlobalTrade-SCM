<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Global Trade System</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/tailwind.css">
    <style>
        /* Fallback styles if CSS doesn't load */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 16px;
        }
        .max-w-md { 
            max-width: 28rem;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            padding: 32px;
        }
        h2 { 
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin: 0 0 24px 0;
            text-align: center;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label { 
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #475569;
            margin-bottom: 4px;
        }
        input { 
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input:focus { 
            outline: none;
            border-color: #818cf8;
            box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
        }
        button { 
            width: 100%;
            background-color: #4f46e5;
            color: white;
            padding: 8px 0;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
        }
        button:hover { 
            background-color: #4338ca;
        }
        .text-center { 
            text-align: center;
            margin-top: 16px;
        }
        a { 
            font-size: 14px;
            color: #4f46e5;
            text-decoration: none;
        }
        a:hover { 
            text-decoration: underline;
        }
        .hidden { 
            display: none;
        }
        #errorMessage { 
            margin-bottom: 16px;
            padding: 12px;
            background-color: #fee2e2;
            color: #dc2626;
            border-radius: 8px;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
    <h2 id="loginTitle" class="text-2xl font-bold text-slate-800 mb-6 text-center">System Login</h2>

    <div id="errorMessage" class="hidden mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm"></div>

    <form id="loginForm" onsubmit="handleLogin(event)">
        <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input type="text" id="username" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="admin, custom, warehouse">
        </div>
        <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" id="password" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold transition">Sign In</button>
    </form>

    <p class="text-center mt-4">
        <a href="dashboard-select.jsp" class="text-sm text-indigo-600 hover:underline">← Back to dashboard selection</a>
    </p>
</div>

<script src="${pageContext.request.contextPath}/assets/js/auth-client.js"></script>
</body>
</html>