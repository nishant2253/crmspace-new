import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

const client = ModelClient(endpoint, new AzureKeyCredential(token));

export async function getRulesFromText(
  prompt,
  systemPromptOverride,
  maxTokens = 300
) {
  const systemPrompt =
    systemPromptOverride ||
    `You are an expert CRM assistant. Convert the following user request into a JSON rules structure for customer segmentation. Use the format: { "rules": [ { "field": ..., "operator": ..., "value": ... } ], "condition": "AND/OR" }`;
  const userPrompt =
    typeof prompt === "string" && systemPromptOverride
      ? prompt
      : `Request: ${prompt}\nRules JSON:`;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      top_p: 1,
      model: model,
      max_tokens: maxTokens,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  const text = response.body.choices[0].message.content;
  // If using for rules, try to parse JSON, else just return string
  if (!systemPromptOverride) {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
  return text;
}

export async function getCampaignSummary(stats) {
  const systemPrompt = `You are an expert CRM assistant. Given campaign delivery stats as JSON, write a 1-2 sentence summary for a business user. The summary should be concise and insightful, focusing on total messages, success rate, and deliveries. Use a tone that's professional but conversational. Include specific percentages and counts. For example: "This campaign sent 85 messages with a 92% success rate, reaching 78 customers."`;
  const userPrompt = `Stats: ${JSON.stringify(stats)}\nSummary:`;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      top_p: 1,
      model: model,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  return response.body.choices[0].message.content.trim();
}
