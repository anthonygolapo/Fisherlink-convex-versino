(function() {
    const AppState = {
        currentRole: null,
        adminToken: null,
        adminUsername: null,
        map: null,
        boatIcons: {},
        markers: {},
        trails: {},
        trailLines: {},
        defaultIcon: null,
        sosIcon: null,
        helpIcon: null,
        notFoundIcon: null,
        allStations: [],
        sosAlerts: {},
        sosStatus: {},
        helpStatus: {},
        notFoundStatus: {},
        detailsData: [],
        isSenderReport: false,
        originalSenderDetails: [],
        lastSearchedSender: null,
        historyMap: null,
        historyTrailLayer: null,
        historyCircles: [],
        modalMarker: null
    };

    window.AppState = AppState;
    window.markers = AppState.markers;
    window.trails = AppState.trails;
    window.trailLines = AppState.trailLines;
    window.sosAlerts = AppState.sosAlerts;
    window.sosStatus = AppState.sosStatus;
    window.helpStatus = AppState.helpStatus;
    window.notFoundStatus = AppState.notFoundStatus;
})();
