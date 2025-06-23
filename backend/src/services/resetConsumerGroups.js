import { createClient } from "redis";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const CONSUMER_GROUP = "crm-consumer-group";

const resetConsumerGroups = async () => {
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

    // Delete and recreate consumer groups for fresh start

    // Customer ingest stream
    try {
      // First try to delete existing group
      await redisClient.xgroup("DESTROY", "customer_ingest", CONSUMER_GROUP);
      console.log("Deleted existing customer consumer group");
    } catch (err) {
      console.log("No customer consumer group existed to delete");
    }

    try {
      // Create fresh consumer group that only processes new messages
      await redisClient.xgroup(
        "CREATE",
        "customer_ingest",
        CONSUMER_GROUP,
        "$",
        "MKSTREAM"
      );
      console.log("Created fresh customer consumer group");
    } catch (err) {
      console.error("Error creating customer consumer group:", err.message);
    }

    // Order ingest stream
    try {
      // First try to delete existing group
      await redisClient.xgroup("DESTROY", "order_ingest", CONSUMER_GROUP);
      console.log("Deleted existing order consumer group");
    } catch (err) {
      console.log("No order consumer group existed to delete");
    }

    try {
      // Create fresh consumer group that only processes new messages
      await redisClient.xgroup(
        "CREATE",
        "order_ingest",
        CONSUMER_GROUP,
        "$",
        "MKSTREAM"
      );
      console.log("Created fresh order consumer group");
    } catch (err) {
      console.error("Error creating order consumer group:", err.message);
    }

    console.log("Consumer groups have been reset successfully");
  } catch (err) {
    console.error("Error resetting consumer groups:", err);
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
  resetConsumerGroups();
}

export default resetConsumerGroups;
