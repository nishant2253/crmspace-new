import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Customer from "./src/models/Customer.js";
import Order from "./src/models/Order.js";
import "./test-env.js"; // Import the test environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => console.error("MongoDB error:", err));

// Basic customers and orders for seeding
const customers = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    totalSpend: 15000,
    visitCount: 12,
    lastVisit: new Date("2024-05-01"),
    lastOrderDate: new Date("2024-04-28"),
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    totalSpend: 8500,
    visitCount: 7,
    lastVisit: new Date("2024-04-25"),
    lastOrderDate: new Date("2024-04-10"),
  },
  {
    name: "Carol Davis",
    email: "carol@example.com",
    totalSpend: 12000,
    visitCount: 10,
    lastVisit: new Date("2024-04-15"),
    lastOrderDate: new Date("2024-03-18"),
  },
  {
    name: "David Wilson",
    email: "david@example.com",
    totalSpend: 20000,
    visitCount: 5,
    lastVisit: new Date("2024-05-10"),
    lastOrderDate: new Date("2024-05-09"),
  },
];

// Seed database
async function seedDatabase() {
  try {
    // Reset collections
    await Customer.deleteMany({});
    await Order.deleteMany({});

    console.log("Seeding customers...");
    const insertedCustomers = await Customer.insertMany(customers);

    console.log("Creating orders for customers...");
    const orders = [];

    // Create some orders for each customer
    for (const customer of insertedCustomers) {
      // Add 1-3 orders per customer
      const numOrders = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numOrders; i++) {
        const orderAmount = Math.floor(Math.random() * 5000) + 1000;

        // Create order with date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);

        orders.push({
          customerId: customer._id,
          orderAmount,
          createdAt: orderDate,
        });
      }
    }

    console.log(`Creating ${orders.length} orders...`);
    await Order.insertMany(orders);

    console.log("Seeding completed successfully!");

    // Print out sample data for reference
    const customerCount = await Customer.countDocuments();
    const orderCount = await Order.countDocuments();
    console.log(
      `Database now contains ${customerCount} customers and ${orderCount} orders`
    );

    console.log("\nSample customer:");
    console.log(await Customer.findOne());

    console.log("\nSample order:");
    console.log(await Order.findOne());
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

seedDatabase();
