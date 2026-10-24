// public/auth-guard.js - Final Production Version

function checkAuth() {
    // 1. Safe retrieval of session from localStorage
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {
        console.error('Failed to parse user session:', e);
    }

    // Extract current page filename
    const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    const protectedPages = ['checkout.html', 'orders.html'];

    // 2. Guard Check for Protected Pages
    if (protectedPages.includes(currentPage) && (!user || !user.id)) {
        alert('Please log in first to access this page!');
        window.location.href = 'login.html';
        return;
    }

    // 3. Dynamic Header Update
    if (user && user.id) {
        const nav = document.querySelector('nav');
        if (nav) {
            // Remove existing Login and Register links
            const loginLink = nav.querySelector('a[href="login.html"]');
            const registerLink = nav.querySelector('a[href="register.html"]');
            
            if (loginLink) loginLink.remove();
            if (registerLink) registerLink.remove();

            // Clean up old badges/buttons if re-rendered
            const existingBadge = document.getElementById('user-badge');
            const existingLogoutBtn = document.getElementById('logout-btn');
            if (existingBadge) existingBadge.remove();
            if (existingLogoutBtn) existingLogoutBtn.remove();

            // Determine user display name
            const displayName = user.name || user.username || (user.email ? user.email.split('@')[0] : 'User');

            // Render User Badge
            const userBadge = document.createElement('span');
            userBadge.id = 'user-badge';
            userBadge.className = 'text-amber-400 text-xs font-semibold';
            userBadge.innerText = `Hi, ${displayName}`;

            // Render Logout Button
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logout-btn';
            logoutBtn.className = 'bg-stone-800 hover:bg-stone-700 border border-stone-700 px-3 py-1 text-stone-200 text-xs font-bold rounded transition ml-2';
            logoutBtn.innerText = 'Logout';
            logoutBtn.onclick = logout;

            nav.appendChild(userBadge);
            nav.appendChild(logoutBtn);
        }
    }
}

// Global logout function accessible by both dynamic and inline HTML triggers
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    alert('You have logged out.');
    window.location.href = 'index.html';
}

// Auto-run guard on DOM load
document.addEventListener('DOMContentLoaded', checkAuth);