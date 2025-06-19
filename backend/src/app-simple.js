import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Import routes
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import customerRouter from "./routes/customer.js";
import orderRouter from "./routes/order.js";
import segmentRouter from "./routes/segment.js";
import campaignRouter from "./routes/campaign.js";
import communicationLogRouter from "./routes/communicationLog.js";
import aiRouter from "./routes/ai.js";
import deliveryRouter from "./routes/delivery.js";
import testRouter from "./routes/test.js";

// Import services
import { initPassport } from "./services/passport.js";
import connectToDatabase from "./config/database.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors());

// Session configuration - simple memory store for Vercel
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
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

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error in app.js:", err);
  });

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
initPassport();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/customers", customerRouter);
app.use("/orders", orderRouter);
app.use("/segments", segmentRouter);
app.use("/campaigns", campaignRouter);
app.use("/communication-logs", communicationLogRouter);
app.use("/ai", aiRouter);
app.use("/delivery", deliveryRouter);
app.use("/test", testRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
