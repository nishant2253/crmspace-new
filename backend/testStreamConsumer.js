import dotenv from "dotenv";
import { getRedisClient } from "./src/redis/client.js";
import mongoose from "mongoose";
import Customer from "./src/models/Customer.js";

// Load env vars
dotenv.config();

const CONSUMER_GROUP = "crm-consumer-group";
const CONSUMER_NAME = "test-consumer";

async function setupConsumerGroup(redisClient) {
  try {
    await redisClient.xgroup(
      "CREATE",
      "customer_ingest",
      CONSUMER_GROUP,
      "$",
      "MKSTREAM"
    );
    console.log("Consumer group created");
  } catch (err) {
    if (err.message.includes("BUSYGROUP")) {
      console.log("Consumer group already exists");
    } else {
      console.error("Error creating consumer group:", err.message);
    }
  }
}

async function processCustomerStream(redisClient) {
  console.log("Starting to process customer stream...");

  try {
    // Read new messages using consumer group
    const res = await redisClient.xreadgroup(
      "GROUP",
      CONSUMER_GROUP,
      CONSUMER_NAME,
      "BLOCK",
      5000,
      "COUNT",
      10,
      "STREAMS",
      "customer_ingest",
      ">"
    );

    if (res) {
      console.log("Received data:", JSON.stringify(res));
      const [[, entries]] = res;
      console.log(`Processing ${entries.length} entries`);

      for (const [id, fields] of entries) {
        console.log(`Processing entry ${id}`);
        const data = Object.fromEntries(
          fields
            .map((v, i, arr) => (i % 2 === 0 ? [v, arr[i + 1]] : null))
            .filter(Boolean)
        );
        console.log("Parsed data:", data);

        try {
          const customer = await Customer.create(data);
          console.log("Customer saved:", customer);
          // Acknowledge message as processed
          await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
          console.log(`Acknowledged entry ${id}`);
        } catch (err) {
          if (err.message.includes("duplicate key error")) {
            // Acknowledge duplicate records but log them
            console.log("Customer already exists:", data.email);
            await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
          } else {
            console.error("Customer save error:", err.message);
          }
        }
      }
    } else {
      console.log("No new messages");
    }
  } catch (err) {
    console.error("Error processing stream:", err.message);
  }
}

async function addTestCustomer(redisClient) {
  const testCustomer = {
    name: "Test Direct Stream Customer",
    email: `test-direct-${Date.now()}@example.com`,
    totalSpend: 2000,
    visitCount: 2,
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
  return testCustomer;
}

async function testStreamConsumer() {
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

    // Setup consumer group
    await setupConsumerGroup(redisClient);

    // Add test customer
    const testCustomer = await addTestCustomer(redisClient);

    // Wait a bit before processing
    console.log("Waiting 2 seconds before processing...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process the stream directly
    await processCustomerStream(redisClient);

    // Check if data was processed
    const customer = await Customer.findOne({ email: testCustomer.email });
    console.log("Customer in MongoDB:", customer ? "Found" : "Not found");
    if (customer) {
      console.log("Customer data:", customer);
    }
  } catch (err) {
    console.error("Error testing stream consumer:", err);
  } finally {
    // Close connections
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
}

// Run the test
testStreamConsumer();
