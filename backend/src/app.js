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

// Import test environment variables
import "../test-env.js";

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(morgan("dev"));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport
initPassport();
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/crm", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected to 'crm' database"))
  .catch((err) => console.error("MongoDB error:", err));

// Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redisClient
  .connect()
  .then(() => console.log("Redis connected"))
  .catch((err) => console.error("Redis error:", err));

// Placeholder for routes
app.get("/", (req, res) => {
  res.send("Mini CRM Platform API");
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

// Add shutdown handler to clear database on exit
process.on("SIGINT", async () => {
  console.log("Server shutting down, clearing database and Redis streams...");
  try {
    // Clear Redis streams
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
    await redisClient.quit();
    console.log("Redis connection closed");

    // Close MongoDB connection using await instead of callback
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
});

export default app;
