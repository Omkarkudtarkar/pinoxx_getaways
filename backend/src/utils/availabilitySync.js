import { Availability } from "../models/Availability.js";
import { Resort } from "../models/Resort.js";
import { parseAvailabilitySource } from "./availabilityImport.js";

const SYNC_TTL_MS = 5 * 60 * 1000;

export async function syncResortAvailability(resort, { force = false } = {}) {
  if (!resort?.availabilitySheetUrl) {
    return { imported: 0, skipped: true };
  }

  const lastSyncedAt = resort.availabilityLastSyncedAt
    ? new Date(resort.availabilityLastSyncedAt).getTime()
    : 0;

  if (!force && lastSyncedAt && Date.now() - lastSyncedAt < SYNC_TTL_MS) {
    return { imported: 0, skipped: true };
  }

  const rows = await parseAvailabilitySource({
    sheetUrl: resort.availabilitySheetUrl,
    defaultResort: {
      name: resort.name,
      slug: resort.slug
    }
  });

  await Availability.deleteMany({ resortSlug: resort.slug });
  if (rows.length > 0) {
    await Availability.insertMany(rows, { ordered: false });
  }

  await Resort.findByIdAndUpdate(resort._id, { availabilityLastSyncedAt: new Date() });

  return { imported: rows.length, skipped: false };
}

export async function syncResortAvailabilityBySlug(resortSlug, options) {
  if (!resortSlug) {
    return { imported: 0, skipped: true };
  }

  const resort = await Resort.findOne({ slug: resortSlug, isActive: true });
  return syncResortAvailability(resort, options);
}
