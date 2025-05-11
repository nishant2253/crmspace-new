import CommunicationLog from "../models/CommunicationLog.js";
import Customer from "../models/Customer.js";

export const listCommunicationLogs = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.query;
    const filter = {
      campaignId,
      status: { $ne: "MASTER_LOG" }, // Exclude MASTER_LOG entries
    };
    if (status) filter.status = status;
    const logs = await CommunicationLog.find(filter)
      .populate("customerId")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
