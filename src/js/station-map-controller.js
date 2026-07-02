(function() {
    function removeStationLayers(sender) {
        const state = window.AppState;
        const markerKeys = [sender, sender + "_main", sender + "_boat"];

        markerKeys.forEach(function(key) {
            if (state.markers[key]) {
                if (state.map && state.map.hasLayer(state.markers[key])) {
                    state.map.removeLayer(state.markers[key]);
                }
                delete state.markers[key];
            }
        });

        if (state.trailLines[sender]) {
            if (state.map && state.map.hasLayer(state.trailLines[sender])) {
                state.map.removeLayer(state.trailLines[sender]);
            }
            delete state.trailLines[sender];
        }

        delete state.trails[sender];
        delete state.sosStatus[sender];
        delete state.helpStatus[sender];
        delete state.notFoundStatus[sender];
        removeSOSAlert(sender);
        removeDelayWarning(sender);
    }

    function getStationTiming(station) {
        const lastPacketTime = typeof station.last_packet_time === "number" ? station.last_packet_time : Date.now();
        const timeGapMinutes = Math.max(0, (Date.now() - lastPacketTime) / 60000);
        return { timeGapMinutes: timeGapMinutes, isDelayed: timeGapMinutes > 20, isVeryStale: timeGapMinutes > 24 * 60 };
    }

    function markerOpacityForTiming(timing) {
        if (timing.isVeryStale) {
            return { main: 0.3, boat: 0.22 };
        }
        if (timing.isDelayed) {
            return { main: 0.58, boat: 0.45 };
        }
        return { main: 1, boat: 1 };
    }

    function applyMarkerOpacity(marker, opacity) {
        if (!marker) {
            return;
        }

        marker.setOpacity(opacity);
        const element = marker.getElement && marker.getElement();
        if (element) {
            element.style.transition = "opacity 0.25s ease";
        }
    }

    function updateMap(stations) {
        const state = window.AppState;
        const activeSenders = new Set(stations.map(function(s) {
            return s.sender;
        }));

        Object.keys(state.markers).forEach(function(key) {
            if (key === "manualMarker") {
                return;
            }

            const sender = key.endsWith("_main")
                ? key.slice(0, -5)
                : key.endsWith("_boat")
                    ? key.slice(0, -5)
                    : key;

            if (!activeSenders.has(sender)) {
                removeStationLayers(sender);
            }
        });

        Object.keys(state.trailLines).forEach(function(sender) {
            if (!activeSenders.has(sender)) {
                removeStationLayers(sender);
            }
        });

        for (const sender in state.sosAlerts) {
            if (!activeSenders.has(sender)) {
                removeSOSAlert(sender);
            }
        }

        stations.forEach(function(station) {
            const lat = parseFloat(station.latitude);
            const lng = parseFloat(station.longitude);
            const sender = station.sender;
            const message = station.message || "";
            const place = (station.place || "Unknown").trim();
            const boatIcon = state.boatIcons[place] || state.boatIcons.Unknown;
            const timing = getStationTiming(station);
            const markerOpacity = markerOpacityForTiming(timing);
            const boatLat = lat + 0.00005;
            const boatLng = lng;
            const boatMarkerKey = sender + "_boat";
            const sosActive = station.sos_status === 1;
            const helpActive = station.help_status === 1;
            const notFoundActive = station.not_found_status === 1;

            if (sosActive && !helpActive) {
                if (!state.sosAlerts[sender]) {
                    showSOSAlert(sender);
                }
                state.sosAlerts[sender].style.background = "#8b0000";
                state.sosAlerts[sender].innerHTML = `SOS: <strong>${sender}</strong>`;
            } else if (helpActive) {
                if (!state.sosAlerts[sender]) {
                    showSOSAlert(sender);
                }
                state.sosAlerts[sender].style.background = "#28a745";
                state.sosAlerts[sender].innerHTML = `Help on the Way: <strong>${sender}</strong>`;
            } else if (notFoundActive) {
                if (!state.sosAlerts[sender]) {
                    showSOSAlert(sender);
                }
                state.sosAlerts[sender].style.background = "#555";
                state.sosAlerts[sender].innerHTML = `Not Found: <strong>${sender}</strong>`;
            } else {
                removeSOSAlert(sender);
            }

            if (timing.isDelayed) {
                showDelayWarning(sender, timing.timeGapMinutes);
            } else {
                removeDelayWarning(sender);
            }

            let icon;
            if (notFoundActive && !sosActive) {
                icon = state.notFoundIcon;
            } else if (sosActive) {
                icon = state.sosIcon;
            } else if (helpActive) {
                icon = state.helpIcon;
            } else {
                icon = state.defaultIcon;
            }

            if (state.markers[boatMarkerKey]) {
                state.markers[boatMarkerKey].setLatLng([boatLat, boatLng]).setIcon(boatIcon);
            } else {
                state.markers[boatMarkerKey] = L.marker([boatLat, boatLng], {
                    icon: boatIcon,
                    zIndexOffset: 1000
                }).bindPopup(`<strong>${sender}</strong><br>Place: ${place}`).addTo(state.map);
            }
            applyMarkerOpacity(state.markers[boatMarkerKey], markerOpacity.boat);

            const markerKey = sender + "_main";
            if (state.markers[markerKey]) {
                state.markers[markerKey].setLatLng([lat, lng]).setIcon(icon);
            } else {
                state.markers[markerKey] = L.marker([lat, lng], { icon: icon }).bindPopup(`<strong>${sender}</strong><br>Message: ${message}`).addTo(state.map);
            }
            applyMarkerOpacity(state.markers[markerKey], markerOpacity.main);

            const popupContent = `
                <div class="station-popup">
                    <h3>${sender}</h3>
                    <p><strong>Last Update:</strong> ${station.time_received}</p>
                    <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
                    <p><strong>Message:</strong> <span class="message-text">${message}</span></p>
                    ${station.battery_percentage !== null ? `<p><strong>Battery:</strong> ${station.battery_percentage}%</p>` : ""}
                    <p><strong>Inactive For:</strong> ${Math.floor(timing.timeGapMinutes)} minute(s)</p>
                    ${sosActive && !helpActive ? `<button class="popup-btn help-btn" onclick="markHelpOnWay('${sender}')">Help on the Way</button>` : ""}
                    ${(sosActive || helpActive || notFoundActive) ? `<button class="popup-btn safe-btn" onclick="markAsSafe('${sender}')">Mark as Safe</button>` : ""}
                    ${helpActive && !notFoundActive ? `<button class="popup-btn notfound-btn" onclick="markNotFound('${sender}')">Not Found</button>` : ""}
                </div>
            `;

            const finalPopupContent = isAdmin() ? popupContent : popupContent.replace(/<button class="popup-btn[\s\S]*?<\/button>/g, "");

            if (!state.markers[sender]) {
                state.markers[sender] = L.marker([lat, lng], { icon: icon, title: sender }).bindPopup(finalPopupContent).addTo(state.map);
                state.trails[sender] = [];
            } else {
                state.markers[sender].setLatLng([lat, lng]).setPopupContent(finalPopupContent).setIcon(icon);
            }

            state.trails[sender].push([lat, lng]);
            if (state.trails[sender].length > 20) {
                state.trails[sender].shift();
            }
        });
    }

    function markHelpOnWay(sender) {
        const state = window.AppState;
        if (!ensureAdminAccess("mark help on the way")) {
            return;
        }

        if (!confirm(`Are you sure you want to mark ${sender} as "Help on the Way"?`)) {
            return;
        }

        ws.send(JSON.stringify({ type: "help_on_way", sender: sender }));
        ws.addEventListener("message", function handleMessage(event) {
            const response = JSON.parse(event.data);
            if (response.type === "update") {
                alert("Help is on the way!");
                state.helpStatus[sender] = true;
                state.sosStatus[sender] = false;
                if (state.sosAlerts[sender]) {
                    state.sosAlerts[sender].style.background = "#28a745";
                    state.sosAlerts[sender].innerHTML = `Help on the Way: <strong>${sender}</strong>`;
                }
                updateMap(response.stations);
                ws.removeEventListener("message", handleMessage);
            } else if (response.type === "error") {
                alert("Failed to update message: " + response.message);
                ws.removeEventListener("message", handleMessage);
            }
        });
    }

    function markAsSafe(sender) {
        const state = window.AppState;
        if (!ensureAdminAccess("mark senders as safe")) {
            return;
        }

        if (!confirm(`Are you sure you want to mark ${sender} as "Safe"? This will reset the status.`)) {
            return;
        }

        ws.send(JSON.stringify({ type: "mark_safe", sender: sender }));
        ws.addEventListener("message", function handleMessage(event) {
            const response = JSON.parse(event.data);
            if (response.type === "update") {
                alert("Sender marked as safe!");
                removeSOSAlert(sender);
                delete state.sosStatus[sender];
                delete state.helpStatus[sender];
                delete state.notFoundStatus[sender];
                updateMap(response.stations);
                ws.removeEventListener("message", handleMessage);
            } else if (response.type === "error") {
                alert("Failed to update message: " + response.message);
                ws.removeEventListener("message", handleMessage);
            }
        });
    }

    function markNotFound(sender) {
        const state = window.AppState;
        if (!ensureAdminAccess("mark senders as not found")) {
            return;
        }

        if (!confirm(`Are you sure you want to mark ${sender} as "Not Found in Database"?`)) {
            return;
        }

        ws.send(JSON.stringify({ type: "not_found", sender: sender }));
        ws.addEventListener("message", function handleMessage(event) {
            const response = JSON.parse(event.data);
            if (response.type === "update") {
                alert("Sender marked as Not Found.");
                state.notFoundStatus[sender] = true;
                removeSOSAlert(sender);
                delete state.helpStatus[sender];
                updateMap(response.stations);
                ws.removeEventListener("message", handleMessage);
            } else if (response.type === "error") {
                alert("Failed to update message: " + response.message);
                ws.removeEventListener("message", handleMessage);
            }
        });
    }

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "update" && data.stations) {
                const state = window.AppState;
                state.allStations = data.stations;
                document.getElementById("fishermenCount").textContent = data.count || 0;
                updateMap(data.stations);
                data.stations.forEach(function(station) {
                    if (station.is_delayed) {
                        showDelayWarning(station.sender, station.time_gap_minutes);
                    } else {
                        removeDelayWarning(station.sender);
                    }
                });
            } else if (data.type === "search_result") {
                plotTrail(data.sender, data.locations);
            } else if (data.type === "history_result") {
                displaySenderHistory(data.history);
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    };

    setInterval(function() {
        const state = window.AppState;
        if (Array.isArray(state.allStations) && state.allStations.length > 0) {
            updateMap(state.allStations);
        }
    }, 60000);

    Object.assign(window, {
        removeStationLayers,
        getStationTiming,
        markerOpacityForTiming,
        applyMarkerOpacity,
        updateMap,
        markHelpOnWay,
        markAsSafe,
        markNotFound
    });
})();
