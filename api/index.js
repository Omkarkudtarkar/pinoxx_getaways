import dotenv from "dotenv";
import { connectDb } from "../backend/src/config/db.js";

dotenv.config();

process.env.MONGODB_TIMEOUT_MS ||= "5000";

let appPromise;

async function prepareApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const allowMemoryFallback = process.env.NODE_ENV !== "production" || process.env.ALLOW_MEMORY_FALLBACK === "true";

      try {
        await connectDb({ allowMemoryFallback });
      } catch (error) {
        console.error("Database connection failed.", error);
        process.env.USE_MEMORY_DB = "false";
        process.env.DATABASE_READY = "false";
        process.env.MONGODB_ERROR = error.message;
      }

      const { app } = await import("../backend/src/app.js");
      return app;
    })();
  }

  return appPromise;
}

export default async function handler(req, res) {
  const preparedApp = await prepareApp();
  return preparedApp(req, res);
}
