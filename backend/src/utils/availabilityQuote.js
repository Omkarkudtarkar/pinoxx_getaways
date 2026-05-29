import { Availability } from "../models/Availability.js";
import { Booking } from "../models/Booking.js";

export const HOLD_MINUTES = 15;

export function parseStayDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).slice(0, 10);
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStayDate(date) {
  return date.toISOString().slice(0, 10);
}

export function buildStayDates(checkIn, checkOut) {
  const start = parseStayDate(checkIn);
  const end = parseStayDate(checkOut) || new Date(start?.getTime() + 24 * 60 * 60 * 1000);

  if (!start || !end || end <= start) {
    const error = new Error("Valid check-in and check-out dates are required");
    error.status = 400;
    throw error;
  }

  const dates = [];
  const cursor = new Date(start);
  while (cursor < end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export async function getAvailabilityQuote({ resort, resortSlug, roomCategory, checkIn, checkOut }) {
  const stayDates = buildStayDates(checkIn, checkOut);
  const start = stayDates[0];
  const end = new Date(stayDates[stayDates.length - 1]);
  end.setUTCDate(end.getUTCDate() + 1);

  const slots = await Availability.find({
    resortSlug,
    roomCategory,
    date: { $gte: start, $lt: end }
  }).sort({ date: 1 });

  const slotByDate = new Map(slots.map((slot) => [formatStayDate(new Date(slot.date)), slot]));
  const now = new Date();
  const createdAfter = new Date(now.getTime() - HOLD_MINUTES * 60 * 1000);
  const nights = [];

  for (const date of stayDates) {
    const key = formatStayDate(date);
    const slot = slotByDate.get(key);

    if (!slot) {
      nights.push({
        date: key,
        available: false,
        remainingRooms: 0,
        availableRooms: 0,
        heldRooms: 0,
        price: 0,
        status: "missing",
        note: "No availability row found for this date"
      });
      continue;
    }

    const heldRooms = await Booking.countDocuments({
      resort: resort._id,
      roomCategory,
      checkIn: { $lte: date },
      checkOut: { $gt: date },
      $or: [
        { status: "confirmed" },
        {
          status: "payment_initiated",
          $or: [
            { holdExpiresAt: { $gt: now } },
            { holdExpiresAt: { $exists: false }, createdAt: { $gt: createdAfter } }
          ]
        }
      ]
    });

    const remainingRooms = Math.max(0, Number(slot.availableRooms || 0) - heldRooms);
    const available = slot.status !== "sold_out" && remainingRooms > 0;

    nights.push({
      date: key,
      available,
      remainingRooms,
      availableRooms: slot.availableRooms,
      heldRooms,
      price: slot.price || 0,
      status: slot.status,
      note: slot.note || ""
    });
  }

  const available = nights.length > 0 && nights.every((night) => night.available);
  const minRemainingRooms = nights.reduce((minimum, night) => Math.min(minimum, night.remainingRooms), Number.POSITIVE_INFINITY);
  const totalRoomPrice = nights.reduce((sum, night) => sum + Number(night.price || 0), 0);

  return {
    available,
    checkedFromExcel: slots.length > 0,
    roomMatched: slots.length > 0,
    hasRowsForDate: nights.every((night) => night.status !== "missing"),
    remainingRooms: Number.isFinite(minRemainingRooms) ? minRemainingRooms : 0,
    nights,
    totalRoomPrice
  };
}

