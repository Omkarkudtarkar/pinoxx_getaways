import mongoose from "mongoose";
import { connectDb } from "../config/db.js";

const readyStateLabels = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized"
};

let mongoConnectionPromise = null;

export function mongoConnectionState() {
  return readyStateLabels[mongoose.connection.readyState] || "unknown";
}

export function isMongoDatabaseReady() {
  return (
    process.env.USE_MEMORY_DB !== "true" &&
    mongoose.connection.readyState === 1
  );
}

export async function ensureMongoDatabaseReady() {
  if (isMongoDatabaseReady()) return true;

  if (process.env.USE_MEMORY_DB === "true") return false;

  if (!process.env.MONGODB_URI) {
    process.env.DATABASE_READY = "false";
    process.env.MONGODB_ERROR = "MONGODB_URI is not configured";
    return false;
  }

  try {
    mongoConnectionPromise ||= connectDb({ allowMemoryFallback: false })
      .finally(() => {
        mongoConnectionPromise = null;
      });
    await mongoConnectionPromise;
    return isMongoDatabaseReady();
  } catch (error) {
    process.env.DATABASE_READY = "false";
    process.env.MONGODB_ERROR = error.message;
    return false;
  }
}

export async function requireMongoDatabase(_req, res, next) {
  if (await ensureMongoDatabaseReady()) {
    next();
    return;
  }

  sendMongoDatabaseUnavailable(res);
}

export function sendMongoDatabaseUnavailable(res) {
  res.status(503).json({
    message: "Database is not connected. Check MONGODB_URI and MongoDB Atlas Network Access, then restart or redeploy.",
    databaseState: mongoConnectionState(),
    databaseError: process.env.MONGODB_ERROR || "MongoDB connection is not ready"
  });
}
