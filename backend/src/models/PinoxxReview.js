import mongoose from "mongoose";

const pinoxxReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ""
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      sparse: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ["approved", "rejected"],
      default: "approved",
      index: true
    },
    usefulCount: {
      type: Number,
      min: 0,
      default: 0
    },
    notUsefulCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
);

export const PinoxxReview = mongoose.model("PinoxxReview", pinoxxReviewSchema);
