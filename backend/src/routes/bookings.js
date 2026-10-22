import express from "express";
import { Booking } from "../models/Booking.js";
import { Resort } from "../models/Resort.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { calculateBookingAmounts } from "../utils/bookingAmounts.js";
import { getSavedActivityPrices } from "../utils/activityPricing.js";
import { HOLD_MINUTES } from "../utils/availabilityQuote.js";
import {
  buildBookingMessage,
  buildCustomerSlip,
  buildUpiLink,
  buildWhatsappUrl
} from "../utils/bookingLinks.js";

export const bookingsRouter = express.Router();

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const {
      resortId,
      customerName,
      phone,
      members,
      roomCategory,
      checkIn,
      checkOut,
      activityIds,
      specialRequests
    } = req.body;
    const resort = await Resort.findById(resortId);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    if (!roomCategory || !checkIn || !checkOut) {
      return res.status(400).json({ message: "Room category, check-in and check-out are required" });
    }

    const amounts = calculateBookingAmounts({
      resort,
      roomCategory,
      checkIn,
      checkOut,
      adults: req.body.adults,
      children5To11: req.body.children5To11,
      childrenUnder5: req.body.childrenUnder5,
      activityIds,
      activityPrices: await getSavedActivityPrices()
    });

    const booking = new Booking({
      resort: resort._id,
      customerName,
      phone,
      members: Number(members),
      roomCategory,
      checkIn,
      checkOut,
      adults: Number(req.body.adults),
      children5To11: Number(req.body.children5To11 || 0),
      childrenUnder5: Number(req.body.childrenUnder5 || 0),
      nights: amounts.nights,
      specialRequests,
      roomAmount: amounts.roomAmount,
      selectedActivities: amounts.selectedActivities,
      activityCharges: amounts.activityCharges,
      totalAmount: amounts.totalAmount,
      advanceRate: amounts.advanceRate,
      advanceAmount: amounts.advanceAmount,
      holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
      status: "payment_initiated"
    });

    booking.payment.upiLink = buildUpiLink({
      amount: booking.advanceAmount,
      bookingId: booking._id,
      resortName: resort.name
    });

    const message = buildBookingMessage({ booking, resort });
    const customerSlip = buildCustomerSlip({ booking, resort });
    booking.whatsapp.message = message;
    booking.whatsapp.customerSlip = customerSlip;
    booking.whatsapp.businessUrl = buildWhatsappUrl(
      process.env.BUSINESS_WHATSAPP_NUMBER || "919353431173",
      message
    );
    booking.whatsapp.customerUrl = buildWhatsappUrl(
      phone,
      customerSlip
    );

    await booking.save();

    res.status(201).json({
      booking,
      upiLink: booking.payment.upiLink,
      holdMinutes: HOLD_MINUTES,
      businessWhatsappUrl: booking.whatsapp.businessUrl,
      customerWhatsappUrl: booking.whatsapp.customerUrl
    });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/confirm", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status: "confirmed",
        "payment.transactionRef": req.body.transactionRef,
        "payment.paidAt": new Date()
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
});
