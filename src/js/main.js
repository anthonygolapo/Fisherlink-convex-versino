function showAllInfo() {
    const tableBody = document.querySelector("#infoTable tbody");
    tableBody.innerHTML = ""; // Clear previous content

    allStations.forEach(station => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${station.sender}</td>
            <td>${station.latitude}</td>
            <td>${station.longitude}</td>
            <td>${station.time_received}</td>
            <td>${station.message || "No message"}</td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("allInfoModal").style.display = "flex";
}


function openSearchModal() {
    document.getElementById("searchModal").style.display = "flex";
}

function closeSearchModal() {
    document.getElementById("searchModal").style.display = "none";
    document.getElementById("searchResults").innerHTML = "";
     // Clear results

    // Clear all date and time inputs
    document.getElementById("Date").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
    document.getElementById("modalSearchInput").value = "";
}







// Initialize map
  const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([9.1, 125.5], 8);

  // Add zoom control (bottom-left)
  L.control.zoom({
    position: 'bottomleft'
  }).addTo(map);

  // --- Define base map layers ---
  const roadMap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Road'
  });

  const satelliteMap = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Satellite'
  });

  const hybridMap = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Hybrid'
  });

  const terrainMap = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Terrain'
  });

  const darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CartoDB'
  });

  // --- Group all map layers ---
  const baseLayers = {
    "🗺️ Road Map": roadMap,
    "🛰️ Satellite": satelliteMap,
    "🧭 Hybrid": hybridMap,
    "🏞️ Terrain": terrainMap,
    "🌙 Dark Mode": darkMap
  };

  // Default layer
darkMap.addTo(map);

  // --- Add layer control (bottom-left, collapsed) ---
  L.control.layers(baseLayers, null, {
    collapsed: true,
    position: 'bottomleft'
  }).addTo(map);






// 🟦 Create a custom Leaflet control for the legend
// 🟦 Custom collapsible legend control
const boatLegend = L.control({ position: 'bottomleft' });

