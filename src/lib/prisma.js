import { jsonDb } from "./json-db.js";

/**
 * Universal Database Client:
 * Uses our zero-cost, persistent JSON Database.
 */
export const prisma = jsonDb;
export default prisma;
