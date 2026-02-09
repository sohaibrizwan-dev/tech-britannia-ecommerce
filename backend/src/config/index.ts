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
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  adminEmail: string;
  adminPassword: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

// Parse CORS origins from comma-separated string
const parseCorsOrigins = (origins: string | undefined): string[] => {
  const defaultOrigins = ["http://localhost:5173", "http://localhost:3000"];
  if (!origins) return defaultOrigins;
  
  const parsed = origins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  
  return parsed.length > 0 ? parsed : defaultOrigins;
};

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    // In development, warn but allow empty if not critical for startup
    console.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

const config: Config = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/tech_britannia",
  
  // Secrets - fail if missing in production
  jwtSecret: getEnv('JWT_SECRET', 'dev_jwt_secret_do_not_use_in_prod'),
  jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev_refresh_secret_do_not_use_in_prod'),
  
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10),
  
  adminEmail: process.env.ADMIN_EMAIL || "admin@techbritannia.co.uk",
  // In production, admin password must be set via env or seed script shouldn't run
  adminPassword: process.env.ADMIN_PASSWORD || "Admin123!",
  
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

export default config;
