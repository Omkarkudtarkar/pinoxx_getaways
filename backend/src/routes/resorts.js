import express from "express";
import slugify from "slugify";
import { Resort } from "../models/Resort.js";
import { Review } from "../models/Review.js";
import { requireAuth } from "../middleware/auth.js";
import { fileToImage, uploadImages } from "../middleware/upload.js";

export const resortsRouter = express.Router();

resortsRouter.get("/", async (req, res, next) => {
  try {
    const { minPrice, maxPrice, rating, location, q } = req.query;
    const filter = { isActive: true };

    if (minPrice || maxPrice) {
      filter.startingPrice = {};
      if (minPrice) filter.startingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.startingPrice.$lte = Number(maxPrice);
    }

    if (rating) filter.rating = { $gte: Number(rating) };
    if (location) filter.location = new RegExp(location, "i");
    if (q) filter.$text = { $search: q };

    const resorts = await Resort.find(filter).sort({ rating: -1, startingPrice: 1 });
    res.json({ resorts });
  } catch (error) {
    next(error);
  }
});

resortsRouter.get("/:slug", async (req, res, next) => {
  try {
    const resort = await Resort.findOne({ slug: req.params.slug, isActive: true }).lean();

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    const reviews = await Review.find({ resort: resort._id, status: "approved" })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ resort, reviews });
  } catch (error) {
    next(error);
  }
});

resortsRouter.post(
  "/:id/reviews",
  requireAuth,
  uploadImages.array("images", 6),
  async (req, res, next) => {
    try {
      const resort = await Resort.findById(req.params.id);
      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      const review = await Review.create({
        resort: resort._id,
        user: req.user._id,
        rating: Number(req.body.rating),
        comment: req.body.comment,
        images: (req.files || []).map(fileToImage)
      });

      res.status(201).json({
        message: "Review submitted for moderation",
        review
      });
    } catch (error) {
      next(error);
    }
  }
);

export function resortPayload(body, files = []) {
  const name = body.name?.trim();
  const uploadedFiles = files || [];
  const resortImageCount = Number(body.resortImageCount ?? uploadedFiles.length);
  const roomImageCounts = parseJsonArray(body.roomImageCounts).map((count) => Number(count || 0));
  const resortFiles = uploadedFiles.slice(0, resortImageCount);
  let roomFileOffset = resortImageCount;

  return {
    name,
    slug: body.slug || slugify(name || "", { lower: true, strict: true }),
    location: body.location,
    shortDescription: body.shortDescription,
    description: body.description,
    startingPrice: Number(body.startingPrice),
    rating: Number(body.rating || 4.5),
    distanceFromBusStandKm: Number(body.distanceFromBusStandKm),
    amenities: parseList(body.amenities),
    activities: parseList(body.activities),
    images: [
      ...parseJsonArray(body.images),
      ...resortFiles.map(fileToImage)
    ],
    rooms: parseJsonArray(body.rooms).map((room, index) => {
      const nextOffset = roomFileOffset + (roomImageCounts[index] || 0);
      const roomFiles = uploadedFiles.slice(roomFileOffset, nextOffset);
      roomFileOffset = nextOffset;

      return {
        ...room,
        images: [
          ...(Array.isArray(room.images) ? room.images : []),
          ...roomFiles.map(fileToImage)
        ]
      };
    }),
    availabilitySheetUrl: body.availabilitySheetUrl?.trim() || "",
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
    isActive: body.isActive !== "false"
  };
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
