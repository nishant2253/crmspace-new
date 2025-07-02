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
import { checkMongoConnection } from "../config/database.js";

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
    version: "1.0.0",
    uptime: process.uptime(),
    systems: {},
  };

  // Test MongoDB
  try {
    const mongoStatus = checkMongoConnection();
    results.systems.mongodb = {
      status: mongoStatus.status,
      readyState: mongoStatus.readyState,
      uri: process.env.MONGODB_URI ? "configured" : "not configured",
    };

    // Add collection names if connected
    if (mongoStatus.readyState === 1) {
      try {
        const collections = await mongoose.connection.db
          .listCollections()
          .toArray();
        results.systems.mongodb.collections = collections.map((c) => c.name);
      } catch (err) {
        results.systems.mongodb.collections = { error: err.message };
      }
    }
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

    // Get Redis client from app
    const redisClient = req.app.get("redisClient");
    if (redisClient) {
      results.systems.redis.clientStatus = "available";
      results.systems.redis.status = "connected";

      try {
        const pingResult = await redisClient.ping();
        results.systems.redis.ping = pingResult;

        // Check streams
        try {
          const customerStreamInfo = await redisClient.xinfo(
            "STREAM",
            "customer_ingest"
          );
          results.systems.redis.streams = {
            customer_ingest: {
              length: customerStreamInfo[1][1],
              groups: await redisClient.xinfo("GROUPS", "customer_ingest"),
            },
          };

          const orderStreamInfo = await redisClient.xinfo(
            "STREAM",
            "order_ingest"
          );
          results.systems.redis.streams.order_ingest = {
            length: orderStreamInfo[1][1],
            groups: await redisClient.xinfo("GROUPS", "order_ingest"),
          };
        } catch (streamErr) {
          results.systems.redis.streams = { error: streamErr.message };
        }
      } catch (pingErr) {
        results.systems.redis.ping = { error: pingErr.message };
      }
    } else if (redisEnabled) {
      results.systems.redis.clientStatus = "not available";

      // Try to create a test connection
      try {
        const testClient = createClient({
          url:
            process.env.REDIS_URL ||
            `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        });
        await testClient.connect();
        const pingResult = await testClient.ping();
        results.systems.redis.testConnection = {
          status: "success",
          ping: pingResult,
        };
        await testClient.disconnect();
      } catch (redisErr) {
        results.systems.redis.testConnection = {
          status: "error",
          message: redisErr.message,
        };
      }
    }
  } catch (err) {
    results.systems.redis = { status: "error", message: err.message };
  }

  // Add session info
  results.session = {
    configured: !!req.session,
    id: req.sessionID || "not available",
    authenticated: req.isAuthenticated
      ? req.isAuthenticated()
      : "function not available",
  };

  res.json(results);
});

export default router;
