import Redis from "ioredis";

// Add a global handler for Redis errors to prevent unhandled error events
Redis.prototype.on = function (eventName, listener) {
  if (eventName === "error" && this.listenerCount("error") === 0) {
    // Add a default error handler if none exists
    this.addListener("error", (err) => {
      console.log(`Redis client error (handled): ${err.message}`);
    });
  }
  return this.addListener(eventName, listener);
};

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    try {
      // Check if REDIS_URL is provided (preferred for Upstash)
      if (process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL, {
          tls:
            process.env.NODE_ENV === "production"
              ? { rejectUnauthorized: false }
              : undefined,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
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
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });
      }

      // Handle connection errors
      redisClient.on("error", (err) => {
        console.log(`Redis client error: ${err.message}`);
      });
    } catch (err) {
      console.error("Redis client initialization error:", err.message);
      // Return a dummy client that doesn't throw errors
      return createDummyClient();
    }
  }
  return redisClient;
}

// Create a dummy client that doesn't throw errors for operations
function createDummyClient() {
  const dummyClient = {
    isConnected: false,
    connect: () => Promise.resolve(),
    on: () => {},
    xgroup: () => Promise.resolve(),
    xreadgroup: () => Promise.resolve(null),
    xack: () => Promise.resolve(),
    keys: () => Promise.resolve([]),
    quit: () => Promise.resolve(),
    ping: () => Promise.reject(new Error("Dummy client - Redis not available")),
  };

  // Add a proxy to handle any other Redis commands gracefully
  return new Proxy(dummyClient, {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop];
      }
      // Return a no-op function for any other Redis commands
      return () => Promise.resolve(null);
    },
  });
}
