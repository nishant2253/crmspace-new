import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { bypassAuth } from "../middleware/testAuth.js";
import {
  createSegmentRule,
  listSegmentRules,
  previewSegmentAudience,
} from "../controllers/segmentController.js";

const router = express.Router();

router.post("/", requireAuth, createSegmentRule);
router.get("/", requireAuth, listSegmentRules);
// Use bypassAuth for testing the preview endpoint
router.post("/preview", bypassAuth, previewSegmentAudience);

export default router;
