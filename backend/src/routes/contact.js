import express from "express";
import { Contact } from "../models/Contact.js";
import { Resort } from "../models/Resort.js";
import { calculateBookingAmounts } from "../utils/bookingAmounts.js";
import { getSavedActivityPrices } from "../utils/activityPricing.js";
import {
  buildContactRequestMessage,
  buildSmsUrl,
  buildWhatsappUrl
} from "../utils/bookingLinks.js";
import { sendWhatsAppTextToMany } from "../utils/whatsappCloud.js";

export const contactRouter = express.Router();
const defaultCallNowTextNumber = "918147843271";

function adminNotificationNumbers() {
  const configured = process.env.WHATSAPP_ADMIN_NOTIFICATION_NUMBERS || process.env.BUSINESS_WHATSAPP_NUMBER || "919353431173";
  return configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

contactRouter.post("/", async (req, res, next) => {
  try {
    let messageText = req.body.message;
    if (
      req.body.contactType === "availability_check" &&
      req.body.resortSlug &&
      req.body.roomCategory &&
      req.body.checkIn &&
      req.body.checkOut
    ) {
      const resort = await Resort.findOne({ slug: req.body.resortSlug, isActive: true });
      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }
      const amounts = calculateBookingAmounts({
        resort,
        roomCategory: req.body.roomCategory,
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut,
        adults: req.body.adults,
        children5To11: req.body.children5To11,
        childrenUnder5: req.body.childrenUnder5,
        activityIds: req.body.activityIds,
        activityPrices: await getSavedActivityPrices()
      });
      const formatRupees = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;
      messageText = [
        `Stay: ${amounts.nights} ${amounts.nights === 1 ? "night" : "nights"}`,
        `Adults: ${Number(req.body.adults || 0)}`,
        `Children 5-11: ${Number(req.body.children5To11 || 0)}`,
        `Children under 5: ${Number(req.body.childrenUnder5 || 0)} (free)`,
        `Room charges: ${formatRupees(amounts.roomAmount)}`,
        ...amounts.selectedActivities.map((activity) => `${activity.label}: ${formatRupees(activity.price)}`),
        `Selected activities: ${amounts.selectedActivities.map((activity) => activity.label).join(", ") || "None"}`,
        `Total activity charges: ${formatRupees(amounts.activityCharges)}`,
        `Final booking total: ${formatRupees(amounts.totalAmount)}`,
        `UPI advance (${Math.round(amounts.advanceRate * 100)}%): ${formatRupees(amounts.advanceAmount)}`,
        req.body.message?.trim() ? `Special request: ${req.body.message.trim()}` : ""
      ].filter(Boolean).join("\n");
    }

    const contact = await Contact.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      peopleCount: Number(req.body.peopleCount || 1),
      requestCall: req.body.requestCall === true || req.body.requestCall === "true",
      contactType: req.body.contactType || "message",
      resortName: req.body.resortName || "",
      resortSlug: req.body.resortSlug || "",
      roomCategory: req.body.roomCategory || "",
      checkIn: req.body.checkIn || "",
      checkOut: req.body.checkOut || "",
      bookingUrl: req.body.bookingUrl || "",
      preferredDate: req.body.preferredDate || "",
      preferredTime: req.body.preferredTime || "",
      message: messageText
    });
    const message = buildContactRequestMessage(contact);
    const whatsappUrl = buildWhatsappUrl(process.env.BUSINESS_WHATSAPP_NUMBER || "919353431173", message);
    const textMessageUrl = contact.contactType === "call_now"
      ? buildSmsUrl(process.env.CALL_NOW_TEXT_NUMBER || defaultCallNowTextNumber, message)
      : "";
    const directWhatsapp = await sendWhatsAppTextToMany({
      recipients: adminNotificationNumbers(),
      message
    });

    res.status(201).json({
      contact,
      whatsappUrl,
      textMessageUrl,
      directWhatsapp,
      notificationUrl: textMessageUrl || whatsappUrl
    });
  } catch (error) {
    next(error);
  }
});
