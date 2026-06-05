export function buildUpiLink({ amount = 1000, bookingId, resortName }) {
  const params = new URLSearchParams({
    pa: process.env.UPI_ID || "kudtarkaromkar8@oksbi",
    pn: process.env.UPI_NAME || "Pinoxx",
    am: String(amount),
    cu: "INR",
    tn: `Pinoxx ${resortName} booking ${bookingId}`
  });

  return `upi://pay?${params.toString()}`;
}

export function buildWhatsappUrl(phone, message) {
  const normalized = String(phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildSmsUrl(phone, message) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `sms:+${normalized}?body=${encodeURIComponent(message)}`;
}

export function buildContactRequestMessage(contact) {
  if (contact.contactType === "availability_check") {
    const dateText = [contact.checkIn || contact.preferredDate, contact.checkOut].filter(Boolean).join(" to ");
    return [
      "Availability request",
      `Name: ${contact.name}`,
      `Number: ${contact.phone}`,
      contact.peopleCount ? `Total guests: ${contact.peopleCount}` : "",
      contact.roomCategory ? `Room: ${contact.roomCategory}` : "",
      dateText ? `Date: ${dateText}` : "",
      contact.message ? `Guest pricing: ${contact.message}` : ""
    ].filter(Boolean).join("\n");
  }

  return [
    "Want to contact this customer",
    "Pinoxx contact request",
    `Request type: ${contact.contactType.replaceAll("_", " ")}`,
    contact.resortName ? `Resort: ${contact.resortName}` : "",
    contact.roomCategory ? `Room: ${contact.roomCategory}` : "",
    contact.checkIn ? `Check-in: ${contact.checkIn}` : "",
    contact.checkOut ? `Check-out: ${contact.checkOut}` : "",
    `Name: ${contact.name}`,
    `Phone: ${contact.phone}`,
    contact.email ? `Email: ${contact.email}` : "",
    `People: ${contact.peopleCount}`,
    contact.requestCall ? "Request: Call back requested" : "",
    contact.preferredDate ? `Preferred date: ${contact.preferredDate}` : "",
    contact.preferredTime ? `Preferred time: ${contact.preferredTime}` : "",
    contact.bookingUrl ? `Booking page: ${contact.bookingUrl}` : "",
    `Message: ${contact.message}`
  ].filter(Boolean).join("\n");
}

export function buildBookingMessage({ booking, resort }) {
  const checkIn = new Date(booking.checkIn).toLocaleDateString("en-IN");
  const checkOut = new Date(booking.checkOut).toLocaleDateString("en-IN");

  return [
    "Pinoxx booking request",
    `Resort: ${resort.name}`,
    booking.roomCategory ? `Room category: ${booking.roomCategory}` : "",
    `Name: ${booking.customerName}`,
    `Phone: ${booking.phone}`,
    `Members: ${booking.members}`,
    `Dates: ${checkIn} to ${checkOut}`,
    `Advance: Rs ${booking.advanceAmount}`,
    `Payment status: ${booking.status.replaceAll("_", " ")}`,
    booking.payment?.transactionRef ? `Transaction ref: ${booking.payment.transactionRef}` : "",
    booking.specialRequests ? `Special request: ${booking.specialRequests}` : "",
    `Booking ID: ${booking._id}`
  ].filter(Boolean).join("\n");
}

export function buildCustomerSlip({ booking, resort }) {
  const checkIn = new Date(booking.checkIn).toLocaleDateString("en-IN");
  const checkOut = new Date(booking.checkOut).toLocaleDateString("en-IN");

  return [
    "PINOXX TRUSTED BOOKING SLIP",
    "Thank you for booking with Pinoxx.",
    `Booking ID: ${booking._id}`,
    `Resort: ${resort.name}`,
    booking.roomCategory ? `Room category: ${booking.roomCategory}` : "",
    `Guest: ${booking.customerName}`,
    `Phone: ${booking.phone}`,
    `Members: ${booking.members}`,
    `Dates: ${checkIn} to ${checkOut}`,
    `Advance amount: Rs ${booking.advanceAmount}`,
    `Payment status: ${booking.status.replaceAll("_", " ")}`,
    "Your request is saved with Pinoxx. Final room confirmation is subject to availability verification by our booking team.",
    "Support: +91 9353431179"
  ].filter(Boolean).join("\n");
}
