import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { getRedisClient } from "../redis/client.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

const redisClient = getRedisClient();
const CONSUMER_GROUP = "crm-consumer-group";
const CONSUMER_NAME = "consumer-1";

async function connectMongo() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/crm",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  console.log("Consumer: MongoDB connected");
}

async function setupConsumerGroups() {
  // Create consumer groups if they don't exist
  try {
    await redisClient.xgroup(
      "CREATE",
      "customer_ingest",
      CONSUMER_GROUP,
      "$",
      "MKSTREAM"
    );
    console.log("Customer consumer group created");
  } catch (err) {
    if (err.message.includes("BUSYGROUP")) {
      console.log("Customer consumer group already exists");
    } else {
      console.error("Error creating customer consumer group:", err.message);
    }
  }

  try {
    await redisClient.xgroup(
      "CREATE",
      "order_ingest",
      CONSUMER_GROUP,
      "$",
      "MKSTREAM"
    );
    console.log("Order consumer group created");
  } catch (err) {
    if (err.message.includes("BUSYGROUP")) {
      console.log("Order consumer group already exists");
    } else {
      console.error("Error creating order consumer group:", err.message);
    }
  }
}

async function processCustomerStream() {
  while (true) {
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
        const [[, entries]] = res;
        for (const [id, fields] of entries) {
          const data = Object.fromEntries(
            fields
              .map((v, i, arr) => (i % 2 === 0 ? [v, arr[i + 1]] : null))
              .filter(Boolean)
          );
          try {
            await Customer.create(data);
            console.log("Customer saved:", data.email);
            // Acknowledge message as processed
            await redisClient.xack("customer_ingest", CONSUMER_GROUP, id);
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
      }
    } catch (err) {
      console.error("Error processing customer stream:", err.message);
      // Small delay to prevent tight error loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function processOrderStream() {
  while (true) {
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
        "order_ingest",
        ">"
      );

      if (res) {
        const [[, entries]] = res;
        for (const [id, fields] of entries) {
          const data = Object.fromEntries(
            fields
              .map((v, i, arr) => (i % 2 === 0 ? [v, arr[i + 1]] : null))
              .filter(Boolean)
          );
          try {
            await Order.create(data);
            console.log("Order saved:", data.customerId);
            // Acknowledge message as processed
            await redisClient.xack("order_ingest", CONSUMER_GROUP, id);
          } catch (err) {
            if (err.message.includes("duplicate key error")) {
              // Acknowledge duplicate records but log them
              console.log("Order already exists:", data._id);
              await redisClient.xack("order_ingest", CONSUMER_GROUP, id);
            } else {
              console.error("Order save error:", err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error processing order stream:", err.message);
      // Small delay to prevent tight error loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  await connectMongo();

  // Setup consumer groups before processing
  await setupConsumerGroups();

  console.log("Starting stream processors...");
  await Promise.all([processCustomerStream(), processOrderStream()]);
}

main().catch(console.error);
