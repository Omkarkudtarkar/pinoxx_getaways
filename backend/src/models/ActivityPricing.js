import mongoose from "mongoose";

const activityPricingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    adventureCombo: { type: Number, required: true, min: 0, default: 0 },
    riverRafting: { type: Number, required: true, min: 0, default: 0 },
    riverZipline: { type: Number, required: true, min: 0, default: 0 }
  },
  { timestamps: true }
);

export const ActivityPricing = mongoose.model("ActivityPricing", activityPricingSchema);