boatLegend.onAdd = function (map) {
    // Create main container div
    const container = L.DomUtil.create('div', 'leaflet-control leaflet-boat-legend');

    // Collapsed button (toggle)
    const toggleBtn = L.DomUtil.create('a', 'leaflet-boat-legend-toggle', container);
    toggleBtn.title = 'Boat Color Legend';

    // Legend content (hidden by default)
    const legendContent = L.DomUtil.create('div', 'leaflet-boat-legend-content', container);
    legendContent.style.display = 'none'; // collapsed initially

    // Define legend items
    const boatColors = {
        "Green": "Surigao City",
        "Blue": "Cabadbaran City",
        "Pink": "Butuan City",
        "Yellow": "Nasipit",
        "Gray": "Unknown"
    };

    let legendHTML = '<h4>🚤 Boat Color Legend</h4>';
    for (const [color, label] of Object.entries(boatColors)) {
        legendHTML += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="
                    width: 16px;
                    height: 16px;
                    background-color: ${color.toLowerCase()};
                    border: 1px solid #444;
                    margin-right: 6px;
                    border-radius: 3px;
                "></div>
                <span>${label}</span>
            </div>
        `;
    }

    legendContent.innerHTML = legendHTML;

    // ✅ Toggle expand/collapse on click
    L.DomEvent.on(toggleBtn, 'click', function (e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        const visible = legendContent.style.display === 'block';
        legendContent.style.display = visible ? 'none' : 'block';
    });

    return container;
};

boatLegend.addTo(map);








// 🛥️ Boat icons by place
const boatIcons = {
    "Butuan": L.icon({
        iconUrl: "public/assets/markers/sail-boat.png", // Boat icon image
        iconSize: [20, 20],
        iconAnchor: [9, -2],
        popupAnchor: [0, -10],
        className: "boat-icon-red"
    }),
    "Surigao": L.icon({
        iconUrl: "public/assets/markers/sail-surigao-boat.png",
        iconSize: [20, 20],
        iconAnchor: [9, -2],
        popupAnchor: [0, -10],
        className: "boat-icon-blue"
    }),
    "Nasipit": L.icon({
        iconUrl: "public/assets/markers/sail-nasipit-boat.png",
        iconSize: [20, 20],
        iconAnchor: [9, -2],
        popupAnchor: [0, -10],
        className: "boat-icon-green"
    }),
    "Cabadbaran": L.icon({
        iconUrl: "public/assets/markers/sail-cabadbaran-boat.png",
        iconSize: [20, 20],
        iconAnchor: [9, -2],
        popupAnchor: [0, -10],
        className: "boat-icon-green"
    }),
    "Unknown": L.icon({
        iconUrl: "public/assets/markers/sail-Unknown-boat.png",
        iconSize: [20, 20],
        iconAnchor: [9, -2],
        popupAnchor: [0, -10],
        className: "boat-icon-gray"
    })
};







const markers = {};
const trails = {};
const trailLines = {}; // Store polyline layers


const defaultIcon = L.icon({
    iconUrl: 'public/assets/markers/mark-blue.png',
    iconSize: [50, 50],
    iconAnchor: [26, 46],
    popupAnchor: [1, -34]
});


const sosIcon = L.icon({
    iconUrl: 'public/assets/markers/mark-red.png',
    iconSize: [50, 50],
    iconAnchor: [26, 46],
    popupAnchor: [1, -34]
});

const helpIcon = L.icon({
    iconUrl: 'public/assets/markers/mark-green.png',
    iconSize: [50, 50],
    iconAnchor: [26, 46],
    popupAnchor: [1, -34]
});

const notFoundIcon = L.icon({
    iconUrl: 'public/assets/markers/mark-gray.png',
    iconSize: [50, 50],
    iconAnchor: [26, 46],
    popupAnchor: [1, -34]
});


let allStations = [];

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("WebSocket received:", data); // Debugging log

        if (data.type === "update" && data.stations) {
            allStations = data.stations;
            document.getElementById("fishermenCount").textContent = data.count || 0;
            updateMap(data.stations);

            // ✅ Check for delayed senders
            data.stations.forEach(station => {
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
        } else {
            console.warn("Received unknown data type:", data);
        }
    } catch (error) {
        console.error("Error processing WebSocket message:", error);
    }
};



function updateMap(stations) { 
    // 🟢 Step 1: Sync SOS alerts globally (before looping)
    const activeSenders = new Set(stations.map(s => s.sender));
    for (const sender in sosAlerts) {
        if (!activeSenders.has(sender)) {
            removeSOSAlert(sender); // Remove alerts for senders no longer active
        }
    }

    stations.forEach(station => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);
        const sender = station.sender;
        const message = station.message || "";
        const place = (station.place || "Unknown").trim();
        const boatIcon = boatIcons[place] || boatIcons["Unknown"];

        const boatLat = lat + 0.00005;
        const boatLng = lng;
        const boatMarkerKey = `${sender}_boat`;

        // 🟡 Step 2: Sync SOS/Help/Not Found alerts with database
        const sosActive = station.sos_status === 1;
        const helpActive = station.help_status === 1;
        const notFoundActive = station.not_found_status === 1;

        if (sosActive && !helpActive) {
            if (!sosAlerts[sender]) showSOSAlert(sender);
            sosAlerts[sender].style.background = "#8b0000";
            sosAlerts[sender].innerHTML = `🚨 <strong>SOS:</strong> ${sender}`;
        } 
        else if (helpActive) {
            if (!sosAlerts[sender]) showSOSAlert(sender);
            sosAlerts[sender].style.background = "#28a745";
            sosAlerts[sender].innerHTML = `✅ <strong>Help on the Way:</strong> ${sender}`;
        } 
        else if (notFoundActive) {
            if (!sosAlerts[sender]) showSOSAlert(sender);
            sosAlerts[sender].style.background = "#555";
            sosAlerts[sender].innerHTML = `⚠️ <strong>Not Found:</strong> ${sender}`;
        } 
        else {
            removeSOSAlert(sender); // Safe or cleared
        }

        // 🧭 Step 3: Choose marker icon based on status
        let icon;
        if (notFoundActive && !sosActive) {
            icon = notFoundIcon;
        } else if (sosActive) {
            icon = sosIcon;
        } else if (helpActive) {
            icon = helpIcon;
        } else {
            icon = defaultIcon;
        }

        // 🛥️ Step 4: Update or create boat marker
        if (markers[boatMarkerKey]) {
            markers[boatMarkerKey].setLatLng([boatLat, boatLng]).setIcon(boatIcon);
        } else {
            markers[boatMarkerKey] = L.marker([boatLat, boatLng], {
                icon: boatIcon,
                zIndexOffset: 1000
            })
            .bindPopup(`<strong>${sender}</strong><br>Place: ${place}`)
            .addTo(map);
        }

        // 📍 Step 5: Main marker logic
        const markerKey = `${sender}_main`;
        if (markers[markerKey]) {
            markers[markerKey].setLatLng([lat, lng]).setIcon(icon);
        } else {
            markers[markerKey] = L.marker([lat, lng], { icon })
                .bindPopup(`<strong>${sender}</strong><br>Message: ${message}`)
                .addTo(map);
        }

        // 📝 Step 6: Popup with action buttons
        const popupContent = `
        <div class="station-popup">
            <h3>${sender}</h3>
            <p><strong>Last Update:</strong> ${station.time_received}</p>
            <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
            <p><strong>Message:</strong> <span class="message-text">${message}</span></p>
            ${station.battery_percentage !== null ? `<p><strong>Battery:</strong> ${station.battery_percentage}%</p>` : ''}

            ${sosActive && !helpActive ? `<button class="popup-btn help-btn" onclick="markHelpOnWay('${sender}')">🚑 Help on the Way</button>` : ''}
            ${(sosActive || helpActive || notFoundActive) ? `<button class="popup-btn safe-btn" onclick="markAsSafe('${sender}')">✅ Mark as Safe</button>` : ''}
            ${helpActive && !notFoundActive ? `<button class="popup-btn notfound-btn" onclick="markNotFound('${sender}')">❌ Not Found</button>` : ''}
        </div>
        `;

        if (!markers[sender]) {
            markers[sender] = L.marker([lat, lng], { icon, title: sender })
                .bindPopup(popupContent)
                .addTo(map);
            trails[sender] = [];
        } else {
            markers[sender].setLatLng([lat, lng])
                .setPopupContent(popupContent)
                .setIcon(icon);
        }

        // 🧵 Step 7: Update trail
        trails[sender].push([lat, lng]);
        if (trails[sender].length > 20) trails[sender].shift();
    });
}






// **Function to Mark Help on the Way**
// **Function to Mark Help on the Way**
function markHelpOnWay(sender) {
    if (!confirm(`Are you sure you want to mark ${sender} as "Help on the Way"?`)) {
        return;
    }

    ws.send(JSON.stringify({
        type: "help_on_way",
        sender: sender
    }));

    ws.addEventListener("message", function handleMessage(event) {
        const response = JSON.parse(event.data);

        if (response.type === "update") {
            alert("Help is on the way!");
            helpStatus[sender] = true;  // Mark as Help on the Way
            sosStatus[sender] = false;  // Remove SOS state if Help is given

            // ✅ Change the alert to green if it exists
            if (sosAlerts[sender]) {
                sosAlerts[sender].style.background = "#28a745";  // Green for Help on the Way
                sosAlerts[sender].innerHTML = `✅ <strong>Help on the Way:</strong> ${sender}`;
            }

            updateMap(response.stations);
            ws.removeEventListener("message", handleMessage);
        } else if (response.type === "error") {
            alert("Failed to update message: " + response.message);
            ws.removeEventListener("message", handleMessage);
        }
    });
}


// **Function to Mark as Safe**
// ✅ Function to Mark as Safe
function markAsSafe(sender) {
    if (!confirm(`Are you sure you want to mark ${sender} as "Safe"? This will reset the status.`)) {
        return;
    }

    ws.send(JSON.stringify({
        type: "mark_safe",
        sender: sender
    }));

    ws.addEventListener("message", function handleMessage(event) {
        const response = JSON.parse(event.data);

        if (response.type === "update") {
            alert("Sender marked as safe!");
            removeSOSAlert(sender); // ✅ Remove alert when marked Safe
            delete sosStatus[sender];
            delete helpStatus[sender];
            delete notFoundStatus[sender];
            updateMap(response.stations);
            ws.removeEventListener("message", handleMessage);
        } else if (response.type === "error") {
            alert("Failed to update message: " + response.message);
            ws.removeEventListener("message", handleMessage);
        }
    });
}




function markNotFound(sender) {
    if (!confirm(`Are you sure you want to mark ${sender} as "Not Found in Database"?`)) {
        return;
    }

    ws.send(JSON.stringify({
        type: "not_found",
        sender: sender
    }));

    ws.addEventListener("message", function handleMessage(event) {
        const response = JSON.parse(event.data);

        if (response.type === "update") {
            alert("Sender marked as Not Found.");
            notFoundStatus[sender] = true;  // Mark sender as Not Found (Gray)

            // ✅ Remove SOS/Help alert when Not Found is marked
            removeSOSAlert(sender);  // This will remove any active alert

            // ✅ Clear the help status to remove the green alert
            delete helpStatus[sender];

            updateMap(response.stations); // Update map after marking
            ws.removeEventListener("message", handleMessage);
        } else if (response.type === "error") {
            alert("Failed to update message: " + response.message);
            ws.removeEventListener("message", handleMessage);
        }
    });
}












const sosAlerts = {}; // Store active alerts

function showSOSAlert(sender) {
    // Check if alert already exists for this sender
    if (sosAlerts[sender]) return;

    // Get or create the alert container
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

    // Create a new alert box
    let alertDiv = document.createElement("div");
    alertDiv.className = "sosAlert";
    alertDiv.id = `sosAlert-${sender}`;
    alertDiv.innerHTML = `🚨 <strong>SOS:</strong> ${sender}`;

    // Style the alert by default as red (SOS)
    alertDiv.style.background = "#8b0000"; // Default: Dark Red
    alertDiv.style.color = "white";
    alertDiv.style.padding = "8px 12px";
    alertDiv.style.fontSize = "14px";
    alertDiv.style.fontWeight = "bold";
    alertDiv.style.margin = "20px";
    alertDiv.style.borderRadius = "5px";
    alertDiv.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.2)";
    alertDiv.style.minWidth = "200px";
    alertDiv.style.textAlign = "center";

    // Add the new alert to the container
    alertContainer.appendChild(alertDiv);

    // Store the alert reference
    sosAlerts[sender] = alertDiv;
}


// ✅ Function to remove SOS alert when marked "Safe"
function removeSOSAlert(sender) {
    let alertDiv = document.getElementById(`sosAlert-${sender}`);
    if (alertDiv) {
        alertDiv.remove(); // Remove alert from UI
        delete sosAlerts[sender]; // Remove from tracking object
    }
}












function printSafeReport() {
    let printWindow = window.open('', '', 'width=800,height=600'); // Open new print window
    printWindow.document.write('<html><head><title>Monthly SOS Report</title>');

    // Add styles to make text solid black and table readable
    printWindow.document.write(`
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; color: black; }
            h2 { color: black; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 5px; text-align: center; color: black; }
            th { background-color: #d3d3d3; color: black; } /* Light gray header, black text */
            tr:nth-child(even) { background-color: #f2f2f2; color: black; }
            tr:nth-child(odd) { background-color: #ffffff; color: black; }
            @media print { /* Remove print button when printing */
                #printReportBtn { display: none; }
            }
        </style>
    `);

    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>📊FisherLink Monthly SOS Report</h2>');


    // Get the table HTML from the existing table
    let tableHTML = document.querySelector(".styled-table").outerHTML;
    printWindow.document.write(tableHTML);

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print(); // Open print dialog
}




let detailsData = []; // Store original data for filtering

function fetchInformation() {
    // ✅ Check if WebSocket is connected before sending a message
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("⚠️ Convex backend not connected. Please configure CONVEX_URL and run Convex.");
        // Optional: still open the modal even without data
        document.getElementById("detailsModal").style.display = "flex";
        return;
    }

    // ✅ Open modal immediately
    document.getElementById("detailsModal").style.display = "flex";
    ws.send(JSON.stringify({ type: "fetch_information" }));

    ws.addEventListener("message", function handleInfo(event) {
        const response = JSON.parse(event.data);

        if (response.type === "information_data") {
            const tableBody = document.getElementById("detailsTable");
            const addressDropdown = document.getElementById("addressFilter");
            tableBody.innerHTML = "";
            addressDropdown.innerHTML = '<option value="">All Addresses</option>'; // Reset dropdown
            detailsData = response.info; // Store original data for filtering

            // ✅ Update fishermen count in Information Details modal
            document.getElementById("infoFishermenCount").textContent = response.info.length;

            let uniqueAddresses = new Set();

            if (response.info.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='7'>No data available.</td></tr>";
            } else {
                response.info.forEach(row => {
                    let newRow = document.createElement("tr");

                    // ✅ Include new fields: boat_color, engine_type, boat_length
                    newRow.innerHTML = `
                        <td>${row.id}</td>
                        <td>${row.name}</td>
                        <td class="clickable-callsign" onclick="fetchHistoryByCallsign('${row.callsign}')">${row.callsign}</td>
                        <td>${row.address}</td>
                        <td>${row.phone_number}</td>
                        <td style="text-align: left; display: flex; align-items: center; margin-left: 70px;">
                            <div class="color-box" style="background-color: ${row.boat_color.toLowerCase()};"></div>
                            ${row.boat_color}
                        </td>
                        <td>${row.engine_type || "N/A"}</td>
                        <td>${row.boat_length ? row.boat_length + " m" : "N/A"}</td>
                    `;

                    tableBody.appendChild(newRow);
                    uniqueAddresses.add(row.address); // Collect unique addresses
                });
            }

            // Populate address filter dropdown
            uniqueAddresses.forEach(address => {
                let option = document.createElement("option");
                option.value = address;
                option.textContent = address;
                addressDropdown.appendChild(option);
            });

            // Ensure the modal is displayed properly
            let modal = document.getElementById("detailsModal");
            modal.style.display = "flex"; // Open modal
            ws.removeEventListener("message", handleInfo);
        } else if (response.type === "error") {
            ws.removeEventListener("message", handleInfo);
        }
    });
}








function fetchHistoryByCallsign(callsign) {
    // ✅ Close the Fishermen's Information Modal
    document.getElementById("detailsModal").style.display = "none";

    // ✅ Open the Fishermen's History Modal
    document.getElementById("searchModal").style.display = "flex";

    // ✅ Set the search input in the history modal to the clicked callsign
    document.getElementById("modalSearchInput").value = callsign;

    // ✅ Fetch the history automatically
    searchSenderHistory();
}









function filterDetails() {
    const searchQuery = document.getElementById("detailsSearchInput").value.toLowerCase();
    const selectedAddress = document.getElementById("addressFilter").value;
    const tableBody = document.getElementById("detailsTable");

    tableBody.innerHTML = ""; // Clear previous results

    let filteredData = detailsData.filter(row => {
        // Combine all relevant fields into one searchable string
        const rowData = `
            ${row.id}
            ${row.name}
            ${row.callsign}
            ${row.address}
            ${row.phone_number}
            ${row.boat_color || ""}
            ${row.engine_type || ""}
            ${row.boat_length || ""}
        `.toLowerCase();

        const matchesSearch = rowData.includes(searchQuery);
        const matchesAddress = selectedAddress === "" || row.address === selectedAddress;
        return matchesSearch && matchesAddress;
    });

    if (filteredData.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='8' style='text-align:center;'>No matching data.</td></tr>";
    } else {
        filteredData.forEach(row => {
            let newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td>${row.id}</td>
                <td>${row.name}</td>
                <td class="clickable-callsign" onclick="fetchHistoryByCallsign('${row.callsign}')">${row.callsign}</td>
                <td>${row.address}</td>
                <td>${row.phone_number}</td>
                <td style="text-align: left; display: flex; align-items: center; margin-left: 70px;">
                    <div class="color-box" style="background-color: ${row.boat_color.toLowerCase()};"></div>
                    ${row.boat_color}
                </td>
                <td>${row.engine_type || "N/A"}</td>
                <td>${row.boat_length ? row.boat_length + " m" : "N/A"}</td>
            `;
            tableBody.appendChild(newRow);
        });
    }

    // ✅ Update fishermen count based on filtered results
    document.getElementById("infoFishermenCount").textContent = filteredData.length;
}






