import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const ROOT_DIR = process.cwd();
const ENV_PATHS = [
  path.join(ROOT_DIR, ".env.local"),
  path.join(ROOT_DIR, ".env")
];
const DEFAULT_BATCH_SIZE = 200;
const MANILA_OFFSET = "+08:00";

function parseArgs(argv) {
  const options = {
    clearExisting: false,
    batchSize: DEFAULT_BATCH_SIZE,
    tables: "all",
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--clear-existing") {
      options.clearExisting = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--batch-size") {
      options.batchSize = Number(argv[i + 1] || DEFAULT_BATCH_SIZE);
      i += 1;
    } else if (arg === "--table") {
      options.tables = argv[i + 1] || "all";
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.batchSize) || options.batchSize <= 0) {
    throw new Error("Batch size must be a positive number.");
  }

  if (!["all", "information", "aprs_packets"].includes(options.tables)) {
    throw new Error("Table must be one of: all, information, aprs_packets.");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run import:mysql-to-convex -- [options]

Options:
  --clear-existing       Delete existing Convex data before importing.
  --batch-size <number>  Number of rows per Convex mutation batch. Default: ${DEFAULT_BATCH_SIZE}
  --table <name>         Import only one table: all, information, aprs_packets
  -h, --help             Show this help text

Environment:
  CONVEX_URL             Required Convex deployment URL.
  DB_HOST                MySQL host. Default: localhost
  DB_USER                MySQL user. Default: root
  DB_PASS                MySQL password. Default: empty
  DB_NAME                MySQL database name. Default: aprs_db
  DB_PORT                MySQL port. Default: 3306

Notes:
  - This is a one-time importer.
  - Run 'npx convex dev' first so the importer mutations exist in your Convex deployment.
`);
}

function parseEnvContents(file) {
  const env = {};

  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function loadLocalEnv() {
  const merged = {};

  for (const envPath of ENV_PATHS) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    Object.assign(merged, parseEnvContents(fs.readFileSync(envPath, "utf8")));
  }

  return merged;
}

function getEnv(name, fallback, localEnv) {
  return process.env[name] ?? localEnv[name] ?? fallback;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toStringOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
}

function toTimestampMs(value) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error(`Unsupported datetime value: ${String(value)}`);
  }

  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}${MANILA_OFFSET}`;
  return new Date(normalized).getTime();
}

function chunkRows(rows, batchSize) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    chunks.push(rows.slice(i, i + batchSize));
  }
  return chunks;
}

async function fetchInformation(connection) {
  const [rows] = await connection.query(`
    SELECT
      id,
      name,
      callsign,
      address,
      phone_number,
      boat_color,
      engine_type,
      boat_length,
      sos_status,
      help_status,
      not_found_status
    FROM information
    ORDER BY id ASC
  `);

  return rows.map((row) => ({
    id: toNumberOrNull(row.id),
    name: row.name ?? "",
    callsign: row.callsign ?? "",
    address: row.address ?? "",
    phone_number: toStringOrNull(row.phone_number),
    boat_color: toStringOrNull(row.boat_color),
    engine_type: toStringOrNull(row.engine_type),
    boat_length: toNumberOrNull(row.boat_length),
    sos_status: toNumberOrNull(row.sos_status),
    help_status: toNumberOrNull(row.help_status),
    not_found_status: toNumberOrNull(row.not_found_status)
  }));
}

async function fetchAprsPackets(connection) {
  const [rows] = await connection.query(`
    SELECT
      sender,
      latitude,
      longitude,
      time_received,
      message,
      place,
      battery_percentage
    FROM aprs_packets
    ORDER BY id ASC
  `);

  return rows.map((row) => ({
    sender: row.sender ?? "",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    time_received: toTimestampMs(row.time_received),
    message: toStringOrNull(row.message),
    place: toStringOrNull(row.place),
    battery_percentage: toNumberOrNull(row.battery_percentage)
  }));
}

async function importInBatches(client, functionRef, rows, batchSize, label) {
  const chunks = chunkRows(rows, batchSize);
  let imported = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const batch = chunks[index];
    const result = await client.mutation(functionRef, { rows: batch });
    imported += result.inserted;
    console.log(`${label}: batch ${index + 1}/${chunks.length} imported (${imported}/${rows.length})`);
  }

  return imported;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const localEnv = loadLocalEnv();
  const convexUrl = getEnv("CONVEX_URL", "", localEnv);
  if (!convexUrl) {
    throw new Error("Missing CONVEX_URL. Set it in your shell or .env file.");
  }

  const dbConfig = {
    host: getEnv("DB_HOST", "localhost", localEnv),
    user: getEnv("DB_USER", "root", localEnv),
    password: getEnv("DB_PASS", "", localEnv),
    database: getEnv("DB_NAME", "aprs_db", localEnv),
    port: Number(getEnv("DB_PORT", "3306", localEnv)),
    dateStrings: true
  };

  const client = new ConvexHttpClient(convexUrl);
  const connection = await mysql.createConnection(dbConfig);

  try {
    const before = await client.query(anyApi.importer.counts, {});
    console.log("Convex counts before import:", before);

    if (options.clearExisting) {
      console.log("Clearing existing Convex data...");
      await client.mutation(anyApi.importer.clearAll, {});
    }

    if (options.tables === "all" || options.tables === "information") {
      const informationRows = await fetchInformation(connection);
      console.log(`Fetched ${informationRows.length} information rows from MySQL.`);
      await importInBatches(
        client,
        anyApi.importer.importInformationBatch,
        informationRows,
        options.batchSize,
        "information"
      );
    }

    if (options.tables === "all" || options.tables === "aprs_packets") {
      const packetRows = await fetchAprsPackets(connection);
      console.log(`Fetched ${packetRows.length} aprs_packets rows from MySQL.`);
      await importInBatches(
        client,
        anyApi.importer.importAprsPacketsBatch,
        packetRows,
        options.batchSize,
        "aprs_packets"
      );
    }

    const after = await client.query(anyApi.importer.counts, {});
    console.log("Convex counts after import:", after);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("MySQL to Convex import failed.");
  if (error instanceof Error) {
    console.error("Message:", error.message || "(empty message)");
    if ("errors" in error && Array.isArray(error.errors)) {
      console.error("Aggregate inner errors:");
      for (const inner of error.errors) {
        if (inner instanceof Error) {
          console.error(`- ${inner.name}: ${inner.message}`);
        } else {
          console.error("-", inner);
        }
      }
    }
    if (error.stack) {
      console.error(error.stack);
    }
    if ("cause" in error && error.cause) {
      console.error("Cause:", error.cause);
    }
  } else {
    console.error("Raw error:", error);
  }
  process.exitCode = 1;
});
