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
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://crmspace-frontend.onrender.com",
      "http://localhost:5173", // For local development
      "https://crmspace-frontend.onrender.com", // Explicitly add production frontend URL
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  })
);
app.use(morgan(isProduction ? "combined" : "dev"));

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
      redisClient = new Redis(process.env.REDIS_URL, {
        tls: isProduction ? { rejectUnauthorized: false } : undefined,
        retryStrategy: (times) => {
          if (times > 10) {
            console.log("Redis max retries reached, using memory store");
            return null; // stop retrying
          }
          return Math.min(times * 50, 1000); // wait time between retries
        },
        maxRetriesPerRequest: 3,
      });
    } else {
      // Fallback to individual connection parameters
      redisClient = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        retryStrategy: (times) => {
          if (times > 10) {
            console.log("Redis max retries reached, using memory store");
            return null; // stop retrying
          }
          return Math.min(times * 50, 1000); // wait time between retries
        },
        maxRetriesPerRequest: 3,
      });
    }

    // Handle Redis errors
    redisClient.on("error", (err) => {
      console.log("Redis error:", err.message);
    });

    // For ioredis, we don't need to explicitly connect
    // Test the connection
    await redisClient.ping();
    console.log("Redis connected successfully");

    // Create Redis store for session
    sessionStore = new RedisStore({ client: redisClient });
    console.log("Redis session store initialized");

    return true;
  } catch (err) {
    console.log(`Redis connection failed: ${err.message}`);
    console.log("Using memory store for session instead");
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
  if (!redisClient) return;

  console.log("Starting stream processors in main app...");

  // Process streams in the background
  processCustomerStream().catch((err) =>
    console.error("Customer stream error:", err.message)
  );
  processOrderStream().catch((err) =>
    console.error("Order stream error:", err.message)
  );
  processCampaignDeliveryStreams().catch((err) =>
    console.error("Campaign stream error:", err.message)
  );
}

// Stream processing functions
async function processCustomerStream() {
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
        "customer_ingest",
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
            await Customer.create(data);
            console.log("Customer saved:", data.email);
            // Acknowledge message as processed
            await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
          } catch (err) {
            if (err.message.includes("duplicate key error")) {
              // Acknowledge duplicate records but log them
              console.log("Customer already exists:", data.email);
              await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
            } else {
              console.error("Customer save error:", err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error processing customer stream:", err.message);
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
  // Try to connect to Redis first if not disabled
  if (useRedis) {
    await setupRedis();

    // If Redis connected successfully, set up consumer groups and start stream processing
    if (redisClient) {
      await setupConsumerGroups();
      // Start stream processing in the background
      startStreamProcessing();
    }
  }

  // Session configuration (with or without Redis)
  app.use(
    session({
      store: sessionStore, // Will be null if Redis connection failed or disabled
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      proxy: true, // Required for Render/Heroku which use proxies
      cookie: {
        secure: isProduction, // Use secure cookies in production
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax", // For cross-site cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: isProduction ? ".onrender.com" : undefined, // Allow cookies across subdomains on Render
      },
    })
  );

  // Passport
  initPassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // MongoDB connection
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/crm";
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected to ${mongoUri}`);
  } catch (err) {
    console.error("MongoDB error:", err);
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

// Start the application
setupApp().catch((err) => {
  console.error("Failed to start application:", err);
});

export default app;
