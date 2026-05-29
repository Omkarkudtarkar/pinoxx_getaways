import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    peopleCount: { type: Number, default: 1, min: 1 },
    requestCall: { type: Boolean, default: false },
    contactType: {
      type: String,
      enum: ["call_now", "call_later", "message", "availability_check"],
      default: "message"
    },
    resortName: { type: String, default: "", trim: true },
    resortSlug: { type: String, default: "", trim: true },
    roomCategory: { type: String, default: "", trim: true },
    checkIn: { type: String, default: "", trim: true },
    checkOut: { type: String, default: "", trim: true },
    bookingUrl: { type: String, default: "", trim: true },
    preferredDate: { type: String, default: "", trim: true },
    preferredTime: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new"
    }
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
