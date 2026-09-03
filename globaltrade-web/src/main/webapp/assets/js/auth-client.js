function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

function getAccessToken() {
    return getCookie('accessToken') || null;
}

function getCurrentUserRole() {
    const token = getAccessToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    const rawRole = payload.roles || payload.role || payload.authority || '';
    if (Array.isArray(rawRole)) {
        return rawRole[0] ? rawRole[0].toUpperCase() : '';
    }
    return rawRole ? rawRole.toUpperCase() : '';
}

function getCurrentUsername() {
    const token = getAccessToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return payload ? (payload.sub || payload.username) : null;
}

function requireAuth() {
    if (!getAccessToken()) {
        window.location.href = '/app/login.jsp';
    }
}

function requireRole(allowedRoles) {
    requireAuth();
    const currentRole = getCurrentUserRole();

    const upperAllowedRoles = allowedRoles.map(r => r.toUpperCase().trim());

    if (!currentRole || !upperAllowedRoles.includes(currentRole)) {
        console.warn(`Access Denied! User role: '${currentRole}', Allowed:`, upperAllowedRoles);
        window.location.href = '/globaltrade/unauthorized.jsp';
    }
}

async function fetchWithAuth(url, options = {}) {
    const accessToken = getAccessToken();
    options.headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + accessToken
    };
    options.credentials = 'include';

    let response = await fetch(url, options);

    if (response.status === 401) {
        console.warn('Access token expired. Attempting to refresh token...');

        const refreshResponse = await fetch('/globaltrade/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (refreshResponse.ok) {
            console.log('Token refreshed successfully. Retrying original request...');

            const newAccessToken = getCookie('accessToken');
            options.headers = {
                ...options.headers,
                'Authorization': 'Bearer ' + newAccessToken
            };

            response = await fetch(url, options);
        } else {
            console.error('Refresh token also expired. Redirecting to login...');
            window.location.href = '/app/login.jsp';
            return response;
        }
    }

    return response;
}

function logout() {
    document.cookie = "accessToken=; path=/; max-age=0";
    window.location.href = '/app/login.jsp';
}

const ROLE_LABELS = {
    'Warehouse Manager': 'Warehouse Manager Login',
    'Coordinator': 'Coordinator Login',
    'Custom Agent': 'Customs Agent Login',
    'Vendor Representative': 'Vendor Representative Login',
    'Admin': 'Administrator Login',
    'Customer': 'Customer Portal Login'
};

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const hintedRole = params.get('role');
    const titleEl = document.getElementById('loginTitle');
    if (hintedRole && titleEl && ROLE_LABELS[hintedRole]) {
        titleEl.textContent = ROLE_LABELS[hintedRole];
    }
});

function getRoleFromToken(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(decoded);
        console.log("DEBUG: Full JWT payload:", parsed);
        if (!parsed || !parsed.roles) {
            console.warn("DEBUG: No roles found in token");
            return null;
        }
        const role = Array.isArray(parsed.roles) ? parsed.roles[0] : parsed.roles;
        console.log("DEBUG: Extracted role from token:", role, "Type:", typeof role);
        return role;
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('errorMessage');

    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }

    try {
        const response = await fetch('/globaltrade/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(response.status === 401
                ? 'Invalid username or password.'
                : `Login failed (${response.status}). Please try again.`);
        }

        const data = await response.json();

        if (data.accessToken) {
            const userRole = getRoleFromToken(data.accessToken);
            redirectBasedOnRole(userRole);
        } else {
            throw new Error('Token not received from server.');
        }

    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.classList.remove('hidden');
        } else {
            alert(error.message || 'Login failed.');
        }
    }
}

function redirectBasedOnRole(role) {
    if (!role) {
        window.location.href = 'dashboard-select.jsp';
        return;
    }

    const normalizedRole = String(role).toUpperCase().replace(/^ROLE_/, '').replace(/[\s_]+/g, '');
    console.log("DEBUG: Normalized Role for redirection:", normalizedRole);

    switch (normalizedRole) {
        case 'ADMIN':
            window.location.href = 'admin/admin-dashboard.jsp';
            break;
        case 'WAREHOUSEMANAGER':
            window.location.href = 'warehouse-dashboard.jsp';
            break;
        case 'COORDINATOR':
            window.location.href = 'coordinator/coordinator-dashboard.jsp';
            break;
        case 'CUSTOMAGENT':
        case 'CUSTOMSAGENT':
            window.location.href = 'custom/customs-dashboard.jsp';
            break;
        case 'VENDORREPRESENTATIVE':
        case 'VENDORREP':
        case 'VENDOR':
            window.location.href = 'vendor/vendor-dashboard.jsp';
            break;
        case 'CUSTOMER':
        case 'CUSTOMERPORTAL':
            window.location.href = 'customer/customer-portal.jsp';
            break;
        default:
            window.location.href = 'dashboard-select.jsp';
    }
}