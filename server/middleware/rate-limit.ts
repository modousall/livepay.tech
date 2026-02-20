/**
 * Rate Limiting Middleware
 * Protects against brute-force, DDoS, and API abuse
 */

import rateLimit, { RateLimitRequestHandler, MemoryStore } from "express-rate-limit";

// Redis is not used in local development - only memory store
// In production (Firebase), rate limiting is handled differently
let redisClient: any = null;

/**
 * Initialize Redis client for rate limiting
 * In local development, this is skipped - memory store is used instead
 */
export async function initRateLimiterRedis(): Promise<void> {
  // Skip Redis initialization in local development
  // Memory store will be used automatically
  console.log("[RATE LIMIT] Using memory store (Redis not available in local dev)");
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): any {
  return redisClient;
}

/**
 * Create a rate limit store (always Memory in local dev)
 */
function createStore(prefix: string): InstanceType<typeof MemoryStore> {
  // Always use memory store in local development
  return new MemoryStore();
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  store: createStore("rl:api:"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests",
    message: "You have exceeded the rate limit. Please try again later.",
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again in 15 minutes.",
    });
  },
});

/**
 * Payment endpoint rate limiter
 * 5 requests per minute per IP (strict for payment security)
 */
export const paymentLimiter: RateLimitRequestHandler = rateLimit({
  store: createStore("rl:payment:"),
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for admin users
    return (req as any).user?.role === "admin" || (req as any).user?.role === "superadmin";
  },
  message: {
    error: "Too many payment attempts",
    message: "Please wait before trying again.",
  },
  handler: (req, res) => {
    console.warn("[RATE LIMIT] Payment rate limit exceeded for IP:", req.ip);
    res.status(429).json({
      error: "Too many payment attempts",
      message: "Rate limit exceeded. Please wait 1 minute before trying again.",
    });
  },
});

/**
 * Authentication rate limiter
 * 5 login attempts per 15 minutes per IP
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  store: createStore("rl:auth:"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many login attempts",
    message: "Please try again later.",
  },
  handler: (req, res) => {
    console.warn("[RATE LIMIT] Auth rate limit exceeded for IP:", req.ip);
    res.status(429).json({
      error: "Too many login attempts",
      message: "Rate limit exceeded. Please try again in 15 minutes.",
    });
  },
});

/**
 * Webhook rate limiter (for payment providers)
 * 30 requests per minute per IP
 */
export const webhookLimiter: RateLimitRequestHandler = rateLimit({
  store: createStore("rl:webhook:"),
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many webhook requests",
    message: "Rate limit exceeded.",
  },
  handler: (req, res) => {
    console.warn("[RATE LIMIT] Webhook rate limit exceeded for IP:", req.ip);
    res.status(429).json({
      error: "Too many webhook requests",
      message: "Rate limit exceeded.",
    });
  },
});

/**
 * Order creation rate limiter
 * 10 orders per minute per IP (prevent spam)
 */
export const orderLimiter: RateLimitRequestHandler = rateLimit({
  store: createStore("rl:order:"),
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many order attempts",
    message: "Please wait before creating another order.",
  },
  handler: (req, res) => {
    console.warn("[RATE LIMIT] Order rate limit exceeded for IP:", req.ip);
    res.status(429).json({
      error: "Too many order attempts",
      message: "Rate limit exceeded. Please wait 1 minute.",
    });
  },
});

/**
 * Apply rate limiters to specific routes
 */
export function applyRateLimiters(app: any) {
  // Apply general API limiter to all /api routes
  app.use("/api", apiLimiter);

  // Apply specific limiters to sensitive endpoints
  app.use("/api/payment", paymentLimiter);
  app.use("/api/auth", authLimiter);
  app.use("/api/webhooks", webhookLimiter);
  app.use("/api/orders", orderLimiter);
}

/**
 * Cleanup function to close Redis connection
 */
export async function cleanupRateLimiter(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log("[RATE LIMIT] Redis connection closed");
  }
}
