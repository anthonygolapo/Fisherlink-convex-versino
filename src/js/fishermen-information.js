(function() {
    function isInformationAdminMode() {
        return typeof window.isAdmin === "function" && window.isAdmin();
    }

    function normalizeInformationRecord(record) {
        return {
            id: record.id === "" || record.id === null || record.id === undefined ? null : Number(record.id),
            name: record.name.trim(),
            callsign: record.callsign.trim().toUpperCase(),
            address: record.address.trim(),
            phone_number: record.phone_number.trim(),
            boat_color: record.boat_color.trim(),
            engine_type: record.engine_type.trim(),
            boat_length: record.boat_length === "" || record.boat_length === null || record.boat_length === undefined
                ? null
                : Number(record.boat_length)
        };
    }

    function setInformationAdminUI() {
        const toolbar = document.getElementById("infoAdminToolbar");
        const actionsHeader = document.getElementById("infoActionsHeader");
        const isAdminMode = isInformationAdminMode();

        if (toolbar) {
            toolbar.style.display = isAdminMode ? "flex" : "none";
        }

        if (actionsHeader) {
            actionsHeader.style.display = isAdminMode ? "table-cell" : "none";
        }
    }

    function populateAddressFilter(rows) {
        const addressDropdown = document.getElementById("addressFilter");
        addressDropdown.innerHTML = '<option value="">All Addresses</option>';

        const uniqueAddresses = new Set();
        rows.forEach(function(row) {
            if (row.address) {
                uniqueAddresses.add(row.address);
            }
        });

        uniqueAddresses.forEach(function(address) {
            const option = document.createElement("option");
            option.value = address;
            option.textContent = address;
            addressDropdown.appendChild(option);
        });
    }

    function renderInformationTable(rows) {
        const tableBody = document.getElementById("detailsTable");
        const isAdminMode = isInformationAdminMode();
        tableBody.innerHTML = "";

        if (rows.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='" + (isAdminMode ? 9 : 8) + "' style='text-align:center;'>No matching data.</td></tr>";
            return;
        }

        rows.forEach(function(row) {
            const newRow = document.createElement("tr");
            const color = row.boat_color || "Gray";
            const actionCell = isAdminMode ? `
                <td>
                    <div class="info-row-actions">
                        <button class="edit-btn" onclick="editInformationRecord('${row._id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteInformationRecord('${row._id}')">Delete</button>
                    </div>
                </td>
            ` : "";

            newRow.innerHTML = `
                <td>${row.id ?? ""}</td>
                <td>${row.name}</td>
                <td class="clickable-callsign" onclick="fetchHistoryByCallsign('${row.callsign}')">${row.callsign}</td>
                <td>${row.address}</td>
                <td>${row.phone_number || ""}</td>
                <td class="boat-color-cell">
                    <div class="color-box" style="background-color: ${color.toLowerCase()};"></div>
                    ${color}
                </td>
                <td>${row.engine_type || "N/A"}</td>
                <td>${row.boat_length ? row.boat_length + " m" : "N/A"}</td>
                ${actionCell}
            `;
            tableBody.appendChild(newRow);
        });
    }

    function refreshInformationView(rows) {
        const state = window.AppState;
        state.detailsData = rows;
        populateAddressFilter(rows);
        setInformationAdminUI();
        filterDetails();
    }

    function showAllInfo() {
        const state = window.AppState;
        const tableBody = document.querySelector("#infoTable tbody");
        tableBody.innerHTML = "";

        state.allStations.forEach(function(station) {
            const row = document.createElement("tr");
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

    function fetchInformation() {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("Convex backend not connected. Please configure CONVEX_URL and run Convex.");
            document.getElementById("detailsModal").style.display = "flex";
            return;
        }

        document.getElementById("detailsModal").style.display = "flex";
        ws.send(JSON.stringify({ type: "fetch_information" }));

        ws.addEventListener("message", function handleInfo(event) {
            const response = JSON.parse(event.data);

            if (response.type === "information_data") {
                refreshInformationView(response.info);
                document.getElementById("detailsModal").style.display = "flex";
                ws.removeEventListener("message", handleInfo);
            } else if (response.type === "error") {
                ws.removeEventListener("message", handleInfo);
            }
        });
    }

    function fetchHistoryByCallsign(callsign) {
        document.getElementById("detailsModal").style.display = "none";
        document.getElementById("searchModal").style.display = "flex";
        document.getElementById("modalSearchInput").value = callsign;
        searchSenderHistory();
    }

    function filterDetails() {
        const state = window.AppState;
        const searchQuery = document.getElementById("detailsSearchInput").value.toLowerCase();
        const selectedAddress = document.getElementById("addressFilter").value;

        const filteredData = state.detailsData.filter(function(row) {
            const rowData = `
                ${row._id}
                ${row.id}
                ${row.name}
                ${row.callsign}
                ${row.address}
                ${row.phone_number}
                ${row.boat_color || ""}
                ${row.engine_type || ""}
                ${row.boat_length || ""}
            `.toLowerCase();

            return rowData.includes(searchQuery) &&
                (selectedAddress === "" || row.address === selectedAddress);
        });

        renderInformationTable(filteredData);
        document.getElementById("infoFishermenCount").textContent = filteredData.length;
    }

    function openInformationForm() {
        if (!ensureAdminAccess("manage fishermen information")) {
            return;
        }

        document.getElementById("informationFormTitle").textContent = "Add Fisherman";
        document.getElementById("informationFormModal").style.display = "flex";
        document.getElementById("infoDocId").value = "";
        document.getElementById("infoIdInput").value = "";
        document.getElementById("infoNameInput").value = "";
        document.getElementById("infoCallsignInput").value = "";
        document.getElementById("infoAddressInput").value = "";
        document.getElementById("infoPhoneInput").value = "";
        document.getElementById("infoBoatColorInput").value = "";
        document.getElementById("infoEngineTypeInput").value = "";
        document.getElementById("infoBoatLengthInput").value = "";
    }

    function closeInformationForm() {
        document.getElementById("informationFormModal").style.display = "none";
    }

    function editInformationRecord(docId) {
        if (!ensureAdminAccess("edit fishermen information")) {
            return;
        }

        const state = window.AppState;
        const record = state.detailsData.find(function(row) {
            return row._id === docId;
        });

        if (!record) {
            alert("Record not found.");
            return;
        }

        document.getElementById("informationFormTitle").textContent = "Edit Fisherman";
        document.getElementById("informationFormModal").style.display = "flex";
        document.getElementById("infoDocId").value = record._id;
        document.getElementById("infoIdInput").value = record.id ?? "";
        document.getElementById("infoNameInput").value = record.name;
        document.getElementById("infoCallsignInput").value = record.callsign;
        document.getElementById("infoAddressInput").value = record.address;
        document.getElementById("infoPhoneInput").value = record.phone_number || "";
        document.getElementById("infoBoatColorInput").value = record.boat_color || "";
        document.getElementById("infoEngineTypeInput").value = record.engine_type || "";
        document.getElementById("infoBoatLengthInput").value = record.boat_length ?? "";
    }

    function hasDuplicateCallsign(callsign, currentDocId) {
        const state = window.AppState;
        return state.detailsData.some(function(row) {
            return row._id !== currentDocId && String(row.callsign || "").trim().toUpperCase() === callsign;
        });
    }

    function submitInformationForm() {
        if (!ensureAdminAccess("manage fishermen information")) {
            return;
        }

        const docId = document.getElementById("infoDocId").value;
        const payload = normalizeInformationRecord({
            id: document.getElementById("infoIdInput").value,
            name: document.getElementById("infoNameInput").value,
            callsign: document.getElementById("infoCallsignInput").value,
            address: document.getElementById("infoAddressInput").value,
            phone_number: document.getElementById("infoPhoneInput").value,
            boat_color: document.getElementById("infoBoatColorInput").value,
            engine_type: document.getElementById("infoEngineTypeInput").value,
            boat_length: document.getElementById("infoBoatLengthInput").value
        });

        if (!payload.name || !payload.callsign || !payload.address) {
            alert("Name, callsign, and address are required.");
            return;
        }

        if (hasDuplicateCallsign(payload.callsign, docId || null)) {
            alert("This callsign is already assigned to another fisherman. Please use a unique callsign.");
            return;
        }

        ws.send(JSON.stringify({
            type: docId ? "update_information" : "create_information",
            record: docId ? { docId: docId, ...payload } : payload
        }));

        ws.addEventListener("message", function handleSave(event) {
            const response = JSON.parse(event.data);

            if (response.type === "information_data") {
                refreshInformationView(response.info);
                closeInformationForm();
                ws.removeEventListener("message", handleSave);
            } else if (response.type === "error") {
                alert("Failed to save information: " + response.message);
                ws.removeEventListener("message", handleSave);
            }
        });
    }

    function deleteInformationRecord(docId) {
        if (!ensureAdminAccess("delete fishermen information")) {
            return;
        }

        if (!confirm("Delete this fisherman record?")) {
            return;
        }

        ws.send(JSON.stringify({
            type: "delete_information",
            docId: docId
        }));

        ws.addEventListener("message", function handleDelete(event) {
            const response = JSON.parse(event.data);

            if (response.type === "information_data") {
                refreshInformationView(response.info);
                ws.removeEventListener("message", handleDelete);
            } else if (response.type === "error") {
                alert("Failed to delete information: " + response.message);
                ws.removeEventListener("message", handleDelete);
            }
        });
    }

    Object.assign(window, {
        showAllInfo,
        fetchInformation,
        fetchHistoryByCallsign,
        filterDetails,
        openInformationForm,
        closeInformationForm,
        editInformationRecord,
        submitInformationForm,
        deleteInformationRecord
    });
})();
