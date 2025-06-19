import express from "express";
import Customer from "../models/Customer.js";
import mongoose from "mongoose";
import { buildQueryFromRules } from "../controllers/segmentController.js";
import {
  segmentRulesFromText,
  campaignSummary,
  campaignMessageFromName,
  campaignImageGeneration,
} from "../controllers/aiController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Flag to track if mock data is loaded
let mockDataLoaded = false;

// Route to import mock data to MongoDB
router.post("/import-mock-data", async (req, res) => {
  try {
    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("TEST ROUTE: Importing mock data to MongoDB");

    // Use hardcoded mock customers instead of reading from file
    const mockCustomers = [
      {
        name: "Bob Singh",
        email: "bob@example.com",
        totalSpend: 3500,
        lastVisit: "2024-04-15T09:00:00Z",
        lastOrderDate: "2024-04-10T14:00:00Z",
        visitCount: 2,
      },
      {
        name: "Carol Patel",
        email: "carol@example.com",
        totalSpend: 8000,
        lastVisit: "2024-03-20T11:00:00Z",
        lastOrderDate: "2024-03-18T16:00:00Z",
        visitCount: 4,
      },
    ];

    // Add additional mock customers from the frontend segmentUtils.js
    const additionalMockCustomers = [
      {
        name: "Alice Sharma",
        email: "alice@example.com",
        totalSpend: 12000,
        lastVisit: "2024-05-01T10:00:00Z",
        lastOrderDate: "2024-04-28T12:00:00Z",
        visitCount: 5,
      },
      {
        name: "David Kumar",
        email: "david@example.com",
        totalSpend: 2000,
        lastVisit: "2024-05-05T14:30:00Z",
        lastOrderDate: "2024-05-05T14:00:00Z",
        visitCount: 1,
      },
      {
        name: "Eva Gupta",
        email: "eva@example.com",
        totalSpend: 15000,
        lastVisit: "2024-04-20T16:45:00Z",
        lastOrderDate: "2024-04-20T16:30:00Z",
        visitCount: 8,
      },
      {
        name: "Frank Mehta",
        email: "frank@example.com",
        totalSpend: 500,
        lastVisit: "2024-01-10T09:15:00Z",
        lastOrderDate: "2024-01-10T09:00:00Z",
        visitCount: 1,
      },
      {
        name: "Grace Sharma",
        email: "grace@example.com",
        totalSpend: 9500,
        lastVisit: "2024-05-02T11:30:00Z",
        lastOrderDate: "2024-05-01T10:00:00Z",
        visitCount: 6,
      },
      {
        name: "Harry Singh",
        email: "harry@example.com",
        totalSpend: 7200,
        lastVisit: "2024-04-25T13:45:00Z",
        lastOrderDate: "2024-04-23T14:00:00Z",
        visitCount: 3,
      },
      {
        name: "Irene Joshi",
        email: "irene@example.com",
        totalSpend: 4500,
        lastVisit: "2024-03-15T10:30:00Z",
        lastOrderDate: "2024-03-15T10:15:00Z",
        visitCount: 2,
      },
      {
        name: "Jack Patel",
        email: "jack@example.com",
        totalSpend: 11000,
        lastVisit: "2024-05-03T17:00:00Z",
        lastOrderDate: "2024-05-03T16:45:00Z",
        visitCount: 7,
      },
    ];

    // Combine all mock customers
    const allMockCustomers = [...mockCustomers, ...additionalMockCustomers];

    // Check if mock data is already loaded
    const mockCustomerCount = await Customer.countDocuments({
      isMockData: true,
    });

    if (mockCustomerCount > 0) {
      // Mock data already exists, just update the flag
      mockDataLoaded = true;
      return res.json({
        message: "Mock data already loaded",
        count: mockCustomerCount,
      });
    }

    // Tag each mock customer as mock data
    const taggedMockCustomers = allMockCustomers.map((customer) => ({
      ...customer,
      isMockData: true,
      email:
        customer.email ||
        `mock-${Math.random().toString(36).substring(2, 15)}@example.com`,
    }));

    // Insert mock customers into the database
    await Customer.insertMany(taggedMockCustomers);

    // Set flag to indicate mock data is loaded
    mockDataLoaded = true;

    res.json({
      message: "Mock data imported successfully",
      count: taggedMockCustomers.length,
    });
  } catch (err) {
    console.error("Error importing mock data:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route to check if mock data is loaded
router.get("/mock-data-status", async (req, res) => {
  try {
    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Count mock customers in the database
    const mockCustomerCount = await Customer.countDocuments({
      isMockData: true,
    });
    mockDataLoaded = mockCustomerCount > 0;

    res.json({
      mockDataLoaded,
      mockCustomerCount,
    });
  } catch (err) {
    console.error("Error checking mock data status:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route to remove mock data
router.post("/remove-mock-data", async (req, res) => {
  try {
    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("TEST ROUTE: Removing mock data from MongoDB");

    // Delete all mock customers
    const result = await Customer.deleteMany({ isMockData: true });

    // Reset flag
    mockDataLoaded = false;

    res.json({
      message: "Mock data removed successfully",
      count: result.deletedCount,
    });
  } catch (err) {
    console.error("Error removing mock data:", err);
    res.status(500).json({ error: err.message });
  }
});

// Mock AI route for segment rules (no auth required)
router.post("/segment-rules-from-text", async (req, res) => {
  try {
    // Add CORS headers
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    console.log("TEST ROUTE: Received AI segment rules request");
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    console.log("Prompt:", prompt);

    // Generate mock rules based on the prompt content
    let mockRules;

    if (
      prompt.toLowerCase().includes("high") ||
      prompt.toLowerCase().includes("more than") ||
      prompt.toLowerCase().includes("over")
    ) {
      mockRules = {
        rules: [{ field: "totalSpend", operator: ">", value: 5000 }],
        condition: "AND",
      };
    } else if (
      prompt.toLowerCase().includes("low") ||
      prompt.toLowerCase().includes("less than") ||
      prompt.toLowerCase().includes("under")
    ) {
      mockRules = {
        rules: [{ field: "totalSpend", operator: "<", value: 5000 }],
        condition: "AND",
      };
    } else if (
      prompt.toLowerCase().includes("frequent") ||
      prompt.toLowerCase().includes("visit")
    ) {
      mockRules = {
        rules: [{ field: "visitCount", operator: ">", value: 3 }],
        condition: "AND",
      };
    } else if (prompt.toLowerCase().includes("recent")) {
      mockRules = {
        rules: [
          { field: "lastVisit", operator: ">", value: "2024-04-01T00:00:00Z" },
        ],
        condition: "AND",
      };
    } else {
      // Default rules
      mockRules = {
        rules: [{ field: "totalSpend", operator: ">", value: 1000 }],
        condition: "AND",
      };
    }

    console.log("Generated mock rules:", JSON.stringify(mockRules, null, 2));

    // Return the mock rules
    res.json({ rulesJSON: mockRules });
  } catch (err) {
    console.error("Error generating segment rules:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add CORS preflight handler for AI routes
router.options("/segment-rules-from-text", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

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

// Add CORS preflight handler for mock data routes
router.options("/import-mock-data", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

router.options("/mock-data-status", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

router.options("/remove-mock-data", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Test route - no auth required
router.get("/", (req, res) => {
  res.json({ message: "Test route working!" });
});

// Test database connection
router.get("/db-status", async (req, res) => {
  try {
    // Check MongoDB connection status
    const status = mongoose.connection.readyState;
    const statusText = [
      "disconnected",
      "connected",
      "connecting",
      "disconnecting",
    ][status];

    // Try to count users as a simple database operation
    let userCount = null;
    let error = null;

    try {
      userCount = await User.countDocuments();
    } catch (err) {
      error = err.message;
    }

    res.json({
      status: statusText,
      readyState: status,
      dbName: mongoose.connection.db?.databaseName || null,
      userCount,
      error,
      mongooseVersion: mongoose.version,
      nodeEnv: process.env.NODE_ENV,
      mongoUriConfigured: !!process.env.MONGO_URI,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test authentication without requiring it
router.get("/auth-status", (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
        }
      : null,
    session: req.session
      ? {
          id: req.sessionID,
          cookie: req.session.cookie,
        }
      : null,
    cookies: req.headers.cookie,
  });
});

export default router;
