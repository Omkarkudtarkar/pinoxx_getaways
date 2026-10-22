import { activityOptions, validateActivityIds } from "./activityPricing.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STANDARD_ADVANCE_RATE = 0.2;
const COUPLE_ADVANCE_RATE = 0.4;

function bookingAmountError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function parseBookingDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).slice(0, 10);
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function positiveCount(value, fallback = 0) {
  const count = Number(value ?? fallback);
  return Number.isFinite(count) ? Math.max(0, count) : fallback;
}

export function calculateBookingAmounts({
  resort,
  roomCategory,
  checkIn,
  checkOut,
  adults,
  children5To11,
  childrenUnder5,
  activityIds = [],
  activityPrices = {}
}) {
  const room = resort.rooms?.find((item) => item.name === roomCategory);

  if (!room) {
    throw bookingAmountError("Selected room category is not available");
  }

  const start = parseBookingDate(checkIn);
  const end = parseBookingDate(checkOut);

  if (!start || !end || end <= start) {
    throw bookingAmountError("Valid check-in and check-out dates are required");
  }

  const adultCount = positiveCount(adults);
  const child5To11Count = positiveCount(children5To11);
  const childUnder5Count = positiveCount(childrenUnder5);

  if (adultCount < 1) {
    throw bookingAmountError("At least one adult is required");
  }

  const nights = Math.max(1, Math.round((end - start) / DAY_IN_MS));
  const chargeableGuests = adultCount + child5To11Count * 0.5;
  const roomAmount = Math.round(Number(room.price || 0) * chargeableGuests * nights);
  const selectedActivityIds = validateActivityIds(activityIds);
  const selectedActivities = selectedActivityIds.map((id) => {
    const activity = activityOptions.find((item) => item.id === id);
    return { id, label: activity.label, price: Number(activityPrices[id] || 0) };
  });
  const activityCharges = selectedActivities.reduce((total, activity) => total + activity.price, 0);
  const totalAmount = roomAmount + activityCharges;
  const totalGuests = adultCount + child5To11Count + childUnder5Count;
  const advanceRate = totalGuests === 2 ? COUPLE_ADVANCE_RATE : STANDARD_ADVANCE_RATE;
  const advanceAmount = Math.ceil(totalAmount * advanceRate);

  return {
    room,
    nights,
    chargeableGuests,
    roomAmount,
    totalGuests,
    selectedActivities,
    activityCharges,
    totalAmount,
    advanceRate,
    advanceAmount
  };
}
