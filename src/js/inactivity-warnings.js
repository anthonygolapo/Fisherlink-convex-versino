function showDelayWarning(sender, minutes) {
    const safeId = `delay-alert-${sender.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const existingAlert = document.getElementById(safeId);

    if (existingAlert) {
        existingAlert.innerHTML = `Delay: <strong>${sender}</strong> has been inactive for ${Math.floor(minutes)} minutes!`;
        adjustPopupPositions();
        return;
    }

    const alertDiv = document.createElement("div");
    alertDiv.id = safeId;
    alertDiv.innerHTML = `Delay: <strong>${sender}</strong> has been inactive for ${Math.floor(minutes)} minutes!`;
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
    alertDiv.style.transition = "top 0.2s ease";

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
    remainingAlerts.forEach((alertDiv, index) => {
        alertDiv.style.top = `${index * 64 + 90}px`;
    });
}
