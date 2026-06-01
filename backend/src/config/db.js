import mongoose from "mongoose";

export async function connectDb({ allowMemoryFallback = false } = {}) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
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
    console.log("MongoDB connected");
    return { mode: "mongo" };
  } catch (error) {
    if (allowMemoryFallback) {
      return enableMemoryDb(error.message);
    }
    throw error;
  }
}

function enableMemoryDb(reason) {
  process.env.USE_MEMORY_DB = "true";
  process.env.MONGODB_ERROR = reason;
  console.warn(`MongoDB unavailable; using in-memory development data. Reason: ${reason}`);
  return { mode: "memory", reason };
}
