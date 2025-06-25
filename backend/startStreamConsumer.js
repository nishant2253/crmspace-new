// Stream Consumer Starter for Vercel Deployment
import dotenv from "dotenv";
import { StreamConsumer } from "./src/services/streamConsumer.js";

// Load environment variables
dotenv.config();

console.log("Starting stream consumer service...");

// Create and start the stream consumer
const consumer = new StreamConsumer();

// For Vercel serverless functions, we need to export a handler
export default async function handler(req, res) {
  try {
    // Start the consumer if it's a GET request to /start
    if (req.method === "GET" && req.url === "/start") {
      await consumer.start();
      return res.status(200).json({ message: "Stream consumer started" });
    }

    // Health check endpoint
    if (req.method === "GET" && req.url === "/health") {
      return res
        .status(200)
        .json({ status: "ok", message: "Stream consumer is running" });
    }

    // Default response
    return res.status(200).json({
      message: "Stream consumer service is running",
      endpoints: {
        start: "GET /start - Start the consumer",
        health: "GET /health - Check if the service is running",
      },
    });
  } catch (error) {
    console.error("Error in stream consumer handler:", error);
    return res.status(500).json({ error: error.message });
  }
}
