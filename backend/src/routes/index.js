import express from "express";
import customerRouter from "./customer.js";
import orderRouter from "./order.js";
import authRouter from "./auth.js";
import segmentRouter from "./segment.js";
import campaignRouter from "./campaign.js";
import communicationLogRouter from "./communicationLog.js";
import deliveryRouter from "./delivery.js";
import aiRouter from "./ai.js";
import testRouter from "./test.js";
import mongoose from "mongoose";
import { createClient } from "redis";

const router = express.Router();

// TODO: Import and use customer, order, campaign, auth, and other routes

router.use("/api/customers", customerRouter);
router.use("/api/orders", orderRouter);
router.use("/auth", authRouter);
router.use("/api/segments", segmentRouter);
router.use("/api/campaigns", campaignRouter);
router.use("/api/communication-logs", communicationLogRouter);
router.use("/api/delivery", deliveryRouter);
router.use("/api/ai", aiRouter);

// Test routes (no authentication required, for development only)
router.use("/test", testRouter);

router.get("/health", (req, res) => res.json({ status: "ok" }));

// Diagnostic endpoint to check connections
router.get("/api/diagnostic", async (req, res) => {
  const results = {
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
    systems: {},
  };

  // Test MongoDB
  try {
    const mongoStatus = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    results.systems.mongodb = {
      status: stateMap[mongoStatus] || "unknown",
      uri: process.env.MONGODB_URI ? "configured" : "not configured",
    };
  } catch (err) {
    results.systems.mongodb = { status: "error", message: err.message };
  }

  // Test Redis
  try {
    const redisEnabled = process.env.USE_REDIS === "true";
    results.systems.redis = {
      status: redisEnabled ? "configured" : "disabled",
      host: process.env.REDIS_HOST || "not configured",
      url: process.env.REDIS_URL ? "configured" : "not configured",
    };

    if (redisEnabled) {
      try {
        const testClient = createClient({
          url:
            process.env.REDIS_URL ||
            `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        });
        await testClient.connect();
        const pingResult = await testClient.ping();
        results.systems.redis.ping = pingResult;
        await testClient.disconnect();
      } catch (redisErr) {
        results.systems.redis.connectionTest = {
          status: "error",
          message: redisErr.message,
        };
      }
    }
  } catch (err) {
    results.systems.redis = { status: "error", message: err.message };
  }

  res.json(results);
});

export default router;
