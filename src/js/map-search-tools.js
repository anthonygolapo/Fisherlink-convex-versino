(function() {
    function searchAndPlotCoordinates() {
        const state = window.AppState;
        const input = document.getElementById("coordSearchInput").value.trim();

        if (input === "") {
            if (state.markers.manualMarker) {
                state.map.removeLayer(state.markers.manualMarker);
                delete state.markers.manualMarker;
            }
            return;
        }

        const match = input.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
        if (!match) {
            alert("Invalid format! Please enter coordinates in 'latitude, longitude' format.");
            return;
        }

        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[3]);

        if (state.markers.manualMarker) {
            state.map.removeLayer(state.markers.manualMarker);
        }

        state.markers.manualMarker = L.marker([lat, lng], { icon: state.defaultIcon })
            .bindPopup("<strong>Manual Plot</strong><br>Latitude: " + lat + "<br>Longitude: " + lng)
            .addTo(state.map);

        state.map.setView([lat, lng], 12);
    }

    function searchSender() {
        const state = window.AppState;
        const searchValue = document.getElementById("searchSender").value.trim();

        if (!searchValue) {
            for (const key in state.markers) {
                if (state.lastSearchedSender && key.includes(state.lastSearchedSender)) {
                    if (state.map.hasLayer(state.markers[key])) {
                        state.map.removeLayer(state.markers[key]);
                    }
                    delete state.markers[key];
                }
            }

            if (state.lastSearchedSender && state.trailLines[state.lastSearchedSender]) {
                if (state.map.hasLayer(state.trailLines[state.lastSearchedSender])) {
                    state.map.removeLayer(state.trailLines[state.lastSearchedSender]);
                }
                delete state.trailLines[state.lastSearchedSender];
            }

            delete state.trails[state.lastSearchedSender];
            state.lastSearchedSender = null;
            return;
        }

        state.lastSearchedSender = searchValue;
        ws.send(JSON.stringify({ type: "search", sender: searchValue }));
    }

    function plotTrail(sender, locations) {
        const state = window.AppState;
        Object.values(state.markers).forEach(function(marker) {
            state.map.removeLayer(marker);
        });
        Object.values(state.trailLines).forEach(function(line) {
            state.map.removeLayer(line);
        });

        Object.keys(state.markers).forEach(function(key) {
            delete state.markers[key];
        });
        Object.keys(state.trailLines).forEach(function(key) {
            delete state.trailLines[key];
        });

        if (locations.length === 0) {
            alert("No past locations found for this sender.");
            return;
        }

        const latLngs = [];
        locations.forEach(function(loc, index) {
            const lat = parseFloat(loc.latitude);
            const lng = parseFloat(loc.longitude);

            if (index === locations.length - 1) {
                const marker = L.marker([lat, lng], { icon: state.defaultIcon })
                    .bindPopup(`<div class="station-marker"><strong>${sender}</strong><br>Timestamp: ${loc.time_received}<br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}<br>Message: ${loc.message}</div>`);

                state.markers[sender] = marker;
                state.map.addLayer(marker);
                state.map.setView([lat, lng], 12);
            } else {
                const circle = L.circle([lat, lng], {
                    color: "yellow",
                    fillColor: "yellow",
                    fillOpacity: 0.2,
                    radius: 100
                }).bindPopup(`<strong>${sender}</strong><br>Timestamp: ${loc.time_received}<br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`);

                state.markers[sender + "_" + index] = circle;
                state.map.addLayer(circle);
            }

            latLngs.push([lat, lng]);
        });

        state.trailLines[sender] = L.polyline(latLngs, { color: "orange", weight: 1 }).addTo(state.map);
    }

    function toggleSidebar() {
        const state = window.AppState;
        const sidebar = document.getElementById("sidebar");
        const senderList = document.getElementById("senderList");
        senderList.innerHTML = "";

        state.allStations.forEach(function(station) {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<span class="highlight">${station.sender}</span><br>Message: ${station.message || "No message"}`;
            listItem.onclick = function() {
                if (state.markers[station.sender]) {
                    state.map.setView(state.markers[station.sender].getLatLng(), 15);
                    state.markers[station.sender].openPopup();
                } else {
                    alert("Location not found for this sender.");
                }
            };
            senderList.appendChild(listItem);
        });

        sidebar.classList.toggle("open");
    }

    function filterSenders() {
        const searchInput = document.getElementById("sidebarSearch").value.toLowerCase();
        const listItems = document.querySelectorAll("#senderList li");
        let hasResult = false;

        listItems.forEach(function(item) {
            const senderText = item.textContent.toLowerCase();
            if (senderText.includes(searchInput)) {
                item.style.display = "block";
                hasResult = true;
            } else {
                item.style.display = "none";
            }
        });

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

    document.getElementById("coordSearchInput").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchAndPlotCoordinates();
        }
    });

    document.getElementById("coordSearchInput").addEventListener("input", function() {
        const state = window.AppState;
        if (this.value.trim() === "" && state.markers.manualMarker) {
            state.map.removeLayer(state.markers.manualMarker);
            delete state.markers.manualMarker;
        }
    });

    document.getElementById("searchIcon").addEventListener("click", function() {
        searchSender();
    });

    document.getElementById("searchSender").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchSender();
        }
    });

    document.getElementById("searchSender").addEventListener("input", function() {
        if (this.value.trim() === "") {
            searchSender();
        }
    });

    Object.assign(window, {
        searchAndPlotCoordinates,
        searchSender,
        plotTrail,
        toggleSidebar,
        filterSenders
    });
})();
