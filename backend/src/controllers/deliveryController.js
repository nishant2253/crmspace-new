import CommunicationLog from "../models/CommunicationLog.js";
import Customer from "../models/Customer.js";
import SegmentRule from "../models/SegmentRule.js";
import Campaign from "../models/Campaign.js";
import { buildQueryFromRules } from "./segmentController.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "redis";
import { getSegmentCustomers } from "../controllers/segmentController.js";

export const handleDeliveryReceipt = async (req, res) => {
  try {
    const receipts = Array.isArray(req.body) ? req.body : [req.body];
    const results = await Promise.all(
      receipts.map(async (r) => {
        if (!r.campaignId || !r.customerId || !r.status)
          return { error: "Missing fields", ...r };
        const log = await CommunicationLog.findOneAndUpdate(
          { campaignId: r.campaignId, customerId: r.customerId },
          {
            status: r.status,
            deliveredAt: r.status === "SENT" ? new Date() : undefined,
          },
          { new: true }
        );
        return log || { error: "Log not found", ...r };
      })
    );
    res.json({ updated: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const handleCampaignDelivery = async (req, res) => {
  try {
    console.log("DELIVERY CONTROLLER: Received campaign delivery request");
    let { campaignId, segmentId, messageText, aiImage, campaignName } =
      req.body;

    if (!segmentId || !messageText) {
      return res
        .status(400)
        .json({ error: "segmentId and messageText are required" });
    }

    // Find segment
    const segment = await SegmentRule.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ error: "Segment not found" });
    }
    console.log(`DELIVERY CONTROLLER: Found segment: ${segment.name}`);

    // Process aiImage if provided as base64
    let aiImageUrl = undefined;
    if (aiImage && typeof aiImage === "string") {
      // Case 1: aiImage is already a URL (processed by campaign controller)
      if (aiImage.startsWith("/uploads/campaigns/")) {
        console.log(
          "DELIVERY CONTROLLER: Using pre-processed image URL:",
          aiImage
        );
        aiImageUrl = aiImage;
      }
      // Case 2: aiImage is a base64 string that needs processing
      else if (aiImage.length > 100) {
        console.log("DELIVERY CONTROLLER: Processing AI image from base64");
        const uploadsDir = path.join(process.cwd(), "uploads", "campaigns");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filename = `${uuidv4()}.png`;
        const filePath = path.join(uploadsDir, filename);
        const base64Data = aiImage.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(filePath, base64Data, "base64");
        aiImageUrl = `/uploads/campaigns/${filename}`;
        console.log(`DELIVERY CONTROLLER: Image saved as ${filename}`);
      }
    }

    // Update the campaign record with the image URL if we have one
    if (campaignId && aiImageUrl) {
      console.log(
        `DELIVERY CONTROLLER: Updating campaign with image URL: ${aiImageUrl}`
      );
      await Campaign.findByIdAndUpdate(campaignId, { aiImage: aiImageUrl });
    }

    // If campaignId is not provided, create a new campaign
    if (!campaignId) {
      console.log(
        "DELIVERY CONTROLLER: No campaignId provided, creating new campaign"
      );
      const campaign = await Campaign.create({
        userId: req.user._id,
        segmentId,
        messageText,
        aiImage: aiImageUrl,
        name: campaignName || `Campaign for ${segment.name}`,
      });
      campaignId = campaign._id;
      console.log(
        `DELIVERY CONTROLLER: Created new campaign with ID: ${campaignId}`
      );
    } else {
      console.log(
        `DELIVERY CONTROLLER: Using existing campaign ID: ${campaignId}`
      );
    }

    // Create a master log entry
    console.log("DELIVERY CONTROLLER: Creating master log entry");
    const masterCampaignLog = await CommunicationLog.create({
      campaignId: campaignId,
      customerId: null,
      status: "MASTER_LOG",
      message: messageText,
      segmentName: segment.name,
      campaignData: JSON.stringify({
        userId: req.user._id,
        segmentId,
        messageText,
        aiImage: aiImageUrl,
        createdAt: new Date(),
        segment: segment.name,
      }),
    });

    // Find audience using getSegmentCustomers to include mock data
    console.log("DELIVERY CONTROLLER: Finding audience with segment rule");
    const audience = await getSegmentCustomers(segmentId);
    console.log(
      `DELIVERY CONTROLLER: Found ${audience.length} matching customers (including mock data: ${segment.useMockData})`
    );

    // Simulate delivery (90% success, 10% failure)
    console.log(
      "DELIVERY CONTROLLER: Creating communication logs for each customer"
    );
    const logs = await Promise.all(
      audience.map(async (customer) => {
        const isSuccess = Math.random() < 0.9;
        return CommunicationLog.create({
          campaignId: campaignId,
          customerId: customer._id,
          status: isSuccess ? "SENT" : "FAILED",
          deliveredAt: isSuccess ? new Date() : undefined,
          message: `Hey ${customer.name}, ${messageText}`,
          customerName: customer.name,
          aiImage: aiImageUrl,
          isMockData: customer.isMockData || false,
        });
      })
    );

    // Return campaign stats
    const sent = logs.filter((log) => log.status === "SENT").length;
    const failed = logs.filter((log) => log.status === "FAILED").length;

    console.log(
      "DELIVERY CONTROLLER: Completed processing, returning response"
    );
    res.status(201).json({
      campaignId,
      segmentId,
      segmentName: segment.name,
      totalAudience: audience.length,
      sent,
      failed,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("DELIVERY CONTROLLER: Error in campaign delivery:", err);
    res.status(500).json({ error: err.message });
  }
};

export const processCampaignDelivery = async (req, res) => {
  try {
    const { campaignId, segmentId } = req.body;
    if (!campaignId || !segmentId)
      return res
        .status(400)
        .json({ error: "campaignId and segmentId required" });

    console.log(`Processing campaign delivery for campaign: ${campaignId}`);

    // Get segment and campaign
    const segment = await SegmentRule.findById(segmentId);
    if (!segment) return res.status(404).json({ error: "Segment not found" });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    // Get customers for this segment using the getSegmentCustomers function
    // This will automatically handle mock data based on the segment's useMockData flag
    const customers = await getSegmentCustomers(segmentId);
    console.log(`Found ${customers.length} customers for segment ${segmentId}`);

    // Create a master log entry for this campaign
    const masterLog = await CommunicationLog.create({
      campaignId,
      customerId: null,
      status: "MASTER_LOG",
      message: `Support your community and discover hidden gems right around the corner...`,
      segmentName: segment.name,
    });

    // Try to use Redis for message processing
    let useRedis = true;
    let redisClient;
    try {
      redisClient = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      });
      await redisClient.connect();
    } catch (redisErr) {
      console.error(
        "Redis connection error, falling back to direct processing:",
        redisErr.message
      );
      useRedis = false;
    }

    const logs = [];
    const streamKey = `stream:campaign:${campaignId}`;

    // Process each customer
    for (const customer of customers) {
      try {
        // Create a communication log for this customer
        const log = new CommunicationLog({
          campaignId,
          customerId: customer._id,
          status: "QUEUED",
          message: campaign.messageText,
          segmentName: segment.name,
          customerName: customer.name,
          isMockData: customer.isMockData || false,
          campaignData: JSON.stringify({
            userId: customer._id,
            segmentId: segment._id,
          }),
        });
        await log.save();
        logs.push(log);

        if (useRedis) {
          // Add to Redis stream
          try {
            await redisClient.xAdd(streamKey, "*", {
              customerId: customer._id.toString(),
              customerName: customer.name,
              customerEmail: customer.email,
              messageText: campaign.messageText,
              campaignName: campaign.name,
              segmentName: segment.name,
              logId: log._id.toString(),
              aiImage: campaign.aiImage || "",
              isMockData: customer.isMockData ? "true" : "false",
            });
          } catch (streamErr) {
            console.error("Error adding to Redis stream:", streamErr.message);
            // If Redis stream fails, update the log directly
            await directProcessMessage(log._id);
          }
        } else {
          // Direct processing without Redis
          await directProcessMessage(log._id);
        }
      } catch (err) {
        console.error(
          `Error processing customer ${customer._id}:`,
          err.message
        );
      }
    }

    // Close Redis connection if it was opened
    if (useRedis && redisClient) {
      await redisClient.quit();
    }

    // Return success response
    res.json({
      success: true,
      customersCount: customers.length,
      logsCreated: logs.length,
      masterLogId: masterLog._id,
    });
  } catch (err) {
    console.error("Error processing campaign delivery:", err);
    res.status(500).json({ error: err.message });
  }
};

// Helper function to directly process a message without Redis
async function directProcessMessage(logId) {
  try {
    // Simulate 90% success rate
    const isSuccess = Math.random() < 0.9;

    // Update the communication log with the result
    await CommunicationLog.findByIdAndUpdate(logId, {
      status: isSuccess ? "SENT" : "FAILED",
      deliveredAt: isSuccess ? new Date() : undefined,
    });

    return true;
  } catch (err) {
    console.error("Error in direct message processing:", err);
    return false;
  }
}
