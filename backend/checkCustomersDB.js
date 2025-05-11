import mongoose from "mongoose";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Define a simple customer schema
const customerSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    totalSpend: { type: Number },
    lastVisit: { type: Date },
    lastOrderDate: { type: Date },
    visitCount: { type: Number },
  },
  { timestamps: true }
);

async function checkBothDatabases() {
  let connectionCRM = null;
  let connectionCRMSpace = null;

  try {
    // Connect to the 'crm' database
    connectionCRM = await mongoose.createConnection(
      "mongodb://localhost:27017/crm",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to 'crm' database");

    // Connect to the 'crmspace' database
    connectionCRMSpace = await mongoose.createConnection(
      "mongodb://localhost:27017/crmspace",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to 'crmspace' database");

    // Create customer models for both connections
    const CustomerCRM = connectionCRM.model("Customer", customerSchema);
    const CustomerCRMSpace = connectionCRMSpace.model(
      "Customer",
      customerSchema
    );

    // Check customers in 'crm' database
    const crmCustomers = await CustomerCRM.find();
    console.log(`\n====== DATABASE: 'crm' ======`);
    console.log(`Total customers: ${crmCustomers.length}`);
    if (crmCustomers.length > 0) {
      console.log("Sample customers:");
      crmCustomers.slice(0, 3).forEach((c) => {
        console.log(
          `- ${c.name} (${c.email}): ${c.totalSpend} | ${c.visitCount} visits`
        );
      });

      // Test query
      const highSpenders = await CustomerCRM.find({
        totalSpend: { $gt: 5000 },
      });
      console.log(`Customers with totalSpend > 5000: ${highSpenders.length}`);
    }

    // Check customers in 'crmspace' database
    const crmspaceCustomers = await CustomerCRMSpace.find();
    console.log(`\n====== DATABASE: 'crmspace' ======`);
    console.log(`Total customers: ${crmspaceCustomers.length}`);
    if (crmspaceCustomers.length > 0) {
      console.log("Sample customers:");
      crmspaceCustomers.slice(0, 3).forEach((c) => {
        console.log(
          `- ${c.name} (${c.email}): ${c.totalSpend} | ${c.visitCount} visits`
        );
      });

      // Test query
      const highSpenders = await CustomerCRMSpace.find({
        totalSpend: { $gt: 5000 },
      });
      console.log(`Customers with totalSpend > 5000: ${highSpenders.length}`);
    }
  } catch (err) {
    console.error("Error checking databases:", err);
  } finally {
    // Close connections
    if (connectionCRM) await connectionCRM.close();
    if (connectionCRMSpace) await connectionCRMSpace.close();
    console.log("\nDatabase connections closed");
  }
}

// Run the check
checkBothDatabases();
