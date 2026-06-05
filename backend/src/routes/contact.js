import express from "express";
import { Contact } from "../models/Contact.js";
import {
  buildContactRequestMessage,
  buildSmsUrl,
  buildWhatsappUrl
} from "../utils/bookingLinks.js";
import { sendWhatsAppTextToMany } from "../utils/whatsappCloud.js";

export const contactRouter = express.Router();
const defaultCallNowTextNumber = "918147843271";

function adminNotificationNumbers() {
  const configured = process.env.WHATSAPP_ADMIN_NOTIFICATION_NUMBERS || process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179";
  return configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

contactRouter.post("/", async (req, res, next) => {
  try {
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
      message: req.body.message
    });
    const message = buildContactRequestMessage(contact);
    const whatsappUrl = buildWhatsappUrl(process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179", message);
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
