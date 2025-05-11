import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Convert __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define customer schema
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    totalSpend: { type: Number, default: 0 },
    lastVisit: { type: Date },
    lastOrderDate: { type: Date },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

async function importMockData() {
  try {
    // Connect directly to the crmspace database
    const connection = await mongoose.createConnection(
      "mongodb://localhost:27017/crmspace",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to 'crmspace' database");

    // Create Customer model
    const Customer = connection.model("Customer", customerSchema);

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

    // Also import any custom customers from the crm database
    const crmConnection = await mongoose.createConnection(
      "mongodb://localhost:27017/crm",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("\nConnected to 'crm' database to copy custom customers");

    const CustomerCRM = crmConnection.model("Customer", customerSchema);
    const crmCustomers = await CustomerCRM.find({
      email: { $nin: customers.map((c) => c.email) }, // Skip customers we already imported
    });

    if (crmCustomers.length > 0) {
      console.log(
        `Found ${crmCustomers.length} additional custom customers to import`
      );

      // Convert to plain objects (remove mongoose metadata)
      const customersToImport = crmCustomers.map((c) => c.toObject());

      // Insert the additional customers
      const additionalResult = await Customer.insertMany(customersToImport);
      console.log(`Imported ${additionalResult.length} additional customers`);

      // Show all customers after additional import
      const finalCustomers = await Customer.find();
      console.log(
        `\nTotal customers in database after all imports: ${finalCustomers.length}`
      );
    } else {
      console.log("No additional custom customers found to import");
    }
  } catch (err) {
    console.error("Error importing mock data:", err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connections closed");
  }
}

// Run the import function
importMockData();
