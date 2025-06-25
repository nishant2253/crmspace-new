import mongoose from "mongoose";
import dotenv from "dotenv";
import { getRedisClient } from "../redis/client.js";
import { fileURLToPath } from "url";

dotenv.config();

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/crm",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to MongoDB");

    // Get Redis client
    const redisClient = getRedisClient();
    console.log("Connected to Redis");

    // Clear Redis streams
    try {
      // Clear customer and order ingest streams
      await redisClient.del("customer_ingest");
      console.log("Cleared customer_ingest stream");

      await redisClient.del("order_ingest");
      console.log("Cleared order_ingest stream");

      // Clear campaign streams
      const campaignStreams = await redisClient.keys("stream:campaign:*");
      if (campaignStreams && campaignStreams.length > 0) {
        for (const key of campaignStreams) {
          await redisClient.del(key);
          console.log(`Cleared Redis stream: ${key}`);
        }
      }

      console.log("Redis streams cleared successfully");
    } catch (redisErr) {
      console.error("Error clearing Redis streams:", redisErr);
    }

    // Get all collections and drop them using direct database access
    const db = mongoose.connection.db;
    const dbCollections = await db.collections();
    console.log(`Found ${dbCollections.length} collections to drop`);

    for (const collection of dbCollections) {
      try {
        await collection.drop();
        console.log(`Dropped collection: ${collection.collectionName}`);
      } catch (err) {
        // If collection doesn't exist or can't be dropped, log and continue
        console.log(
          `Could not drop collection ${collection.collectionName}: ${err.message}`
        );
      }
    }

    console.log("All collections dropped successfully");
  } catch (err) {
    console.error("Error clearing database:", err);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
};

// Execute if this file is run directly (ES module version)
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  clearDatabase();
}

export default clearDatabase;
