import { connectDb } from "./config/db.js";
import { loadEnv } from "./config/env.js";
import { ensureAdminUser } from "./utils/bootstrapAdmin.js";

loadEnv();

const port = process.env.PORT || 5000;
const allowMemoryFallback = process.env.ALLOW_MEMORY_FALLBACK === "true";

async function startServer() {
  try {
    await connectDb({ allowMemoryFallback });
    await ensureAdminUser();
  } catch (error) {
    console.error("Database connection failed; starting API with database marked unavailable.", error);
    process.env.USE_MEMORY_DB = "false";
    process.env.DATABASE_READY = "false";
    process.env.MONGODB_ERROR = error.message;
  }

  const { app } = await import("./app.js");

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`Pinoxx API running on port ${port}`);
      resolve();
    });
  });
}

startServer()
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
