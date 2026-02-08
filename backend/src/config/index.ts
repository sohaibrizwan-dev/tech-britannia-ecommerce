import dotenv from "dotenv";

/**
 * Load environment variables
 * - Locally: loads from .env
 * - Production (Render): uses dashboard env vars
 */
dotenv.config();

/* =========================
   Types
========================= */

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;
  nodeEnv: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  adminEmail: string;
  adminPassword: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

/* =========================
   Helpers
========================= */

const parseCorsOrigins = (origins?: string): string[] => {
  const defaults = [
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  if (!origins) return defaults;

  const parsed = origins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : defaults;
};

/* =========================
   Config Object
========================= */

const config: Config = {
  port: Number(process.env.PORT) || 5000,

  mongoUri:
    process.env.MONGODB_URI ??
    "mongodb://localhost:27017/tech_britannia",

  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "",

  jwtExpire: process.env.JWT_EXPIRE ?? "7d",
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE ?? "30d",

  nodeEnv: process.env.NODE_ENV ?? "development",

  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  rateLimitMaxRequests:
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,

  adminEmail:
    process.env.ADMIN_EMAIL ?? "admin@techbritannia.co.uk",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

/* =========================
   Production Safety Checks
========================= */

if (config.nodeEnv === "production") {
  const requiredVars: Array<keyof NodeJS.ProcessEnv> = [
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "CORS_ORIGIN",
    "STRIPE_SECRET_KEY",
  ];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      throw new Error(
        `❌ Missing required environment variable: ${key}`,
      );
    }
  }
}

export default config;
