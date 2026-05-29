import express from "express";
import { Availability } from "../models/Availability.js";
import { Resort } from "../models/Resort.js";
import { getAvailabilityQuote } from "../utils/availabilityQuote.js";
import { syncResortAvailabilityBySlug } from "../utils/availabilitySync.js";

export const availabilityRouter = express.Router();

availabilityRouter.get("/", async (req, res, next) => {
  try {
    const { resortSlug, date, roomCategory } = req.query;
    const filter = {};
    let syncError = "";

    if (resortSlug) {
      try {
        await syncResortAvailabilityBySlug(resortSlug);
      } catch (error) {
        syncError = error.message;
        console.warn(`Availability sheet sync failed for ${resortSlug}: ${error.message}`);
      }
      filter.resortSlug = resortSlug;
    }
    if (roomCategory) filter.roomCategory = roomCategory;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    const availability = await Availability.find(filter).sort({ date: 1, resortName: 1, roomCategory: 1 }).limit(250);
    res.json({ availability, syncError });
  } catch (error) {
    next(error);
  }
});

availabilityRouter.get("/check", async (req, res, next) => {
  try {
    const { resortSlug, checkIn, checkOut, roomCategory } = req.query;
    if (!resortSlug || !checkIn || !roomCategory) {
      return res.status(400).json({ message: "resortSlug, roomCategory and checkIn are required" });
    }

    let syncError = "";
    try {
      await syncResortAvailabilityBySlug(resortSlug);
    } catch (error) {
      syncError = error.message;
      console.warn(`Availability sheet sync failed for ${resortSlug}: ${error.message}`);
    }

    const resort = await Resort.findOne({ slug: resortSlug, isActive: true });
    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    const quote = await getAvailabilityQuote({
      resort,
      resortSlug,
      roomCategory,
      checkIn,
      checkOut
    });

    res.json({
      ...quote,
      availability: quote.nights,
      syncError
    });
  } catch (error) {
    next(error);
  }
});
