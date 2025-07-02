import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import Redis from "ioredis";
import RedisStore from "connect-redis";
import router from "./routes/index.js";
import { initPassport } from "./services/passport.js";
import path from "path";
import MemorySessionStore from "./services/memorySessionStore.js";
// Import stream consumer functionality
import Customer from "./models/Customer.js";
import Order from "./models/Order.js";
import CommunicationLog from "./models/CommunicationLog.js";

// Import test environment variables in development only
if (process.env.NODE_ENV !== "production") {
  import("../test-env.js").catch((err) =>
    console.error("Test env import error:", err)
  );
}

// Load env vars
dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enhanced CORS configuration for cross-domain authentication
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
console.log("Setting up CORS with frontend URL:", frontendUrl);

app.use(
  cors({
    origin: [
      frontendUrl,
      "https://crmspace-frontend.vercel.app", // Explicitly add production frontend URL
      "http://localhost:5173", // For local development
    ],
    credentials: true, // Critical for cookies/authentication
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);
app.use(morgan(isProduction ? "combined" : "dev"));

// Root route handler to avoid 404 errors
app.get("/", (req, res) => {
  res.send("CRMspace Platform API");
});

// Handle favicon requests to avoid 404 errors
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No content response
});

// Redis client setup (with fallback to memory store if Redis is not available)
let redisClient = null;
let sessionStore = null;

// Check if Redis is explicitly disabled
const useRedis = process.env.USE_REDIS !== "false";

// Constants for stream consumer
const CONSUMER_GROUP = "crm-consumer-group";
const CONSUMER_NAME = "consumer-1";

// Try to connect to Redis, but don't crash if it fails
async function setupRedis() {
  if (!useRedis) {
    console.log("Redis disabled by environment variable, using memory store");
    return false;
  }

  try {
    // Check if REDIS_URL is provided (preferred for production/Upstash)
    if (process.env.REDIS_URL) {
      console.log("Connecting to Redis using REDIS_URL");
      redisClient = new Redis(process.env.REDIS_URL, {
        tls: isProduction ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 5000, // Reduced from 10000 to 5000
        disconnectTimeout: 2000, // Reduced from 5000 to 2000
        retryStrategy: (times) => {
          if (times > 3) {
            // Reduced from 5 to 3
            console.log("Redis max retries reached, using memory store");
            return null; // stop retrying
          }
          return Math.min(times * 100, 1000); // Faster retry
        },
        maxRetriesPerRequest: 1, // Reduced from 2 to 1
      });
    } else {
      // Fallback to individual connection parameters
      console.log(
        `Connecting to Redis at ${process.env.REDIS_HOST || "localhost"}:${
          process.env.REDIS_PORT || 6379
        }`
      );
      redisClient = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 5000, // Reduced from 10000 to 5000
        disconnectTimeout: 2000, // Reduced from 5000 to 2000
        retryStrategy: (times) => {
          if (times > 3) {
            // Reduced from 5 to 3
            console.log("Redis max retries reached, using memory store");
            return null; // stop retrying
          }
          return Math.min(times * 100, 1000); // Faster retry
        },
        maxRetriesPerRequest: 1, // Reduced from 2 to 1
      });
    }

    // Handle Redis errors
    redisClient.on("error", (err) => {
      console.log("Redis error:", err.message);
    });

    // Add additional event handlers for better debugging
    redisClient.on("connect", () => {
      console.log("Redis: connect event fired");
    });

    redisClient.on("ready", () => {
      console.log("Redis: ready event fired");
    });

    redisClient.on("end", () => {
      console.log("Redis: end event fired");
    });

    // For ioredis, we don't need to explicitly connect
    // Test the connection with a timeout
    const pingPromise = redisClient.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timeout")), 5000)
    );

    await Promise.race([pingPromise, timeoutPromise]);
    console.log("Redis connected successfully");

    // Make Redis client available to the app
    app.set("redisClient", redisClient);

    // Create Redis store for session
    sessionStore = new RedisStore({ client: redisClient });
    console.log("Redis session store initialized");

    return true;
  } catch (err) {
    console.log(`Redis connection failed: ${err.message}`);
    console.log("Using memory store for session instead");
    // Try to close the Redis client if it exists to prevent hanging connections
    if (redisClient) {
      try {
        await redisClient
          .quit()
          .catch((e) => console.log("Error closing Redis:", e.message));
      } catch (e) {
        console.log("Error during Redis quit:", e.message);
      }
    }
    redisClient = null;
    return false;
  }
}

