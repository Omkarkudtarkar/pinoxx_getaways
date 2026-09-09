import mongoose from "mongoose";

const readyStateLabels = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized"
};

export function mongoConnectionState() {
  return readyStateLabels[mongoose.connection.readyState] || "unknown";
}

export function isMongoDatabaseReady() {
  return (
    process.env.USE_MEMORY_DB !== "true" &&
    process.env.DATABASE_READY === "true" &&
    mongoose.connection.readyState === 1
  );
}

export function requireMongoDatabase(_req, res, next) {
  if (isMongoDatabaseReady()) {
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
