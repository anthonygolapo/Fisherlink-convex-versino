(function() {
    function openSearchModal() {
        document.getElementById("searchModal").style.display = "flex";
    }

    function closeSearchModal() {
        document.getElementById("searchModal").style.display = "none";
        document.getElementById("searchResults").innerHTML = "";

        ["startDate", "endDate", "startTime", "endTime", "modalSearchInput"].forEach(function(id) {
            const element = document.getElementById(id);
            if (element) {
                element.value = "";
            }
        });
    }

    function openInformationModal() {
        document.getElementById("detailsModal").style.display = "flex";
    }

    function closeDetailsModal() {
        const tableBody = document.getElementById("detailsTable");
        const addressDropdown = document.getElementById("addressFilter");
        document.getElementById("detailsModal").style.display = "none";
        if (tableBody) {
            tableBody.innerHTML = "";
        }
        if (addressDropdown) {
            addressDropdown.innerHTML = '<option value="">All Addresses</option>';
        }
        document.getElementById("infoFishermenCount").textContent = "0";
    }

    function openSafeReportModal() {
        document.getElementById("safeReportModal").style.display = "flex";
    }

    function closeSafeReportModal() {
        const tableBody = document.getElementById("safeReportTable");
        const tableHeader = document.getElementById("safeReportHeader");
        document.getElementById("safeReportModal").style.display = "none";
        if (tableBody) {
            tableBody.innerHTML = "";
        }
        if (tableHeader) {
            tableHeader.innerHTML = "";
        }
    }

    Object.assign(window, {
        openSearchModal,
        closeSearchModal,
        openInformationModal,
        closeDetailsModal,
        openSafeReportModal,
        closeSafeReportModal
    });
})();
