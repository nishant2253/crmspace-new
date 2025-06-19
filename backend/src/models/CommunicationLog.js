import mongoose from "mongoose";

const communicationLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: function () {
        return this.status !== "MASTER_LOG";
      },
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "MASTER_LOG", "QUEUED"],
      required: true,
    },
    deliveredAt: { type: Date },
    message: { type: String, required: true },
    customerName: { type: String },
    segmentName: { type: String },
    campaignData: { type: String },
    aiImage: { type: String },
    isMockData: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("CommunicationLog", communicationLogSchema);
