import { jsonDb } from "./json-db";

/**
 * Universal Database Client:
 * Uses our zero-cost, persistent JSON Database by default.
 * If DATABASE_URL is explicitly configured, it can optionally fall back to Prisma.
 */
let dbClient = jsonDb;

if (process.env.DATABASE_URL && process.env.USE_JSON_DB === "false") {
  try {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    dbClient = new PrismaClient({ adapter });
  } catch (err) {
    console.warn("[DB] Prisma initialization skipped, using JSON DB:", err.message);
    dbClient = jsonDb;
  }
}

export const prisma = dbClient;
export default prisma;
