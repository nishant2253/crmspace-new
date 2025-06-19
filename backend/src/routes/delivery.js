import express from "express";
import {
  handleDeliveryReceipt,
  processCampaignDelivery,
} from "../controllers/deliveryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/receipt", handleDeliveryReceipt);
router.post("/campaign-delivery", requireAuth, processCampaignDelivery);

export default router;
