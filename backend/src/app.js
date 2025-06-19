import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createClient } from "redis";
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

// Session configuration
app.use(
  session({
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
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB connected to ${mongoUri}`))
  .catch((err) => console.error("MongoDB error:", err));

// Redis client
let redisClient;
try {
  redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });
  redisClient
    .connect()
    .then(() => console.log("Redis connected"))
    .catch((err) => console.error("Redis error:", err));
} catch (err) {
  console.error("Redis initialization error:", err);
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

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Add shutdown handler to clear database on exit (development only)
if (!isProduction) {
  process.on("SIGINT", async () => {
    console.log("Server shutting down, clearing database and Redis streams...");
    try {
      // Clear Redis streams
      if (redisClient) {
        try {
          const streamKeys = await redisClient.keys("stream:*");
          if (streamKeys && streamKeys.length > 0) {
            for (const key of streamKeys) {
              await redisClient.del(key);
              console.log(`Cleared Redis stream: ${key}`);
            }
          }
          console.log("Redis streams cleared successfully");
        } catch (redisErr) {
          console.error("Error clearing Redis streams:", redisErr);
        }
      }

      // Get all collections and drop them
      const collections = Object.keys(mongoose.connection.collections);
      for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName];
        await collection.drop();
      }
      console.log("Database cleared successfully");
    } catch (err) {
      console.error("Error clearing database:", err);
    } finally {
      // Close Redis connection
      if (redisClient) {
        await redisClient.quit();
        console.log("Redis connection closed");
      }

      // Close MongoDB connection
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    }
  });
}

export default app;
