import express from "express";
import { ingestCustomer } from "../controllers/customerController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, ingestCustomer);

export default router;
