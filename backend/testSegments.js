import mongoose from "mongoose";
import Customer from "./src/models/Customer.js";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Helper to build MongoDB query from rulesJSON
function buildQueryFromRules(rulesJSON) {
  console.log("Building query from:", JSON.stringify(rulesJSON, null, 2));
  // Default to empty if not provided
  const { rules = [], condition = "AND" } = rulesJSON;

  // If no rules, return empty query that matches all documents
  if (!rules.length) {
    return {};
  }

  const ops = {
    ">": "$gt",
    "<": "$lt",
    ">=": "$gte",
    "<=": "$lte",
    "==": "$eq",
    "!=": "$ne",
    contains: { $regex: true }, // Special case for string contains
  };

  const filters = rules
    .map((r) => {
      // Handle invalid rule format
      if (!r.field || !r.operator) {
        console.error("Invalid rule format:", r);
        return null;
      }

      // Handle special case for string contains
      if (r.operator === "contains") {
        return { [r.field]: { $regex: r.value, $options: "i" } };
      }

      // Map operator to MongoDB operator
      const mongoOp = ops[r.operator];
      if (!mongoOp) {
        console.error("Unsupported operator:", r.operator);
        return null;
      }

      return { [r.field]: { [mongoOp]: r.value } };
    })
    .filter(Boolean); // Remove null entries

  // If no valid filters after processing, return empty query
  if (!filters.length) {
    console.log("No valid filters, returning empty query");
    return {};
  }

  const finalQuery = condition === "OR" ? { $or: filters } : { $and: filters };
  console.log("Generated query:", JSON.stringify(finalQuery, null, 2));
  return finalQuery;
}

async function testSegmentQueries() {
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

    // Test cases
    const testCases = [
      {
        name: "High spenders (> 5000)",
        query: {
          rules: [{ field: "totalSpend", operator: ">", value: 5000 }],
          condition: "AND",
        },
      },
      {
        name: "Low spenders (<= 5000)",
        query: {
          rules: [{ field: "totalSpend", operator: "<=", value: 5000 }],
          condition: "AND",
        },
      },
      {
        name: "Frequent visitors (>= 3 visits)",
        query: {
          rules: [{ field: "visitCount", operator: ">=", value: 3 }],
          condition: "AND",
        },
      },
      {
        name: "High spenders with many visits",
        query: {
          rules: [
            { field: "totalSpend", operator: ">", value: 5000 },
            { field: "visitCount", operator: ">=", value: 3 },
          ],
          condition: "AND",
        },
      },
      {
        name: "Either high spend OR many visits",
        query: {
          rules: [
            { field: "totalSpend", operator: ">", value: 10000 },
            { field: "visitCount", operator: ">=", value: 4 },
          ],
          condition: "OR",
        },
      },
    ];

    // Run each test case
    for (const testCase of testCases) {
      console.log(`\n=== Testing: ${testCase.name} ===`);
      const query = buildQueryFromRules(testCase.query);
      const customers = await Customer.find(query);
      console.log(`Found ${customers.length} matching customers:`);
      customers.forEach((customer) => {
        console.log(
          `- ${customer.name} (${customer.email}): ${customer.totalSpend} | ${customer.visitCount} visits`
        );
      });
    }
  } catch (err) {
    console.error("Error testing segment queries:", err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
testSegmentQueries();
