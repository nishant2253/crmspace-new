import { getRedisClient } from "../redis/client.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const CONSUMER_GROUP = "crm-consumer-group";

const resetConsumerGroups = async () => {
  try {
    // Get Redis client
    const redisClient = getRedisClient();
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

    // Reset campaign stream consumer groups if any
    const campaignStreams = await redisClient.keys("stream:campaign:*");
    if (campaignStreams && campaignStreams.length > 0) {
      for (const streamKey of campaignStreams) {
        try {
          await redisClient.xgroup("DESTROY", streamKey, CONSUMER_GROUP);
          console.log(`Deleted existing consumer group for ${streamKey}`);
        } catch (err) {
          console.log(`No consumer group existed for ${streamKey}`);
        }

        try {
          await redisClient.xgroup(
            "CREATE",
            streamKey,
            CONSUMER_GROUP,
            "$",
            "MKSTREAM"
          );
          console.log(`Created fresh consumer group for ${streamKey}`);
        } catch (err) {
          console.error(
            `Error creating consumer group for ${streamKey}:`,
            err.message
          );
        }
      }
    }

    console.log("Consumer groups have been reset successfully");
  } catch (err) {
    console.error("Error resetting consumer groups:", err);
  } finally {
    process.exit(0);
  }
};

// Execute if this file is run directly (ES module version)
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  resetConsumerGroups();
}

export default resetConsumerGroups;
