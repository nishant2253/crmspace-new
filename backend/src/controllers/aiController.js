import openai from "../ai/openai.js";
import OpenAI from "openai";

// Generate rules from text
export const generateRules = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemPrompt =
      'You are an expert CRM assistant. Convert the following user request into a JSON rules structure for customer segmentation. Use the format: { "rules": [ { "field": ..., "operator": ..., "value": ... } ], "condition": "AND/OR" }';

    const result = await openai.generateContent(
      `${systemPrompt}\n\nRequest: ${prompt}\nRules JSON:`,
      { temperature: 0.2 }
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Try to parse JSON from the response
    try {
      const match = result.content.match(/\{[\s\S]*\}/);
      const jsonData = match ? JSON.parse(match[0]) : null;

      if (!jsonData) {
        return res.status(422).json({
          error: "Failed to parse rules from AI response",
          rawResponse: result.content,
        });
      }

      return res.json(jsonData);
    } catch (parseError) {
      return res.status(422).json({
        error: "Invalid JSON in AI response",
        parseError: parseError.message,
        rawResponse: result.content,
      });
    }
  } catch (error) {
    console.error("AI rules generation error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to generate rules" });
  }
};

// Generate campaign summary
export const generateCampaignSummary = async (req, res) => {
  try {
    const { stats } = req.body;

    if (!stats) {
      return res.status(400).json({ error: "Campaign stats are required" });
    }

    const systemPrompt =
      "You are an expert CRM assistant. Given campaign delivery stats as JSON, write a 1-2 sentence summary for a business user. The summary should be concise and insightful, focusing on total messages, success rate, and deliveries. Use a tone that's professional but conversational. Include specific percentages and counts.";

    const result = await openai.generateContent(
      `${systemPrompt}\n\nStats: ${JSON.stringify(stats)}\nSummary:`,
      { temperature: 0.3 }
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ summary: result.content.trim() });
  } catch (error) {
    console.error("AI summary generation error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to generate summary" });
  }
};

// Generate email content
export const generateEmailContent = async (req, res) => {
  try {
    const { campaignType, customerInfo, productInfo } = req.body;

    if (!campaignType) {
      return res.status(400).json({ error: "Campaign type is required" });
    }

    const prompt = `
      Generate a marketing email for a ${campaignType} campaign.
      ${customerInfo ? `Customer info: ${JSON.stringify(customerInfo)}` : ""}
      ${productInfo ? `Product info: ${JSON.stringify(productInfo)}` : ""}
      The email should be professional but friendly, and include a clear call to action.
    `;

    const result = await openai.generateContent(prompt, { maxTokens: 800 });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ content: result.content });
  } catch (error) {
    console.error("AI email generation error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to generate email content" });
  }
};

// Generate marketing message
export const generateMarketingMessage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });

    const systemPrompt = `You are an expert marketing assistant. Given a campaign name, generate a short, friendly, and engaging marketing message for customers. Do not include the customer's name, just the message body.`;

    const result = await openai.generateContent(
      `${systemPrompt}\n\nCampaign Name: ${prompt}\nMessage:`,
      { maxTokens: 100, temperature: 0.7 }
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ message: result.content.trim() });
  } catch (error) {
    console.error("Marketing message generation error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to generate marketing message" });
  }
};

// Get campaign summary with stats
export const getCampaignSummaryWithStats = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Get delivery stats for the campaign
    const stats = req.body.stats || { total: 0, success: 0, failed: 0 };

    // Add some calculated fields
    const enhancedStats = {
      ...stats,
      successRate:
        stats.total > 0
          ? ((stats.success / stats.total) * 100).toFixed(1) + "%"
          : "0%",
      failureRate:
        stats.total > 0
          ? ((stats.failed / stats.total) * 100).toFixed(1) + "%"
          : "0%",
    };

    // Generate the summary
    const result = await openai.generateContent(
      `You are an expert CRM assistant. Given campaign delivery stats as JSON, write a 1-2 sentence summary for a business user. The summary should be concise and insightful, focusing on total messages, success rate, and deliveries.\n\nStats: ${JSON.stringify(
        enhancedStats
      )}\nSummary:`,
      { temperature: 0.3 }
    );

    if (result.error) {
      return res.status(500).json({
        error: result.error,
        stats: enhancedStats,
        summary:
          "Unable to generate summary. Please check the campaign statistics directly.",
      });
    }

    // Return the summary and the enhanced stats
    return res.json({
      stats: enhancedStats,
      summary: result.content.trim(),
    });
  } catch (error) {
    console.error("Error getting campaign summary:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to get campaign summary" });
  }
};
