# FisherLink Local Setup

These steps describe how to run the Convex-based version of the project locally.

## 1. Open the project folder

Use the actual app folder:

`C:\Users\ENVI-COMM\Desktop\fisherlink-website-main\fisherlink-website-main`

## 2. Install Convex

Install the local Node dependency:

```powershell
npm install
```

## 3. Create or connect a Convex project

Start the Convex dev environment:

```powershell
npx convex dev
```

This creates or connects a Convex deployment and generates the local Convex files needed by the backend functions.

## 4. Set the frontend deployment URL and local passwords

Update [frontend-config.js](/C:/Users/ENVI-COMM/Desktop/fisherlink-website-main/fisherlink-website-main/src/js/frontend-config.js) and replace the placeholder `CONVEX_URL` with your actual Convex deployment URL.

Also replace the placeholder values in `AUTH.ADMIN_PASSWORD` and `AUTH.USER_PASSWORD` before using the app locally.

## 5. Seed or import your data

This migration changed the app from MySQL to Convex. The app will not show existing fishermen, packets, or reports until the `information` and `aprs_packets` data is inserted into Convex.

To import from the old MySQL database:

```powershell
npm run import:mysql-to-convex -- --clear-existing
```

Optional flags:

- `--table information`
- `--table aprs_packets`
- `--batch-size 100`

The importer reads `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, and `CONVEX_URL` from your shell or a local `.env` file.

For sharing the project, keep real environment values only in your ignored local env files and share placeholder-based files such as `.env.example`.

## 6. Open the frontend

Serve the folder with any simple static file server.

Example:

```powershell
python -m http.server 8000
```

Then open:

`http://localhost:8000/aprs_map.html`

## Notes

- The old Python backend remains in `backend/` as a legacy reference, with files renamed to `*.legacy*` where appropriate.
- The active frontend data layer now uses Convex through `src/js/convex-api-bridge.js`.
- The active backend code is the Convex code in `convex/`.
- Static assets remain under `public/assets/`.
