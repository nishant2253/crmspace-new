import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { getRedisClient } from "../redis/client.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import CommunicationLog from "../models/CommunicationLog.js";

// Check if Redis is explicitly disabled
const useRedis = process.env.USE_REDIS !== "false";

// Create a safer Redis client that won't crash on errors
let redisClient;
try {
  // Only create Redis client if not disabled
  if (useRedis) {
    redisClient = getRedisClient();

    // Add extra safety by catching any unhandled errors
    process.on("uncaughtException", (err) => {
      if (err.message.includes("Redis") || err.message.includes("ECONNRESET")) {
        console.log(`Caught unhandled Redis error: ${err.message}`);
      } else {
        console.error("Unhandled exception:", err);
        process.exit(1);
      }
    });
  } else {
    console.log(
      "Redis disabled by environment variable. Stream consumer will not function."
    );
    // Create a dummy client that won't throw errors
    redisClient = {
      ping: () => Promise.reject(new Error("Redis disabled")),
      xgroup: () => Promise.resolve(),
      xreadgroup: () => Promise.resolve(null),
      xack: () => Promise.resolve(),
      keys: () => Promise.resolve([]),
      on: () => {},
    };
  }
} catch (err) {
  console.error("Error initializing Redis client:", err.message);
  // Create a dummy client that won't throw errors
  redisClient = {
    ping: () => Promise.reject(new Error("Redis not available")),
    xgroup: () => Promise.resolve(),
    xreadgroup: () => Promise.resolve(null),
    xack: () => Promise.resolve(),
    keys: () => Promise.resolve([]),
    on: () => {},
  };
}

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

  // Add consumer group for campaign delivery
  try {
    // Wildcard pattern for all campaign streams
    const campaignStreams = await redisClient.keys("stream:campaign:*");

    for (const streamKey of campaignStreams) {
      try {
        await redisClient.xgroup(
          "CREATE",
          streamKey,
          CONSUMER_GROUP,
          "$",
          "MKSTREAM"
        );
        console.log(`Campaign consumer group created for ${streamKey}`);
      } catch (err) {
        if (err.message.includes("BUSYGROUP")) {
          console.log(
            `Campaign consumer group already exists for ${streamKey}`
          );
        } else {
          console.error(
            `Error creating campaign consumer group for ${streamKey}:`,
            err.message
          );
        }
      }
    }
  } catch (err) {
    console.error("Error setting up campaign consumer groups:", err.message);
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

async function processCampaignDeliveryStreams() {
  while (true) {
    try {
      // Find all campaign streams
      const campaignStreams = await redisClient.keys("stream:campaign:*");

      if (campaignStreams.length === 0) {
        // No campaign streams yet, wait and check again
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      // Process each campaign stream
      for (const streamKey of campaignStreams) {
        try {
          // Ensure consumer group exists for this stream
          try {
            await redisClient.xgroup(
              "CREATE",
              streamKey,
              CONSUMER_GROUP,
              "$",
              "MKSTREAM"
            );
          } catch (err) {
            if (!err.message.includes("BUSYGROUP")) {
              console.error(
                `Error creating consumer group for ${streamKey}:`,
                err.message
              );
            }
          }

          // Read messages from this stream
          const res = await redisClient.xreadgroup(
            "GROUP",
            CONSUMER_GROUP,
            CONSUMER_NAME,
            "BLOCK",
            1000,
            "COUNT",
            10,
            "STREAMS",
            streamKey,
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
                // Process the message (simulate message delivery)
                console.log(
                  `Processing message for ${data.customerName} (${data.customerEmail})`
                );

                // Simulate 90% success rate
                const isSuccess = Math.random() < 0.9;

                // Update the communication log with the result
                if (data.logId) {
                  await CommunicationLog.findByIdAndUpdate(data.logId, {
                    status: isSuccess ? "SENT" : "FAILED",
                    deliveredAt: isSuccess ? new Date() : undefined,
                    isMockData: data.isMockData === "true",
                  });

                  console.log(
                    `Message ${isSuccess ? "sent" : "failed"} to ${
                      data.customerName
                    } (${data.isMockData === "true" ? "mock" : "real"} data)`
                  );
                }

                // Acknowledge message as processed
                await redisClient.xack(streamKey, CONSUMER_GROUP, id);
              } catch (err) {
                console.error(
                  `Error processing campaign message:`,
                  err.message
                );
              }
            }
          }
        } catch (streamErr) {
          console.error(
            `Error processing stream ${streamKey}:`,
            streamErr.message
          );
        }
      }

      // Small delay before checking streams again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(
        "Error in campaign delivery stream processor:",
        err.message
      );
      // Small delay to prevent tight error loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function main() {
  try {
    console.log("Starting stream consumer service...");
    await connectMongo();

    let retries = 0;
    const maxRetries = 10;
    const retryDelay = 5000; // 5 seconds

    // Connect to Redis with retry logic
    while (retries < maxRetries) {
      try {
        await redisClient.ping();
        console.log("Redis connected successfully");
        break;
      } catch (err) {
        retries++;
        console.log(
          `Redis connection failed (${retries}/${maxRetries}): ${err.message}`
        );

        if (retries >= maxRetries) {
          throw new Error("Max Redis connection retries exceeded");
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    await setupConsumerGroups();

    // Start processing streams in parallel
    console.log("Starting stream processors...");

    // Use Promise.all to run all processors in parallel but wrap each in a self-healing function
    Promise.all([
      runWithRecovery(processCustomerStream, "Customer Stream"),
      runWithRecovery(processOrderStream, "Order Stream"),
      runWithRecovery(
        processCampaignDeliveryStreams,
        "Campaign Delivery Streams"
      ),
    ]);

    console.log("All stream processors started");
  } catch (err) {
    console.error("Fatal error in stream consumer:", err);
    process.exit(1);
  }
}

// Helper function to make stream processors resilient
async function runWithRecovery(processFn, processorName) {
  while (true) {
    try {
      console.log(`Starting ${processorName} processor`);
      await processFn();
    } catch (err) {
      console.error(`Error in ${processorName} processor:`, err);
      console.log(`Restarting ${processorName} processor in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Handle termination signals
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  try {
    await redisClient.quit();
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error during graceful shutdown:", err);
  }
  process.exit(0);
});

main();
