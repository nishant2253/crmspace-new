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
import MongoStore from "connect-mongo";

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

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL ||
    (isProduction
      ? "https://crmspacefrontend.vercel.app"
      : "http://localhost:5173"),
  "https://crmspacefrontend.vercel.app",
  "http://localhost:5173",
];

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS: ", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
  })
);
app.use(morgan(isProduction ? "combined" : "dev"));

// Add CORS preflight options
app.options("*", cors());

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/crm",
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: "native",
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
};

// In production, ensure secure cookies
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // Trust first proxy
  console.log("Production environment detected - using secure cookies");
}

app.use(session(sessionConfig));

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
    serverSelectionTimeoutMS: 15000, // Increased timeout for serverless environments
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

// CORS test endpoint
app.get("/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin,
    cookies: req.cookies,
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
  });
});

// Placeholder for routes
app.get("/", (req, res) => {
  res.send("CRMspace Platform API");
});

// Serve uploaded campaign images
app.use(
  "/uploads/campaigns",
  express.static(path.join(process.cwd(), "uploads", "campaigns"))
);

// Add CORS headers to auth routes specifically
app.use("/auth", (req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  next();
});

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
