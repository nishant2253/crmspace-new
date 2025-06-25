import mongoose from "mongoose";

const segmentRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    name: { type: String, required: true },
    rulesJSON: { type: Object, required: true },
    audienceSize: { type: Number, default: 0 },
    useMockData: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("SegmentRule", segmentRuleSchema);