function closeDetailsModal() {
    document.getElementById("detailsModal").style.display = "none";
}


function searchAndPlotCoordinates() {
    const input = document.getElementById("coordSearchInput").value.trim();

    // Remove marker if search bar is empty
    if (input === "") {
        if (markers["manualMarker"]) {
            map.removeLayer(markers["manualMarker"]);
            delete markers["manualMarker"]; // Remove reference
        }
        return; // Stop execution
    }

    // Regular expression to match coordinates format "12.7509, 139.2009"
    const coordPattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = input.match(coordPattern);

    if (!match) {
        alert("Invalid format! Please enter coordinates in 'latitude, longitude' format.");
        return;
    }

    // Extract latitude and longitude
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);

    // Remove previous marker if it exists
    if (markers["manualMarker"]) {
        map.removeLayer(markers["manualMarker"]);
    }

    // Create a new marker
    let newMarker = L.marker([lat, lng], { icon: defaultIcon })
        .bindPopup(`<strong>Manual Plot</strong><br>Latitude: ${lat}<br>Longitude: ${lng}`)
        .addTo(map);

    markers["manualMarker"] = newMarker; // Store marker reference

    // Move map to the entered location
    map.setView([lat, lng], 12);
}

document.getElementById("coordSearchInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchAndPlotCoordinates();
    }
});

