import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    totalSpend: { type: Number, default: 0 },
    lastVisit: { type: Date },
    lastOrderDate: { type: Date },
    visitCount: { type: Number, default: 0 },
    isMockData: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
