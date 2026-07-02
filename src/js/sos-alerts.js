(function() {
    function showSOSAlert(sender) {
        const state = window.AppState;
        if (state.sosAlerts[sender]) {
            return;
        }

        let alertContainer = document.getElementById("sosAlertContainer");
        if (!alertContainer) {
            alertContainer = document.createElement("div");
            alertContainer.id = "sosAlertContainer";
            alertContainer.style.position = "fixed";
            alertContainer.style.top = "90px";
            alertContainer.style.left = "5px";
            alertContainer.style.display = "flex";
            alertContainer.style.flexDirection = "column";
            alertContainer.style.gap = "5px";
            alertContainer.style.zIndex = "1000";
            document.body.appendChild(alertContainer);
        }

        const alertDiv = document.createElement("div");
        alertDiv.className = "sosAlert";
        alertDiv.id = "sosAlert-" + sender;
        alertDiv.innerHTML = "SOS: <strong>" + sender + "</strong>";
        alertDiv.style.background = "#8b0000";
        alertDiv.style.color = "white";
        alertDiv.style.padding = "8px 12px";
        alertDiv.style.fontSize = "14px";
        alertDiv.style.fontWeight = "bold";
        alertDiv.style.margin = "20px";
        alertDiv.style.borderRadius = "5px";
        alertDiv.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.2)";
        alertDiv.style.minWidth = "200px";
        alertDiv.style.textAlign = "center";

        alertContainer.appendChild(alertDiv);
        state.sosAlerts[sender] = alertDiv;
    }

    function removeSOSAlert(sender) {
        const state = window.AppState;
        const alertDiv = document.getElementById("sosAlert-" + sender);
        if (alertDiv) {
            alertDiv.remove();
            delete state.sosAlerts[sender];
        }
    }

    Object.assign(window, {
        showSOSAlert,
        removeSOSAlert
    });
})();
