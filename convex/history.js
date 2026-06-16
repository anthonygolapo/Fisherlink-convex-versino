import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  formatAppDateTime,
  formatLegacyDateTime,
  getMonthYearLabel,
  isStatusMessage,
  parseManilaDateTime
} from "./lib";

async function infoForSender(ctx, sender) {
  return await ctx.db
    .query("information")
    .withIndex("by_callsign", (q) => q.eq("callsign", sender))
    .unique();
}

export const fetchHistory = query({
  args: {
    sender: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const info = await infoForSender(ctx, args.sender);
    if (!info) {
      return { type: "history_result", sender: args.sender, history: [] };
    }

    const startDate = parseManilaDateTime(args.start_date);
    const endDate = parseManilaDateTime(args.end_date);

    const packets = await ctx.db
      .query("aprs_packets")
      .withIndex("by_sender_time", (q) => q.eq("sender", args.sender))
      .order("desc")
      .collect();

    const history = packets
      .filter((packet) => {
        if (startDate && packet.time_received < startDate.getTime()) {
          return false;
        }
        if (endDate && packet.time_received > endDate.getTime()) {
          return false;
        }
        return true;
      })
      .map((packet) => ({
        sender: packet.sender,
        latitude: packet.latitude,
        longitude: packet.longitude,
        time_received: formatAppDateTime(packet.time_received),
        message: packet.message || "",
        place: packet.place || "",
        battery_percentage:
          packet.battery_percentage === undefined ? null : packet.battery_percentage,
        name: info.name,
        address: info.address,
        boat_color: info.boat_color || null,
        engine_type: info.engine_type || null,
        boat_length: info.boat_length || null
      }));

    return { type: "history_result", sender: args.sender, history };
  }
});

export const senderDetails = query({
  args: {
    sender: v.string(),
    month: v.string()
  },
  handler: async (ctx, args) => {
    const packets = await ctx.db
      .query("aprs_packets")
      .withIndex("by_sender_time", (q) => q.eq("sender", args.sender))
      .order("desc")
      .collect();

    const details = packets
      .filter(
        (packet) =>
          isStatusMessage(packet.message) &&
          getMonthYearLabel(packet.time_received) === args.month
      )
      .map((packet) => ({
        time_received: formatLegacyDateTime(packet.time_received),
        message: packet.message
      }));

    return { type: "sender_details", details };
  }
});
