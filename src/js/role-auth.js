(function() {
    function getAuthConfig() {
        return (window.CONFIG && window.CONFIG.AUTH) || {
            SESSION_KEY: "fisherlink_role",
            ADMIN_TOKEN_KEY: "fisherlink_admin_token",
            ADMIN_USERNAME_KEY: "fisherlink_admin_username"
        };
    }

    function isAdmin() {
        return window.AppState.currentRole === "admin" && Boolean(window.AppState.adminToken);
    }

    function ensureAdminAccess(actionLabel) {
        if (isAdmin()) {
            return true;
        }

        alert("Only admin can " + actionLabel + ".");
        return false;
    }

    function listenForResponse(handler) {
        function wrapped(event) {
            handler(JSON.parse(event.data), wrapped);
        }

        ws.addEventListener("message", wrapped);
    }

    function setAuthError(message) {
        const errorEl = document.getElementById("authError");
        if (errorEl) {
            errorEl.textContent = message || "";
        }
    }

    function setAdminCredentialsError(message) {
        const errorEl = document.getElementById("adminCredentialsError");
        if (errorEl) {
            errorEl.textContent = message || "";
        }
    }

    function setAdminSession(username, token) {
        const auth = getAuthConfig();
        const state = window.AppState;

        state.currentRole = "admin";
        state.adminToken = token;
        state.adminUsername = username;

        sessionStorage.setItem(auth.SESSION_KEY, "admin");
        sessionStorage.setItem(auth.ADMIN_TOKEN_KEY, token);
        sessionStorage.setItem(auth.ADMIN_USERNAME_KEY, username);
    }

    function setUserSession() {
        const auth = getAuthConfig();
        const state = window.AppState;

        state.currentRole = "user";
        state.adminToken = null;
        state.adminUsername = null;

        sessionStorage.setItem(auth.SESSION_KEY, "user");
        sessionStorage.removeItem(auth.ADMIN_TOKEN_KEY);
        sessionStorage.removeItem(auth.ADMIN_USERNAME_KEY);
    }

    function clearSession() {
        const auth = getAuthConfig();
        const state = window.AppState;

        state.currentRole = null;
        state.adminToken = null;
        state.adminUsername = null;

        sessionStorage.removeItem(auth.SESSION_KEY);
        sessionStorage.removeItem(auth.ADMIN_TOKEN_KEY);
        sessionStorage.removeItem(auth.ADMIN_USERNAME_KEY);
    }

    function showAuthChoice() {
        const subtitle = document.getElementById("authSubtitle");
        const choicePanel = document.getElementById("authChoicePanel");
        const adminPanel = document.getElementById("adminLoginPanel");
        const usernameInput = document.getElementById("adminUsername");
        const passwordInput = document.getElementById("adminPassword");

        setAuthError("");

        if (subtitle) {
            subtitle.textContent = "Choose how you want to continue.";
        }
        if (choicePanel) {
            choicePanel.style.display = "flex";
        }
        if (adminPanel) {
            adminPanel.style.display = "none";
        }
        if (usernameInput && !usernameInput.dataset.prefilled) {
            usernameInput.value = "";
        }
        if (passwordInput) {
            passwordInput.value = "";
        }
    }

    function showAdminLogin(defaultUsername) {
        const subtitle = document.getElementById("authSubtitle");
        const choicePanel = document.getElementById("authChoicePanel");
        const adminPanel = document.getElementById("adminLoginPanel");
        const usernameInput = document.getElementById("adminUsername");
        const passwordInput = document.getElementById("adminPassword");

        setAuthError("");

        if (subtitle) {
            subtitle.textContent = "Sign in as admin to manage data and responses.";
        }
        if (choicePanel) {
            choicePanel.style.display = "none";
        }
        if (adminPanel) {
            adminPanel.style.display = "flex";
        }
        if (usernameInput) {
            if (defaultUsername) {
                usernameInput.value = defaultUsername;
                usernameInput.dataset.prefilled = "true";
            } else if (!usernameInput.value) {
                usernameInput.dataset.prefilled = "";
            }
        }
        if (passwordInput) {
            passwordInput.value = "";
            setTimeout(function() {
                passwordInput.focus();
            }, 0);
        }
    }

    function openAuthModal() {
        const authModal = document.getElementById("authModal");

        if (typeof window.closeSidebar === "function") {
            window.closeSidebar();
        }

        showAuthChoice();

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
        const adminCredentialsBtn = document.getElementById("adminCredentialsBtn");

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

        if (adminCredentialsBtn) {
            adminCredentialsBtn.style.display = isAdmin() ? "flex" : "none";
        }

        if (typeof window.setInformationAdminUI === "function") {
            window.setInformationAdminUI();
        }

        if (typeof window.filterDetails === "function" && Array.isArray(state.detailsData) && state.detailsData.length > 0) {
            window.filterDetails();
        }

        if (Array.isArray(state.allStations) && state.allStations.length > 0 && typeof window.updateMap === "function") {
            window.updateMap(state.allStations);
        }
    }

    function enterUserMode() {
        setUserSession();
        closeAuthModal();
        updateRoleUI();
    }

    function loginAsAdmin() {
        const usernameInput = document.getElementById("adminUsername");
        const passwordInput = document.getElementById("adminPassword");
        const loginBtn = document.getElementById("loginBtn");
        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!username || !password) {
            setAuthError("Admin name and password are required.");
            return;
        }

        setAuthError("");

        if (loginBtn) {
            loginBtn.disabled = true;
        }

        ws.send(JSON.stringify({
            type: "admin_login",
            username: username,
            password: password
        }));

        listenForResponse(function(response, listener) {
            if (response.type === "admin_login") {
                ws.removeEventListener("message", listener);
                if (loginBtn) {
                    loginBtn.disabled = false;
                }
                setAdminSession(response.username, response.token);
                closeAuthModal();
                updateRoleUI();
            } else if (response.type === "error") {
                ws.removeEventListener("message", listener);
                if (loginBtn) {
                    loginBtn.disabled = false;
                }
                setAuthError(response.message || "Admin login failed.");
            }
        });
    }

    function openAdminCredentialsModal() {
        if (!ensureAdminAccess("change admin credentials")) {
            return;
        }

        const modal = document.getElementById("adminCredentialsModal");
        const usernameField = document.getElementById("currentAdminUsername");
        const currentPasswordField = document.getElementById("currentAdminPassword");
        const newUsernameField = document.getElementById("newAdminUsername");
        const newPasswordField = document.getElementById("newAdminPassword");
        const confirmPasswordField = document.getElementById("confirmAdminPassword");

        setAdminCredentialsError("");

        if (usernameField) {
            usernameField.value = window.AppState.adminUsername || "";
        }
        if (currentPasswordField) {
            currentPasswordField.value = "";
        }
        if (newUsernameField) {
            newUsernameField.value = window.AppState.adminUsername || "";
        }
        if (newPasswordField) {
            newPasswordField.value = "";
        }
        if (confirmPasswordField) {
            confirmPasswordField.value = "";
        }
        if (modal) {
            modal.style.display = "flex";
        }
    }

    function closeAdminCredentialsModal() {
        const modal = document.getElementById("adminCredentialsModal");
        if (modal) {
            modal.style.display = "none";
        }
        setAdminCredentialsError("");
    }

    function submitAdminCredentialsChange() {
        if (!ensureAdminAccess("change admin credentials")) {
            return;
        }

        const currentPassword = document.getElementById("currentAdminPassword").value;
        const newUsername = document.getElementById("newAdminUsername").value.trim();
        const newPassword = document.getElementById("newAdminPassword").value;
        const confirmPassword = document.getElementById("confirmAdminPassword").value;

        if (!currentPassword || !newUsername || !newPassword) {
            setAdminCredentialsError("All fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setAdminCredentialsError("New password and confirmation do not match.");
            return;
        }

        setAdminCredentialsError("");

        ws.send(JSON.stringify({
            type: "change_admin_credentials",
            current_password: currentPassword,
            new_username: newUsername,
            new_password: newPassword
        }));

        listenForResponse(function(response, listener) {
            if (response.type === "admin_credentials_changed") {
                ws.removeEventListener("message", listener);
                setAdminSession(response.username, response.token);
                closeAdminCredentialsModal();
                updateRoleUI();
                alert("Admin login details updated successfully.");
            } else if (response.type === "error") {
                ws.removeEventListener("message", listener);
                setAdminCredentialsError(response.message || "Failed to update admin credentials.");
            }
        });
    }

    function logoutRole() {
        const token = window.AppState.adminToken;
        const wasAdmin = isAdmin();

        if (wasAdmin && token) {
            ws.send(JSON.stringify({
                type: "admin_logout",
                token: token
            }));
        }

        clearSession();
        closeAdminCredentialsModal();
        updateRoleUI();
        openAuthModal();
    }

    function restoreUserSession() {
        setUserSession();
        closeAuthModal();
        updateRoleUI();
    }

    function restoreAdminSession(token) {
        ws.send(JSON.stringify({
            type: "verify_admin_session",
            token: token
        }));

        listenForResponse(function(response, listener) {
            if (response.type === "admin_session") {
                ws.removeEventListener("message", listener);
                if (response.valid) {
                    setAdminSession(response.username, token);
                    closeAuthModal();
                    updateRoleUI();
                } else {
                    clearSession();
                    openAuthModal();
                }
            } else if (response.type === "error") {
                ws.removeEventListener("message", listener);
                clearSession();
                openAuthModal();
            }
        });
    }

    function initRoleAccess() {
        const auth = getAuthConfig();
        const savedRole = sessionStorage.getItem(auth.SESSION_KEY);
        const savedToken = sessionStorage.getItem(auth.ADMIN_TOKEN_KEY);
        const savedUsername = sessionStorage.getItem(auth.ADMIN_USERNAME_KEY);
        const adminPasswordInput = document.getElementById("adminPassword");
        const adminUsernameInput = document.getElementById("adminUsername");

        if (adminUsernameInput && savedUsername) {
            adminUsernameInput.value = savedUsername;
            adminUsernameInput.dataset.prefilled = "true";
        }

        if (savedRole === "user") {
            restoreUserSession();
        } else if (savedRole === "admin" && savedToken) {
            window.AppState.adminUsername = savedUsername || null;
            restoreAdminSession(savedToken);
        } else {
            clearSession();
            openAuthModal();
            ws.send(JSON.stringify({ type: "fetch_auth_mode" }));
            listenForResponse(function(response, listener) {
                if (response.type === "auth_mode") {
                    ws.removeEventListener("message", listener);
                    if (response.defaultAdminUsername && adminUsernameInput && !adminUsernameInput.value) {
                        adminUsernameInput.value = response.defaultAdminUsername;
                        adminUsernameInput.dataset.prefilled = "true";
                    }
                } else if (response.type === "error") {
                    ws.removeEventListener("message", listener);
                }
            });
        }

        if (adminPasswordInput) {
            adminPasswordInput.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    loginAsAdmin();
                }
            });
        }
    }

    Object.assign(window, {
        getAuthConfig,
        isAdmin,
        ensureAdminAccess,
        showAuthChoice,
        showAdminLogin,
        openAuthModal,
        closeAuthModal,
        updateRoleUI,
        enterUserMode,
        loginAsAdmin,
        logoutRole,
        initRoleAccess,
        openAdminCredentialsModal,
        closeAdminCredentialsModal,
        submitAdminCredentialsChange
    });
})();
