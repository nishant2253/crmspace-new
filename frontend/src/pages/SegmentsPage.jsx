import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/api";
import { previewSegmentAudience } from "../services/segmentUtils";
import { useNavigate } from "react-router-dom";

export default function SegmentsPage() {
  const navigate = useNavigate();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rulesJSON, setRulesJSON] = useState({ rules: [], condition: "AND" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    apiGet("/api/segments")
      .then(setSegments)
      .catch((err) => console.error("Error fetching segments:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const seg = await apiPost("/api/segments", { name, rulesJSON });
      setSegments([seg, ...segments]);

      // Navigate to campaigns page with the new segment ID
      navigate(`/campaigns?createCampaign=true&segmentId=${seg._id}`);
    } catch (err) {
      setError(err?.response?.data?.error || "Error creating segment");
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = async () => {
    setError("");
    setPreviewLoading(true);
    setAudiencePreview(null);

    try {
      console.log("Previewing segment with rules:", rulesJSON);
      const response = await apiPost("/api/segments/preview", { rulesJSON });
      console.log("Preview response:", response);
      setAudiencePreview(response);

      if (response.audienceSize === 0) {
        setError(
          "No customers match these rules. Try adjusting your criteria."
        );
      }
    } catch (err) {
      console.error("Preview error:", err);
      setError(
        err?.response?.data?.error || "Preview failed. Check your rules format."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAiAssist = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setError("");
    try {
      const res = await apiPost("/api/ai/segment-rules-from-text", {
        prompt: aiPrompt,
      });
      setRulesJSON(res.rulesJSON);
    } catch (err) {
      setError("AI assist failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRulesJSONChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setRulesJSON(parsed);
      setError("");
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  // Example rule to help users
  const addExampleRule = () => {
    setRulesJSON({
      rules: [
        { field: "totalSpend", operator: ">", value: 5000 },
        { field: "visitCount", operator: ">=", value: 3 },
      ],
      condition: "AND",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Segments</h1>
      <form
        onSubmit={handleCreate}
        className="bg-white p-4 rounded shadow mb-6"
      >
        <div className="mb-2">
          <label className="block font-semibold mb-1">Segment Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-2 py-1 rounded w-full"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">AI Rule Builder</label>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="border px-2 py-1 rounded w-full"
              placeholder="e.g. People who haven't shopped in 6 months and spent over ₹5K"
            />
            <button
              type="button"
              onClick={handleAiAssist}
              className="bg-blue-500 text-white px-3 py-1 rounded"
              disabled={aiLoading}
            >
              {aiLoading ? "Thinking..." : "AI Assist"}
            </button>
          </div>
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">
            Rules JSON
            <button
              type="button"
              onClick={addExampleRule}
              className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded"
            >
              Add Example
            </button>
          </label>
          <textarea
            value={JSON.stringify(rulesJSON, null, 2)}
            onChange={handleRulesJSONChange}
            className="border px-2 py-1 rounded w-full font-mono text-xs"
            rows={4}
          />
          <div className="text-xs text-gray-500 mt-1">
            Format:{" "}
            {
              "{ rules: [{ field: 'totalSpend', operator: '>', value: 5000 }], condition: 'AND' }"
            }
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={handlePreview}
            className="bg-gray-500 text-white px-3 py-1 rounded"
            disabled={previewLoading}
          >
            {previewLoading ? "Loading..." : "Preview Audience"}
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-3 py-1 rounded"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Segment"}
          </button>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {audiencePreview && (
          <div className="bg-gray-50 p-2 rounded mt-2">
            <div className="font-semibold">
              Audience Size: {audiencePreview.audienceSize}
            </div>
            <div className="text-xs text-gray-600">
              Sample: {audiencePreview.sample.map((c) => c.email).join(", ")}
            </div>
          </div>
        )}
      </form>
      <h2 className="text-xl font-semibold mb-2">Your Segments</h2>
      {loading ? (
        <div>Loading segments...</div>
      ) : segments.length === 0 ? (
        <div>No segments created yet</div>
      ) : (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <div key={segment._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{segment.name}</h3>
              <div className="text-sm text-gray-600 mt-1">
                Rules: {JSON.stringify(segment.rulesJSON)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
