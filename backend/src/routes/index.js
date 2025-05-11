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

export default router;
