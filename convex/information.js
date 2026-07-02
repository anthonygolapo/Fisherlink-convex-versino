import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeCallsign(callsign) {
  return callsign.trim().toUpperCase();
}

async function ensureUniqueCallsign(ctx, callsign, excludedDocId) {
  const normalizedCallsign = normalizeCallsign(callsign);
  const existing = await ctx.db
    .query("information")
    .withIndex("by_callsign", (q) => q.eq("callsign", normalizedCallsign))
    .collect();

  const duplicate = existing.find((row) => row._id !== excludedDocId);
  if (duplicate) {
    throw new Error(`Callsign '${normalizedCallsign}' is already assigned to another fisherman.`);
  }

  return normalizedCallsign;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("information").collect();
    const info = rows.map((row) => ({
      _id: row._id,
      id: row.id ?? null,
      name: row.name,
      callsign: row.callsign,
      address: row.address,
      phone_number: row.phone_number || "",
      boat_color: row.boat_color || "",
      engine_type: row.engine_type || "",
      boat_length: row.boat_length ?? null,
      sos_status: row.sos_status ?? 0,
      help_status: row.help_status ?? 0,
      not_found_status: row.not_found_status ?? 0
    }));

    return {
      type: "information_data",
      info
    };
  }
});

export const create = mutation({
  args: {
    id: v.optional(v.number()),
    name: v.string(),
    callsign: v.string(),
    address: v.string(),
    phone_number: v.optional(v.string()),
    boat_color: v.optional(v.string()),
    engine_type: v.optional(v.string()),
    boat_length: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const normalizedCallsign = await ensureUniqueCallsign(ctx, args.callsign);

    await ctx.db.insert("information", {
      id: args.id,
      name: args.name,
      callsign: normalizedCallsign,
      address: args.address,
      phone_number: args.phone_number,
      boat_color: args.boat_color,
      engine_type: args.engine_type,
      boat_length: args.boat_length,
      sos_status: 0,
      help_status: 0,
      not_found_status: 0
    });

    return { ok: true };
  }
});

export const update = mutation({
  args: {
    docId: v.id("information"),
    id: v.optional(v.number()),
    name: v.string(),
    callsign: v.string(),
    address: v.string(),
    phone_number: v.optional(v.string()),
    boat_color: v.optional(v.string()),
    engine_type: v.optional(v.string()),
    boat_length: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.docId);
    if (!existing) {
      throw new Error("Information record not found.");
    }

    const normalizedCallsign = await ensureUniqueCallsign(ctx, args.callsign, args.docId);

    await ctx.db.patch(args.docId, {
      id: args.id,
      name: args.name,
      callsign: normalizedCallsign,
      address: args.address,
      phone_number: args.phone_number,
      boat_color: args.boat_color,
      engine_type: args.engine_type,
      boat_length: args.boat_length
    });

    return { ok: true };
  }
});

export const remove = mutation({
  args: {
    docId: v.id("information")
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.docId);
    if (!existing) {
      throw new Error("Information record not found.");
    }

    await ctx.db.delete(args.docId);
    return { ok: true };
  }
});
