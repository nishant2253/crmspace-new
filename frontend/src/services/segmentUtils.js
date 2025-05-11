// Frontend utility to preview segment audience locally
// This can be used when the API segment preview is not accessible (e.g., authentication issues)

// Mock customer data from backend/mock-data/customers.json
const mockCustomers = [
  {
    name: "Alice Sharma",
    email: "alice@example.com",
    totalSpend: 12000,
    lastVisit: "2024-05-01T10:00:00Z",
    lastOrderDate: "2024-04-28T12:00:00Z",
    visitCount: 5,
  },
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

// Helper function to evaluate a condition
const evaluateCondition = (customer, rule) => {
  const { field, operator, value } = rule;

  if (!customer[field]) {
    return false;
  }

  switch (operator) {
    case ">":
      return customer[field] > value;
    case "<":
      return customer[field] < value;
    case ">=":
      return customer[field] >= value;
    case "<=":
      return customer[field] <= value;
    case "==":
      return customer[field] === value;
    case "!=":
      return customer[field] !== value;
    case "contains":
      return String(customer[field])
        .toLowerCase()
        .includes(String(value).toLowerCase());
    default:
      return false;
  }
};

// Function to preview segment audience
export const previewSegmentAudience = (rulesJSON) => {
  console.log("Previewing segment with rules:", rulesJSON);

  // Default to empty if not provided
  const { rules = [], condition = "AND" } = rulesJSON;

  // Filter customers based on rules
  const matchedCustomers = mockCustomers.filter((customer) => {
    const results = rules.map((rule) => evaluateCondition(customer, rule));

    if (condition === "AND") {
      return results.every((result) => result === true);
    } else {
      return results.some((result) => result === true);
    }
  });

  console.log("Matched customers:", matchedCustomers.length);

  return {
    audienceSize: matchedCustomers.length,
    sample: matchedCustomers.slice(0, 5),
  };
};

export default {
  previewSegmentAudience,
};
