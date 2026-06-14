const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ADVANCE_RATE = 0.2;

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

export function calculateBookingAmounts({ resort, roomCategory, checkIn, checkOut, adults, children5To11 }) {
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

  if (adultCount < 1) {
    throw bookingAmountError("At least one adult is required");
  }

  const nights = Math.max(1, Math.round((end - start) / DAY_IN_MS));
  const chargeableGuests = adultCount + child5To11Count * 0.5;
  const totalAmount = Math.round(Number(room.price || 0) * chargeableGuests * nights);
  const advanceAmount = Math.ceil(totalAmount * ADVANCE_RATE);

  return {
    room,
    nights,
    chargeableGuests,
    totalAmount,
    advanceAmount
  };
}
