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
- `requirements.txt`
  Root Python dependencies kept unchanged.
- `Procfile`
  Root process file kept unchanged.
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

- `backend/websocket_server.py` remains in `backend/` as a legacy copy.
- No root-level `websocket_server.py` was present during cleanup, so no legacy copy was created.
- The active frontend data path now points at Convex through `src/js/convexAdapter.js`.
