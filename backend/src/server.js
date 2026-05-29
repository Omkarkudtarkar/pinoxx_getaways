import dotenv from "dotenv";
import path from "path";
import { connectDb } from "./config/db.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const port = process.env.PORT || 5000;

connectDb({ allowMemoryFallback: true })
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
