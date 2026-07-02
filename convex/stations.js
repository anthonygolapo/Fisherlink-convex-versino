import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getNowTimestamp,
  mapInfoByCallsign,
  toStation,
  upsertLatestStation
} from "./lib";

async function latestPacketForSender(ctx, sender) {
  return await ctx.db
    .query("aprs_packets")
    .withIndex("by_sender_time", (q) => q.eq("sender", sender))
    .order("desc")
    .first();
}

async function infoForSender(ctx, sender) {
  return await ctx.db
    .query("information")
    .withIndex("by_callsign", (q) => q.eq("callsign", sender))
    .unique();
}

async function buildLatestPacketsFromHistory(ctx) {
  const packets = await ctx.db.query("aprs_packets").collect();
  const latestBySender = new Map();

  for (const packet of packets) {
    const existing = latestBySender.get(packet.sender);
    if (!existing || packet.time_received > existing.time_received) {
      latestBySender.set(packet.sender, packet);
    }
  }

  return [...latestBySender.values()];
}

async function latestPacketsForMap(ctx) {
  const latestPackets = await ctx.db.query("latest_stations").collect();
  if (latestPackets.length > 0) {
    return latestPackets;
  }
  return await buildLatestPacketsFromHistory(ctx);
}

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const latestPacketsSource = await latestPacketsForMap(ctx);
    const informationRows = await ctx.db.query("information").collect();
    const infoByCallsign = mapInfoByCallsign(informationRows);
    const latestPackets = latestPacketsSource
      .filter((packet) => infoByCallsign.has(packet.sender))
      .sort((a, b) => b.time_received - a.time_received)
      .slice(0, 100);

    const now = getNowTimestamp();
    const stations = latestPackets.map((packet) =>
      toStation(packet, infoByCallsign.get(packet.sender), now)
    );

    return {
      type: "update",
      stations,
      count: latestPackets.length
    };
  }
});

export const getUpdateStamp = query({
  args: {},
  handler: async (ctx) => {
    const [latestPackets, informationRows] = await Promise.all([
      latestPacketsForMap(ctx),
      ctx.db.query("information").collect()
    ]);
    let latestTimeReceived = 0;

    for (const packet of latestPackets) {
      if (packet.time_received > latestTimeReceived) {
        latestTimeReceived = packet.time_received;
      }
    }

    const informationSignature = informationRows
      .map((row) =>
        [
          row._id,
          row.callsign,
          row.name,
          row.address,
          row.phone_number || "",
          row.boat_color || "",
          row.engine_type || "",
          row.boat_length ?? "",
          row.sos_status ?? 0,
          row.help_status ?? 0,
          row.not_found_status ?? 0
        ].join("|")
      )
      .sort()
      .join("||");

    return {
      packetCount: latestPackets.length,
      latestTimeReceived,
      informationCount: informationRows.length,
      informationSignature
    };
  }
});

export const getTrail = query({
  args: { sender: v.string() },
  handler: async (ctx, args) => {
    const info = await infoForSender(ctx, args.sender);
    if (!info) {
      return { type: "search_result", sender: args.sender, locations: [] };
    }

    const packets = await ctx.db
      .query("aprs_packets")
      .withIndex("by_sender_time", (q) => q.eq("sender", args.sender))
      .order("desc")
      .take(20);

    const locations = packets.map((packet) => ({
      sender: packet.sender,
      latitude: packet.latitude,
      longitude: packet.longitude,
      time_received: new Date(packet.time_received).toISOString(),
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

    return { type: "search_result", sender: args.sender, locations };
  }
});

export const markSafe = mutation({
  args: { sender: v.string() },
  handler: async (ctx, args) => {
    const info = await infoForSender(ctx, args.sender);
    if (!info) {
      throw new Error(`Sender '${args.sender}' not found in information table.`);
    }

    const latestPacket = await latestPacketForSender(ctx, args.sender);
    if (!latestPacket) {
      throw new Error(`No packet found for sender '${args.sender}'.`);
    }

    const latestPacketSnapshot = {
      sender: latestPacket.sender,
      latitude: latestPacket.latitude,
      longitude: latestPacket.longitude,
      time_received: getNowTimestamp(),
      message: "Marked as Safe",
      place: latestPacket.place || "",
      battery_percentage:
        latestPacket.battery_percentage === undefined
          ? undefined
          : latestPacket.battery_percentage
    };

    await ctx.db.insert("aprs_packets", latestPacketSnapshot);

    await upsertLatestStation(ctx, latestPacketSnapshot);

    await ctx.db.patch(info._id, {
      sos_status: 0,
      help_status: 0,
      not_found_status: 0
    });

    return { ok: true };
  }
});

export const markHelpOnWay = mutation({
  args: { sender: v.string() },
  handler: async (ctx, args) => {
    const info = await infoForSender(ctx, args.sender);
    if (!info) {
      throw new Error(`Sender '${args.sender}' not found in information table.`);
    }

    const latestPacket = await latestPacketForSender(ctx, args.sender);
    if (!latestPacket) {
      throw new Error(`No packet found for sender '${args.sender}'.`);
    }

    const latestPacketSnapshot = {
      sender: latestPacket.sender,
      latitude: latestPacket.latitude,
      longitude: latestPacket.longitude,
      time_received: getNowTimestamp(),
      message: "Help on the Way",
      place: latestPacket.place || "",
      battery_percentage:
        latestPacket.battery_percentage === undefined
          ? undefined
          : latestPacket.battery_percentage
    };

    await ctx.db.insert("aprs_packets", latestPacketSnapshot);

    await upsertLatestStation(ctx, latestPacketSnapshot);

    await ctx.db.patch(info._id, {
      sos_status: 0,
      help_status: 1,
      not_found_status: 0
    });

    return { ok: true };
  }
});

export const markNotFound = mutation({
  args: { sender: v.string() },
  handler: async (ctx, args) => {
    const info = await infoForSender(ctx, args.sender);
    if (!info) {
      throw new Error(`Sender '${args.sender}' not found in information table.`);
    }

    const latestPacket = await latestPacketForSender(ctx, args.sender);
    if (!latestPacket) {
      throw new Error(`No packet found for sender '${args.sender}'.`);
    }

    await ctx.db.patch(latestPacket._id, {
      message: "Not Found"
    });

    await upsertLatestStation(ctx, {
      sender: latestPacket.sender,
      latitude: latestPacket.latitude,
      longitude: latestPacket.longitude,
      time_received: latestPacket.time_received,
      message: "Not Found",
      place: latestPacket.place || "",
      battery_percentage:
        latestPacket.battery_percentage === undefined
          ? undefined
          : latestPacket.battery_percentage
    });

    await ctx.db.patch(info._id, {
      sos_status: 0,
      help_status: 0,
      not_found_status: 1
    });

    return { ok: true };
  }
});
