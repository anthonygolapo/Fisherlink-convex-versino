const MANILA_OFFSET = "+08:00";
const MANILA_TIME_ZONE = "Asia/Manila";
const STATUS_MESSAGES = new Set([
  "SOS",
  "Marked as Safe",
  "Help on the Way",
  "Not Found"
]);

function formatParts(date, options) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    ...options
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

export function normalizeNumber(value, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

export function getNowTimestamp() {
  return Date.now();
}

export function getManilaDateTime(input) {
  return input instanceof Date ? input : new Date(input);
}

export function parseManilaDateTime(value) {
  if (!value) {
    return null;
  }

  const [datePart, timePart = "00:00:00"] = value.trim().split(" ");
  return new Date(`${datePart}T${timePart}${MANILA_OFFSET}`);
}

export function formatAppDateTime(value) {
  const date = getManilaDateTime(value);
  const parts = formatParts(date, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return `${parts.month} ${parts.day}, ${parts.year}, ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
}

export function formatLegacyDateTime(value) {
  const date = getManilaDateTime(value);
  const parts = formatParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function getMonthYearLabel(value) {
  const date = getManilaDateTime(value);
  const parts = formatParts(date, {
    year: "numeric",
    month: "long"
  });
  return `${parts.month}-${parts.year}`;
}

export function getManilaDayKey(value) {
  const date = getManilaDateTime(value);
  const parts = formatParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isStatusMessage(message) {
  return STATUS_MESSAGES.has(message);
}

export function statusPatchForMessage(message, currentInfo = {}) {
  const lower = (message || "").toLowerCase();
  const helpActive = normalizeNumber(currentInfo.help_status) === 1;

  if (lower.includes("sos")) {
    if (helpActive) {
      return {
        sos_status: normalizeNumber(currentInfo.sos_status),
        help_status: 1,
        not_found_status: 0
      };
    }
    return { sos_status: 1, help_status: 0, not_found_status: 0 };
  }

  if (lower.includes("help")) {
    return { sos_status: 0, help_status: 1, not_found_status: 0 };
  }

  if (lower.includes("safe")) {
    return { sos_status: 0, help_status: 0, not_found_status: 0 };
  }

  if (lower.includes("not found")) {
    return { sos_status: 0, help_status: 0, not_found_status: 1 };
  }

  return {
    sos_status: normalizeNumber(currentInfo.sos_status),
    help_status: normalizeNumber(currentInfo.help_status),
    not_found_status: normalizeNumber(currentInfo.not_found_status)
  };
}

export function mapInfoByCallsign(informationRows) {
  return new Map(informationRows.map((row) => [row.callsign, row]));
}

export function toStation(packet, info, nowTimestamp) {
  const timeGapMinutes = (nowTimestamp - packet.time_received) / 60000;
  const statusPatch = statusPatchForMessage(packet.message, info || {});

  return {
    sender: packet.sender,
    latitude: packet.latitude,
    longitude: packet.longitude,
    time_received: formatAppDateTime(packet.time_received),
    message: packet.message || "",
    place: packet.place || "",
    battery_percentage:
      packet.battery_percentage === undefined ? null : packet.battery_percentage,
    name: info?.name || null,
    address: info?.address || null,
    phone_number: info?.phone_number || null,
    boat_color: info?.boat_color || null,
    engine_type: info?.engine_type || null,
    boat_length: info?.boat_length || null,
    sos_status: statusPatch.sos_status,
    help_status: statusPatch.help_status,
    not_found_status: statusPatch.not_found_status,
    time_gap_minutes: timeGapMinutes,
    is_delayed: timeGapMinutes > 20
  };
}
