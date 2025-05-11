import express from "express";
import { ingestOrder } from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, ingestOrder);

export default router;
