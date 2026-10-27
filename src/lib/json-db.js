import fs from "fs";
import path from "path";

// Choose database file location
function getDbPath() {
  if (process.env.JSON_DB_PATH) {
    return process.env.JSON_DB_PATH;
  }
  // If running in a read-only serverless environment (like Vercel production)
  if (process.env.VERCEL) {
    return path.join("/tmp", "postvis-db.json");
  }
  return path.join(process.cwd(), "data", "db.json");
}

const DB_PATH = getDbPath();

const initialDbStructure = {
  users: [
    {
      id: "demo-user-1",
      name: "Demo Creator",
      email: "creator@postvis.local",
      credits: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  scheduledPosts: [],
  mediaAssets: [],
  postTags: [],
  accounts: [],
  sessions: [],
  creations: [],
  appInstances: [],
};

let memoryDb = null;

function loadDb() {
  if (memoryDb) return memoryDb;

  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      memoryDb = JSON.parse(data);
    } else {
      memoryDb = { ...initialDbStructure };
      fs.writeFileSync(DB_PATH, JSON.stringify(memoryDb, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("[JSON_DB] Disk write/read issue, using in-memory state:", err.message);
    if (!memoryDb) memoryDb = { ...initialDbStructure };
  }

  // Ensure all collections exist
  for (const key of Object.keys(initialDbStructure)) {
    if (!Array.isArray(memoryDb[key])) {
      memoryDb[key] = [];
    }
  }

  return memoryDb;
}

function saveDb() {
  if (!memoryDb) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (err) {
    console.warn("[JSON_DB] Failed to persist to disk:", err.message);
  }
}

function createModelHandler(collectionName, idPrefix = "item") {
  return {
    async findMany(params = {}) {
      const db = loadDb();
      let items = [...(db[collectionName] || [])];
      const { where, orderBy, take, skip } = params;

      if (where) {
        items = items.filter((item) => {
          return Object.entries(where).every(([key, value]) => {
            if (value === undefined) return true;
            if (typeof value === "object" && value !== null) {
              if ("not" in value) return item[key] !== value.not;
              if ("in" in value && Array.isArray(value.in)) return value.in.includes(item[key]);
            }
            return item[key] === value;
          });
        });
      }

      if (orderBy) {
        const [sortKey, sortDir] = Object.entries(orderBy)[0] || [];
        if (sortKey) {
          items.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return sortDir === "desc" ? 1 : -1;
            if (valA > valB) return sortDir === "desc" ? -1 : 1;
            return 0;
          });
        }
      }

      if (skip) items = items.slice(skip);
      if (take) items = items.slice(0, take);

      return items;
    },

    async findFirst(params = {}) {
      const results = await this.findMany({ ...params, take: 1 });
      return results[0] || null;
    },

    async findUnique(params = {}) {
      const db = loadDb();
      const { where } = params;
      if (!where) return null;

      const items = db[collectionName] || [];
      const item = items.find((i) => {
        return Object.entries(where).some(([k, v]) => i[k] === v);
      });

      return item || null;
    },

    async create(params = {}) {
      const db = loadDb();
      const { data } = params;
      const now = new Date().toISOString();

      const newItem = {
        id: data.id || `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: data.createdAt || now,
        updatedAt: now,
        ...data,
      };

      if (!db[collectionName]) db[collectionName] = [];
      db[collectionName].unshift(newItem);
      saveDb();

      return newItem;
    },

    async update(params = {}) {
      const db = loadDb();
      const { where, data } = params;
      if (!where) throw new Error("Missing where clause for update");

      const items = db[collectionName] || [];
      const index = items.findIndex((i) => {
        return Object.entries(where).some(([k, v]) => i[k] === v);
      });

      if (index === -1) {
        throw new Error(`Record to update not found in ${collectionName}`);
      }

      const existing = items[index];
      const updated = { ...existing };

      for (const [key, val] of Object.entries(data)) {
        if (typeof val === "object" && val !== null) {
          if ("increment" in val) {
            updated[key] = (Number(updated[key]) || 0) + val.increment;
            continue;
          }
          if ("decrement" in val) {
            updated[key] = (Number(updated[key]) || 0) - val.decrement;
            continue;
          }
        }
        updated[key] = val;
      }

      updated.updatedAt = new Date().toISOString();
      items[index] = updated;
      saveDb();

      return updated;
    },

    async delete(params = {}) {
      const db = loadDb();
      const { where } = params;
      if (!where) throw new Error("Missing where clause for delete");

      const items = db[collectionName] || [];
      const index = items.findIndex((i) => {
        return Object.entries(where).some(([k, v]) => i[k] === v);
      });

      if (index === -1) {
        throw new Error(`Record to delete not found in ${collectionName}`);
      }

      const [deleted] = items.splice(index, 1);
      saveDb();
      return deleted;
    },

    async count(params = {}) {
      const items = await this.findMany(params);
      return items.length;
    },

    async upsert(params = {}) {
      const { where, create: createData, update: updateData } = params;
      const existing = await this.findUnique({ where });
      if (existing) {
        return await this.update({ where, data: updateData });
      }
      return await this.create({ data: createData });
    },
  };
}

export const jsonDb = {
  user: createModelHandler("users", "user"),
  scheduledPost: createModelHandler("scheduledPosts", "post"),
  mediaAsset: createModelHandler("mediaAssets", "media"),
  postTag: createModelHandler("postTags", "tag"),
  account: createModelHandler("accounts", "acc"),
  session: createModelHandler("sessions", "sess"),
  creation: createModelHandler("creations", "create"),
  appInstance: createModelHandler("appInstances", "app"),
};
