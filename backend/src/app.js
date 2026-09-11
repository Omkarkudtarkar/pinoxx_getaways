import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { availabilityRouter } from "./routes/availability.js";
import { bookingsRouter } from "./routes/bookings.js";
import { chatbotRouter } from "./routes/chatbot.js";
import { contactRouter } from "./routes/contact.js";
import { createMemoryRouter } from "./routes/memory.js";
import { pinoxxReviewsRouter } from "./routes/pinoxxReviews.js";
import { resortsRouter } from "./routes/resorts.js";
import { ensureMongoDatabaseReady, requireMongoDatabase } from "./middleware/database.js";
import { adminEmail, adminUsername } from "./utils/bootstrapAdmin.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendAssetsPath = path.join(frontendDistPath, "assets");

// Log paths for debugging
console.log("[Pinoxx API] __dirname:", __dirname);
console.log("[Pinoxx API] frontendDistPath:", frontendDistPath);
console.log("[Pinoxx API] NODE_ENV:", process.env.NODE_ENV);
console.log("[Pinoxx API] Frontend dist exists:", fs.existsSync(frontendDistPath));

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://accounts.google.com", "https://vercel.live"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "font-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https:", "wss:"],
      "frame-src": ["'self'", "https://accounts.google.com", "https://vercel.live"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const clientOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const vercelOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ""
].filter(Boolean);
const allowedProductionOrigins = new Set([...clientOrigins, ...vercelOrigins]);
const isLocalOrigin = (origin) => /^https?:\/\/localhost(?::\d+)?$/.test(origin);

function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (clientOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    callback(null, isLocalOrigin(origin));
    return;
  }

  if (allowedProductionOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  callback(null, false);
}

app.use(cors({
  origin: resolveCorsOrigin,
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));
app.use(["/api/auth", "/api/admin", "/auth", "/admin"], rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(express.static(frontendDistPath, {
  index: false,
  setHeaders: (res, filePath) => {
    const assetRelativePath = path.relative(frontendAssetsPath, filePath);
    const isFrontendAsset = assetRelativePath && !assetRelativePath.startsWith("..") && !path.isAbsolute(assetRelativePath);

    if (isFrontendAsset) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return;
    }

    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));

app.get(["/health", "/api/health"], async (_req, res) => {
  const database = await databaseHealth();

  res.status(database.ok ? 200 : 503);
  res.json({
    ok: database.ok,
    service: "pinoxx-api",
    dataMode: database.dataMode,
    mongoConfigured: Boolean(process.env.MONGODB_URI),
    cloudUploadsConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
    googleLoginConfigured: Boolean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID),
    jwtConfigured: Boolean(process.env.JWT_SECRET),
    adminEmail: adminEmail(),
    adminUsername: adminUsername(),
    databaseError: database.ok ? undefined : process.env.MONGODB_ERROR
  });
});

async function databaseHealth() {
  if (process.env.USE_MEMORY_DB === "true") {
    return {
      ok: process.env.NODE_ENV !== "production",
      dataMode: "memory"
    };
  }

  if (!(await ensureMongoDatabaseReady())) {
    return {
      ok: false,
      dataMode: "unavailable"
    };
  }

  return {
    ok: true,
    dataMode: "mongo"
  };
}

function acceptsHtmlRequest(req) {
  return String(req.headers.accept || "").includes("text/html");
}

function sendFrontendIndex(_req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) next();
  });
}

if (process.env.USE_MEMORY_DB === "true") {
  app.use(createMemoryRouter());
}

app.get(/^\/(?:resorts(?:\/[^/]+)?|admin|contact)\/?$/, (req, res, next) => {
  if (!acceptsHtmlRequest(req)) {
    next();
    return;
  }

  sendFrontendIndex(req, res, next);
});

app.use([
  "/api/auth",
  "/auth",
  "/api/resorts",
  "/resorts",
  "/api/availability",
  "/availability",
  "/api/bookings",
  "/bookings",
  "/api/admin",
  "/admin",
  "/api/contact",
  "/contact"
], requireMongoDatabase);

app.use("/api/auth", authRouter);
app.use("/auth", authRouter);
app.use("/api/resorts", resortsRouter);
app.use("/resorts", resortsRouter);
app.use("/api/availability", availabilityRouter);
app.use("/availability", availabilityRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);
app.use("/admin", adminRouter);
app.use("/api/contact", contactRouter);
app.use("/contact", contactRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/chatbot", chatbotRouter);
app.use("/api/pinoxx-reviews", pinoxxReviewsRouter);
app.use("/pinoxx-reviews", pinoxxReviewsRouter);

app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)|assets(?:\/|$)|health$).*/, sendFrontendIndex);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const duplicateField = error.code === 11000 ? Object.keys(error.keyPattern || error.keyValue || {})[0] : "";
  const validationMessage = error.name === "ValidationError"
    ? Object.values(error.errors || {}).map((item) => item.message).filter(Boolean).join(" ")
    : "";
  const status = error.status || (error.code === 11000 ? 409 : error.name === "ValidationError" || error.name === "CastError" ? 400 : 500);

  res.status(status).json({
    message: duplicateField
      ? `A record with this ${duplicateField} already exists. Use a different value.`
      : validationMessage || error.message || "Internal server error"
  });
});
