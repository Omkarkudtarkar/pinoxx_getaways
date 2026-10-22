import { ActivityPricing } from "../models/ActivityPricing.js";

export const activityOptions = [
  { id: "adventureCombo", label: "Adventure Combo", description: "Kayaking, River Zorbing, and River Boating" },
  { id: "riverRafting", label: "River Rafting", description: "River Rafting" },
  { id: "riverZipline", label: "River Zipline", description: "River Zipline Adventure" }
];

export const defaultActivityPrices = {
  adventureCombo: 0,
  riverRafting: 0,
  riverZipline: 0
};

export function validateActivityIds(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    const error = new Error("Selected activities must be a list");
    error.status = 400;
    throw error;
  }

  const allowed = new Set(activityOptions.map((activity) => activity.id));
  const ids = value.map((id) => String(id));
  if (ids.some((id) => !allowed.has(id)) || new Set(ids).size !== ids.length) {
    const error = new Error("One or more selected activities are invalid");
    error.status = 400;
    throw error;
  }
  return ids;
}

export async function getSavedActivityPrices() {
  const pricing = await ActivityPricing.findOneAndUpdate(
    { _id: "default" },
    { $setOnInsert: defaultActivityPrices },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return Object.fromEntries(
    Object.keys(defaultActivityPrices).map((id) => [id, Number(pricing[id] || 0)])
  );
}
