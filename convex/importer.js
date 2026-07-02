import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { upsertLatestStation } from "./lib";

const informationRow = v.object({
  id: v.union(v.number(), v.null()),
  name: v.string(),
  callsign: v.string(),
  address: v.string(),
  phone_number: v.union(v.string(), v.null()),
  boat_color: v.union(v.string(), v.null()),
  engine_type: v.union(v.string(), v.null()),
  boat_length: v.union(v.number(), v.null()),
  sos_status: v.union(v.number(), v.null()),
  help_status: v.union(v.number(), v.null()),
  not_found_status: v.union(v.number(), v.null())
});

const packetRow = v.object({
  sender: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  time_received: v.number(),
  message: v.union(v.string(), v.null()),
  place: v.union(v.string(), v.null()),
  battery_percentage: v.union(v.number(), v.null())
});

function toOptionalNumber(value) {
  return value === null ? undefined : value;
}

function toOptionalString(value) {
  return value === null ? undefined : value;
}

export const counts = query({
  args: {},
  handler: async (ctx) => {
    const [information, aprsPackets, latestStations] = await Promise.all([
      ctx.db.query("information").collect(),
      ctx.db.query("aprs_packets").collect(),
      ctx.db.query("latest_stations").collect()
    ]);

    return {
      information: information.length,
      aprs_packets: aprsPackets.length,
      latest_stations: latestStations.length
    };
  }
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    for (const row of await ctx.db.query("information").collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("aprs_packets").collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("latest_stations").collect()) {
      await ctx.db.delete(row._id);
    }

    return { ok: true };
  }
});

export const importInformationBatch = mutation({
  args: {
    rows: v.array(informationRow)
  },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert("information", {
        id: toOptionalNumber(row.id),
        name: row.name,
        callsign: row.callsign,
        address: row.address,
        phone_number: toOptionalString(row.phone_number),
        boat_color: toOptionalString(row.boat_color),
        engine_type: toOptionalString(row.engine_type),
        boat_length: toOptionalNumber(row.boat_length),
        sos_status: toOptionalNumber(row.sos_status),
        help_status: toOptionalNumber(row.help_status),
        not_found_status: toOptionalNumber(row.not_found_status)
      });
    }

    return { inserted: args.rows.length };
  }
});

export const importAprsPacketsBatch = mutation({
  args: {
    rows: v.array(packetRow)
  },
  handler: async (ctx, args) => {
    const latestBySender = new Map();

    for (const row of args.rows) {
      const packet = {
        sender: row.sender,
        latitude: row.latitude,
        longitude: row.longitude,
        time_received: row.time_received,
        message: toOptionalString(row.message),
        place: toOptionalString(row.place),
        battery_percentage: toOptionalNumber(row.battery_percentage)
      };

      await ctx.db.insert("aprs_packets", packet);

      const currentLatest = latestBySender.get(packet.sender);
      if (!currentLatest || packet.time_received > currentLatest.time_received) {
        latestBySender.set(packet.sender, packet);
      }
    }

    for (const packet of latestBySender.values()) {
      await upsertLatestStation(ctx, packet);
    }

    return { inserted: args.rows.length };
  }
});

export const rebuildLatestStations = mutation({
  args: {},
  handler: async (ctx) => {
    for (const row of await ctx.db.query("latest_stations").collect()) {
      await ctx.db.delete(row._id);
    }

    const latestBySender = new Map();
    for (const packet of await ctx.db.query("aprs_packets").collect()) {
      const existing = latestBySender.get(packet.sender);
      if (!existing || packet.time_received > existing.time_received) {
        latestBySender.set(packet.sender, packet);
      }
    }

    for (const packet of latestBySender.values()) {
      await ctx.db.insert("latest_stations", {
        sender: packet.sender,
        latitude: packet.latitude,
        longitude: packet.longitude,
        time_received: packet.time_received,
        message: packet.message || undefined,
        place: packet.place || undefined,
        battery_percentage:
          packet.battery_percentage === null || packet.battery_percentage === undefined
            ? undefined
            : packet.battery_percentage
      });
    }

    return { rebuilt: latestBySender.size };
  }
});
