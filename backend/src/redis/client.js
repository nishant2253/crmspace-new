import Redis from "ioredis";

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    // Check if REDIS_URL is provided (preferred for Upstash)
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        tls:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : undefined,
      });
    } else {
      // Fallback to individual connection parameters
      redisClient = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        tls:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : undefined,
      });
    }
  }
  return redisClient;
}
