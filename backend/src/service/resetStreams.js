import { createClient } from "redis";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const resetStreams = async () => {
  let redisClient;

  try {
    // Connect to Redis
    redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || 6379
      }`,
    });
    await redisClient.connect();
    console.log("Connected to Redis");

    // Clear all Redis streams
    const streamKeys = await redisClient.keys("stream:*");

    if (streamKeys && streamKeys.length > 0) {
      console.log(`Found ${streamKeys.length} Redis streams to clear`);

      for (const key of streamKeys) {
        await redisClient.del(key);
        console.log(`Cleared Redis stream: ${key}`);
      }

      console.log("All Redis streams cleared successfully");
    } else {
      console.log("No Redis streams found to clear");
    }

    // Clear consumer groups if any
    const allKeys = await redisClient.keys("*");
    for (const key of allKeys) {
      if (key.includes("consumer") || key.includes("group")) {
        await redisClient.del(key);
        console.log(`Cleared Redis key: ${key}`);
      }
    }
  } catch (err) {
    console.error("Error clearing Redis streams:", err);
  } finally {
    if (redisClient) {
      await redisClient.quit();
      console.log("Redis connection closed");
    }
    process.exit(0);
  }
};

// Execute if this file is run directly (ES module version)
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  resetStreams();
}

export default resetStreams;
