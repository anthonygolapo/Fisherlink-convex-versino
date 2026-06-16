import { query } from "./_generated/server";
import {
  getManilaDayKey,
  getMonthYearLabel,
  isStatusMessage
} from "./lib";

function buildReportRows(packets, validSenders) {
  const latestBySenderDayMessage = new Map();

  for (const packet of packets) {
    if (!validSenders.has(packet.sender) || !isStatusMessage(packet.message)) {
      continue;
    }

    const key = `${packet.sender}|${getManilaDayKey(packet.time_received)}|${packet.message}`;
    const existing = latestBySenderDayMessage.get(key);
    if (!existing || packet.time_received > existing.time_received) {
      latestBySenderDayMessage.set(key, packet);
    }
  }

  return [...latestBySenderDayMessage.values()];
}

function countsTemplate() {
  return {
    sos_count: 0,
    safe_count: 0,
    help_count: 0,
    not_found_count: 0
  };
}

function applyCount(target, message) {
  if (message === "SOS") {
    target.sos_count += 1;
  } else if (message === "Marked as Safe") {
    target.safe_count += 1;
  } else if (message === "Help on the Way") {
    target.help_count += 1;
  } else if (message === "Not Found") {
    target.not_found_count += 1;
  }
}

export const safeReport = query({
  args: {},
  handler: async (ctx) => {
    const packets = await ctx.db.query("aprs_packets").collect();
    const informationRows = await ctx.db.query("information").collect();
    const validSenders = new Set(informationRows.map((row) => row.callsign));
    const rows = buildReportRows(packets, validSenders);
    const grouped = new Map();

    for (const row of rows) {
      const month = getMonthYearLabel(row.time_received);
      const existing = grouped.get(month) || {
        month,
        ...countsTemplate(),
        latest_time_received: row.time_received
      };
      applyCount(existing, row.message);
      existing.latest_time_received = Math.max(existing.latest_time_received, row.time_received);
      grouped.set(month, existing);
    }

    const report = [...grouped.values()]
      .sort((a, b) => b.latest_time_received - a.latest_time_received)
      .map(({ latest_time_received, ...row }) => row);

    return { type: "safe_report", report };
  }
});

export const senderReport = query({
  args: {},
  handler: async (ctx) => {
    const packets = await ctx.db.query("aprs_packets").collect();
    const informationRows = await ctx.db.query("information").collect();
    const validSenders = new Set(informationRows.map((row) => row.callsign));
    const rows = buildReportRows(packets, validSenders);
    const grouped = new Map();

    for (const row of rows) {
      const month = getMonthYearLabel(row.time_received);
      const key = `${month}|${row.sender}`;
      const existing = grouped.get(key) || {
        month,
        sender: row.sender,
        ...countsTemplate(),
        latest_time_received: row.time_received
      };
      applyCount(existing, row.message);
      existing.latest_time_received = Math.max(existing.latest_time_received, row.time_received);
      grouped.set(key, existing);
    }

    const report = [...grouped.values()]
      .sort((a, b) => {
        if (b.latest_time_received !== a.latest_time_received) {
          return b.latest_time_received - a.latest_time_received;
        }
        return a.sender.localeCompare(b.sender);
      })
      .map(({ latest_time_received, ...row }) => row);

    return { type: "sender_report", report };
  }
});