// Setup consumer groups if Redis is available
async function setupConsumerGroups() {
  if (!redisClient) return;

  try {
    // Create consumer groups if they don't exist
    try {
      await redisClient.xgroup(
        "CREATE",
        "customer_ingest",
        CONSUMER_GROUP,
        "$",
        "MKSTREAM"
      );
      console.log("Customer consumer group created");
    } catch (err) {
      if (err.message.includes("BUSYGROUP")) {
        console.log("Customer consumer group already exists");
      } else {
        console.error("Error creating customer consumer group:", err.message);
      }
    }

    try {
      await redisClient.xgroup(
        "CREATE",
        "order_ingest",
        CONSUMER_GROUP,
        "$",
        "MKSTREAM"
      );
      console.log("Order consumer group created");
    } catch (err) {
      if (err.message.includes("BUSYGROUP")) {
        console.log("Order consumer group already exists");
      } else {
        console.error("Error creating order consumer group:", err.message);
      }
    }
  } catch (err) {
    console.error("Error setting up consumer groups:", err.message);
  }
}

// Start stream processing if Redis is available
async function startStreamProcessing() {
  if (!redisClient) {
    console.log(
      "STREAM PROCESSING: Redis client not available, skipping stream processing"
    );
    return;
  }

  console.log("STREAM PROCESSING: Starting stream processors in main app...");

  try {
    // Ensure consumer groups are set up
    await setupConsumerGroups();
    console.log("STREAM PROCESSING: Consumer groups set up successfully");

    // Process streams in the background
    console.log("STREAM PROCESSING: Starting customer stream processor");
    processCustomerStream().catch((err) =>
      console.error("STREAM ERROR: Customer stream error:", err.message)
    );

    console.log("STREAM PROCESSING: Starting order stream processor");
    processOrderStream().catch((err) =>
      console.error("STREAM ERROR: Order stream error:", err.message)
    );

    console.log(
      "STREAM PROCESSING: Starting campaign delivery stream processor"
    );
    processCampaignDeliveryStreams().catch((err) =>
      console.error("STREAM ERROR: Campaign stream error:", err.message)
    );

    console.log("STREAM PROCESSING: All stream processors started");
  } catch (err) {
    console.error(
      "STREAM ERROR: Failed to start stream processing:",
      err.message
    );
  }
}

