import mongoose from "mongoose";

const segmentRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    rulesJSON: { type: Object, required: true },
    audienceSize: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("SegmentRule", segmentRuleSchema);
