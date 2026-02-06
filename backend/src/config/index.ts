import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;
  nodeEnv: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  adminEmail: string;
  adminPassword: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/tech_britannia",
  jwtSecret: process.env.JWT_SECRET || "default_secret_change_this",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "default_refresh_secret_change_this",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute window (was 15 min)
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "1000",
    10,
  ), // 1000 requests per window
  adminEmail: process.env.ADMIN_EMAIL || "admin@techbritannia.co.uk",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin123!",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

export default config;
