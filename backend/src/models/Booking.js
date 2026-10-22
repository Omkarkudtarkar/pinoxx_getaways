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
    adults: { type: Number, default: 1, min: 1 },
    children5To11: { type: Number, default: 0, min: 0 },
    childrenUnder5: { type: Number, default: 0, min: 0 },
    nights: { type: Number, default: 1, min: 1 },
    specialRequests: { type: String, default: "", trim: true, maxlength: 1000 },
    roomAmount: { type: Number, default: 0 },
    selectedActivities: [{
      id: { type: String, trim: true },
      label: { type: String, trim: true },
      price: { type: Number, min: 0 }
    }],
    activityCharges: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0 },
    advanceRate: { type: Number, default: 0.2, min: 0, max: 1 },
    advanceAmount: { type: Number, default: 0 },
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
