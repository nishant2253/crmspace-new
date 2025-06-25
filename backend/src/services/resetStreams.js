import { getRedisClient } from "../redis/client.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const resetStreams = async () => {
  try {
    // Get Redis client
    const redisClient = getRedisClient();
    console.log("Connected to Redis");

    // Clear customer and order ingest streams
    await redisClient.del("customer_ingest");
    console.log("Cleared customer_ingest stream");

    await redisClient.del("order_ingest");
    console.log("Cleared order_ingest stream");

    // Clear all campaign streams
    const streamKeys = await redisClient.keys("stream:campaign:*");

    if (streamKeys && streamKeys.length > 0) {
      console.log(`Found ${streamKeys.length} Redis campaign streams to clear`);

      for (const key of streamKeys) {
        await redisClient.del(key);
        console.log(`Cleared Redis stream: ${key}`);
      }

      console.log("All Redis campaign streams cleared successfully");
    } else {
      console.log("No Redis campaign streams found to clear");
    }

    // Clear consumer groups if any
    const allKeys = await redisClient.keys("*");
    for (const key of allKeys) {
      if (key.includes("consumer") || key.includes("group")) {
        await redisClient.del(key);
        console.log(`Cleared Redis key: ${key}`);
      }
    }

    console.log("Redis streams reset successfully");
  } catch (err) {
    console.error("Error clearing Redis streams:", err);
  } finally {
    process.exit(0);
  }
};

// Execute if this file is run directly (ES module version)
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  resetStreams();
}

export default resetStreams;
