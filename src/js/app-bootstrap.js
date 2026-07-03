function hoistModalToBody(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || modal.parentElement === document.body) {
        return;
    }

    document.body.appendChild(modal);
}

[
    "safeReportModal",
    "senderDetailsModal"
].forEach(hoistModalToBody);

function syncSidebarOffset() {
    const controls = document.getElementById("controls");
    const sidebar = document.getElementById("sidebar");

    if (!controls || !sidebar) {
        return;
    }

    const controlsRect = controls.getBoundingClientRect();
    const sidebarTop = Math.max(0, Math.ceil(controlsRect.bottom));
    document.documentElement.style.setProperty("--sidebar-top", sidebarTop + "px");
}

syncSidebarOffset();
window.addEventListener("resize", syncSidebarOffset);
window.addEventListener("orientationchange", syncSidebarOffset);
requestAnimationFrame(syncSidebarOffset);

if (typeof window.initRoleAccess === "function") {
    window.initRoleAccess();
}
