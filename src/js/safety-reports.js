(function() {
    function printSafeReport() {
        if (!ensureAdminAccess("print reports")) {
            return;
        }

        const printWindow = window.open("", "", "width=800,height=600");
        printWindow.document.write("<html><head><title>Monthly SOS Report</title>");
        printWindow.document.write(`
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; color: black; }
                h2 { color: black; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid black; padding: 5px; text-align: center; color: black; }
                th { background-color: #d3d3d3; color: black; }
                tr:nth-child(even) { background-color: #f2f2f2; color: black; }
                tr:nth-child(odd) { background-color: #ffffff; color: black; }
                @media print { #printReportBtn { display: none; } }
            </style>
        `);
        printWindow.document.write("</head><body>");
        printWindow.document.write("<h2>FisherLink Monthly SOS Report</h2>");
        printWindow.document.write(document.querySelector(".styled-table").outerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
    }

    function fetchSafeReport() {
        const state = window.AppState;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("Convex backend not connected. Please configure CONVEX_URL and run Convex.");
            document.getElementById("safeReportModal").style.display = "flex";
            return;
        }

        document.getElementById("safeReportModal").style.display = "flex";
        ws.send(JSON.stringify({ type: state.isSenderReport ? "sender_report" : "safe_report" }));

        ws.addEventListener("message", function handleReport(event) {
            const response = JSON.parse(event.data);

            if (response.type === "safe_report" || response.type === "sender_report") {
                const tableBody = document.getElementById("safeReportTable");
                const tableHeader = document.getElementById("safeReportHeader");
                tableBody.innerHTML = "";

                tableHeader.innerHTML = state.isSenderReport ? `
                    <tr>
                        <th style="background-color: #0047AB; color: white;">Month</th>
                        <th style="background-color: #0047AB; color: white;">Sender</th>
                        <th style="background-color: #b40000; color: white;">SOS Count</th>
                        <th style="background-color: #006700; color: white;">Mark as Safe Count</th>
                        <th style="background-color: #676767; color: white;">Not Found Count</th>
                    </tr>
                ` : `
                    <tr>
                        <th style="background-color: #0047AB; color: white;">Month</th>
                        <th style="background-color: #b40000; color: white;">SOS Count</th>
                        <th style="background-color: #006700; color: white;">Mark as Safe Count</th>
                        <th style="background-color: #676767; color: white;">Not Found Count</th>
                    </tr>
                `;

                if (response.report.length === 0) {
                    tableBody.innerHTML = "<tr><td colspan='5'>No records found.</td></tr>";
                } else {
                    response.report.forEach(function(row) {
                        const newRow = document.createElement("tr");
                        if (state.isSenderReport) {
                            newRow.innerHTML = `
                                <td>${row.month || "N/A"}</td>
                                <td><span class="clickable-callsign" onclick="fetchSenderDetails('${row.sender}', '${row.month}')">${row.sender}</span></td>
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

    function applyMonthYearFilter() {
        const fromMonth = document.getElementById("fromMonthDropdown").value.toLowerCase();
        const fromYear = document.getElementById("fromYearInput").value;
        const toMonth = document.getElementById("toMonthDropdown").value.toLowerCase();
        const toYear = document.getElementById("toYearInput").value;
        const rows = Array.from(document.getElementById("safeReportTable").querySelectorAll("tr"));
        let visibleRowCount = 0;
        const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

        function toNumericValue(month, year, isStart) {
            if (!year) {
                return null;
            }
            const monthIndex = !month || month === "" ? (isStart ? 1 : 12) : monthNames.indexOf(month) + 1;
            return parseInt(String(year) + String(monthIndex).padStart(2, "0"), 10);
        }

        const fromValue = toNumericValue(fromMonth, fromYear, true);
        const toValue = toNumericValue(toMonth, toYear, false);

        rows.forEach(function(row) {
            const parts = row.cells[0].innerText.trim().split("-");
            const rowValue = toNumericValue(parts[0].toLowerCase(), parts[1], true);

            if (!fromValue && !toValue) {
                row.style.display = "";
                visibleRowCount++;
            } else if (rowValue && (!fromValue || rowValue >= fromValue) && (!toValue || rowValue <= toValue)) {
                row.style.display = "";
                visibleRowCount++;
            } else {
                row.style.display = "none";
            }
        });

        showNoResultsMessage(visibleRowCount === 0);
    }

    function populateYearDropdowns() {
        const currentYear = new Date().getFullYear();
        [document.getElementById("fromYearInput"), document.getElementById("toYearInput")].forEach(function(dropdown) {
            if (!dropdown) {
                return;
            }
            dropdown.innerHTML = '<option value="">All Years</option>';
            for (let year = currentYear; year >= 2000; year--) {
                const option = document.createElement("option");
                option.value = year;
                option.textContent = year;
                dropdown.appendChild(option);
            }
        });
    }

    function filterSafeReportByCallsign() {
        const input = document.getElementById("safeReportSearchInput").value.toLowerCase();
        const tableBody = document.getElementById("safeReportTable");
        const rows = tableBody.getElementsByTagName("tr");
        let visibleCount = 0;

        for (const row of rows) {
            const callsignCell = row.cells[1];
            if (!callsignCell) {
                continue;
            }

            if (callsignCell.textContent.toLowerCase().includes(input)) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        }

        let noRow = document.getElementById("noCallsignResultsRow");
        if (noRow) {
            noRow.remove();
        }

        if (visibleCount === 0) {
            noRow = document.createElement("tr");
            noRow.id = "noCallsignResultsRow";
            noRow.innerHTML = '<td colspan="5" style="text-align:center; color:white;">No matching callsign found.</td>';
            tableBody.appendChild(noRow);
        }
    }

    let sosFilterTimeout;
    function debounceSafeFilter() {
        clearTimeout(sosFilterTimeout);
        sosFilterTimeout = setTimeout(function() {
            filterSafeReportByCallsign();
        }, 300);
    }

    function showNoResultsMessage(noResults) {
        const tableBody = document.getElementById("safeReportTable");
        let noResultsRow = document.getElementById("noResultsRow");

        if (noResultsRow) {
            noResultsRow.remove();
        }

        if (noResults) {
            noResultsRow = document.createElement("tr");
            noResultsRow.id = "noResultsRow";
            noResultsRow.classList.add("no-results-row");
            noResultsRow.innerHTML = '<td colspan="5" style="font-weight: 500; color: white; background-color: rgba(255, 255, 255, 0.2);">No records found for the selected month or year.</td>';
            tableBody.appendChild(noResultsRow);
        }
    }

    function toggleReportType() {
        const state = window.AppState;
        state.isSenderReport = !state.isSenderReport;
        const button = document.getElementById("filterToggleBtn");
        button.innerHTML = state.isSenderReport
            ? 'Show by Month<img src="public/assets/icons/calendar.png" alt="Month Icon" width="20" height="20">'
            : 'Show by Details<img src="public/assets/icons/details.png" alt="Month Icon" width="20" height="20">';

        fetchSafeReport();
        setTimeout(function() {
            applyMonthYearFilter();
        }, 400);
    }

    populateYearDropdowns();

    ["fromYearInput", "toYearInput", "fromMonthDropdown", "toMonthDropdown"].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", applyMonthYearFilter);
        }
    });

    const safeReportInput = document.getElementById("safeReportSearchInput");
    if (safeReportInput) {
        safeReportInput.addEventListener("input", debounceSafeFilter);
        safeReportInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                filterSafeReportByCallsign();
            }
        });
    }

    Object.assign(window, {
        printSafeReport,
        fetchSafeReport,
        applyMonthYearFilter,
        populateYearDropdowns,
        filterSafeReportByCallsign,
        debounceSafeFilter,
        showNoResultsMessage,
        toggleReportType
    });
})();
