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

if (typeof window.initRoleAccess === "function") {
    window.initRoleAccess();
}
