function showDelayWarning(sender, minutes) {
    const safeId = `delay-alert-${sender.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const existingAlert = document.getElementById(safeId);
    const isPhone = window.innerWidth <= 600;
    const message = isPhone
        ? `Delay: <strong>${sender}</strong> inactive ${Math.floor(minutes)} min`
        : `Delay: <strong>${sender}</strong> has been inactive for ${Math.floor(minutes)} minutes!`;

    if (existingAlert) {
        existingAlert.innerHTML = message;
        adjustPopupPositions();
        return;
    }

    const alertDiv = document.createElement("div");
    alertDiv.id = safeId;
    alertDiv.innerHTML = message;
    alertDiv.style.background = "#a46b00ff";
    alertDiv.style.color = "black";
    alertDiv.style.padding = "10px 14px";
    alertDiv.style.borderRadius = "5px";
    alertDiv.style.position = "fixed";
    alertDiv.style.right = "16px";
    alertDiv.style.zIndex = 1400;
    alertDiv.style.pointerEvents = "none";
    alertDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    alertDiv.style.maxWidth = "280px";
    alertDiv.style.fontWeight = "600";
    alertDiv.style.fontSize = "14px";
    alertDiv.style.lineHeight = "1.4";
    alertDiv.style.transition = "top 0.2s ease";

    if (isPhone) {
        alertDiv.style.left = "auto";
        alertDiv.style.right = "10px";
        alertDiv.style.maxWidth = "180px";
        alertDiv.style.padding = "7px 10px";
        alertDiv.style.fontSize = "12px";
        alertDiv.style.lineHeight = "1.35";
        alertDiv.style.borderRadius = "10px";
    }

    document.body.appendChild(alertDiv);
    adjustPopupPositions();
}

function removeDelayWarning(sender) {
    const safeId = `delay-alert-${sender.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const alertDiv = document.getElementById(safeId);
    if (alertDiv) {
        alertDiv.remove();
        adjustPopupPositions();
    }
}

function adjustPopupPositions() {
    const remainingAlerts = document.querySelectorAll("[id^='delay-alert-']");
    const isPhone = window.innerWidth <= 600;
    const startTop = isPhone ? 72 : 90;
    const step = isPhone ? 54 : 64;

    remainingAlerts.forEach((alertDiv, index) => {
        alertDiv.style.top = `${index * step + startTop}px`;
    });
}
