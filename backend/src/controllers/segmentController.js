import SegmentRule from "../models/SegmentRule.js";
import Customer from "../models/Customer.js";

// Helper to build MongoDB query from rulesJSON
export function buildQueryFromRules(rulesJSON) {
  console.log("Received rulesJSON:", JSON.stringify(rulesJSON, null, 2));

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

  return condition === "OR" ? { $or: filters } : { $and: filters };
}

export const createSegmentRule = async (req, res) => {
  try {
    const { name, rulesJSON } = req.body;
    if (!name || !rulesJSON)
      return res.status(400).json({ error: "Name and rulesJSON required" });
    // Calculate audience size
    const query = buildQueryFromRules(rulesJSON);
    const audienceSize = await Customer.countDocuments(query);
    const segment = await SegmentRule.create({
      userId: req.user._id,
      name,
      rulesJSON,
      audienceSize,
    });
    res.status(201).json(segment);
  } catch (err) {
    console.error("Error creating segment rule:", err);
    res.status(500).json({ error: err.message });
  }
};

export const listSegmentRules = async (req, res) => {
  try {
    const segments = await SegmentRule.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(segments);
  } catch (err) {
    console.error("Error listing segment rules:", err);
    res.status(500).json({ error: err.message });
  }
};

export const previewSegmentAudience = async (req, res) => {
  try {
    console.log("Preview request body:", req.body);
    const { rulesJSON } = req.body;
    if (!rulesJSON)
      return res.status(400).json({ error: "rulesJSON required" });

    // Build query and log it
    const query = buildQueryFromRules(rulesJSON);
    console.log("Generated MongoDB query:", JSON.stringify(query, null, 2));

    // Get customers matching the query
    const audienceSize = await Customer.countDocuments(query);
    console.log("Matched audience size:", audienceSize);
    const sample = await Customer.find(query).limit(5);
    console.log("Sample customers:", sample.length);

    res.json({ audienceSize, sample });
  } catch (err) {
    console.error("Error previewing segment audience:", err);
    res.status(500).json({ error: err.message });
  }
};
