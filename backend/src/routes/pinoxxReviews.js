import express from "express";
import jwt from "jsonwebtoken";
import { PinoxxReview } from "../models/PinoxxReview.js";
import { User } from "../models/User.js";

export const pinoxxReviewsRouter = express.Router();

const memoryReviews = [
  {
    _id: "pinoxx-review-1",
    name: "Aarav",
    email: "aarav@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    user: "sample-google-aarav",
    rating: 5,
    comment: "Pinoxx made the Dandeli resort selection clear and helped us understand the rafting package before booking.",
    status: "approved",
    usefulCount: 18,
    notUsefulCount: 1,
    createdAt: new Date().toISOString()
  },
  {
    _id: "pinoxx-review-2",
    name: "Neha",
    email: "neha@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    user: "sample-google-neha",
    rating: 5,
    comment: "Fast WhatsApp support and simple guidance for rooms, food, activities, and final package details.",
    status: "approved",
    usefulCount: 14,
    notUsefulCount: 0,
    createdAt: new Date().toISOString()
  }
];

function serializeReview(review) {
  return {
    _id: review._id,
    name: review.name,
    avatarUrl: review.avatarUrl,
    rating: review.rating,
    comment: review.comment,
    usefulCount: Number(review.usefulCount || 0),
    notUsefulCount: Number(review.notUsefulCount || 0),
    createdAt: review.createdAt
  };
}

async function requireGoogleReviewAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Google login is required to add a Pinoxx review" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "pinoxx-dev-secret");

    if (process.env.USE_MEMORY_DB === "true") {
      req.user = {
        _id: payload.id,
        id: payload.id,
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.avatarUrl,
        authProvider: payload.authProvider,
        role: payload.role
      };
    } else {
      const user = await User.findById(payload.id);
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.user = user;
    }

    if (req.user?.authProvider !== "google" || !req.user?.email || !req.user?.avatarUrl) {
      return res.status(403).json({ message: "Please continue with Google and allow your profile photo before adding a Pinoxx review" });
    }

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

pinoxxReviewsRouter.get("/", async (_req, res, next) => {
  try {
    if (process.env.USE_MEMORY_DB === "true") {
      return res.json({
        reviews: memoryReviews
          .filter((review) => review.status === "approved")
          .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
          .map(serializeReview)
      });
    }

    const reviews = await PinoxxReview.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ reviews: reviews.map(serializeReview) });
  } catch (error) {
    next(error);
  }
});

pinoxxReviewsRouter.post("/", requireGoogleReviewAuth, async (req, res, next) => {
  try {
    const comment = String(req.body.comment || "").trim();
    const rating = Number(req.body.rating || 5);

    if (!comment) {
      return res.status(400).json({ message: "Review is required" });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (process.env.USE_MEMORY_DB === "true") {
      const existing = memoryReviews.find((review) => review.user === req.user._id || review.email === req.user.email);
      if (existing) {
        return res.status(409).json({ message: "You have already added a Pinoxx review" });
      }

      const review = {
        _id: `pinoxx-review-${Date.now()}`,
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl || "",
        rating,
        comment,
        status: "approved",
        createdAt: new Date().toISOString()
      };
      memoryReviews.unshift(review);
      return res.status(201).json({ review: serializeReview(review) });
    }

    const existing = await PinoxxReview.findOne({ user: req.user._id });
    if (existing) {
      return res.status(409).json({ message: "You have already added a Pinoxx review" });
    }

    const review = await PinoxxReview.create({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
      rating,
      comment
    });

    res.status(201).json({ review: serializeReview(review) });
  } catch (error) {
    next(error);
  }
});

pinoxxReviewsRouter.post("/:id/vote", async (req, res, next) => {
  try {
    const vote = req.body.vote;
    const field = vote === "useful" ? "usefulCount" : vote === "not_useful" ? "notUsefulCount" : "";

    if (!field) {
      return res.status(400).json({ message: "Vote must be useful or not_useful" });
    }

    if (process.env.USE_MEMORY_DB === "true") {
      const review = memoryReviews.find((item) => item._id === req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      review[field] = Number(review[field] || 0) + 1;
      return res.json({ review: serializeReview(review) });
    }

    const review = await PinoxxReview.findByIdAndUpdate(
      req.params.id,
      { $inc: { [field]: 1 } },
      { new: true }
    ).lean();

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ review: serializeReview(review) });
  } catch (error) {
    next(error);
  }
});