// Event listener to remove marker when input is cleared
document.getElementById("coordSearchInput").addEventListener("input", function () {
    if (this.value.trim() === "") {
        if (markers["manualMarker"]) {
            map.removeLayer(markers["manualMarker"]);
            delete markers["manualMarker"]; // Remove reference
        }
    }
});






// ✅ Plot the selected location inside the modal map
function plotManualLocation(lat, lng, sender, time, message) {
    // Show the map in the modal and hide the table
    showMapInModal(); // Switch to the map inside the modal

    // Clear previous modal marker if it exists
    if (modalMarker) {
        historyMap.removeLayer(modalMarker);
    }

    // Create a new marker for the selected location
    modalMarker = L.marker([lat, lng], { icon: defaultIcon })
        .bindPopup(`
            <strong>${sender}</strong><br>
            Time: ${time}<br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lng.toFixed(6)}<br>
            Message: ${message}
        `)
        .addTo(historyMap);

    // Center and zoom on the plotted location inside the modal
    historyMap.setView([lat, lng], 12);
}












function fetchSafeReport() {
    // ✅ Check if WebSocket is connected before sending a message
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("⚠️ Convex backend not connected. Please configure CONVEX_URL and run Convex.");
        // Optional: still open the modal so the user can see it
        document.getElementById("safeReportModal").style.display = "flex";
        return;
    }

    // ✅ Open modal immediately
    document.getElementById("safeReportModal").style.display = "flex";

    // Send WebSocket request
    ws.send(JSON.stringify({
        type: isSenderReport ? "sender_report" : "safe_report"
    }));

    ws.addEventListener("message", function handleReport(event) {
        const response = JSON.parse(event.data);

        if (response.type === "safe_report" || response.type === "sender_report") {
            const tableBody = document.getElementById("safeReportTable");
            const tableHeader = document.getElementById("safeReportHeader");

            tableBody.innerHTML = "";

            // ✅ Dynamically update table header based on report type with colors directly added
            if (isSenderReport) {
                tableHeader.innerHTML = `
                    <tr>
                        <th style="background-color: #0047AB; color: white;">Month</th>
                        <th style="background-color: #0047AB; color: white;">Sender</th>
                        <th style="background-color: #b40000; color: white;">SOS Count ℹ️</th>
                        <th style="background-color: #006700; color: white;">Mark as Safe Count ℹ️</th>
                        <th style="background-color: #676767; color: white;">Not Found Count ℹ️</th>
                    </tr>
                `;
            } else {
                tableHeader.innerHTML = `
                    <tr>
                        <th style="background-color: #0047AB; color: white;">Month</th>
                        <th style="background-color: #b40000; color: white;">SOS Count ℹ️</th>
                        <th style="background-color: #006700; color: white;">Mark as Safe Count ℹ️</th>
                        <th style="background-color: #676767; color: white;">Not Found Count ℹ️</th>
                    </tr>
                `;
            }

            if (response.report.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>No records found.</td></tr>";
            } else {
                response.report.forEach(row => {
                    let newRow = document.createElement("tr");

                    if (isSenderReport) {
                        newRow.innerHTML = `
                            <td>${row.month || "N/A"}</td>
                            <td>
                                <span class="clickable-callsign" onclick="fetchSenderDetails('${row.sender}', '${row.month}')">
                                    ${row.sender}
                                </span>
                            </td>
                            <td>${row.sos_count || 0}</td>
                            <td>${row.safe_count || 0}</td>
                            <td>${row.not_found_count || 0}</td>
                        `;
                    } else {
                        newRow.innerHTML = `
                            <td>${row.month}</td>
                            <td>${row.sos_count || 0}</td>
                            <td>${row.safe_count || 0}</td>
                            <td>${row.not_found_count || 0}</td>
                        `;
                    }
                    tableBody.appendChild(newRow);
                });
            }

            document.getElementById("safeReportModal").style.display = "flex";
        } else if (response.type === "error") {
            alert("Error fetching report: " + response.message);
            ws.removeEventListener("message", handleReport);
        } else {
            return;
        }
        ws.removeEventListener("message", handleReport);
    });
}







