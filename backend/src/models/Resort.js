import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
    images: [imageSchema]
  },
  { _id: true }
);

const resortSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    location: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    resortType: {
      type: String,
      enum: ["bamboo", "budget", "premium"],
      default: "budget",
      index: true
    },
    startingPrice: { type: Number, required: true, min: 0 },
    sharingPrice: { type: Number, min: 0, default: 0 },
    couplePrice: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
    distanceFromBusStandKm: { type: Number, required: true, min: 0 },
    distanceToWaterActivitiesKm: { type: Number, min: 0, default: 0 },
    amenities: [{ type: String, trim: true }],
    activities: [{ type: String, trim: true }],
    checkInTime: { type: String, default: "", trim: true },
    checkOutTime: { type: String, default: "", trim: true },
    images: [imageSchema],
    rooms: [roomSchema],
    availabilitySheetUrl: { type: String, default: "", trim: true },
    availabilityLastSyncedAt: { type: Date },
    isActive: { type: Boolean, default: true },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" }
  },
  { timestamps: true }
);

resortSchema.index({ name: "text", location: "text", resortType: "text", amenities: "text" });

export const Resort = mongoose.model("Resort", resortSchema);
