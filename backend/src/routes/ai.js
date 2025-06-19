import express from "express";
import * as aiController from "../controllers/aiController.js";

const router = express.Router();

// Generate segmentation rules from text
router.post("/segment-rules", aiController.generateRules);

// Generate campaign summary
router.post("/campaign-summary", aiController.generateCampaignSummary);

// Generate email content
router.post("/email-content", aiController.generateEmailContent);

// Generate marketing message
router.post("/marketing-message", aiController.generateMarketingMessage);

// Get campaign summary with stats
router.post(
  "/campaign/:campaignId/summary",
  aiController.getCampaignSummaryWithStats
);

export default router;