function closeSafeReportModal() {
    document.getElementById("safeReportModal").style.display = "none";
}




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

    // Ensure date and time are combined correctly
    startDate = startDate ? `${startDate} ${startTime || '00:00:00'}` : null;
    endDate = endDate ? `${endDate} ${endTime || '23:59:59'}` : null;

    ws.send(JSON.stringify({
        type: "fetch_history",
        sender: sender,
        start_date: startDate,
        end_date: endDate
    }));
}

// Automatically fetch history when date inputs change
document.getElementById("startDate").addEventListener("change", searchSenderHistory);
document.getElementById("endDate").addEventListener("change", searchSenderHistory);
document.getElementById("startTime").addEventListener("change", searchSenderHistory);
document.getElementById("endTime").addEventListener("change", searchSenderHistory);

document.getElementById("modalSearchInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent accidental form submission
        searchSenderHistory();  // Call the function directly
    }
});





let lastSearchedSender = null;


function searchSender() {
    const searchValue = document.getElementById('searchSender').value.trim();

    // 🧹 If input is empty → remove only that sender’s trail and markers
    if (!searchValue) {
        console.log("Clearing searched sender’s markers and trails...");

        // Loop through markers and remove those related to the last searched sender
        for (let key in markers) {
            if (key.includes(lastSearchedSender)) {
                if (map.hasLayer(markers[key])) map.removeLayer(markers[key]);
                delete markers[key];
            }
        }

        // Remove the sender’s trail line
        if (trailLines[lastSearchedSender]) {
            if (map.hasLayer(trailLines[lastSearchedSender])) {
                map.removeLayer(trailLines[lastSearchedSender]);
            }
            delete trailLines[lastSearchedSender];
        }

        // Clear the sender’s trail data
        delete trails[lastSearchedSender];

        // Reset the tracking variable
        lastSearchedSender = null;

        return;
    }

    // 📡 Otherwise, request past locations for that sender
    lastSearchedSender = searchValue;
    ws.send(JSON.stringify({ type: "search", sender: searchValue }));
}

document.getElementById("searchIcon").addEventListener("click", function() {
  searchSender(); // calls your existing function
});

document.getElementById("searchSender").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchSender();
    }
});
document.getElementById("searchSender").addEventListener("input", function () {
    if (this.value.trim() === "") {
        searchSender(); // Automatically clear trail when erased
    }
});



        function plotTrail(sender, locations) {
            Object.values(markers).forEach(marker => map.removeLayer(marker));
            Object.values(trailLines).forEach(line => map.removeLayer(line));

            Object.keys(markers).forEach(key => delete markers[key]);
            Object.keys(trailLines).forEach(key => delete trailLines[key]);

            if (locations.length === 0) {
                alert("No past locations found for this sender.");
                return;
            }

            let latLngs = [];
            locations.forEach((loc, index) => {
                let lat = parseFloat(loc.latitude);
                let lng = parseFloat(loc.longitude);

                if (index === locations.length - 1) {
                    let marker = L.marker([lat, lng], { icon: defaultIcon })
                        .bindPopup(`<div class="station-marker"><strong>${sender}</strong><br>Timestamp: ${loc.time_received}<br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}<br>Message: ${loc.message}</div>`);

                    markers[sender] = marker;
                    map.addLayer(marker);
                    map.setView([lat, lng], 12);
                } else {
                    let circle = L.circle([lat, lng], {
                        color: 'yellow',
                        fillColor: 'yellow',
                        fillOpacity: 0.2,
                        radius: 100
                    }).bindPopup(`<strong>${sender}</strong><br>Timestamp: ${loc.time_received}<br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`);

                    markers[sender + "_" + index] = circle;
                    map.addLayer(circle);
                }

                latLngs.push([lat, lng]);
            });

            trailLines[sender] = L.polyline(latLngs, { color: 'orange', weight: 1 }).addTo(map);
        }

   function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const senderList = document.getElementById('senderList');

    // Clear existing list
    senderList.innerHTML = '';

    // Populate the sender list with sender ID and latest message
    allStations.forEach(station => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `<span class="highlight">${station.sender}</span><br>Message: ${station.message || "No message"}`;

    listItem.onclick = function() {
        if (markers[station.sender]) {
            map.setView(markers[station.sender].getLatLng(), 15); // Zoom in
            markers[station.sender].openPopup(); // Open popup
        } else {
            alert('Location not found for this sender.');
        }
    };

    senderList.appendChild(listItem);
});


    // Toggle sidebar visibility
    sidebar.classList.toggle('open');
}

