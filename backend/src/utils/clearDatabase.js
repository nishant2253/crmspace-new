import mongoose from "mongoose";
import dotenv from "dotenv";
import { createClient } from "redis";
import { fileURLToPath } from "url";

dotenv.config();

const clearDatabase = async () => {
  let redisClient;

  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/crm",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to MongoDB");

    // Connect to Redis
    redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || 6379
      }`,
    });
    await redisClient.connect();
    console.log("Connected to Redis");

    // Clear Redis streams
    try {
      const streamKeys = await redisClient.keys("stream:*");
      if (streamKeys && streamKeys.length > 0) {
        for (const key of streamKeys) {
          await redisClient.del(key);
          console.log(`Cleared Redis stream: ${key}`);
        }
        console.log("Redis streams cleared successfully");
      } else {
        console.log("No Redis streams found to clear");
      }
    } catch (redisErr) {
      console.error("Error clearing Redis streams:", redisErr);
    }

    // Get all collections and drop them
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      await collection.drop();
      console.log(`Dropped collection: ${collectionName}`);
    }

    console.log("All collections dropped successfully");
  } catch (err) {
    console.error("Error clearing database:", err);
  } finally {
    // Close the connections
    if (redisClient) {
      await redisClient.quit();
      console.log("Redis connection closed");
    }

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
