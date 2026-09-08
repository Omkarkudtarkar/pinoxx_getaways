import dotenv from "dotenv";
import path from "path";
import { connectDb } from "./config/db.js";
import { ensureAdminUser } from "./utils/bootstrapAdmin.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const port = process.env.PORT || 5000;
const allowMemoryFallback = process.env.NODE_ENV !== "production" || process.env.ALLOW_MEMORY_FALLBACK === "true";

connectDb({ allowMemoryFallback })
  .then(() => ensureAdminUser())
  .then(() => {
    return import("./app.js");
  })
  .then(({ app }) => {
    app.listen(port, () => {
      console.log(`Pinoxx API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
