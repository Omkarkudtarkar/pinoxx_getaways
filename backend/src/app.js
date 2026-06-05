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

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

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
      "script-src": ["'self'", "https://accounts.google.com"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "font-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https:"],
      "frame-src": ["'self'", "https://accounts.google.com"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Determine CORS origin
let corsOrigin = "http://localhost:5173";
if (process.env.CLIENT_URL) {
  corsOrigin = process.env.CLIENT_URL.split(",");
} else if (process.env.NODE_ENV === "production") {
  // In production on Vercel, allow same-origin requests
  corsOrigin = true;
}

app.use(cors({
  origin: corsOrigin,
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

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(express.static(frontendDistPath));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pinoxx-api",
    dataMode: process.env.USE_MEMORY_DB === "true" ? "memory" : "mongo"
  });
});

if (process.env.USE_MEMORY_DB === "true") {
  app.use(createMemoryRouter());
}

app.use("/api/auth", authRouter);
app.use("/api/resorts", resortsRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/pinoxx-reviews", pinoxxReviewsRouter);

app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)|health$).*/, (_req, res, next) => {
  res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) next();
  });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Internal server error"
  });
});
