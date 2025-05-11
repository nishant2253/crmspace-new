import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Use in-memory storage for development
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      inMemory: true, // Enable in-memory storage
      inMemorySizeGB: 1, // Allocate 1GB for in-memory storage
    };

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/crm",
      connectionOptions
    );
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
