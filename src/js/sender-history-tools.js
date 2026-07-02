(function() {
    function searchSenderHistory() {
        const sender = document.getElementById("modalSearchInput").value.trim();
        let startDate = document.getElementById("startDate").value;
        let startTime = document.getElementById("startTime").value;
        let endDate = document.getElementById("endDate").value;
        let endTime = document.getElementById("endTime").value;

        if (!sender) {
            alert("Please enter a Sender ID");
            return;
        }

        startDate = startDate ? startDate + " " + (startTime || "00:00:00") : null;
        endDate = endDate ? endDate + " " + (endTime || "23:59:59") : null;

        ws.send(JSON.stringify({
            type: "fetch_history",
            sender: sender,
            start_date: startDate,
            end_date: endDate
        }));
    }

    function fetchSenderDetails(sender, month) {
        ws.send(JSON.stringify({
            type: "fetch_sender_details",
            sender: sender,
            month: month
        }));

        ws.addEventListener("message", function handleDetails(event) {
            const response = JSON.parse(event.data);

            if (response.type === "sender_details") {
                displaySenderDetails(response.details, sender, month);
                ws.removeEventListener("message", handleDetails);
            } else if (response.type === "error") {
                alert("Failed to fetch sender details: " + response.message);
                ws.removeEventListener("message", handleDetails);
            }
        });
    }

    function displaySenderDetails(details, sender, month) {
        const state = window.AppState;
        const tableBody = document.getElementById("senderDetailsTable");
        tableBody.innerHTML = "";
        state.originalSenderDetails = details;

        if (details.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='2'>No records found for this sender in the selected month.</td></tr>";
            return;
        }

        details.sort(function(a, b) {
            return new Date(b.time_received) - new Date(a.time_received);
        });

        details.forEach(function(entry) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${formatDate(entry.time_received)}</td>
                <td>${entry.message}</td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById("senderName").innerText = sender;
        document.getElementById("selectedMonth").innerText = month;
        document.getElementById("senderDetailsModal").style.display = "flex";
        document.getElementById("messageCount").textContent = details.length;
    }

    function closeSenderDetailsModal() {
        document.getElementById("senderDetailsModal").style.display = "none";
    }

    function formatDate(dateStr) {
        if (dateStr.includes("T")) {
            const date = new Date(dateStr);
            if (!isNaN(date)) {
                return date.toLocaleString();
            }
        }

        const parts = dateStr.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
        if (parts) {
            return new Date(
                parseInt(parts[3], 10),
                parseInt(parts[2], 10) - 1,
                parseInt(parts[1], 10),
                parseInt(parts[4], 10),
                parseInt(parts[5], 10),
                parseInt(parts[6], 10)
            ).toLocaleString();
        }

        return "Invalid Date";
    }

    function applySenderFilter() {
        const state = window.AppState;
        const fromDate = document.getElementById("filterFromDate").value;
        const toDate = document.getElementById("filterToDate").value;
        const fromTime = document.getElementById("filterFromTime").value || "00:00";
        const toTime = document.getElementById("filterToTime").value || "23:59";
        const filterMessage = document.getElementById("filterMessage").value.toLowerCase();
        const tableBody = document.getElementById("senderDetailsTable");
        tableBody.innerHTML = "";

        const fromDateTime = fromDate ? new Date(fromDate + "T" + fromTime) : null;
        const toDateTime = toDate ? new Date(toDate + "T" + toTime) : null;

        const filteredDetails = state.originalSenderDetails.filter(function(entry) {
            const fixedDateStr = entry.time_received.replace(/^(\d{2})-(\d{2})-(\d{4})/, "$3-$2-$1");
            const entryDate = new Date(fixedDateStr);
            if (isNaN(entryDate)) {
                return false;
            }

            const matchesMessage = !filterMessage || entry.message.toLowerCase().includes(filterMessage);
            return (!fromDateTime || entryDate >= fromDateTime) &&
                (!toDateTime || entryDate <= toDateTime) &&
                matchesMessage;
        });

        if (filteredDetails.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='2'>No matching records found.</td></tr>";
        } else {
            filteredDetails.forEach(function(entry) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${formatDate(entry.time_received)}</td>
                    <td>${entry.message}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        document.getElementById("messageCount").textContent = filteredDetails.length;
    }

    let filterTimeout;
    function debounceFilter() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(function() {
            applySenderFilter();
        }, 400);
    }

    function clearSenderFilter() {
        const state = window.AppState;
        document.getElementById("filterFromDate").value = "";
        document.getElementById("filterToDate").value = "";
        document.getElementById("filterFromTime").value = "";
        document.getElementById("filterToTime").value = "";
        document.getElementById("filterMessage").value = "";
        displaySenderDetails(
            state.originalSenderDetails,
            document.getElementById("senderName").innerText,
            document.getElementById("selectedMonth").innerText
        );
    }

    function plotFilteredTrail() {
        const sender = document.getElementById("modalSearchInput").value;
        const startDate = document.getElementById("startDate").value;
        const startTime = document.getElementById("startTime").value || "00:00:00";
        const endDate = document.getElementById("endDate").value;
        const endTime = document.getElementById("endTime").value || "23:59:59";

        if (!sender) {
            alert("Please enter a sender ID to plot the trail.");
            return;
        }

        ws.send(JSON.stringify({
            type: "fetch_history",
            sender: sender,
            start_date: startDate ? startDate + " " + startTime : null,
            end_date: endDate ? endDate + " " + endTime : null
        }));

        ws.addEventListener("message", function handleMessage(event) {
            const response = JSON.parse(event.data);

            if (response.type === "history_result" && response.history.length > 0) {
                plotTrailInModal(sender, response.history);
                ws.removeEventListener("message", handleMessage);
            } else if (response.type === "error") {
                alert("Error fetching trail data: " + response.message);
                ws.removeEventListener("message", handleMessage);
            } else if (response.type === "history_result" && response.history.length === 0) {
                alert("No journey recorded for this sender within the selected time range.");
                ws.removeEventListener("message", handleMessage);
            }
        });
    }

    function showMapInModal() {
        const state = window.AppState;
        document.getElementById("searchResultsWrapper").style.display = "none";
        document.getElementById("historyMap").style.display = "block";

        if (!state.historyMap) {
            state.historyMap = L.map("historyMap").setView([9.1, 125.5], 8);
            L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
                attribution: "&copy; Google"
            }).addTo(state.historyMap);
        }

        setTimeout(function() {
            state.historyMap.invalidateSize();
        }, 0);
    }

    function restoreTableInModal() {
        const state = window.AppState;
        document.getElementById("searchResultsWrapper").style.display = "block";
        document.getElementById("historyMap").style.display = "none";

        if (state.modalMarker) {
            state.historyMap.removeLayer(state.modalMarker);
            state.modalMarker = null;
        }
    }

    function plotTrailInModal(sender, locations) {
        const state = window.AppState;
        showMapInModal();

        if (state.historyTrailLayer) {
            state.historyMap.removeLayer(state.historyTrailLayer);
        }

        state.historyCircles.forEach(function(circle) {
            state.historyMap.removeLayer(circle);
        });
        state.historyCircles = [];

        const trailCoordinates = locations.map(function(entry) {
            return [entry.latitude, entry.longitude];
        });

        if (trailCoordinates.length > 1) {
            state.historyTrailLayer = L.polyline(trailCoordinates, {
                color: "#ff4500",
                weight: 1.5,
                opacity: 0.8
            }).addTo(state.historyMap);

            locations.forEach(function(entry) {
                const circle = L.circle([entry.latitude, entry.longitude], {
                    color: "#dfff00",
                    fillColor: "#dfff00",
                    fillOpacity: 0.8,
                    radius: 100
                }).addTo(state.historyMap);

                circle.bindPopup(`
                    <b>Sender:</b> ${entry.sender}<br>
                    <b>Time:</b> ${entry.time_received}<br>
                    <b>Location:</b> (${entry.latitude}, ${entry.longitude})<br>
                    <b>Message:</b> ${entry.message || "No message"}
                `);

                state.historyCircles.push(circle);
            });

            state.historyMap.fitBounds(state.historyTrailLayer.getBounds());
        } else {
            alert("Not enough data points to plot a trail.");
        }
    }

    function clearPlot() {
        const state = window.AppState;
        if (state.historyTrailLayer) {
            state.historyMap.removeLayer(state.historyTrailLayer);
            state.historyTrailLayer = null;
        }

        state.historyCircles.forEach(function(circle) {
            state.historyMap.removeLayer(circle);
        });
        state.historyCircles = [];
        restoreTableInModal();
        alert("Plot cleared. Table restored.");
    }

    function plotManualLocation(lat, lng, sender, time, message) {
        const state = window.AppState;
        showMapInModal();

        if (state.modalMarker) {
            state.historyMap.removeLayer(state.modalMarker);
        }

        state.modalMarker = L.marker([lat, lng], { icon: state.defaultIcon })
            .bindPopup(`
                <strong>${sender}</strong><br>
                Time: ${time}<br>
                Latitude: ${lat.toFixed(6)}<br>
                Longitude: ${lng.toFixed(6)}<br>
                Message: ${message}
            `)
            .addTo(state.historyMap);

        state.historyMap.setView([lat, lng], 12);
    }

    document.getElementById("startDate").addEventListener("change", searchSenderHistory);
    document.getElementById("endDate").addEventListener("change", searchSenderHistory);
    document.getElementById("startTime").addEventListener("change", searchSenderHistory);
    document.getElementById("endTime").addEventListener("change", searchSenderHistory);
    document.getElementById("modalSearchInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchSenderHistory();
        }
    });

    [document.getElementById("filterFromDate"), document.getElementById("filterToDate"),
        document.getElementById("filterFromTime"), document.getElementById("filterToTime")
    ].forEach(function(input) {
        if (input) {
            input.addEventListener("change", applySenderFilter);
        }
    });

    const messageInput = document.getElementById("filterMessage");
    if (messageInput) {
        messageInput.addEventListener("input", debounceFilter);
        messageInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                applySenderFilter();
            }
        });
    }

    Object.assign(window, {
        searchSenderHistory,
        fetchSenderDetails,
        displaySenderDetails,
        closeSenderDetailsModal,
        formatDate,
        applySenderFilter,
        clearSenderFilter,
        plotFilteredTrail,
        showMapInModal,
        restoreTableInModal,
        plotTrailInModal,
        clearPlot,
        plotManualLocation
    });
})();
