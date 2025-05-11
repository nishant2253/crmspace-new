import express from "express";
import Customer from "../models/Customer.js";
import mongoose from "mongoose";
import { buildQueryFromRules } from "../controllers/segmentController.js";

const router = express.Router();

// Test route for segment preview (no auth required)
router.post("/segments/preview", async (req, res) => {
  try {
    // Add CORS headers with specific origin
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("TEST ROUTE: Received segment preview request");
    const { rulesJSON } = req.body;
    if (!rulesJSON) {
      return res.status(400).json({ error: "rulesJSON required" });
    }

    // Print MongoDB connection status
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    console.log("MongoDB connection:", mongoose.connection.name);
    console.log("MongoDB host:", mongoose.connection.host);
    console.log("MongoDB port:", mongoose.connection.port);

    // Debug: Check all collections in the database
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Collections in database:",
      collections.map((c) => c.name)
    );

    // Build query
    const query = buildQueryFromRules(rulesJSON);
    console.log("Generated MongoDB query:", JSON.stringify(query, null, 2));

    // Debug: Count all customers first
    const totalCustomers = await Customer.countDocuments({});
    console.log("Total customers in database:", totalCustomers);

    // Get a sample of all customers to verify schema
    if (totalCustomers > 0) {
      const sampleCustomer = await Customer.findOne();
      console.log(
        "Sample customer schema:",
        Object.keys(sampleCustomer.toObject())
      );
      console.log(
        "Sample customer data:",
        JSON.stringify(sampleCustomer, null, 2)
      );
    }

    // Get customers matching the query
    const audienceSize = await Customer.countDocuments(query);
    console.log("Matched audience size:", audienceSize);
    const sample = await Customer.find(query).limit(5);
    console.log("Sample customers:", sample.length);

    // Print sample customer details for debugging
    if (sample.length > 0) {
      console.log(
        "First customer in sample:",
        JSON.stringify(sample[0], null, 2)
      );
    }

    res.json({ audienceSize, sample });
  } catch (err) {
    console.error("Error previewing segment audience:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add CORS preflight handler
router.options("/segments/preview", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Test route to get all customers (for debugging)
router.get("/customers", async (req, res) => {
  try {
    // Add CORS headers with specific origin
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("TEST ROUTE: Getting all customers");

    // Print MongoDB connection status
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    console.log("MongoDB connection:", mongoose.connection.name);

    // Debug: Count all customers
    const totalCustomers = await Customer.countDocuments({});
    console.log("Total customers in database:", totalCustomers);

    const customers = await Customer.find();
    console.log("Customers found:", customers.length);

    res.json(customers);
  } catch (err) {
    console.error("Error getting customers:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simple test route to verify MongoDB connection
router.get("/db-test", async (req, res) => {
  try {
    // Add CORS headers with specific origin
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("TEST ROUTE: Testing MongoDB connection");
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    console.log("MongoDB connection:", mongoose.connection.name);

    // Mongoose connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const connectionState = mongoose.connection.readyState;

    res.json({
      connectionState,
      status: connectionState === 1 ? "connected" : "not connected",
      dbName: mongoose.connection.name || "unknown",
    });
  } catch (err) {
    console.error("Error testing MongoDB connection:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add this route to test frontend connectivity
router.get("/frontend-test", async (req, res) => {
  try {
    // Return basic information with CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );

    res.json({
      status: "ok",
      message: "Frontend can connect to backend",
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in frontend test:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
