import { mutation } from "./_generated/server";
import { v } from "convex/values";

function hoursAgo(hours) {
  return Date.now() - hours * 60 * 60 * 1000;
}

const sampleInformation = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    callsign: "FISH001",
    address: "Nasipit",
    phone_number: "09123456789",
    boat_color: "Blue",
    engine_type: "Diesel",
    boat_length: 8,
    sos_status: 0,
    help_status: 0,
    not_found_status: 0
  },
  {
    id: 2,
    name: "Pedro Santos",
    callsign: "FISH002",
    address: "Cabadbaran City",
    phone_number: "09987654321",
    boat_color: "Green",
    engine_type: "Gasoline",
    boat_length: 7,
    sos_status: 1,
    help_status: 0,
    not_found_status: 0
  },
  {
    id: 3,
    name: "Mario Reyes",
    callsign: "FISH003",
    address: "Surigao City",
    phone_number: "09111222333",
    boat_color: "Yellow",
    engine_type: "Diesel",
    boat_length: 9,
    sos_status: 0,
    help_status: 1,
    not_found_status: 0
  }
];

const samplePackets = [
  {
    sender: "FISH001",
    latitude: 8.969,
    longitude: 125.294,
    time_received: hoursAgo(1),
    message: "Fishing near coast",
    place: "Nasipit",
    battery_percentage: 85
  },
  {
    sender: "FISH002",
    latitude: 9.122,
    longitude: 125.531,
    time_received: hoursAgo(2),
    message: "SOS",
    place: "Cabadbaran",
    battery_percentage: 62
  },
  {
    sender: "FISH003",
    latitude: 9.784,
    longitude: 125.488,
    time_received: hoursAgo(3),
    message: "Help on the Way",
    place: "Surigao",
    battery_percentage: 74
  },
  {
    sender: "FISH001",
    latitude: 8.975,
    longitude: 125.301,
    time_received: hoursAgo(5),
    message: "All good",
    place: "Nasipit",
    battery_percentage: 88
  }
];

export const populateSampleData = mutation({
  args: {
    reset: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    if (args.reset) {
      for (const row of await ctx.db.query("information").collect()) {
        await ctx.db.delete(row._id);
      }
      for (const row of await ctx.db.query("aprs_packets").collect()) {
        await ctx.db.delete(row._id);
      }
    }

    for (const row of sampleInformation) {
      await ctx.db.insert("information", row);
    }

    for (const row of samplePackets) {
      await ctx.db.insert("aprs_packets", row);
    }

    return {
      insertedInformation: sampleInformation.length,
      insertedAprsPackets: samplePackets.length
    };
  }
});

export const insertLivePacket = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.db.insert("aprs_packets", {
      sender: "FISH002",
      latitude: 9.145,
      longitude: 125.545,
      time_received: Date.now(),
      message: "Live update test",
      place: "Cabadbaran",
      battery_percentage: 59
    });

    return { ok: true };
  }
});

export const insertLatestFISH001 = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.db.insert("aprs_packets", {
      sender: "FISH001",
      latitude: 8.981,
      longitude: 125.312,
      time_received: Date.now(),
      message: "Latest live packet for FISH001",
      place: "Nasipit",
      battery_percentage: 83
    });

    return { ok: true };
  }
});
