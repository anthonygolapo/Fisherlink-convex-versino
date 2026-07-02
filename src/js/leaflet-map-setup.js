(function() {
    const state = window.AppState;
    const map = L.map("map", {
        zoomControl: false,
        scrollWheelZoom: true
    }).setView([9.1, 125.5], 8);

    L.control.zoom({
        position: "bottomleft"
    }).addTo(map);

    const roadMap = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        attribution: "&copy; Google Road"
    });
    const satelliteMap = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        attribution: "&copy; Google Satellite"
    });
    const hybridMap = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: "&copy; Google Hybrid"
    });
    const terrainMap = L.tileLayer("https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}", {
        attribution: "&copy; Google Terrain"
    });
    const darkMap = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap & CartoDB"
    });

    darkMap.addTo(map);

    L.control.layers({
        "Road Map": roadMap,
        "Satellite": satelliteMap,
        "Hybrid": hybridMap,
        "Terrain": terrainMap,
        "Dark Mode": darkMap
    }, null, {
        collapsed: true,
        position: "bottomleft"
    }).addTo(map);

    const boatLegend = L.control({ position: "bottomleft" });
    boatLegend.onAdd = function() {
        const container = L.DomUtil.create("div", "leaflet-control leaflet-boat-legend");
        const toggleBtn = L.DomUtil.create("a", "leaflet-boat-legend-toggle", container);
        toggleBtn.title = "Boat Color Legend";
        const legendContent = L.DomUtil.create("div", "leaflet-boat-legend-content", container);
        legendContent.style.display = "none";

        const boatColors = {
            Green: "Surigao City",
            Blue: "Cabadbaran City",
            Pink: "Butuan City",
            Yellow: "Nasipit",
            Gray: "Unknown"
        };

        let legendHTML = "<h4>Boat Color Legend</h4>";
        for (const [color, label] of Object.entries(boatColors)) {
            legendHTML += `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <div style="width: 16px; height: 16px; background-color: ${color.toLowerCase()}; border: 1px solid #444; margin-right: 6px; border-radius: 3px;"></div>
                    <span>${label}</span>
                </div>
            `;
        }

        legendContent.innerHTML = legendHTML;

        L.DomEvent.on(toggleBtn, "click", function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            legendContent.style.display = legendContent.style.display === "block" ? "none" : "block";
        });

        return container;
    };
    boatLegend.addTo(map);

    state.boatIcons = {
        Butuan: L.icon({ iconUrl: "public/assets/markers/sail-boat.png", iconSize: [20, 20], iconAnchor: [9, -2], popupAnchor: [0, -10], className: "boat-icon-red" }),
        Surigao: L.icon({ iconUrl: "public/assets/markers/sail-surigao-boat.png", iconSize: [20, 20], iconAnchor: [9, -2], popupAnchor: [0, -10], className: "boat-icon-blue" }),
        Nasipit: L.icon({ iconUrl: "public/assets/markers/sail-nasipit-boat.png", iconSize: [20, 20], iconAnchor: [9, -2], popupAnchor: [0, -10], className: "boat-icon-green" }),
        Cabadbaran: L.icon({ iconUrl: "public/assets/markers/sail-cabadbaran-boat.png", iconSize: [20, 20], iconAnchor: [9, -2], popupAnchor: [0, -10], className: "boat-icon-green" }),
        Unknown: L.icon({ iconUrl: "public/assets/markers/sail-Unknown-boat.png", iconSize: [20, 20], iconAnchor: [9, -2], popupAnchor: [0, -10], className: "boat-icon-gray" })
    };

    state.defaultIcon = L.icon({ iconUrl: "public/assets/markers/mark-blue.png", iconSize: [50, 50], iconAnchor: [26, 46], popupAnchor: [1, -34] });
    state.sosIcon = L.icon({ iconUrl: "public/assets/markers/mark-red.png", iconSize: [50, 50], iconAnchor: [26, 46], popupAnchor: [1, -34] });
    state.helpIcon = L.icon({ iconUrl: "public/assets/markers/mark-green.png", iconSize: [50, 50], iconAnchor: [26, 46], popupAnchor: [1, -34] });
    state.notFoundIcon = L.icon({ iconUrl: "public/assets/markers/mark-gray.png", iconSize: [50, 50], iconAnchor: [26, 46], popupAnchor: [1, -34] });
    state.map = map;
    window.map = map;
})();
