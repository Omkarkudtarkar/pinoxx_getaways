import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(configDir, "../..");
const projectRoot = path.resolve(backendRoot, "..");

export function loadEnv() {
  const existingEnv = { ...process.env };

  dotenv.config({ path: path.join(backendRoot, ".env") });
  dotenv.config({ path: path.join(projectRoot, ".env"), override: true });

  Object.assign(process.env, existingEnv);
}
