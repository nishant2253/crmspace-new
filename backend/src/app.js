import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createClient } from "redis";
import RedisStore from "connect-redis";
import router from "./routes/index.js";
import { initPassport } from "./services/passport.js";
import path from "path";

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
      process.env.FRONTEND_URL ||
        (isProduction
          ? "https://crmspace-new.vercel.app"
          : "http://localhost:5173"),
      "http://localhost:5173", // Explicitly add this to ensure it works
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan(isProduction ? "combined" : "dev"));

// Redis client setup (with fallback to memory store if Redis is not available)
let redisClient = null;
let sessionStore = null;

// Check if Redis is explicitly disabled
const useRedis = process.env.USE_REDIS !== "false";

// Try to connect to Redis, but don't crash if it fails
async function setupRedis() {
  if (!useRedis) {
    console.log("Redis disabled by environment variable, using memory store");
    return false;
  }

  try {
    // Check if REDIS_URL is provided (preferred for production/Upstash)
    if (process.env.REDIS_URL) {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log("Redis max retries reached, using memory store");
              return false; // stop retrying
            }
            return Math.min(retries * 50, 1000); // wait time between retries
          },
        },
      });
    } else {
      // Fallback to individual connection parameters
      redisClient = createClient({
        url: `redis://${process.env.REDIS_HOST || "localhost"}:${
          process.env.REDIS_PORT || 6379
        }`,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log("Redis max retries reached, using memory store");
              return false; // stop retrying
            }
            return Math.min(retries * 50, 1000); // wait time between retries
          },
        },
      });
    }

    // Handle Redis errors
    redisClient.on("error", (err) => {
      console.log("Redis error:", err.message);
    });

    // Try to connect
    await redisClient.connect();
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

// Setup session middleware with appropriate store
async function setupApp() {
  // Try to connect to Redis first if not disabled
  if (useRedis) {
    await setupRedis();
  }

  // Session configuration (with or without Redis)
  app.use(
    session({
      store: sessionStore, // Will be null if Redis connection failed or disabled
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction, // Use secure cookies in production
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax", // For cross-site cookies in production
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