// Move this function outside
function filterSenders() {
    const searchInput = document.getElementById("sidebarSearch").value.toLowerCase();
    const listItems = document.querySelectorAll("#senderList li");
    let hasResult = false;

    listItems.forEach(item => {
        const senderText = item.textContent.toLowerCase();
        if (senderText.includes(searchInput)) {
            item.style.display = "block";
            hasResult = true;
        } else {
            item.style.display = "none";
        }
    });

    // Add or show "no result" message inside the list
    let noResultMsg = document.getElementById("noResultMsg");
    if (!noResultMsg) {
        noResultMsg = document.createElement("li");
        noResultMsg.id = "noResultMsg";
        noResultMsg.textContent = "No results found";
        noResultMsg.style.textAlign = "center";
        noResultMsg.style.color = "#ffffff";
        noResultMsg.style.borderRadius = "8px";
        noResultMsg.style.padding = "8px";
        noResultMsg.style.marginTop = "5px";
        document.getElementById("senderList").appendChild(noResultMsg);
    }

    noResultMsg.style.display = hasResult ? "none" : "block";
}







// ✅ Apply Month/Year Filter on SOS Report
// ✅ Apply Month/Year Filter on SOS Report
function applyMonthYearFilter() {
    const fromMonth = document.getElementById("fromMonthDropdown").value.toLowerCase();
    const fromYear = document.getElementById("fromYearInput").value;
    const toMonth = document.getElementById("toMonthDropdown").value.toLowerCase();
    const toYear = document.getElementById("toYearInput").value;

    const tableBody = document.getElementById("safeReportTable");
    const rows = Array.from(tableBody.querySelectorAll("tr"));
    let visibleRowCount = 0;

    const monthNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];

    function toNumericValue(month, year, isStart = true) {
        if (!year) return null;
        let monthIndex;

        // If month is not selected, pick first or last month depending on range
        if (!month || month === "") {
            monthIndex = isStart ? 1 : 12;
        } else {
            monthIndex = monthNames.indexOf(month) + 1;
        }

        return parseInt(`${year}${monthIndex.toString().padStart(2, "0")}`);
    }

    const fromValue = toNumericValue(fromMonth, fromYear, true);
    const toValue = toNumericValue(toMonth, toYear, false);

    rows.forEach(row => {
        const monthYearText = row.cells[0].innerText.trim(); // e.g. "March-2024"
        const [monthText, yearText] = monthYearText.split("-");
        const rowValue = toNumericValue(monthText.toLowerCase(), yearText);

        if (!fromValue && !toValue) {
            row.style.display = "";
            visibleRowCount++;
        } 
        else if (rowValue && (!fromValue || rowValue >= fromValue) && (!toValue || rowValue <= toValue)) {
            row.style.display = "";
            visibleRowCount++;
        } 
        else {
            row.style.display = "none";
        }
    });

    showNoResultsMessage(visibleRowCount === 0);
}


// 🟢 Populate year dropdowns
function populateYearDropdowns() {
    const currentYear = new Date().getFullYear();
    const yearDropdowns = [document.getElementById("fromYearInput"), document.getElementById("toYearInput")];

    yearDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="">All Years</option>';
        for (let year = currentYear; year >= 2000; year--) {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            dropdown.appendChild(option);
        }
    });
}
populateYearDropdowns();

// 🟢 Auto-apply filter when dropdowns change
["fromYearInput", "toYearInput", "fromMonthDropdown", "toMonthDropdown"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", applyMonthYearFilter);
});






// ✅ Filter SOS/Safe Report by Callsign
function filterSafeReportByCallsign() {
    const input = document.getElementById("safeReportSearchInput").value.toLowerCase();
    const tableBody = document.getElementById("safeReportTable");
    const rows = tableBody.getElementsByTagName("tr");

    let visibleCount = 0;

    for (let row of rows) {
        const callsignCell = row.cells[1]; // Sender is in column 2 for sender report
        if (!callsignCell) continue;

        const callsignText = callsignCell.textContent.toLowerCase();
        if (callsignText.includes(input)) {
            row.style.display = "";
            visibleCount++;
        } else {
            row.style.display = "none";
        }
    }

    // ✅ Handle "no results" message
    let noRow = document.getElementById("noCallsignResultsRow");
    if (noRow) noRow.remove();

    if (visibleCount === 0) {
        const newRow = document.createElement("tr");
        newRow.id = "noCallsignResultsRow";
        newRow.innerHTML = `
            <td colspan="5" style="text-align:center; color:white;">
                No matching callsign found.
            </td>`;
        tableBody.appendChild(newRow);
    }
}


// 🟢 Auto-trigger SOS filter while typing or pressing Enter
const safeReportInput = document.getElementById("safeReportSearchInput");

// Debounce to avoid firing too often while typing
let sosFilterTimeout;
function debounceSafeFilter() {
    clearTimeout(sosFilterTimeout);
    sosFilterTimeout = setTimeout(() => {
        filterSafeReportByCallsign();
    }, 300); // 0.3 seconds after typing stops
}

