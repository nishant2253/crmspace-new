import { getRulesFromText, getCampaignSummary } from "../ai/openai.js";
import OpenAI from "openai";

export const segmentRulesFromText = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });
    const rulesJSON = await getRulesFromText(prompt);
    res.json({ rulesJSON });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const campaignMessageFromName = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });
    // Use the same AI logic but with a different system prompt
    const systemPrompt = `You are an expert marketing assistant. Given a campaign name, generate a short, friendly, and engaging marketing message for customers. Do not include the customer's name, just the message body.`;
    const userPrompt = `Campaign Name: ${prompt}\nMessage:`;
    const message = await getRulesFromText(userPrompt, systemPrompt, 100);
    res.json({ message: typeof message === "string" ? message.trim() : "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const campaignImageGeneration = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Message box can't be empty" });
    }
    const client = new OpenAI({
      baseURL: "https://api.studio.nebius.com/v1/",
      apiKey: process.env.NEBIUS_API_KEY,
    });
    const response = await client.images.generate({
      model: "stability-ai/sdxl",
      response_format: "b64_json",
      extra_body: {
        response_extension: "png",
        width: 768,
        height: 512,
        num_inference_steps: 30,
        negative_prompt: "",
        seed: -1,
      },
      prompt,
    });
    const image = response.data[0]?.b64_json;
    if (!image)
      return res.status(500).json({ error: "Image generation failed" });
    res.json({ image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const campaignSummary = async (req, res) => {
  try {
    const { stats } = req.body;
    if (!stats) return res.status(400).json({ error: "Stats required" });

    // Enhance the stats structure for better AI summaries
    const enhancedStats = {
      ...stats,
      // Calculate additional metrics if they don't exist
      successRate:
        stats.successRate ||
        (stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0),
      failureRate:
        stats.failureRate ||
        (stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0),
      // Format dates for better readability if they exist
      campaignDate: stats.campaign?.createdAt
        ? new Date(stats.campaign.createdAt).toLocaleDateString()
        : "recent",
    };

    // Get the AI summary
    const summary = await getCampaignSummary(enhancedStats);

    // Return the summary and the enhanced stats
    res.json({
      summary,
      stats: enhancedStats,
    });
  } catch (err) {
    console.error("Error generating campaign summary:", err);
    res.status(500).json({ error: err.message });
  }
};
