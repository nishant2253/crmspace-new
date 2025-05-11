import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createCampaign,
  listCampaigns,
  getCampaignStats,
} from "../controllers/campaignController.js";

const router = express.Router();

router.post("/", requireAuth, createCampaign);
router.get("/", requireAuth, listCampaigns);
router.get("/:id/stats", requireAuth, getCampaignStats);

export default router;
