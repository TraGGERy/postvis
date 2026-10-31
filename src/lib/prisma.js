import { jsonDb } from "./json-db";

/**
 * Universal Database Client:
 * Uses our zero-cost, persistent JSON Database.
 */
export const prisma = jsonDb;
export default prisma;
