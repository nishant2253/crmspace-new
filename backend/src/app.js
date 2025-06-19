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

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
console.log(`Frontend URL: ${frontendUrl}`);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        frontendUrl,
        "https://crmspacefrontend.vercel.app",
        "http://localhost:5173",
      ];

      console.log("Request origin:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        // Or from any of the allowed origins
        callback(null, origin);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

app.use(morgan(isProduction ? "combined" : "dev"));

// Add CORS preflight options
app.options("*", cors());

// Add explicit OPTIONS request handler
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.status(200).send();
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Vercel serverless to trust the proxy
    cookie: {
      secure: isProduction, // Use secure cookies in production
      httpOnly: true,
      sameSite: "none", // Always none for cross-site cookies
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
      domain: isProduction ? ".vercel.app" : undefined, // Use Vercel domain in production
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/crm",
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
      autoRemove: "native", // Remove expired sessions
      touchAfter: 24 * 3600, // Only update the session once per 24 hours unless data changes
      crypto: {
        secret: process.env.SESSION_SECRET || "secret",
      },
      collectionName: "sessions",
      stringify: false,
    }),
  })
);

// Passport
initPassport();
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/crm";

// Check if we have a cached connection
let cachedConnection = null;

const connectToMongoDB = async () => {
  if (cachedConnection) {
    console.log("Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    console.log(
      `Connecting to MongoDB at ${mongoUri.replace(
        /\/\/([^:]+):[^@]+@/,
        "//***:***@"
      )}`
    );

    const connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout for serverless
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
    });

    console.log(
      `MongoDB connected to ${mongoUri.replace(
        /\/\/([^:]+):[^@]+@/,
        "//***:***@"
      )}`
    );
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

// Connect to MongoDB before handling requests
connectToMongoDB()
  .then(() => {
    console.log("MongoDB connection established");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

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
