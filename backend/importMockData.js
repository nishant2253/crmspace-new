import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Customer from "./src/models/Customer.js";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Convert __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importMockData() {
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

    // Import Customers
    const customersPath = path.join(__dirname, "mock-data", "customers.json");
    const customersData = JSON.parse(fs.readFileSync(customersPath, "utf8"));

    // Check if there are existing customers
    const existingCount = await Customer.countDocuments();
    console.log(`Found ${existingCount} existing customers in database`);

    if (existingCount > 0) {
      // Clear existing data first
      console.log("Clearing existing customer data...");
      await Customer.deleteMany({});
      console.log("Existing customer data cleared");
    }

    // Insert all customers
    const result = await Customer.insertMany(customersData);
    console.log(`Imported ${result.length} customers successfully`);

    // Verify import
    const count = await Customer.countDocuments();
    console.log(`Total customers in database after import: ${count}`);

    // Show all customers
    const customers = await Customer.find();
    console.log("\nCustomers in database:");
    customers.forEach((customer) => {
      console.log(
        `- ${customer.name} (${customer.email}): ${customer.totalSpend} | ${customer.visitCount} visits`
      );
    });
  } catch (err) {
    console.error("Error importing mock data:", err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the import function
importMockData();
