import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getNowTimestamp, mapInfoByCallsign, toStation } from "./lib";

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

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = getNowTimestamp() - 24 * 60 * 60 * 1000;
    const packets = await ctx.db
      .query("aprs_packets")
      .withIndex("by_time_received", (q) => q.gte("time_received", cutoff))
      .collect();
    const informationRows = await ctx.db.query("information").collect();
    const infoByCallsign = mapInfoByCallsign(informationRows);

    const latestBySender = new Map();
    for (const packet of packets) {
      const existing = latestBySender.get(packet.sender);
      if (!existing || packet.time_received > existing.time_received) {
        latestBySender.set(packet.sender, packet);
      }
    }

    const latestPackets = [...latestBySender.values()]
      .sort((a, b) => b.time_received - a.time_received)
      .slice(0, 100);

    const now = getNowTimestamp();
    const stations = latestPackets.map((packet) =>
      toStation(packet, infoByCallsign.get(packet.sender), now)
    );

    return {
      type: "update",
      stations,
      count: latestBySender.size
    };
  }
});

export const getUpdateStamp = query({
  args: {},
  handler: async (ctx) => {
    const packets = await ctx.db.query("aprs_packets").collect();
    let latestTimeReceived = 0;

    for (const packet of packets) {
      if (packet.time_received > latestTimeReceived) {
        latestTimeReceived = packet.time_received;
      }
    }

    return {
      packetCount: packets.length,
      latestTimeReceived
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

    await ctx.db.insert("aprs_packets", {
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
    });

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

    await ctx.db.insert("aprs_packets", {
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
    });

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

    await ctx.db.patch(info._id, {
      sos_status: 0,
      help_status: 0,
      not_found_status: 1
    });

    return { ok: true };
  }
});
