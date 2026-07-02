(function() {
    function getAuthConfig() {
        return (window.CONFIG && window.CONFIG.AUTH) || {
            SESSION_KEY: "fisherlink_role",
            ADMIN_PASSWORD: "admin",
            USER_PASSWORD: "user"
        };
    }

    function isAdmin() {
        return window.AppState.currentRole === "admin";
    }

    function ensureAdminAccess(actionLabel) {
        if (isAdmin()) {
            return true;
        }

        alert("Only admin can " + actionLabel + ".");
        return false;
    }

    function openAuthModal() {
        const authModal = document.getElementById("authModal");
        const errorEl = document.getElementById("authError");
        const passwordInput = document.getElementById("rolePassword");

        if (typeof window.closeSidebar === "function") {
            window.closeSidebar();
        }

        if (errorEl) {
            errorEl.textContent = "";
        }
        if (passwordInput) {
            passwordInput.value = "";
        }
        if (authModal) {
            authModal.style.display = "flex";
        }
    }

    function closeAuthModal() {
        const authModal = document.getElementById("authModal");
        if (authModal) {
            authModal.style.display = "none";
        }
    }

    function updateRoleUI() {
        const state = window.AppState;
        const roleStatus = document.getElementById("roleStatus");
        const roleBadge = document.getElementById("roleBadge");
        const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
        const printReportBtn = document.getElementById("printReportBtn");

        if (roleStatus) {
            roleStatus.style.display = state.currentRole ? "flex" : "none";
        }

        if (roleBadge) {
            roleBadge.textContent = state.currentRole ? state.currentRole + " mode" : "";
        }

        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.style.display = state.currentRole ? "flex" : "none";
        }

        if (printReportBtn) {
            printReportBtn.style.display = isAdmin() ? "inline-flex" : "none";
        }

        if (Array.isArray(state.allStations) && state.allStations.length > 0 && typeof window.updateMap === "function") {
            window.updateMap(state.allStations);
        }
    }

    function loginWithRole() {
        const state = window.AppState;
        const auth = getAuthConfig();
        const roleSelect = document.getElementById("roleSelect");
        const passwordInput = document.getElementById("rolePassword");
        const errorEl = document.getElementById("authError");
        const selectedRole = roleSelect ? roleSelect.value : "user";
        const password = passwordInput ? passwordInput.value : "";

        const expectedPassword = selectedRole === "admin"
            ? auth.ADMIN_PASSWORD
            : auth.USER_PASSWORD;

        if (password !== expectedPassword) {
            if (errorEl) {
                errorEl.textContent = "Incorrect password.";
            }
            return;
        }

        state.currentRole = selectedRole;
        sessionStorage.setItem(auth.SESSION_KEY, selectedRole);
        closeAuthModal();
        updateRoleUI();
    }

    function logoutRole() {
        const state = window.AppState;
        const auth = getAuthConfig();
        state.currentRole = null;
        sessionStorage.removeItem(auth.SESSION_KEY);
        updateRoleUI();
        openAuthModal();
    }

    function initRoleAccess() {
        const state = window.AppState;
        const auth = getAuthConfig();
        const savedRole = sessionStorage.getItem(auth.SESSION_KEY);
        state.currentRole = savedRole === "admin" || savedRole === "user" ? savedRole : null;

        updateRoleUI();

        if (state.currentRole) {
            closeAuthModal();
        } else {
            openAuthModal();
        }

        const passwordInput = document.getElementById("rolePassword");
        if (passwordInput) {
            passwordInput.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    loginWithRole();
                }
            });
        }
    }

    Object.assign(window, {
        getAuthConfig,
        isAdmin,
        ensureAdminAccess,
        openAuthModal,
        closeAuthModal,
        updateRoleUI,
        loginWithRole,
        logoutRole,
        initRoleAccess
    });
})();
