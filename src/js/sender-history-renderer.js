function displaySenderHistory(history) {
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = ""; // Clear previous results

    if (history.length === 0) {
        resultsDiv.innerHTML = "<p>No journey recorded for this sender within the selected time range.</p>";
        return;
    }
    history.forEach(entry => {
        const messageBlock = document.createElement("div");
        messageBlock.innerHTML = `
            <div class="message-item" onclick="plotManualLocation(${entry.latitude}, ${entry.longitude}, '${entry.sender}', '${entry.time_received}', '${entry.message}'), ${entry.battery_percentage}">
                <strong class="highlight">${entry.sender}</strong> <br>
                Time: ${entry.time_received} <br>
                Location: (Latitude: ${entry.latitude}, Longitude: ${entry.longitude}) <br>
                Message: ${entry.message} <br>
                Address: ${entry.place} <br>
                Battery: ${entry.battery_percentage}%
            </div>
            <hr>
        `;
        resultsDiv.appendChild(messageBlock);
    });
}