import dotenv from "dotenv";

dotenv.config();

// Simple mock OpenAI client that doesn't require external dependencies
console.log(
  "Using mock OpenAI client - AI features will return placeholder responses"
);

// Generate content with error handling
export async function generateContent(prompt, options = {}) {
  try {
    // Return mock response
    return {
      content:
        "This is a placeholder response. AI features are disabled in this deployment.",
      error: null,
    };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      content: "Unable to generate content due to an error.",
      error: error.message || "Failed to generate content",
    };
  }
}

export default {
  generateContent,
};
