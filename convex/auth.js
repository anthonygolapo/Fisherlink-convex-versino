import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_KEY = "default";
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin";

function encodeHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return encodeHex(bytes);
}

async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return encodeHex(new Uint8Array(digest));
}

async function getCredentialRow(ctx) {
  return await ctx.db
    .query("admin_credentials")
    .withIndex("by_key", (q) => q.eq("key", ADMIN_KEY))
    .unique();
}

export async function ensureAdminSetup(ctx) {
  const existing = await getCredentialRow(ctx);
  if (existing) {
    return existing;
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD, salt);
  const docId = await ctx.db.insert("admin_credentials", {
    key: ADMIN_KEY,
    username: DEFAULT_ADMIN_USERNAME,
    password_hash: passwordHash,
    salt,
    updated_at: Date.now()
  });

  return await ctx.db.get(docId);
}

async function createSession(ctx) {
  const token = randomHex(24);
  await ctx.db.insert("admin_sessions", {
    token,
    credential_key: ADMIN_KEY,
    created_at: Date.now()
  });
  return token;
}

async function deleteAllSessions(ctx) {
  const sessions = await ctx.db.query("admin_sessions").collect();
  for (const session of sessions) {
    await ctx.db.delete(session._id);
  }
}

export async function requireAdminSession(ctx, token) {
  if (!token) {
    throw new Error("Admin session is required.");
  }

  const session = await ctx.db
    .query("admin_sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) {
    throw new Error("Admin session is invalid. Please log in again.");
  }

  return session;
}

export const getAuthMode = query({
  args: {},
  handler: async (ctx) => {
    const credentials = await ensureAdminSetup(ctx);
    return {
      type: "auth_mode",
      adminConfigured: Boolean(credentials),
      defaultAdminUsername: credentials?.username || DEFAULT_ADMIN_USERNAME
    };
  }
});

export const verifySession = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    await ensureAdminSetup(ctx);
    await requireAdminSession(ctx, args.token);
    const credentials = await getCredentialRow(ctx);

    return {
      type: "admin_session",
      valid: true,
      username: credentials?.username || DEFAULT_ADMIN_USERNAME
    };
  }
});

export const loginAdmin = mutation({
  args: {
    username: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const credentials = await ensureAdminSetup(ctx);
    const attemptedUsername = args.username.trim();
    const passwordHash = await hashPassword(args.password, credentials.salt);

    if (
      attemptedUsername !== credentials.username ||
      passwordHash !== credentials.password_hash
    ) {
      throw new Error("Incorrect admin username or password.");
    }

    const token = await createSession(ctx);
    return {
      type: "admin_login",
      token,
      username: credentials.username
    };
  }
});

export const logoutAdmin = mutation({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { ok: true };
  }
});

export const changeAdminCredentials = mutation({
  args: {
    token: v.string(),
    current_password: v.string(),
    new_username: v.string(),
    new_password: v.string()
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    const credentials = await ensureAdminSetup(ctx);
    const currentPasswordHash = await hashPassword(args.current_password, credentials.salt);

    if (currentPasswordHash !== credentials.password_hash) {
      throw new Error("Current password is incorrect.");
    }

    const nextUsername = args.new_username.trim();
    const nextPassword = args.new_password.trim();

    if (!nextUsername || !nextPassword) {
      throw new Error("New username and new password are required.");
    }

    const nextSalt = randomHex(16);
    const nextPasswordHash = await hashPassword(nextPassword, nextSalt);

    await ctx.db.patch(credentials._id, {
      username: nextUsername,
      password_hash: nextPasswordHash,
      salt: nextSalt,
      updated_at: Date.now()
    });

    await deleteAllSessions(ctx);
    const token = await createSession(ctx);

    return {
      type: "admin_credentials_changed",
      token,
      username: nextUsername
    };
  }
});
