import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  segmentRulesFromText,
  campaignSummary,
  campaignMessageFromName,
  campaignImageGeneration,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/segment-rules-from-text", requireAuth, segmentRulesFromText);
router.post("/campaign-summary", requireAuth, campaignSummary);
router.post(
  "/campaign-message-from-name",
  requireAuth,
  campaignMessageFromName
);
router.post("/campaign-image", requireAuth, campaignImageGeneration);

export default router;
