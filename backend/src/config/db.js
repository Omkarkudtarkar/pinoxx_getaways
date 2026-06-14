import mongoose from "mongoose";

export async function connectDb({ allowMemoryFallback = false } = {}) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    process.env.DATABASE_READY = "false";
    process.env.MONGODB_ERROR = "MONGODB_URI is not configured";
    if (allowMemoryFallback) {
      return enableMemoryDb("MONGODB_URI is not configured");
    }
    throw new Error("MONGODB_URI is required");
  }

  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 5000)
    });
    process.env.USE_MEMORY_DB = "false";
    process.env.DATABASE_READY = "true";
    delete process.env.MONGODB_ERROR;
    console.log("MongoDB connected");
    return { mode: "mongo" };
  } catch (error) {
    process.env.DATABASE_READY = "false";
    process.env.MONGODB_ERROR = error.message;
    if (allowMemoryFallback) {
      return enableMemoryDb(error.message);
    }
    throw error;
  }
}

function enableMemoryDb(reason) {
  process.env.USE_MEMORY_DB = "true";
  process.env.DATABASE_READY = "memory";
  process.env.MONGODB_ERROR = reason;
  console.warn(`MongoDB unavailable; using in-memory development data. Reason: ${reason}`);
  return { mode: "memory", reason };
}
