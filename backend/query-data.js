import mongoose from "mongoose";
import "./test-env.js"; // Import the test environment variables
import Customer from "./src/models/Customer.js";
import Order from "./src/models/Order.js";

console.log("Starting MongoDB query script...");
console.log("Using MongoDB URI:", process.env.MONGO_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for querying"))
  .catch((err) => console.error("MongoDB error:", err));

async function queryData() {
  try {
    console.log("\nQuerying MongoDB for data...");

    // Get customer count
    const customerCount = await Customer.countDocuments();
    console.log(`Total Customers: ${customerCount}`);

    // Show customer data
    const customers = await Customer.find().limit(5);
    console.log("\nCustomer Samples:");
    customers.forEach((customer) => {
      console.log(JSON.stringify(customer, null, 2));
    });

    // Get order count
    const orderCount = await Order.countDocuments();
    console.log(`\nTotal Orders: ${orderCount}`);

    // Show order data
    const orders = await Order.find().limit(5);
    console.log("\nOrder Samples:");
    orders.forEach((order) => {
      console.log(JSON.stringify(order, null, 2));
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected");
  } catch (error) {
    console.error("Error querying data:", error);
    await mongoose.disconnect();
  }
}

queryData();
