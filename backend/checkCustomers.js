import mongoose from "mongoose";
import Customer from "./src/models/Customer.js";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

async function checkCustomers() {
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

    // Get count of customers
    const count = await Customer.countDocuments();
    console.log(`Total customers in database: ${count}`);

    // Get all customers
    const customers = await Customer.find();
    console.log("Customer data:");
    customers.forEach((customer) => {
      console.log(
        `- ${customer.name} (${customer.email}): ${customer.totalSpend} | ${customer.visitCount} visits`
      );
    });

    // Test a simple query
    const highSpenders = await Customer.find({ totalSpend: { $gt: 5000 } });
    console.log(`\nCustomers with totalSpend > 5000: ${highSpenders.length}`);
    highSpenders.forEach((customer) => {
      console.log(
        `- ${customer.name} (${customer.email}): ${customer.totalSpend}`
      );
    });

    // Test a more complex query
    const frequentVisitors = await Customer.find({
      $and: [{ visitCount: { $gte: 3 } }, { totalSpend: { $gt: 5000 } }],
    });
    console.log(
      `\nCustomers with visitCount >= 3 AND totalSpend > 5000: ${frequentVisitors.length}`
    );
    frequentVisitors.forEach((customer) => {
      console.log(
        `- ${customer.name} (${customer.email}): visits=${customer.visitCount}, spend=${customer.totalSpend}`
      );
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
checkCustomers();
