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

async function testSegmentDirectly() {
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

    // Use the same segment rule format as the frontend
    const rulesJSON = {
      rules: [{ field: "totalSpend", operator: ">", value: 5000 }],
      condition: "AND",
    };

    // Build query
    const query = buildQueryFromRules(rulesJSON);

    // Get customers matching the query
    const audienceSize = await Customer.countDocuments(query);
    console.log("Matched audience size:", audienceSize);

    const sample = await Customer.find(query).limit(5);
    console.log("Sample customers:", sample.length);

    sample.forEach((customer) => {
      console.log(
        `- ${customer.name} (${customer.email}): ${customer.totalSpend} | ${customer.visitCount} visits`
      );
    });

    console.log("\nResult object that would be sent to frontend:");
    console.log(JSON.stringify({ audienceSize, sample }, null, 2));
  } catch (err) {
    console.error("Error testing segment directly:", err);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
testSegmentDirectly();