// Stream processing functions
async function processCustomerStream() {
  if (!redisClient) {
    console.log("STREAM ERROR: Redis client not available for customer stream");
    return;
  }

  console.log("STREAM PROCESSING: Customer stream processor started");

  while (true) {
    try {
      console.log("STREAM PROCESSING: Reading from customer_ingest stream...");
      // Read new messages using consumer group
      const res = await redisClient.xreadgroup(
        "GROUP",
        CONSUMER_GROUP,
        CONSUMER_NAME,
        "BLOCK",
        5000,
        "COUNT",
        10,
        "STREAMS",
        "customer_ingest",
        ">"
      );

      if (res) {
        console.log(
          "STREAM PROCESSING: Received data from customer_ingest stream:",
          JSON.stringify(res)
        );
        const [[, entries]] = res;
        console.log(
          `STREAM PROCESSING: Processing ${entries.length} customer entries`
        );

        for (const [id, fields] of entries) {
          console.log(`STREAM PROCESSING: Processing customer entry ${id}`);
          const data = Object.fromEntries(
            fields
              .map((v, i, arr) => (i % 2 === 0 ? [v, arr[i + 1]] : null))
              .filter(Boolean)
          );
          console.log("STREAM PROCESSING: Parsed customer data:", data);

          try {
            await Customer.create(data);
            console.log("STREAM PROCESSING: Customer saved:", data.email);
            // Acknowledge message as processed
            await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
            console.log(`STREAM PROCESSING: Acknowledged customer entry ${id}`);
          } catch (err) {
            if (err.message.includes("duplicate key error")) {
              // Acknowledge duplicate records but log them
              console.log(
                "STREAM PROCESSING: Customer already exists:",
                data.email
              );
              await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
              console.log(
                `STREAM PROCESSING: Acknowledged duplicate customer entry ${id}`
              );
            } else {
              console.error("STREAM ERROR: Customer save error:", err.message);
            }
          }
        }
      } else {
        console.log(
          "STREAM PROCESSING: No new messages in customer_ingest stream"
        );
      }
    } catch (err) {
      console.error(
        "STREAM ERROR: Error processing customer stream:",
        err.message
      );
      // Small delay to prevent tight error loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function processOrderStream() {
  if (!redisClient) return;

  while (true) {
    try {
      // Read new messages using consumer group
      const res = await redisClient.xreadgroup(
        "GROUP",
        CONSUMER_GROUP,
        CONSUMER_NAME,
        "BLOCK",
        5000,
        "COUNT",
        10,
        "STREAMS",
        "order_ingest",
        ">"
      );

      if (res) {
        const [[, entries]] = res;
        for (const [id, fields] of entries) {
          const data = Object.fromEntries(
            fields
              .map((v, i, arr) => (i % 2 === 0 ? [v, arr[i + 1]] : null))
              .filter(Boolean)
          );
          try {
            await Order.create(data);
            console.log("Order saved:", data.customerId);
            // Acknowledge message as processed
            await redisClient.xack("order_ingest", CONSUMER_GROUP, id);
          } catch (err) {
            if (err.message.includes("duplicate key error")) {
              // Acknowledge duplicate records but log them
              console.log("Order already exists:", data._id);
              await redisClient.xack("order_ingest", CONSUMER_GROUP, id);
            } else {
              console.error("Order save error:", err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error processing order stream:", err.message);
      // Small delay to prevent tight error loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function processCampaignDeliveryStreams() {
  if (!redisClient) return;

  while (true) {
    try {
      // Find all campaign streams
      const campaignStreams = await redisClient.keys("stream:campaign:*");

      if (campaignStreams.length === 0) {
        // No campaign streams yet, wait and check again
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      // Process each campaign stream
      for (const streamKey of campaignStreams) {
        try {
          // Ensure consumer group exists for this stream
          try {
            await redisClient.xgroup(
              "CREATE",
              streamKey,
              CONSUMER_GROUP,
              "$",
              "MKSTREAM"
            );
          } catch (err) {
            if (!err.message.includes("BUSYGROUP")) {
              console.error(
                `Error creating consumer group for ${streamKey}:`,
                err.message
              );
            }
          }

          // Read messages from this stream
          const res = await redisClient.xreadgroup(
            "GROUP",
            CONSUMER_GROUP,
            CONSUMER_NAME,
            "BLOCK",
            1000,
            "COUNT",
            10,
            "STREAMS",
            streamKey,
            ">"
          );

          if (res) {
            const [[, entries]] = res;
            for (const [id, fields] of entries) {
              const data = Object.fromEntries(
                fields
                  .map((v, i, arr) => (i % 2 === 0 ? [v, arr[i + 1]] : null))
                  .filter(Boolean)
              );

              try {
                // Process the message (simulate message delivery)
                console.log(
                  `Processing message for ${data.customerName} (${data.customerEmail})`
                );

                // Simulate 90% success rate
                const isSuccess = Math.random() < 0.9;

                // Update the communication log with the result
                if (data.logId) {
                  await CommunicationLog.findByIdAndUpdate(data.logId, {
                    status: isSuccess ? "SENT" : "FAILED",
                    deliveredAt: isSuccess ? new Date() : undefined,
                    isMockData: data.isMockData === "true",
                  });

                  console.log(
                    `Message ${isSuccess ? "sent" : "failed"} to ${
                      data.customerName
                    } (${data.isMockData === "true" ? "mock" : "real"} data)`
                  );
                }

                // Acknowledge message as processed
                await redisClient.xack(streamKey, CONSUMER_GROUP, id);
              } catch (err) {
                console.error(
                  `Error processing campaign message:`,
                  err.message
                );
              }
            }
          }
        } catch (streamErr) {
          console.error(
            `Error processing stream ${streamKey}:`,
            streamErr.message
          );
        }
      }

      // Small delay before checking streams again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(
        "Error in campaign delivery stream processor:",
        err.message
      );
      // Small delay to prevent tight error loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Setup session middleware with appropriate store
async function setupApp() {
  let sessionStore;
  let redisConnected = false;

  // Try to connect to Redis first if not disabled and in production
  if (useRedis && isProduction) {
    redisConnected = await setupRedis();

    // If Redis connected successfully, set up consumer groups and start stream processing
    if (redisClient) {
      await setupConsumerGroups();
      // Start stream processing in the background
      startStreamProcessing();

      // Create Redis store for session
      sessionStore = new RedisStore({ client: redisClient });
      console.log("Redis session store initialized");
    }
  }

  // If Redis is not connected, use the built-in memory store
  if (!redisConnected) {
    console.log("Using default memory store for sessions");
    // Don't create a store - express-session will use its default MemoryStore
  }

  // Session configuration
  const sessionOptions = {
    // Only set store if Redis is connected
    ...(redisConnected && { store: sessionStore }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Render/Heroku which use proxies
    cookie: {
      secure: isProduction, // Use secure cookies in production
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax", // For cross-site cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    // Add rolling: true to extend session on each request
    rolling: true,
  };

  // Log session configuration (without exposing secrets)
  console.log("Session configuration:", {
    store: redisConnected ? "Redis" : "Memory",
    cookie: {
      secure: sessionOptions.cookie.secure,
      sameSite: sessionOptions.cookie.sameSite,
      httpOnly: sessionOptions.cookie.httpOnly,
    },
    proxy: sessionOptions.proxy,
  });

  app.use(session(sessionOptions));

  // Passport
  initPassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // MongoDB connection with timeout
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/crm";
  try {
    console.log(
      `Attempting to connect to MongoDB at ${mongoUri.split("@").pop()}`
    );

    // Set a timeout for MongoDB connection
    const connectWithTimeout = async (uri, options, timeout) => {
      return Promise.race([
        mongoose.connect(uri, options),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("MongoDB connection timeout")),
            timeout
          )
        ),
      ]);
    };

    await connectWithTimeout(
      mongoUri,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10 seconds
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      },
      15000
    ); // 15 second overall timeout

    console.log(`MongoDB connected to ${mongoUri.split("@").pop()}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.error("Server will continue without database functionality");
  }

  // Placeholder for routes
  app.get("/", (req, res) => {
    res.send("CRMspace Platform API");
  });

  // Serve uploaded campaign images
  app.use(
    "/uploads/campaigns",
    express.static(path.join(process.cwd(), "uploads", "campaigns"))
  );

  app.use(router);

  const PORT = process.env.PORT || 5003;
  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }

  // Add shutdown handler to clear database on exit (development only)
  if (!isProduction) {
    process.on("SIGINT", async () => {
      console.log("Server shutting down...");
      try {
        // Close Redis connection if it exists
        if (redisClient && redisClient.isOpen) {
          await redisClient
            .quit()
            .catch((err) => console.error("Redis quit error:", err.message));
          console.log("Redis connection closed");
        }

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (err) {
        console.error("Error during shutdown:", err.message);
      } finally {
        process.exit(0);
      }
    });
  }
}

// At the very beginning of the file, add this:
process.on("uncaughtException", (err) => {
  console.error(
    "UNCAUGHT EXCEPTION! 💥 Shutting down...",
    err.name,
    err.message
  );
  console.error(err.stack);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥", err.name, err.message);
  console.error(err.stack);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Start the application
setupApp().catch((err) => {
  console.error("Failed to start application:", err.name, err.message);
  console.error(err.stack);

  // Even if setup fails, start the server to prevent 502 errors
  const PORT = process.env.PORT || 5003;
  if (process.env.NODE_ENV !== "test") {
    app.get("*", (req, res) => {
      res.status(200).send("CRMspace API - Limited functionality mode");
    });

    app.listen(PORT, () =>
      console.log(`Server running in limited mode on port ${PORT}`)
    );
  }
});

export default app;
