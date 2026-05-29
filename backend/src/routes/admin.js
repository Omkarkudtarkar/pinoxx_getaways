import express from "express";
import multer from "multer";
import { Availability } from "../models/Availability.js";
import { Booking } from "../models/Booking.js";
import { Contact } from "../models/Contact.js";
import { Resort } from "../models/Resort.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { fileToImage, uploadImages } from "../middleware/upload.js";
import { parseAvailabilityUpload } from "../utils/availabilityImport.js";
import { syncResortAvailability } from "../utils/availabilitySync.js";
import { resortPayload } from "./resorts.js";

export const adminRouter = express.Router();
const uploadSheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/summary", async (_req, res, next) => {
  try {
    const [resorts, bookings, users, pendingReviews, contacts, availabilityRows] = await Promise.all([
      Resort.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      User.countDocuments(),
      Review.countDocuments({ status: "pending" }),
      Contact.countDocuments({ status: "new" }),
      Availability.countDocuments()
    ]);

    res.json({ resorts, bookings, users, pendingReviews, contacts, availabilityRows });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/bookings", async (_req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("resort", "name slug")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/bookings/:id", async (req, res, next) => {
  try {
    const allowed = ["pending_payment", "payment_initiated", "confirmed", "cancelled"];
    const update = {};

    if (allowed.includes(req.body.status)) update.status = req.body.status;
    if (req.body.transactionRef) update["payment.transactionRef"] = req.body.transactionRef;
    if (req.body.status === "confirmed") update["payment.paidAt"] = new Date();

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("resort", "name slug");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/availability", async (_req, res, next) => {
  try {
    const availability = await Availability.find()
      .sort({ date: 1, resortName: 1, roomCategory: 1 })
      .limit(500);
    res.json({ availability });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/availability/import", uploadSheet.single("sheet"), async (req, res, next) => {
  try {
    const sheetUrl = req.body.sheetUrl?.trim();
    const resort = req.body.resortId ? await Resort.findById(req.body.resortId) : null;

    if (req.body.resortId && !resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    if (!req.file && !sheetUrl) {
      return res.status(400).json({ message: "Upload an Excel/CSV file or provide a sheet URL" });
    }

    const rows = await parseAvailabilityUpload({
      file: req.file,
      sheetUrl,
      defaultResort: resort ? { name: resort.name, slug: resort.slug } : undefined
    });

    if (resort) {
      await Availability.deleteMany({ resortSlug: resort.slug });
      if (sheetUrl) {
        resort.availabilitySheetUrl = sheetUrl;
        await resort.save();
      }
    } else {
      await Availability.deleteMany({});
    }
    if (rows.length > 0) {
      await Availability.insertMany(rows, { ordered: false });
    }

    res.status(201).json({
      imported: rows.length,
      availability: await Availability.find().sort({ date: 1, resortName: 1, roomCategory: 1 }).limit(500)
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(100);
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/reviews", async (_req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("resort", "name slug")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/reviews/:id", async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/resorts", uploadImages.array("images", 80), async (req, res, next) => {
  try {
    const resort = await Resort.create(resortPayload(req.body, req.files));
    let availabilityImport = null;
    let availabilityError = null;

    if (resort.availabilitySheetUrl) {
      try {
        availabilityImport = await syncResortAvailability(resort, { force: true });
      } catch (error) {
        availabilityError = error.message;
      }
    }

    res.status(201).json({ resort, availabilityImport, availabilityError });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/resorts/:id", uploadImages.array("images", 80), async (req, res, next) => {
  try {
    const payload = resortPayload(req.body, req.files);
    const resort = await Resort.findByIdAndUpdate(req.params.id, payload, { new: true });

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    let availabilityImport = null;
    let availabilityError = null;
    if (resort.availabilitySheetUrl) {
      try {
        availabilityImport = await syncResortAvailability(resort, { force: true });
      } catch (error) {
        availabilityError = error.message;
      }
    }

    res.json({ resort, availabilityImport, availabilityError });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/resorts/:id/availability/sync", async (req, res, next) => {
  try {
    const resort = await Resort.findById(req.params.id);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    if (req.body.sheetUrl) {
      resort.availabilitySheetUrl = req.body.sheetUrl.trim();
      await resort.save();
    }

    const sync = await syncResortAvailability(resort, { force: true });
    const availability = await Availability.find({ resortSlug: resort.slug })
      .sort({ date: 1, resortName: 1, roomCategory: 1 })
      .limit(500);

    res.json({ sync, availability });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/resorts/:id/images", uploadImages.array("images", 80), async (req, res, next) => {
  try {
    const images = (req.files || []).map(fileToImage);
    const resort = await Resort.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: images } } },
      { new: true }
    );

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    res.json({ resort });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/resorts/:id", async (req, res, next) => {
  try {
    const resort = await Resort.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    res.json({ resort });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/contacts", async (_req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
    res.json({ contacts });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/contacts/:id", async (req, res, next) => {
  try {
    const allowed = ["new", "contacted", "closed"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid contact status" });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact request not found" });
    }

    res.json({ contact });
  } catch (error) {
    next(error);
  }
});
