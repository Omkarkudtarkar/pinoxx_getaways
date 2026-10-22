import express from "express";
import { getSavedActivityPrices } from "../utils/activityPricing.js";

export const activityPricingRouter = express.Router();

activityPricingRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ prices: await getSavedActivityPrices() });
  } catch (error) {
    next(error);
  }
});
