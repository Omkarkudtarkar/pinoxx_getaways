import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
      index: true
    },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    members: { type: Number, required: true, min: 1 },
    roomCategory: { type: String, default: "", trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    specialRequests: { type: String, default: "", trim: true, maxlength: 1000 },
    advanceAmount: { type: Number, default: 1000 },
    holdExpiresAt: { type: Date },
    commissionPerGuest: { type: Number, default: 100 },
    estimatedCommission: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending_payment", "payment_initiated", "confirmed", "cancelled"],
      default: "pending_payment"
    },
    payment: {
      provider: { type: String, default: "upi" },
      upiLink: String,
      transactionRef: String,
      paidAt: Date
    },
    whatsapp: {
      businessUrl: String,
      customerUrl: String,
      message: String,
      customerSlip: String
    }
  },
  { timestamps: true }
);

bookingSchema.pre("save", function calculateCommission() {
  this.estimatedCommission = this.members * this.commissionPerGuest;
});

export const Booking = mongoose.model("Booking", bookingSchema);