if (safeReportInput) {
    // 🔹 Filter as user types
    safeReportInput.addEventListener("input", debounceSafeFilter);

    // 🔹 Also trigger when pressing Enter
    safeReportInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterSafeReportByCallsign();
        }
    });
}



// ✅ Function to display "No records found" message
function showNoResultsMessage(noResults) {
    const tableBody = document.getElementById("safeReportTable");
    let noResultsRow = document.getElementById("noResultsRow");

    // Remove existing "No records found" row if it exists
    if (noResultsRow) {
        noResultsRow.remove();
    }

    if (noResults) {
    // ✅ Add a new row for "No records found"
    noResultsRow = document.createElement("tr");
    noResultsRow.id = "noResultsRow";
    noResultsRow.classList.add("no-results-row");
    noResultsRow.innerHTML = `
        <td colspan="5" style="font-weight: 500; color: white; background-color: rgba(255, 255, 255, 0.2);">
            No records found for the selected month or year.
        </td>
    `;
    tableBody.appendChild(noResultsRow);
}

}


let isSenderReport = false; // Default to Safe Report

// Toggle between Safe Report and Sender Report using button
function toggleReportType() {
    isSenderReport = !isSenderReport; // Toggle state

    // Change button text based on the current state
    const button = document.getElementById("filterToggleBtn");
    if (isSenderReport) {
        button.innerHTML = 'Show by Month<img src="public/assets/icons/calendar.png" alt="Month Icon" width="20" height="20">';
    } else {
        button.innerHTML = 'Show by Details<img src="public/assets/icons/details.png" alt="Month Icon" width="20" height="20">';
    }

    // Fetch the corresponding report after toggling
    fetchSafeReport();

    // 🟢 Wait a short moment to ensure table updates, then apply the filter again
    setTimeout(() => {
        applyMonthYearFilter();
    }, 400); // wait 0.4s for table refresh
}





