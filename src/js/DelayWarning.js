function showDelayWarning(sender, minutes) {
    const safeId = `delay-alert-${sender.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const existingAlert = document.getElementById(safeId);

    if (existingAlert) {
        existingAlert.innerHTML = `Delay: <strong>${sender}</strong> has been inactive for ${Math.floor(minutes)} minutes!`;
        return;
    }

    const alertDiv = document.createElement("div");
    alertDiv.id = safeId;
    alertDiv.innerHTML = `Delay: <strong>${sender}</strong> has been inactive for ${Math.floor(minutes)} minutes!`;
    alertDiv.style.background = "#a46b00ff";
    alertDiv.style.color = "black";
    alertDiv.style.padding = "8px";
    alertDiv.style.margin = "100px";
    alertDiv.style.borderRadius = "5px";
    alertDiv.style.position = "fixed";
    alertDiv.style.right = "-70px";
    alertDiv.style.zIndex = 1000;
    alertDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    alertDiv.style.maxWidth = "400px";

    const existingAlerts = document.querySelectorAll("[id^='delay-alert-']");
    const offsetTop = existingAlerts.length * 60 + 10;
    alertDiv.style.top = `${offsetTop}px`;

    document.body.appendChild(alertDiv);
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
        alertDiv.style.top = `${index * 60 + 10}px`;
    });
}
