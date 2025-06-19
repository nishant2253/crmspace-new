import Campaign from "../models/Campaign.js";
import SegmentRule from "../models/SegmentRule.js";
import Customer from "../models/Customer.js";
import CommunicationLog from "../models/CommunicationLog.js";
import { getSegmentCustomers } from "./segmentController.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// Helper to build MongoDB query from rulesJSON (reuse from segmentController)
function buildQueryFromRules(rulesJSON) {
  const { rules, condition } = rulesJSON;
  const ops = {
    ">": "$gt",
    "<": "$lt",
    ">=": "$gte",
    "<=": "$lte",
    "==": "$eq",
    "!=": "$ne",
  };
  const filters = rules.map((r) => ({
    [r.field]: { [ops[r.operator]]: r.value },
  }));
  return condition === "OR" ? { $or: filters } : { $and: filters };
}

export const createCampaign = async (req, res) => {
  try {
    console.log("CAMPAIGN CONTROLLER: Received request to create campaign");
    console.log(
      "CAMPAIGN CONTROLLER: Request body:",
      JSON.stringify({
        segmentId: req.body.segmentId,
        messageText: req.body.messageText?.substring(0, 20) + "...",
        hasAiImage: !!req.body.aiImage,
        aiImageLength: req.body.aiImage ? req.body.aiImage.length : 0,
      })
    );

    let { segmentId, messageText, aiImage, campaignName } = req.body;
    if (!segmentId || !messageText)
      return res
        .status(400)
        .json({ error: "segmentId and messageText required" });

    // Create campaign record first
    const segment = await SegmentRule.findById(segmentId);
    if (!segment) return res.status(404).json({ error: "Segment not found" });

    // If aiImage is a base64 string, we'll process it before creating the campaign
    let aiImageUrl = undefined;
    if (aiImage && typeof aiImage === "string" && aiImage.length > 100) {
      console.log("CAMPAIGN CONTROLLER: Processing AI image directly");
      const uploadsDir = path.join(process.cwd(), "uploads", "campaigns");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = `${uuidv4()}.png`;
      const filePath = path.join(uploadsDir, filename);
      const base64Data = aiImage.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(filePath, base64Data, "base64");
      aiImageUrl = `/uploads/campaigns/${filename}`;
      console.log(
        `CAMPAIGN CONTROLLER: Image saved as ${filename}, URL: ${aiImageUrl}`
      );
    }

    console.log(
      "CAMPAIGN CONTROLLER: Creating campaign record with aiImageUrl:",
      aiImageUrl
    );

    // Create basic campaign record with the image URL if it exists
    const campaign = await Campaign.create({
      userId: req.user._id,
      segmentId,
      messageText,
      name: campaignName || `Campaign for ${segment.name}`,
      aiImage: aiImageUrl, // Store image URL directly in the campaign
    });
    console.log(
      `CAMPAIGN CONTROLLER: Campaign created with ID: ${campaign._id}`
    );

    // Forward to delivery-receipt endpoint to handle actual message generation
    try {
      console.log("CAMPAIGN CONTROLLER: Making request to delivery endpoint");
      // Get base API URL (same server)
      const apiUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/delivery/campaign-delivery`;

      // Send request with auth cookie included
      const deliveryResponse = await axios.post(
        apiUrl,
        {
          campaignId: campaign._id,
          segmentId,
          messageText,
          aiImage: aiImageUrl ? null : aiImage, // Don't send image if we already processed it
          campaignName: campaign.name,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.cookie, // Forward auth cookies
          },
          withCredentials: true,
        }
      );
      console.log(
        "CAMPAIGN CONTROLLER: Received response from delivery endpoint"
      );

      // Return combined response with campaign that includes the image URL
      console.log(
        "CAMPAIGN CONTROLLER: Sending final response to client with aiImage:",
        campaign.aiImage
      );
      res.status(201).json({
        campaign: {
          ...campaign.toObject(),
          aiImage: aiImageUrl, // Ensure the image URL is included in the response
        },
        delivery: deliveryResponse.data,
      });
    } catch (deliveryError) {
      // If delivery fails, we still created the campaign but log the error
      console.error("Error calling delivery endpoint:", deliveryError.message);
      res.status(201).json({
        campaign: {
          ...campaign.toObject(),
          aiImage: aiImageUrl, // Include image URL even if delivery fails
        },
        deliveryError: "Failed to process message delivery, please try again",
        error: deliveryError.message,
      });
    }
  } catch (err) {
    console.error("CAMPAIGN CONTROLLER: Error creating campaign:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const listCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("segmentId");
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    // Add filter to exclude MASTER_LOG entries
    const total = await CommunicationLog.countDocuments({
      campaignId: id,
      status: { $ne: "MASTER_LOG" },
    });
    const sent = await CommunicationLog.countDocuments({
      campaignId: id,
      status: "SENT",
    });
    const failed = await CommunicationLog.countDocuments({
      campaignId: id,
      status: "FAILED",
    });

    // Get counts for mock data
    const mockTotal = await CommunicationLog.countDocuments({
      campaignId: id,
      status: { $ne: "MASTER_LOG" },
      isMockData: true,
    });
    const mockSent = await CommunicationLog.countDocuments({
      campaignId: id,
      status: "SENT",
      isMockData: true,
    });
    const mockFailed = await CommunicationLog.countDocuments({
      campaignId: id,
      status: "FAILED",
      isMockData: true,
    });

    res.json({
      total,
      sent,
      failed,
      mockData: {
        total: mockTotal,
        sent: mockSent,
        failed: mockFailed,
      },
      hasMockData: mockTotal > 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleCreateCampaign = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(
      "http://localhost:5003/api/campaigns",
      { ...newCampaign, aiImage },
      { withCredentials: true }
    );
    console.log("Campaign created response:", response.data);
    setCampaigns([...campaigns, response.data.campaign]);
    setShowCreateForm(false);
    setNewCampaign({ segmentId: "", messageText: "" });
    setAiImage(null);
  } catch (err) {
    setError(err.message);
  }
};
