import Customer from "../models/Customer.js";
import { getRedisClient } from "../redis/client.js";

export const ingestCustomer = async (req, res) => {
  try {
    const { name, email, totalSpend, lastVisit, lastOrderDate, visitCount } =
      req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }
    // Only validate, do not save to MongoDB here
    const payload = {
      name,
      email,
      totalSpend: totalSpend || 0,
      lastVisit,
      lastOrderDate,
      visitCount: visitCount || 0,
    };
    const redisClient = getRedisClient();
    await redisClient.xadd(
      "customer_ingest",
      "*",
      ...Object.entries(payload).flat()
    );
    return res
      .status(200)
      .json({ message: "Customer data queued for ingestion." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
