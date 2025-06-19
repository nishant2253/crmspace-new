import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { apiGet, apiPost } from "../services/api"; // Import API service
import api from "../services/api";

// Get the API base URL for image sources
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_PROD_API_BASE_URL || "https://crmspace-new.vercel.app"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:5003";

export default function CampaignsPage() {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    segmentId: "",
    messageText: "",
  });
  const [segments, setSegments] = useState([]);
  const [campaignSummaries, setCampaignSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});
  const [campaignStats, setCampaignStats] = useState({});
  const [campaignLogs, setCampaignLogs] = useState({});
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImage, setAiImage] = useState(null);

  // Check for query parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldCreateCampaign = searchParams.get("createCampaign") === "true";
    const segmentId = searchParams.get("segmentId");

    if (shouldCreateCampaign && segmentId) {
      setShowCreateForm(true);
      setNewCampaign((prev) => ({
        ...prev,
        segmentId: segmentId,
      }));
    }
  }, [location]);

  // Fetch campaigns and segments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsData, segmentsData] = await Promise.all([
          apiGet("/api/campaigns"),
          apiGet("/api/segments"),
        ]);

        console.log("Fetched campaigns:", campaignsData);
        setCampaigns(campaignsData);
        setSegments(segmentsData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const response = await apiPost("/api/campaigns", {
        ...newCampaign,
        aiImage,
      });
      setCampaigns([...campaigns, response.campaign]);
      setShowCreateForm(false);
      setNewCampaign({ segmentId: "", messageText: "" });
      setAiImage(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const getSegmentName = (segmentId) => {
    const segment = segments.find((s) => s._id === segmentId);
    return segment ? segment.name : "Unknown Segment";
  };

  const toggleCampaignDetails = async (campaignId) => {
    // Toggle expanded state
    setExpandedCampaigns({
      ...expandedCampaigns,
      [campaignId]: !expandedCampaigns[campaignId],
    });

    // If expanding and we don't have stats/logs yet, fetch them
    if (!expandedCampaigns[campaignId] && !campaignStats[campaignId]) {
      fetchCampaignDetails(campaignId);
    }
  };

  const fetchCampaignDetails = async (campaignId) => {
    console.log("Fetching details for campaign:", campaignId);
    setLoadingLogs({ ...loadingLogs, [campaignId]: true });

    try {
      // Fetch both in parallel
      const [statsData, logsData] = await Promise.all([
        apiGet(`/api/campaigns/${campaignId}/stats`),
        apiGet(`/api/communication-logs/campaign/${campaignId}`),
      ]);

      console.log("Successfully fetched campaign data:", {
        stats: statsData,
        logsCount: logsData.length,
      });

      // Update state with the new data
      setCampaignStats((prevStats) => ({
        ...prevStats,
        [campaignId]: statsData,
      }));

      setCampaignLogs((prevLogs) => ({
        ...prevLogs,
        [campaignId]: logsData,
      }));

      // Return the data directly for immediate use
      return { stats: statsData, logs: logsData };
    } catch (err) {
      console.error("Error fetching campaign details:", err);
      throw err; // Rethrow to be handled by caller
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleSummarizeCampaign = async (campaignId) => {
    console.log("Starting summarize campaign for:", campaignId);
    setSummarizing((prev) => ({ ...prev, [campaignId]: true }));

    try {
      // Try to get data from state first
      let campaignData = {
        stats: campaignStats[campaignId],
        logs: campaignLogs[campaignId],
      };

      // If data is missing, fetch it directly and use the returned data
      if (!campaignData.stats || !campaignData.logs) {
        console.log("Data not in state, fetching directly...");
        campaignData = await fetchCampaignDetails(campaignId);
      }

      const { stats, logs } = campaignData;

      if (!stats || !logs) {
        throw new Error("Failed to get campaign data after fetching");
      }

      console.log("Processing campaign data:", {
        statsAvailable: !!stats,
        logsCount: logs?.length || 0,
      });

      // Calculate success rate
      const successRate =
        stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

      // Prepare enriched stats for AI
      const enrichedStats = {
        total: stats.total,
        sent: stats.sent,
        failed: stats.failed,
        successRate: successRate,
        deliveredCount: logs.filter((log) => log.deliveredAt).length,
        campaign: campaigns.find((c) => c._id === campaignId),
      };

      console.log("Calling AI endpoint with stats:", enrichedStats);

      // Call the AI endpoint for summary
      const summaryResponse = await apiPost("/api/ai/campaign-summary", {
        stats: enrichedStats,
      });
      const summary = summaryResponse.summary;
      console.log("Received AI summary:", summary);

      // Update the campaign summaries state with function form
      setCampaignSummaries((prev) => ({
        ...prev,
        [campaignId]: summary,
      }));

      return summary;
    } catch (err) {
      console.error("Error generating summary:", err);

      // Set error state
      setCampaignSummaries((prev) => ({
        ...prev,
        [campaignId]: "Failed to generate summary. Please try again.",
      }));

      throw err;
    } finally {
      setSummarizing((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  // AI message generation handler
  const handleAIGenerateMessage = async () => {
    if (!newCampaign.segmentId) {
      setError("Please select a segment first.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      // Find the selected segment name
      const segment = segments.find((s) => s._id === newCampaign.segmentId);
      const campaignName = segment ? segment.name : "";
      if (!campaignName) {
        setError("Segment name not found for AI message generation.");
        setAiLoading(false);
        return;
      }
      const res = await apiPost("/api/ai/campaign-message-from-name", {
        prompt: campaignName,
      });
      setNewCampaign((prev) => ({ ...prev, messageText: res.message }));
    } catch (err) {
      setError("AI message generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  // AI image generation handler
  const handleAIGenerateImage = async () => {
    setError("");
    setAiImage(null);
    if (!newCampaign.messageText || !newCampaign.messageText.trim()) {
      setError("Message box can't be empty");
      return;
    }
    setAiImageLoading(true);
    try {
      const res = await apiPost("/api/ai/campaign-image", {
        prompt: newCampaign.messageText,
      });
      setAiImage(res.image);
    } catch (err) {
      setError("AI image generation failed");
    } finally {
      setAiImageLoading(false);
    }
  };

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            Loading campaigns...
          </CardContent>
        </Card>
      </div>
    );

  if (error)
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-destructive">Error: {error}</CardContent>
        </Card>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="default"
          size="default"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>
              Create a new campaign for your selected segment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">
                  Select Segment:
                </label>
                <select
                  value={newCampaign.segmentId}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      segmentId: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Select a segment...</option>
                  {segments.map((segment) => (
                    <option key={segment._id} value={segment._id}>
                      {segment.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">
                  Message:
                </label>
                <textarea
                  value={newCampaign.messageText}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      messageText: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md bg-background"
                  required
                  rows="4"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAIGenerateMessage}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Generating..." : "AI Generated Message"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAIGenerateImage}
                    disabled={aiImageLoading}
                  >
                    {aiImageLoading ? "Generating..." : "Generate AI Image"}
                  </Button>
                </div>
                {aiImage && (
                  <div className="mt-4 flex flex-row items-start">
                    <img
                      src={`data:image/png;base64,${aiImage}`}
                      alt="AI Generated"
                      className="max-w-[200px] max-h-[150px] rounded border border-gray-200 shadow-md transition-transform duration-200 ease-in-out opacity-0 animate-fade-in hover:scale-105 hover:shadow-lg"
                      style={{ animation: "fadeIn 0.7s forwards" }}
                    />
                    <div className="text-xs text-gray-500 ml-4 mt-2">
                      AI Generated Image Preview
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="default">
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No campaigns yet. Create your first campaign!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign._id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleCampaignDetails(campaign._id)}
              >
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Campaign Details</CardTitle>
                  {expandedCampaigns[campaign._id] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
                <CardDescription>
                  Created on {new Date(campaign.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Segment:</span>{" "}
                    {getSegmentName(campaign.segmentId)}
                  </p>
                  <p>
                    <span className="font-medium">Message:</span>{" "}
                    {campaign.messageText}
                  </p>

                  {/* Display AI image only when details are expanded */}
                  {expandedCampaigns[campaign._id] && campaign.aiImage && (
                    <div className="mt-4">
                      <p className="font-medium">Campaign Image:</p>
                      <div className="mt-2">
                        <img
                          src={`${API_BASE_URL}${campaign.aiImage}`}
                          alt="Campaign AI"
                          className="max-w-[300px] max-h-[200px] rounded border border-gray-200 shadow-md"
                        />
                      </div>
                    </div>
                  )}

                  {campaignSummaries[campaign._id] && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium">AI Summary:</p>
                      <p className="text-sm">
                        {campaignSummaries[campaign._id]}
                      </p>
                    </div>
                  )}

                  {/* Campaign Details */}
                  {expandedCampaigns[campaign._id] && (
                    <div className="mt-4 pt-4 border-t">
                      {loadingLogs[campaign._id] ? (
                        <p className="text-sm">Loading campaign details...</p>
                      ) : campaignStats[campaign._id] ? (
                        <div>
                          <h3 className="text-md font-semibold mb-2">
                            Campaign Stats
                          </h3>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 p-2 rounded text-center">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="font-medium">
                                {campaignStats[campaign._id].total}
                              </p>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-center">
                              <p className="text-xs text-gray-500">Sent</p>
                              <p className="font-medium text-green-600">
                                {campaignStats[campaign._id].sent}
                              </p>
                            </div>
                            <div className="bg-red-50 p-2 rounded text-center">
                              <p className="text-xs text-gray-500">Failed</p>
                              <p className="font-medium text-red-600">
                                {campaignStats[campaign._id].failed}
                              </p>
                            </div>
                          </div>

                          {/* Show mock data info if present */}
                          {campaignStats[campaign._id].hasMockData && (
                            <div className="mb-4">
                              <div className="flex items-center mb-2">
                                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                                  Includes Mock Data
                                </div>
                                <span className="text-xs text-gray-500">
                                  This campaign includes mock customer data
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-2 bg-blue-50 p-2 rounded">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">
                                    Mock Total
                                  </p>
                                  <p className="font-medium">
                                    {campaignStats[campaign._id].mockData.total}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">
                                    Mock Sent
                                  </p>
                                  <p className="font-medium text-green-600">
                                    {campaignStats[campaign._id].mockData.sent}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">
                                    Mock Failed
                                  </p>
                                  <p className="font-medium text-red-600">
                                    {
                                      campaignStats[campaign._id].mockData
                                        .failed
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {campaignLogs[campaign._id] &&
                            campaignLogs[campaign._id].length > 0 && (
                              <div>
                                <h3 className="text-md font-semibold mb-2">
                                  Communication Logs
                                </h3>
                                <div className="border rounded overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Customer
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Status
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Date
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {campaignLogs[campaign._id]
                                        .filter(
                                          (log) => log.status !== "MASTER_LOG"
                                        )
                                        .map((log) => (
                                          <tr key={log._id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                              {log.customerName || "Unknown"}
                                              {log.isMockData && (
                                                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                                  Mock
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                              <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                  log.status === "SENT"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                              >
                                                {log.status}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                              {new Date(
                                                log.createdAt
                                              ).toLocaleString()}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                  <div className="px-3 py-2 bg-gray-50 text-center text-sm text-gray-500">
                                    Total logs:{" "}
                                    {
                                      campaignLogs[campaign._id].filter(
                                        (log) => log.status !== "MASTER_LOG"
                                      ).length
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No stats available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => handleSummarizeCampaign(campaign._id)}
                  variant="outline"
                  size="sm"
                  disabled={summarizing[campaign._id]}
                >
                  {summarizing[campaign._id]
                    ? "Summarizing..."
                    : "Summarize Campaign"}
                </Button>
                <Button
                  onClick={() => toggleCampaignDetails(campaign._id)}
                  variant="ghost"
                  size="sm"
                >
                  {expandedCampaigns[campaign._id]
                    ? "Hide Details"
                    : "Show Details"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
