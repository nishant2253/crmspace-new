import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SegmentRule",
    required: true,
  },
  messageText: { type: String, required: true },
  aiImage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Campaign", campaignSchema);
