import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { listCommunicationLogs } from "../controllers/communicationLogController.js";

const router = express.Router();

router.get("/campaign/:campaignId", requireAuth, listCommunicationLogs);

export default router;
