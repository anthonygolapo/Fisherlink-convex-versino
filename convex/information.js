import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("information").collect();
    const info = rows.map((row) => ({
      id: row.id ?? null,
      name: row.name,
      callsign: row.callsign,
      address: row.address,
      phone_number: row.phone_number || "",
      boat_color: row.boat_color || "",
      engine_type: row.engine_type || "",
      boat_length: row.boat_length ?? null
    }));

    return {
      type: "information_data",
      info
    };
  }
});
