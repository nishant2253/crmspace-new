import dotenv from "dotenv";
import { getRedisClient } from "./src/redis/client.js";
import mongoose from "mongoose";
import Customer from "./src/models/Customer.js";
import Order from "./src/models/Order.js";

// Load env vars
dotenv.config();

async function testRedisStreams() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/crm",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected");

    // Get Redis client
    const redisClient = getRedisClient();
    console.log("Redis client initialized");

    // Check Redis connection
    try {
      const pingResult = await redisClient.ping();
      console.log("Redis ping result:", pingResult);
    } catch (err) {
      console.error("Redis ping failed:", err.message);
      return;
    }

    // Check existing streams
    const customerStreamExists = await redisClient.exists("customer_ingest");
    const orderStreamExists = await redisClient.exists("order_ingest");

    console.log("Customer stream exists:", customerStreamExists === 1);
    console.log("Order stream exists:", orderStreamExists === 1);

    // Check consumer groups
    try {
      const customerGroups = await redisClient.xinfo(
        "GROUPS",
        "customer_ingest"
      );
      console.log("Customer consumer groups:", customerGroups);
    } catch (err) {
      console.log("No customer consumer groups or error:", err.message);
    }

    try {
      const orderGroups = await redisClient.xinfo("GROUPS", "order_ingest");
      console.log("Order consumer groups:", orderGroups);
    } catch (err) {
      console.log("No order consumer groups or error:", err.message);
    }

    // Add test data to streams
    const testCustomer = {
      name: "Test Stream Customer",
      email: `test-stream-${Date.now()}@example.com`,
      totalSpend: 1000,
      visitCount: 1,
      lastVisit: new Date().toISOString(),
      lastOrderDate: new Date().toISOString(),
    };

    console.log("Adding test customer to stream:", testCustomer);

    const customerResult = await redisClient.xadd(
      "customer_ingest",
      "*",
      ...Object.entries(testCustomer).flat()
    );

    console.log("Customer added to stream, ID:", customerResult);

    // Create a valid ObjectId for the customerId
    const validObjectId = new mongoose.Types.ObjectId().toString();

    const testOrder = {
      customerId: validObjectId,
      orderAmount: 500,
      createdAt: new Date().toISOString(),
    };

    console.log("Adding test order to stream:", testOrder);

    const orderResult = await redisClient.xadd(
      "order_ingest",
      "*",
      ...Object.entries(testOrder).flat()
    );

    console.log("Order added to stream, ID:", orderResult);

    // Wait a bit for processing
    console.log("Waiting 5 seconds for stream processing...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check if data was processed
    const customer = await Customer.findOne({ email: testCustomer.email });
    console.log("Customer in MongoDB:", customer ? "Found" : "Not found");
    if (customer) {
      console.log("Customer data:", customer);
    }

    const order = await Order.findOne({ customerId: validObjectId });
    console.log("Order in MongoDB:", order ? "Found" : "Not found");
    if (order) {
      console.log("Order data:", order);
    }
  } catch (err) {
    console.error("Error testing Redis streams:", err);
  } finally {
    // Close connections
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
}

// Run the test
testRedisStreams();
