import { getRedisClient } from "../redis/client.js";

export const ingestOrder = async (req, res) => {
  try {
    const { customerId, orderAmount, createdAt } = req.body;
    if (!customerId || !orderAmount) {
      return res
        .status(400)
        .json({ error: "customerId and orderAmount are required." });
    }
    const payload = {
      customerId,
      orderAmount,
      createdAt: createdAt || new Date().toISOString(),
    };
    const redisClient = getRedisClient();
    await redisClient.xadd(
      "order_ingest",
      "*",
      ...Object.entries(payload).flat()
    );
    return res
      .status(200)
      .json({ message: "Order data queued for ingestion." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
