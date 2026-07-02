# FisherLink Project Structure

This repo was reorganized for local cleanup only. App behavior, backend logic, database code, and SQL queries were left unchanged.

## Top-level layout

- `aprs_map.html`
  Main frontend entry page.
- `public/assets/`
  Static image assets used by the frontend.
- `src/css/`
  Frontend stylesheet files moved from the old `css/` folder.
- `src/js/`
  Frontend JavaScript files moved from the old `js/` folder.
- `convex/`
  Convex schema and backend functions for packets, reports, history, and information queries.
- `backend/`
  Legacy Python backend files and runtime config kept for reference.
- `docs/`
  Local project documentation.
- `requirements.legacy.txt`
  Legacy Python backend dependencies kept for reference.
- `Procfile.legacy`
  Legacy Python process file kept for reference.
- `_redirects`
  Existing redirect config kept unchanged.

## Asset folders

- `public/assets/icons/`
  UI icons such as search, filter, delete, calendar, printer, info, history, sidebar, and SOS.
- `public/assets/logos/`
  FisherLink branding and logo files.
- `public/assets/markers/`
  Boat, plot, and map marker images.
- `public/assets/images/`
  Other general images used by the frontend.

## Notes

- `backend/legacy_websocket_server.py` remains in `backend/` as a legacy copy.
- `backend/Procfile.legacy` and `backend/requirements.legacy.txt` are legacy runtime files for the old Python backend.
- No root-level `websocket_server.py` was present during cleanup, so no legacy copy was created.
- The active frontend data path now points at Convex through `src/js/convex-api-bridge.js`.
- The active backend now lives under `convex/`, especially `convex/stations.js`, `convex/history.js`, `convex/information.js`, `convex/reports.js`, and `convex/importer.js`.
