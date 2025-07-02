import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    // Connection options optimized for serverless environments
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // Increase from default 30s to 15s for faster failure
      socketTimeoutMS: 45000, // Increase from default 30s
      connectTimeoutMS: 30000, // Increase from default 30s
      maxPoolSize: 10, // Reduce from default 100
      minPoolSize: 1, // Minimum connections to maintain
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      // Only use in-memory storage for development
      ...(isProduction
        ? {}
        : {
            inMemory: true,
            inMemorySizeGB: 1,
          }),
    };

    // Log connection attempt
    console.log(
      `Connecting to MongoDB at ${
        process.env.MONGODB_URI || "mongodb://localhost:27017/crm"
      }`
    );

    // Connect with retry logic
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        await mongoose.connect(
          process.env.MONGODB_URI || "mongodb://localhost:27017/crm",
          connectionOptions
        );
        console.log("MongoDB connected successfully");
        return; // Success, exit function
      } catch (err) {
        lastError = err;
        console.error(
          `MongoDB connection attempt failed (${retries} retries left):`,
          err.message
        );
        retries--;

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          const delay = (3 - retries) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, all retries failed
    console.error(
      "MongoDB connection failed after multiple attempts:",
      lastError
    );

    if (isProduction) {
      // In production, log error but don't exit
      console.error("Continuing without MongoDB connection in production");
    } else {
      // In development, exit the process
      process.exit(1);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);

    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    } else {
      console.error("Continuing without MongoDB connection in production");
    }
  }
};

// Add a helper function to check connection status
export const checkMongoConnection = () => {
  return {
    readyState: mongoose.connection.readyState,
    status:
      ["disconnected", "connected", "connecting", "disconnecting"][
        mongoose.connection.readyState
      ] || "unknown",
  };
};

export default connectDB;
