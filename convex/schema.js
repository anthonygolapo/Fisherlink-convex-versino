import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    aprs_packets: defineTable({
      sender: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      time_received: v.number(),
      message: v.optional(v.string()),
      place: v.optional(v.string()),
      battery_percentage: v.optional(v.number())
    })
      .index("by_sender_time", ["sender", "time_received"])
      .index("by_time_received", ["time_received"]),
    latest_stations: defineTable({
      sender: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      time_received: v.number(),
      message: v.optional(v.string()),
      place: v.optional(v.string()),
      battery_percentage: v.optional(v.number())
    })
      .index("by_sender", ["sender"])
      .index("by_time_received", ["time_received"]),
    information: defineTable({
      id: v.optional(v.number()),
      name: v.string(),
      callsign: v.string(),
      address: v.string(),
      phone_number: v.optional(v.string()),
      boat_color: v.optional(v.string()),
      engine_type: v.optional(v.string()),
      boat_length: v.optional(v.number()),
      sos_status: v.optional(v.number()),
      help_status: v.optional(v.number()),
      not_found_status: v.optional(v.number())
    }).index("by_callsign", ["callsign"]),
    admin_credentials: defineTable({
      key: v.string(),
      username: v.string(),
      password_hash: v.string(),
      salt: v.string(),
      updated_at: v.number()
    }).index("by_key", ["key"]),
    admin_sessions: defineTable({
      token: v.string(),
      credential_key: v.string(),
      created_at: v.number()
    }).index("by_token", ["token"])
  },
  {
    schemaValidation: false
  }
);
