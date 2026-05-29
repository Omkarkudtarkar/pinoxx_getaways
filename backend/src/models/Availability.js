import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    resortName: { type: String, required: true, trim: true },
    resortSlug: { type: String, required: true, trim: true, index: true },
    roomCategory: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    availableRooms: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["available", "limited", "sold_out", "unknown"],
      default: "unknown",
      index: true
    },
    price: { type: Number, default: 0, min: 0 },
    note: { type: String, default: "", trim: true },
    sourceUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

availabilitySchema.index({ resortSlug: 1, roomCategory: 1, date: 1 }, { unique: true });

export const Availability = mongoose.model("Availability", availabilitySchema);