function fetchSenderDetails(sender, month) {
    // Send WebSocket message to fetch sender details by sender and month
    ws.send(JSON.stringify({
        type: "fetch_sender_details",
        sender: sender,
        month: month
    }));

    // Listen for the response
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



// ✅ Store the original details for filtering
let originalSenderDetails = [];

// ✅ Update displaySenderDetails to store original details
function displaySenderDetails(details, sender, month) {
    const tableBody = document.getElementById("senderDetailsTable");
    tableBody.innerHTML = ""; // Clear previous content

    originalSenderDetails = details;

    if (details.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='2'>No records found for this sender in the selected month.</td></tr>";
        return;
    }

    // ✅ Sort by most recent first
    details.sort((a, b) => new Date(b.time_received) - new Date(a.time_received));

    // ✅ Display each record individually
    details.forEach(entry => {
        const row = document.createElement("tr");
        const formattedDate = formatDate(entry.time_received);

        // Color code based on message
       // let color = "#333";
       /// if (entry.message.toLowerCase().includes("sos")) color = "red";
       // else if (entry.message.toLowerCase().includes("safe")) color = "green";
        //else if (entry.message.toLowerCase().includes("help")) color = "orange";
        //else if (entry.message.toLowerCase().includes("not found")) color = "gray";
      
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td >${entry.message}</td>
        `;
        tableBody.appendChild(row);
    });

    // ✅ Count all messages
    const messageCount = details.length;

    // ✅ Update total message count
    
    // ✅ Update the header with count beside "Messages"
    document.getElementById("senderName").innerText = `${sender}`;
    
    document.getElementById("selectedMonth").innerText = `${month}`;
    document.getElementById("senderDetailsModal").style.display = "flex";
    document.getElementById("messageCount").textContent = details.length;
}




// ✅ Close Sender Details Modal
function closeSenderDetailsModal() {
    document.getElementById("senderDetailsModal").style.display = "none";
}


function formatDate(dateStr) {
    // Check if the string is in ISO format
    if (dateStr.includes("T")) {
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toLocaleString(); // Return formatted date if valid
        }
    }

    // Handle custom format: "DD-MM-YYYY HH:MM:SS"
    const parts = dateStr.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[3], 10);
        const hours = parseInt(parts[4], 10);
        const minutes = parseInt(parts[5], 10);
        const seconds = parseInt(parts[6], 10);

        const date = new Date(year, month, day, hours, minutes, seconds);
        return date.toLocaleString(); // Return properly formatted date
    }

    // Fallback if format is unknown
    return "Invalid Date";
}




// ✅ Apply Filter on Sender Details
function applySenderFilter() {
    const fromDate = document.getElementById("filterFromDate").value;
    const toDate = document.getElementById("filterToDate").value;
    const fromTime = document.getElementById("filterFromTime").value || "00:00";
    const toTime = document.getElementById("filterToTime").value || "23:59";
    const filterMessage = document.getElementById("filterMessage").value.toLowerCase();
    const tableBody = document.getElementById("senderDetailsTable");

    tableBody.innerHTML = "";

    const fromDateTime = fromDate ? new Date(`${fromDate}T${fromTime}`) : null;
    const toDateTime = toDate ? new Date(`${toDate}T${toTime}`) : null;

    const filteredDetails = originalSenderDetails.filter(entry => {
        // 🧠 Fix the format first
        const fixedDateStr = entry.time_received.replace(
            /^(\d{2})-(\d{2})-(\d{4})/,
            "$3-$2-$1"
        );
        const entryDate = new Date(fixedDateStr);
        if (isNaN(entryDate)) return false;

        const message = entry.message.toLowerCase();
        const matchesMessage = !filterMessage || message.includes(filterMessage);

        let withinRange = true;
        if (fromDateTime && entryDate < fromDateTime) withinRange = false;
        if (toDateTime && entryDate > toDateTime) withinRange = false;

        return withinRange && matchesMessage;
    });

    if (filteredDetails.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='2'>No matching records found.</td></tr>";
    } else {
        filteredDetails.forEach(entry => {
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




// 🟢 Auto-trigger Sender Details filter when inputs change
const fromDateInput = document.getElementById("filterFromDate");
const toDateInput = document.getElementById("filterToDate");
const fromTimeInput = document.getElementById("filterFromTime");
const toTimeInput = document.getElementById("filterToTime");
const messageInput = document.getElementById("filterMessage");

// Debounce helper (waits for user to stop typing)
let filterTimeout;
function debounceFilter() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        applySenderFilter();
    }, 400); // 0.4s delay after typing stops
}

// 🔹 Trigger when date/time changes
[fromDateInput, toDateInput, fromTimeInput, toTimeInput].forEach(input => {
    if (input) input.addEventListener("change", applySenderFilter);
});

// 🔹 Trigger when typing or pressing Enter in message box
if (messageInput) {
    // Auto-filter while typing
    messageInput.addEventListener("input", debounceFilter);

    // Trigger immediately when pressing Enter
    messageInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            applySenderFilter();
        }
    });
}


// ✅ Clear Filter and Restore Original Data
function clearSenderFilter() {
    document.getElementById("filterFromDate").value = "";
    document.getElementById("filterToDate").value = "";
    document.getElementById("filterFromTime").value = "";
    document.getElementById("filterToTime").value = "";
    document.getElementById("filterMessage").value = "";
    displaySenderDetails(originalSenderDetails, document.getElementById("senderName").innerText, document.getElementById("selectedMonth").innerText);
}


// ✅ Fetch and Plot Trail Data
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

    const formattedStartDate = startDate ? `${startDate} ${startTime}` : null;
    const formattedEndDate = endDate ? `${endDate} ${endTime}` : null;

    // Send WebSocket request to fetch the trail data
    ws.send(JSON.stringify({
        type: "fetch_history",
        sender: sender,
        start_date: formattedStartDate,
        end_date: formattedEndDate
    }));

    ws.addEventListener("message", function handleMessage(event) {
        const response = JSON.parse(event.data);

        if (response.type === "history_result" && response.history.length > 0) {
            plotTrailInModal(sender, response.history); // Plot trail and show map
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








// ✅ Initialize the Map for Plotting
let historyMap;
let historyTrailLayer;
let historyCircles = [];
let modalMarker; // Store the marker inside the modal

// ✅ Show Map in Modal and Hide Table
function showMapInModal() {
    document.getElementById("searchResultsWrapper").style.display = "none"; // Hide table
    document.getElementById("historyMap").style.display = "block"; // Show map

    // Initialize the map only once
    if (!historyMap) {
        historyMap = L.map("historyMap").setView([9.1, 125.5], 8);

        // Add Google Satellite tiles
        L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
            attribution: "&copy; Google"
        }).addTo(historyMap);
    }
}

// ✅ Hide Map and Show Table Back
function restoreTableInModal() {
    document.getElementById("searchResultsWrapper").style.display = "block"; // Show table
    document.getElementById("historyMap").style.display = "none"; // Hide map

    // Clear marker if any
    if (modalMarker) {
        historyMap.removeLayer(modalMarker);
        modalMarker = null;
    }
}

// ✅ Plot Trail and Replace Table
function plotTrailInModal(sender, locations) {
    showMapInModal(); // Switch to map

    // Clear existing trail if it exists
    if (historyTrailLayer) {
        historyMap.removeLayer(historyTrailLayer);
    }

    // Remove any existing circles
    historyCircles.forEach(circle => historyMap.removeLayer(circle));
    historyCircles = [];

    const trailCoordinates = locations.map(entry => [entry.latitude, entry.longitude]);

    if (trailCoordinates.length > 1) {
        // Draw trail
        historyTrailLayer = L.polyline(trailCoordinates, {
            color: "#ff4500", // Orange trail
            weight: 1.5,
            opacity: 0.8
        }).addTo(historyMap);

        // Add circles at each point
        locations.forEach(entry => {
            const circle = L.circle([entry.latitude, entry.longitude], {
                color: "#dfff00",
                fillColor: "#dfff00",
                fillOpacity: 0.8,
                radius: 100
            }).addTo(historyMap);

            // Add popups with details
            circle.bindPopup(`
                <b>Sender:</b> ${entry.sender}<br>
                <b>Time:</b> ${entry.time_received}<br>
                <b>Location:</b> (${entry.latitude}, ${entry.longitude})<br>
                <b>Message:</b> ${entry.message || "No message"}
            `);

            historyCircles.push(circle);
        });

        // Zoom to fit the trail bounds
        historyMap.fitBounds(historyTrailLayer.getBounds());
    } else {
        alert("Not enough data points to plot a trail.");
    }
}

// ✅ Clear Trail and Restore Table
function clearPlot() {
    if (historyTrailLayer) {
        historyMap.removeLayer(historyTrailLayer);
        historyTrailLayer = null;
    }

    // Remove all circles
    historyCircles.forEach(circle => historyMap.removeLayer(circle));
    historyCircles = [];
    restoreTableInModal(); // Restore table after clearing
    alert("Plot cleared. Table restored.");
}


// 🟩 Fishermen's Information Modal Controls
function openInformationModal() {
    document.getElementById("detailsModal").style.display = "flex";
}

function closeDetailsModal() {
    const modal = document.getElementById("detailsModal");
    modal.style.display = "none";

    // Optional cleanup
    const tableBody = document.getElementById("detailsTable");
    const addressDropdown = document.getElementById("addressFilter");
    if (tableBody) tableBody.innerHTML = "";
    if (addressDropdown) addressDropdown.innerHTML = '<option value="">All Addresses</option>';
    document.getElementById("infoFishermenCount").textContent = "0";
}



// 🟦 Monthly SOS Report Modal Controls
function openSafeReportModal() {
    document.getElementById("safeReportModal").style.display = "flex";
}

function closeSafeReportModal() {
    const modal = document.getElementById("safeReportModal");
    modal.style.display = "none";

    // Optional cleanup
    const tableBody = document.getElementById("safeReportTable");
    const tableHeader = document.getElementById("safeReportHeader");
    if (tableBody) tableBody.innerHTML = "";
    if (tableHeader) tableHeader.innerHTML = "";
}

