import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  // If we have a cached connection, return it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log("Using cached database connection");
    return cachedDb;
  }

  // Get MongoDB URI from environment variables
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/crm";
  console.log(`Connecting to MongoDB at ${mongoUri.split("@")[1]}`); // Log without credentials

  try {
    // Configure MongoDB connection options for serverless environment
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout
      connectTimeoutMS: 30000, // Increase connect timeout
      keepAlive: true,
      keepAliveInitialDelay: 300000, // 5 minutes
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoUri, options);
    console.log(`MongoDB connected successfully to ${mongoUri.split("@")[1]}`);

    // Cache the connection
    cachedDb = connection;
    return connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export default connectToDatabase;
