import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import slugify from "slugify";
import { parseAvailabilityUpload } from "../utils/availabilityImport.js";
import {
  buildBookingMessage,
  buildContactRequestMessage,
  buildCustomerSlip,
  buildSmsUrl,
  buildUpiLink,
  buildWhatsappUrl
} from "../utils/bookingLinks.js";
import { fileToImage, uploadImages } from "../middleware/upload.js";
import { sendWhatsAppText } from "../utils/whatsappCloud.js";
import { verifyGoogleCredential } from "../utils/googleAuth.js";

const uploadSheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
const defaultCallNowTextNumber = "918147843271";
const memoryHoldMinutes = 15;

const resortImages = {
  river: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  pool: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
  cottage: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
  room: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80",
  dining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80"
};

const store = createStore();

export function createMemoryRouter() {
  const router = express.Router();

  router.post("/api/auth/signup", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (store.users.some((user) => user.email === normalizedEmail)) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = {
      _id: makeId("user"),
      name,
      email: normalizedEmail,
      phone,
      password: await bcrypt.hash(password, 8),
      role: "user",
      createdAt: new Date().toISOString()
    };
    store.users.push(user);

    res.status(201).json({ token: signMemoryToken(user), user: serializeUser(user) });
  });

  router.post("/api/auth/login", async (req, res) => {
    const email = req.body.email?.toLowerCase().trim();
    const user = store.users.find((item) => item.email === email);

    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: signMemoryToken(user), user: serializeUser(user) });
  });

  router.post("/api/auth/google", async (req, res, next) => {
    try {
      const profile = await verifyGoogleCredential(req.body.credential);
      let user = store.users.find((item) => item.email === profile.email);

      if (user) {
        user.name = user.name || profile.name;
        user.googleId = user.googleId || profile.googleId;
        user.avatarUrl = profile.avatarUrl;
        user.authProvider = "google";
      } else {
        user = {
          _id: makeId("user"),
          name: profile.name,
          email: profile.email,
          phone: "",
          password: "",
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          authProvider: "google",
          role: "user",
          createdAt: new Date().toISOString()
        };
        store.users.push(user);
      }

      res.json({ token: signMemoryToken(user), user: serializeUser(user) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/auth/me", requireMemoryAuth, (req, res) => {
    res.json({ user: serializeUser(req.user) });
  });

  router.get("/api/resorts", (req, res) => {
    const { minPrice, maxPrice, rating, location, resortType, q } = req.query;
    let resorts = store.resorts.filter((resort) => resort.isActive !== false);

    if (minPrice) resorts = resorts.filter((resort) => resort.startingPrice >= Number(minPrice));
    if (maxPrice) resorts = resorts.filter((resort) => resort.startingPrice <= Number(maxPrice));
    if (rating) resorts = resorts.filter((resort) => resort.rating >= Number(rating));
    if (location) resorts = resorts.filter((resort) => resort.location.toLowerCase().includes(String(location).toLowerCase()));
    if (resortType) resorts = resorts.filter((resort) => resort.resortType === resortType);
    if (q) {
      const query = String(q).toLowerCase();
      resorts = resorts.filter((resort) => [
        resort.name,
        resort.location,
        resort.shortDescription,
        resort.description
      ].some((field) => field?.toLowerCase().includes(query)));
    }

    resorts.sort((a, b) => b.rating - a.rating || a.startingPrice - b.startingPrice);
    res.json({ resorts });
  });

  router.get("/api/resorts/:slug", (req, res) => {
    const resort = store.resorts.find((item) => item.slug === req.params.slug && item.isActive !== false);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    const reviews = store.reviews
      .filter((review) => review.resort === resort._id && review.status === "approved")
      .map(populateReview)
      .sort(sortNewest);

    res.json({ resort, reviews });
  });

  router.post("/api/resorts/:id/reviews", requireMemoryAuth, uploadImages.array("images", 6), (req, res) => {
    const resort = store.resorts.find((item) => item._id === req.params.id);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    const review = {
      _id: makeId("review"),
      resort: resort._id,
      user: req.user._id,
      rating: Number(req.body.rating),
      comment: req.body.comment,
      images: (req.files || []).map(fileToImage),
      status: "pending",
      createdAt: new Date().toISOString()
    };
    store.reviews.push(review);

    res.status(201).json({ message: "Review submitted for moderation", review });
  });

  router.get("/api/availability", async (req, res) => {
    const { resortSlug, date, roomCategory } = req.query;
    let availability = [...store.availability];
    let syncError = "";

    if (resortSlug) {
      try {
        await syncMemoryResortAvailability(resortSlug);
      } catch (error) {
        syncError = error.message;
        console.warn(`Availability sheet sync failed for ${resortSlug}: ${error.message}`);
      }
      availability = [...store.availability].filter((slot) => slot.resortSlug === resortSlug);
    }
    if (roomCategory) availability = availability.filter((slot) => slot.roomCategory === roomCategory);
    if (date) availability = availability.filter((slot) => sameDay(slot.date, date));

    availability.sort(sortAvailability);
    res.json({ availability: availability.slice(0, 250), syncError });
  });

  router.get("/api/availability/check", async (req, res) => {
    const { resortSlug, checkIn, checkOut, roomCategory } = req.query;

    if (!resortSlug || !checkIn || !roomCategory) {
      return res.status(400).json({ message: "resortSlug, roomCategory and checkIn are required" });
    }

    let syncError = "";
    try {
      await syncMemoryResortAvailability(resortSlug);
    } catch (error) {
      syncError = error.message;
      console.warn(`Availability sheet sync failed for ${resortSlug}: ${error.message}`);
    }

    const resort = store.resorts.find((item) => item.slug === resortSlug && item.isActive !== false);
    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    const quote = getMemoryAvailabilityQuote({ resort, resortSlug, roomCategory, checkIn, checkOut });

    res.json({
      ...quote,
      availability: quote.nights,
      syncError
    });
  });

  router.post("/api/bookings", async (req, res) => {
    const resort = store.resorts.find((item) => item._id === req.body.resortId);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    if (!req.body.roomCategory || !req.body.checkIn || !req.body.checkOut) {
      return res.status(400).json({ message: "Room category, check-in and check-out are required" });
    }

    const booking = {
      _id: makeId("booking"),
      resort: resort._id,
      customerName: req.body.customerName,
      phone: req.body.phone,
      members: Number(req.body.members),
      roomCategory: req.body.roomCategory || "",
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      specialRequests: req.body.specialRequests || "",
      advanceAmount: Number(process.env.ADVANCE_AMOUNT || 1000),
      holdExpiresAt: new Date(Date.now() + memoryHoldMinutes * 60 * 1000).toISOString(),
      commissionPerGuest: 100,
      estimatedCommission: Number(req.body.members) * 100,
      status: "payment_initiated",
      payment: { provider: "upi" },
      whatsapp: {},
      createdAt: new Date().toISOString()
    };
    booking.payment.upiLink = buildUpiLink({
      amount: booking.advanceAmount,
      bookingId: booking._id,
      resortName: resort.name
    });
    booking.whatsapp.message = buildBookingMessage({ booking, resort });
    booking.whatsapp.customerSlip = buildCustomerSlip({ booking, resort });
    booking.whatsapp.businessUrl = buildWhatsappUrl(
      process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179",
      booking.whatsapp.message
    );
    booking.whatsapp.customerUrl = buildWhatsappUrl(booking.phone, booking.whatsapp.customerSlip);
    store.bookings.push(booking);

    res.status(201).json({
      booking,
      upiLink: booking.payment.upiLink,
      holdMinutes: memoryHoldMinutes,
      businessWhatsappUrl: booking.whatsapp.businessUrl,
      customerWhatsappUrl: booking.whatsapp.customerUrl
    });
  });

  router.post("/api/contact", async (req, res) => {
    const contact = {
      _id: makeId("contact"),
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || "",
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
      message: req.body.message,
      status: "new",
      createdAt: new Date().toISOString()
    };
    store.contacts.push(contact);

    const message = buildContactRequestMessage(contact);
    const whatsappUrl = buildWhatsappUrl(process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179", message);
    const textMessageUrl = contact.contactType === "call_now"
      ? buildSmsUrl(process.env.CALL_NOW_TEXT_NUMBER || defaultCallNowTextNumber, message)
      : "";

    const directWhatsapp = await sendWhatsAppText({
      to: process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179",
      message
    });

    res.status(201).json({
      contact,
      whatsappUrl,
      textMessageUrl,
      directWhatsapp,
      notificationUrl: textMessageUrl || whatsappUrl
    });
  });

  router.post("/api/chatbot", async (req, res) => {
    if (!req.body.message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const answer = answerFromMemory(req.body.message);
    res.json({ answer, source: "memory" });
  });

  router.use("/api/admin", requireMemoryAuth, requireMemoryAdmin);

  router.get("/api/admin/summary", (_req, res) => {
    res.json({
      resorts: store.resorts.filter((resort) => resort.isActive !== false).length,
      bookings: store.bookings.length,
      users: store.users.length,
      pendingReviews: store.reviews.filter((review) => review.status === "pending").length,
      contacts: store.contacts.filter((contact) => contact.status === "new").length,
      availabilityRows: store.availability.length
    });
  });

  router.get("/api/admin/bookings", (_req, res) => {
    res.json({ bookings: store.bookings.map(populateBooking).sort(sortNewest).slice(0, 100) });
  });

  router.patch("/api/admin/bookings/:id", (req, res) => {
    const booking = store.bookings.find((item) => item._id === req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const allowed = ["pending_payment", "payment_initiated", "confirmed", "cancelled"];
    if (allowed.includes(req.body.status)) booking.status = req.body.status;
    if (req.body.transactionRef) booking.payment.transactionRef = req.body.transactionRef;
    if (req.body.status === "confirmed") booking.payment.paidAt = new Date().toISOString();

    res.json({ booking: populateBooking(booking) });
  });

  router.get("/api/admin/availability", (_req, res) => {
    res.json({ availability: [...store.availability].sort(sortAvailability).slice(0, 500) });
  });

  router.post("/api/admin/availability/import", uploadSheet.single("sheet"), async (req, res, next) => {
    try {
      const sheetUrl = req.body.sheetUrl?.trim();

      if (!req.file && !sheetUrl) {
        return res.status(400).json({ message: "Upload an Excel/CSV file or provide a sheet URL" });
      }

      const resort = req.body.resortId ? store.resorts.find((item) => item._id === req.body.resortId) : null;

      if (req.body.resortId && !resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      const rows = await parseAvailabilityUpload({
        file: req.file,
        sheetUrl,
        defaultResort: resort ? { name: resort.name, slug: resort.slug } : undefined
      });

      if (resort) {
        store.availability = store.availability.filter((slot) => slot.resortSlug !== resort.slug);
        if (sheetUrl) resort.availabilitySheetUrl = sheetUrl;
      } else {
        store.availability = [];
      }
      store.availability.push(...rows.map((row) => ({ ...row, _id: makeId("availability") })));

      res.status(201).json({
        imported: rows.length,
        availability: [...store.availability].sort(sortAvailability).slice(0, 500)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/admin/resorts", uploadImages.array("images", 80), async (req, res, next) => {
    try {
      const resort = {
        _id: makeId("resort"),
        ...memoryResortPayload(req.body, req.files),
        createdAt: new Date().toISOString()
      };
      store.resorts.push(resort);

      let availabilityImport = null;
      let availabilityError = null;
      if (resort.availabilitySheetUrl) {
        try {
          availabilityImport = await syncMemoryResortAvailability(resort.slug, { force: true });
        } catch (error) {
          availabilityError = error.message;
        }
      }

      res.status(201).json({ resort, availabilityImport, availabilityError });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/api/admin/resorts/:id", uploadImages.array("images", 80), (req, res) => {
    const resort = store.resorts.find((item) => item._id === req.params.id);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    Object.assign(resort, memoryResortPayload(req.body, req.files));
    res.json({ resort });
  });

  router.delete("/api/admin/resorts/:id", (req, res) => {
    const resort = store.resorts.find((item) => item._id === req.params.id);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    resort.isActive = false;
    res.json({ resort });
  });

  router.post("/api/admin/resorts/:id/availability/sync", async (req, res, next) => {
    try {
      const resort = store.resorts.find((item) => item._id === req.params.id);

      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      if (req.body.sheetUrl) {
        resort.availabilitySheetUrl = req.body.sheetUrl.trim();
      }

      const sync = await syncMemoryResortAvailability(resort.slug, { force: true });
      const availability = store.availability
        .filter((slot) => slot.resortSlug === resort.slug)
        .sort(sortAvailability)
        .slice(0, 500);

      res.json({ sync, availability });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/admin/users", (_req, res) => {
    res.json({ users: store.users.map(serializeUser).sort(sortNewest).slice(0, 100) });
  });

  router.get("/api/admin/reviews", (_req, res) => {
    res.json({ reviews: store.reviews.map(populateReview).sort(sortNewest).slice(0, 100) });
  });

  router.patch("/api/admin/reviews/:id", (req, res) => {
    const review = store.reviews.find((item) => item._id === req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = req.body.status;
    res.json({ review: populateReview(review) });
  });

  router.post("/api/admin/resorts/:id/images", uploadImages.array("images", 80), (req, res) => {
    const resort = store.resorts.find((item) => item._id === req.params.id);

    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    resort.images.push(...(req.files || []).map(fileToImage));
    res.json({ resort });
  });

  router.get("/api/admin/contacts", (_req, res) => {
    res.json({ contacts: [...store.contacts].sort(sortNewest).slice(0, 100) });
  });

  router.patch("/api/admin/contacts/:id", (req, res) => {
    const contact = store.contacts.find((item) => item._id === req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Contact request not found" });
    }

    const allowed = ["new", "contacted", "closed"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid contact status" });
    }

    contact.status = req.body.status;
    res.json({ contact });
  });

  return router;
}

function createStore() {
  const now = new Date().toISOString();
  const adminPassword = bcrypt.hashSync("Admin@12345", 8);
  const guestPassword = bcrypt.hashSync("Guest@12345", 8);

  const resorts = [
    {
      _id: "sample-kali",
      name: "Kali River Edge Resort",
      slug: "kali-river-edge-resort",
      location: "Kogilban, Dandeli",
      shortDescription: "Riverside stay with rafting access, meals, bonfire space, and family rooms.",
      description:
        "A calm river-facing resort for families, student groups, and corporate weekend plans. Pinoxx coordinates availability, best-price guidance, activity slots, sightseeing support, food preferences, and local guidance from inquiry to check-out.",
      resortType: "premium",
      startingPrice: 1799,
      sharingPrice: 1799,
      couplePrice: 3499,
      rating: 4.8,
      distanceFromBusStandKm: 3.2,
      distanceToWaterActivitiesKm: 1.4,
      amenities: ["River view", "Meals", "Parking", "Bonfire", "Swimming pool", "Power backup", "Guide support"],
      activities: ["River rafting", "Kayaking", "Zipline", "Jungle safari", "Campfire"],
      images: [
        { url: resortImages.river, alt: "Kali river side resort view" },
        { url: resortImages.pool, alt: "Resort swimming pool" },
        { url: resortImages.room, alt: "Premium room" }
      ],
      rooms: [
        {
          name: "River View Cottage",
          price: 2499,
          capacity: 3,
          description: "Private cottage with river-facing sit-out and attached washroom.",
          images: [{ url: resortImages.cottage, alt: "River view cottage" }]
        },
        {
          name: "Family Deluxe Room",
          price: 1999,
          capacity: 4,
          description: "Comfortable AC room suited for families and mixed groups.",
          images: [{ url: resortImages.room, alt: "Family deluxe room" }]
        }
      ],
      seoTitle: "Kali River Edge Resort Booking in Dandeli | Pinoxx",
      seoDescription: "Plan Kali River Edge Resort in Dandeli with rafting support, best-price help, meals, sightseeing, and Pinoxx trip guidance.",
      isActive: true,
      createdAt: now
    },
    {
      _id: "sample-hornbill",
      name: "Hornbill Jungle Retreat",
      slug: "hornbill-jungle-retreat",
      location: "Ganeshgudi, Dandeli",
      shortDescription: "Forest retreat with nature trails, birding, adventure activities, and group packages.",
      description:
        "A nature-first Dandeli resort for guests who want a quieter stay near forest routes while still having access to rafting and adventure activities through Pinoxx coordination.",
      resortType: "mamboo",
      startingPrice: 1499,
      sharingPrice: 1499,
      couplePrice: 2999,
      rating: 4.6,
      distanceFromBusStandKm: 8.5,
      distanceToWaterActivitiesKm: 2.8,
      amenities: ["Forest view", "Meals", "Indoor games", "Campfire", "Nature trail", "Doctor on call"],
      activities: ["Bird watching", "Nature walk", "River rafting", "Cycling", "Boating"],
      images: [
        { url: resortImages.forest, alt: "Forest retreat" },
        { url: resortImages.cottage, alt: "Jungle cottage" },
        { url: resortImages.dining, alt: "Dining area" }
      ],
      rooms: [
        {
          name: "Jungle Cottage",
          price: 1899,
          capacity: 3,
          description: "Independent forest cottage with meal package options.",
          images: [{ url: resortImages.cottage, alt: "Jungle cottage room" }]
        },
        {
          name: "Group Dorm",
          price: 1499,
          capacity: 8,
          description: "Budget group stay with shared facilities and activity support.",
          images: [{ url: resortImages.room, alt: "Group dorm" }]
        }
      ],
      seoTitle: "Hornbill Jungle Retreat Dandeli | Resort Booking by Pinoxx",
      seoDescription: "Compare and book Hornbill Jungle Retreat with Pinoxx support for forest stays and Dandeli adventures.",
      isActive: true,
      createdAt: now
    },
    {
      _id: "sample-adventure",
      name: "Adventure Nest Dandeli",
      slug: "adventure-nest-dandeli",
      location: "Old Dandeli Road",
      shortDescription: "Activity-focused resort for groups seeking rafting, zipline, kayaking, and pool time.",
      description:
        "A practical resort for high-energy groups who want easy activity planning. Pinoxx helps confirm slots, prices, inclusions, sightseeing options, and travel guidance from arrival to check-out.",
      resortType: "budget",
      startingPrice: 1299,
      sharingPrice: 1299,
      couplePrice: 2499,
      rating: 4.4,
      distanceFromBusStandKm: 5.1,
      distanceToWaterActivitiesKm: 0.9,
      amenities: ["Swimming pool", "Meals", "DJ on request", "Parking", "Activity desk", "First-aid support"],
      activities: ["River rafting", "Zipline", "Kayaking", "Zorbing", "Rain dance"],
      images: [
        { url: resortImages.pool, alt: "Pool resort in Dandeli" },
        { url: resortImages.river, alt: "River adventure" },
        { url: resortImages.dining, alt: "Resort dining" }
      ],
      rooms: [
        {
          name: "Adventure Room",
          price: 1599,
          capacity: 4,
          description: "Simple, clean room for groups with package meal options.",
          images: [{ url: resortImages.room, alt: "Adventure room" }]
        }
      ],
      seoTitle: "Adventure Nest Dandeli Booking | Pinoxx",
      seoDescription: "Plan Adventure Nest Dandeli for rafting, group activities, best-price help, and Pinoxx trip support.",
      isActive: true,
      createdAt: now
    }
  ];

  return {
    resorts,
    users: [
      {
        _id: "user-admin",
        name: "Pinoxx Admin",
        email: "admin@pinoxx.in",
        phone: "919999999999",
        password: adminPassword,
        role: "admin",
        createdAt: now
      },
      {
        _id: "user-guest",
        name: "Aarav Guest",
        email: "guest@example.com",
        phone: "919888888888",
        password: guestPassword,
        role: "user",
        createdAt: now
      }
    ],
    reviews: [
      {
        _id: "review-kali",
        resort: resorts[0]._id,
        user: "user-guest",
        rating: 5,
        comment: "Pinoxx helped us compare resorts and kept the rafting plan clear. The stay was clean and close to the river.",
        status: "approved",
        images: [{ url: resortImages.river, alt: "Guest river view" }],
        createdAt: now
      },
      {
        _id: "review-hornbill",
        resort: resorts[1]._id,
        user: "user-guest",
        rating: 4,
        comment: "Good forest stay and quick support on food preferences. Best for a quiet group trip.",
        status: "approved",
        images: [{ url: resortImages.forest, alt: "Guest forest stay" }],
        createdAt: now
      }
    ],
    bookings: [],
    contacts: [],
    availability: [
      {
        _id: "availability-kali-cottage",
        resortName: resorts[0].name,
        resortSlug: resorts[0].slug,
        roomCategory: "River View Cottage",
        date: "2026-06-14",
        availableRooms: 4,
        status: "available",
        price: 2499,
        note: "Seed Excel-style availability"
      },
      {
        _id: "availability-kali-family",
        resortName: resorts[0].name,
        resortSlug: resorts[0].slug,
        roomCategory: "Family Deluxe Room",
        date: "2026-06-14",
        availableRooms: 1,
        status: "limited",
        price: 1999,
        note: "Limited rooms"
      },
      {
        _id: "availability-hornbill-cottage",
        resortName: resorts[1].name,
        resortSlug: resorts[1].slug,
        roomCategory: "Jungle Cottage",
        date: "2026-06-14",
        availableRooms: 0,
        status: "sold_out",
        price: 1899,
        note: "Sold out"
      }
    ]
  };
}

function signMemoryToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      authProvider: user.authProvider || "password"
    },
    process.env.JWT_SECRET || "pinoxx-dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function requireMemoryAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "pinoxx-dev-secret");
    const user = store.users.find((item) => item._id === payload.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireMemoryAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function serializeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl || "",
    authProvider: user.authProvider || "password",
    role: user.role,
    createdAt: user.createdAt
  };
}

function populateReview(review) {
  const user = store.users.find((item) => item._id === review.user);
  const resort = store.resorts.find((item) => item._id === review.resort);
  return {
    ...review,
    user: user ? { _id: user._id, name: user.name, email: user.email } : null,
    resort: resort ? { _id: resort._id, name: resort.name, slug: resort.slug } : null
  };
}

function populateBooking(booking) {
  const resort = store.resorts.find((item) => item._id === booking.resort);
  return {
    ...booking,
    resort: resort ? { _id: resort._id, name: resort.name, slug: resort.slug } : null
  };
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function memoryResortPayload(body, files = []) {
  const name = body.name?.trim();
  const uploadedFiles = files || [];
  const resortImageCount = Number(body.resortImageCount ?? uploadedFiles.length);
  const roomImageCounts = parseJsonArray(body.roomImageCounts).map((count) => Number(count || 0));
  const resortFiles = uploadedFiles.slice(0, resortImageCount);
  let roomFileOffset = resortImageCount;
  const sharingPrice = optionalNumber(body.sharingPrice);
  const couplePrice = optionalNumber(body.couplePrice);

  return {
    name,
    slug: body.slug || slugify(name || "", { lower: true, strict: true }),
    location: body.location,
    shortDescription: body.shortDescription,
    description: body.description,
    resortType: normalizeResortType(body.resortType),
    startingPrice: resolveStartingPrice(body.startingPrice, sharingPrice, couplePrice),
    sharingPrice: sharingPrice ?? 0,
    couplePrice: couplePrice ?? 0,
    rating: Number(body.rating || 4.5),
    distanceFromBusStandKm: Number(body.distanceFromBusStandKm),
    distanceToWaterActivitiesKm: optionalNumber(body.distanceToWaterActivitiesKm) ?? 0,
    amenities: parseList(body.amenities),
    activities: parseList(body.activities),
    images: [
      ...parseJsonArray(body.images),
      ...resortFiles.map(fileToImage)
    ],
    rooms: parseJsonArray(body.rooms).map((room, index) => {
      const nextOffset = roomFileOffset + (roomImageCounts[index] || 0);
      const roomFiles = uploadedFiles.slice(roomFileOffset, nextOffset);
      roomFileOffset = nextOffset;

      return {
        ...room,
        images: [
          ...(Array.isArray(room.images) ? room.images : []),
          ...roomFiles.map(fileToImage)
        ]
      };
    }),
    availabilitySheetUrl: body.availabilitySheetUrl?.trim() || "",
    seoTitle: body.seoTitle || "",
    seoDescription: body.seoDescription || "",
    isActive: body.isActive !== "false"
  };
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function resolveStartingPrice(value, sharingPrice, couplePrice) {
  const explicitPrice = optionalNumber(value);
  if (explicitPrice !== undefined) return explicitPrice;
  const prices = [sharingPrice, couplePrice].filter((price) => price !== undefined);
  return prices.length ? Math.min(...prices) : 0;
}

function normalizeResortType(value) {
  return ["mamboo", "budget", "premium"].includes(value) ? value : "budget";
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function syncMemoryResortAvailability(resortSlug, { force = false } = {}) {
  const resort = store.resorts.find((item) => item.slug === resortSlug && item.isActive !== false);

  if (!resort?.availabilitySheetUrl) {
    return { imported: 0, skipped: true };
  }

  const lastSyncedAt = resort.availabilityLastSyncedAt
    ? new Date(resort.availabilityLastSyncedAt).getTime()
    : 0;

  if (!force && lastSyncedAt && Date.now() - lastSyncedAt < 5 * 60 * 1000) {
    return { imported: 0, skipped: true };
  }

  const rows = await parseAvailabilityUpload({
    sheetUrl: resort.availabilitySheetUrl,
    defaultResort: {
      name: resort.name,
      slug: resort.slug
    }
  });

  store.availability = store.availability.filter((slot) => slot.resortSlug !== resort.slug);
  store.availability.push(...rows.map((row) => ({ ...row, _id: makeId("availability") })));
  resort.availabilityLastSyncedAt = new Date().toISOString();

  return { imported: rows.length, skipped: false };
}

function sameDay(left, right) {
  return new Date(left).toISOString().slice(0, 10) === new Date(right).toISOString().slice(0, 10);
}

function parseMemoryStayDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildMemoryStayDates(checkIn, checkOut) {
  const start = parseMemoryStayDate(checkIn);
  const end = parseMemoryStayDate(checkOut) || new Date(start?.getTime() + 24 * 60 * 60 * 1000);
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

function getMemoryAvailabilityQuote({ resort, resortSlug, roomCategory, checkIn, checkOut }) {
  const stayDates = buildMemoryStayDates(checkIn, checkOut);
  const now = new Date();
  const createdAfter = new Date(now.getTime() - memoryHoldMinutes * 60 * 1000);

  const nights = stayDates.map((date) => {
    const dateKey = date.toISOString().slice(0, 10);
    const slot = store.availability.find((item) =>
      item.resortSlug === resortSlug &&
      item.roomCategory === roomCategory &&
      sameDay(item.date, date)
    );

    if (!slot) {
      return {
        date: dateKey,
        available: false,
        remainingRooms: 0,
        availableRooms: 0,
        heldRooms: 0,
        price: 0,
        status: "missing",
        note: "No availability row found for this date"
      };
    }

    const heldRooms = store.bookings.filter((booking) => {
      const bookingCheckIn = parseMemoryStayDate(booking.checkIn);
      const bookingCheckOut = parseMemoryStayDate(booking.checkOut);
      const isSameRoom = booking.resort === resort._id && booking.roomCategory === roomCategory;
      const overlapsNight = bookingCheckIn <= date && bookingCheckOut > date;
      const activeHold = booking.status === "confirmed" ||
        (booking.status === "payment_initiated" && (
          (booking.holdExpiresAt && new Date(booking.holdExpiresAt) > now) ||
          (!booking.holdExpiresAt && new Date(booking.createdAt) > createdAfter)
        ));
      return isSameRoom && overlapsNight && activeHold;
    }).length;

    const remainingRooms = Math.max(0, Number(slot.availableRooms || 0) - heldRooms);
    return {
      date: dateKey,
      available: slot.status !== "sold_out" && remainingRooms > 0,
      remainingRooms,
      availableRooms: slot.availableRooms,
      heldRooms,
      price: slot.price || 0,
      status: slot.status,
      note: slot.note || ""
    };
  });

  const minRemainingRooms = nights.reduce((minimum, night) => Math.min(minimum, night.remainingRooms), Number.POSITIVE_INFINITY);

  return {
    available: nights.length > 0 && nights.every((night) => night.available),
    checkedFromExcel: nights.some((night) => night.status !== "missing"),
    roomMatched: nights.some((night) => night.status !== "missing"),
    hasRowsForDate: nights.every((night) => night.status !== "missing"),
    remainingRooms: Number.isFinite(minRemainingRooms) ? minRemainingRooms : 0,
    nights,
    totalRoomPrice: nights.reduce((sum, night) => sum + Number(night.price || 0), 0)
  };
}

function sortAvailability(a, b) {
  return new Date(a.date) - new Date(b.date)
    || a.resortName.localeCompare(b.resortName)
    || a.roomCategory.localeCompare(b.roomCategory);
}

function sortNewest(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

function formatMemoryPrice(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function activeMemoryResortsByPrice() {
  return store.resorts
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.startingPrice)))
    .sort((first, second) => Number(first.startingPrice) - Number(second.startingPrice));
}

function memoryCategoryForIndex(index, total) {
  if (total <= 1) return "budget";
  if (index < Math.ceil(total / 3)) return "budget";
  if (index < Math.ceil((total * 2) / 3)) return "comfort";
  return "premium";
}

function groupedMemoryPriceLines() {
  const sorted = activeMemoryResortsByPrice();
  const groups = {
    budget: [],
    comfort: [],
    premium: []
  };

  sorted.forEach((resort, index) => {
    groups[memoryCategoryForIndex(index, sorted.length)].push(resort);
  });

  return groups;
}

function memoryResortPriceLine(resort) {
  return `${resort.name} - from ${formatMemoryPrice(resort.startingPrice)}`;
}

function activeMemoryResortsByDistance() {
  return store.resorts
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.distanceFromBusStandKm)))
    .sort((first, second) => Number(first.distanceFromBusStandKm) - Number(second.distanceFromBusStandKm));
}

function memoryResortDistanceLine(resort) {
  return `${resort.name} - ${Number(resort.distanceFromBusStandKm).toFixed(1)} km from Dandeli bus stand`;
}

function buildMemoryDistanceAnswer(query) {
  const sorted = activeMemoryResortsByDistance();
  const wantsNearest = query.includes("near") || query.includes("nearest") || query.includes("closest");
  const wantsRoute = query.includes("pickup") || query.includes("route") || query.includes("travel");

  if (!sorted.length) {
    return "Distance details are not available right now. Pinoxx can confirm the exact route before booking.";
  }

  if (wantsRoute) {
    return `Pinoxx can guide pickup and route planning from Dandeli bus stand. Current resort distances:\n${sorted.map(memoryResortDistanceLine).join("\n")}\n\nActual travel time can vary by road condition and pickup point.`;
  }

  if (wantsNearest) {
    return `Nearest active resorts from Dandeli bus stand:\n${sorted.slice(0, 5).map(memoryResortDistanceLine).join("\n")}\n\nThese distances come from the resort distance data saved in Pinoxx.`;
  }

  return `Current resort distances from Dandeli bus stand:\n${sorted.map(memoryResortDistanceLine).join("\n")}\n\nPinoxx can confirm pickup guidance after you choose a resort.`;
}

const memoryRaftingPackages = [
  {
    key: "short",
    title: "Short rafting",
    price: "Included in package",
    details: "Short rafting is included with eligible resort packages."
  },
  {
    key: "mid",
    title: "Mid rafting - 6 km",
    price: "Rs 1,450",
    details: "Includes 6 km rafting plus all water activities."
  },
  {
    key: "long",
    title: "Long rafting - 12 km",
    price: "Rs 1,750",
    details: "Includes only the 12 km rafting experience."
  }
];

function memoryRaftingLine(item) {
  return `${item.title} - ${item.price}: ${item.details}`;
}

function buildMemoryRaftingAnswer(query) {
  const selected = memoryRaftingPackages.find((item) =>
    query.includes(item.key) ||
    (item.key === "mid" && query.includes("6")) ||
    (item.key === "long" && query.includes("12"))
  );

  if (selected) {
    return `${memoryRaftingLine(selected)}\n\nAvailability depends on season, river condition, and slot timing. Pinoxx can confirm before booking.`;
  }

  return `Dandeli rafting options:\n${memoryRaftingPackages.map(memoryRaftingLine).join("\n")}\n\nShort rafting is package-included, mid rafting includes all water activities, and long rafting includes only rafting.`;
}

function buildMemoryFacilitiesAnswer(query, resortName = "") {
  const prefix = resortName ? `${resortName} package inclusions:\n` : "Dandeli resort package inclusions:\n";
  const wantsFood = query.includes("food") || query.includes("meal") || query.includes("breakfast") || query.includes("lunch") || query.includes("dinner");
  const wantsPool = query.includes("pool") || query.includes("swimming") || query.includes("campfire") || query.includes("music") || query.includes("rain");
  const wantsIndoor = query.includes("indoor") || query.includes("carrom") || query.includes("chess") || query.includes("badminton") || query.includes("archery");
  const wantsOverview = query.includes("all") || query.includes("inclusion") || [wantsFood, wantsPool, wantsIndoor].filter(Boolean).length > 1;

  if (!wantsOverview && wantsFood) {
    return `${prefix}Food included:\nBreakfast\nLunch\nDinner\n\nPinoxx can confirm veg/non-veg and meal timing before booking.`;
  }

  if (!wantsOverview && wantsPool) {
    return `${prefix}Activity and entertainment inclusions:\nSwimming pool\nCampfire with music\nRain dance\n\nTiming can depend on resort rules and group schedule.`;
  }

  if (!wantsOverview && wantsIndoor) {
    return `${prefix}Indoor and outdoor games included:\nCarrom\nChess\nBadminton\nArchery\n\nPinoxx can confirm availability before your visit.`;
  }

  return `${prefix}Meals:\nBreakfast\nLunch\nDinner\n\nAmenities and activities:\nSwimming pool\nCampfire with music\nRain dance\nCarrom\nChess\nBadminton\nArchery\n\nExact timing and availability can vary by resort and date, so Pinoxx will confirm before booking.`;
}

const memorySightseeingPlaces = [
  "Crocodile Park",
  "Moulangi Eco Park",
  "Honey Park",
  "Butterfly Park",
  "Syntheri Rocks"
];

function isMemoryExtraActivitiesQuery(query) {
  return (
    query.includes("extra") ||
    query.includes("sightseeing") ||
    query.includes("sight seeing") ||
    query.includes("jungle safari") ||
    query.includes("safari") ||
    query.includes("crocodile") ||
    query.includes("moulangi") ||
    query.includes("maulangi") ||
    query.includes("honey") ||
    query.includes("butterfly") ||
    query.includes("syntheri") ||
    query.includes("sethori") ||
    query.includes("rocks")
  );
}

function buildMemoryExtraActivitiesAnswer(query) {
  const wantsSightseeing = query.includes("sightseeing") || query.includes("sight seeing") || query.includes("crocodile") || query.includes("moulangi") || query.includes("maulangi") || query.includes("honey") || query.includes("butterfly") || query.includes("syntheri") || query.includes("sethori") || query.includes("rocks");
  const wantsSafari = query.includes("jungle safari") || query.includes("safari");
  const wantsMidRafting = query.includes("mid") || query.includes("6");
  const wantsLongRafting = query.includes("long") || query.includes("12");

  if (wantsSightseeing && !wantsSafari && !wantsMidRafting && !wantsLongRafting) {
    return `Sightseeing places Pinoxx can help with:\n${memorySightseeingPlaces.join("\n")}\n\nPinoxx can guide route, timing, vehicle planning, and coordination around your resort check-in to check-out schedule.`;
  }

  if (wantsSafari && !wantsSightseeing && !wantsMidRafting && !wantsLongRafting) {
    return "Jungle safari is available as an extra activity. Timing, entry, and availability depend on forest rules and slot availability, so Pinoxx will confirm before booking.";
  }

  if (wantsMidRafting && !wantsSightseeing && !wantsSafari && !wantsLongRafting) {
    return buildMemoryRaftingAnswer("mid rafting 6 km");
  }

  if (wantsLongRafting && !wantsSightseeing && !wantsSafari && !wantsMidRafting) {
    return buildMemoryRaftingAnswer("long rafting 12 km");
  }

  return `Extra activities available:\nSightseeing:\n${memorySightseeingPlaces.join("\n")}\n\nJungle safari\nMid rafting - 6 km - Rs 1,450: Includes 6 km rafting plus all water activities.\nLong rafting - 12 km - Rs 1,750: Includes only the 12 km rafting experience.\n\nPinoxx can confirm timing, availability, transport, final pricing, and how it fits with your stay plan.`;
}

function isMemoryTripGuidanceQuery(query) {
  return (
    query.includes("trip help") ||
    query.includes("guidance") ||
    query.includes("guide") ||
    query.includes("check-in") ||
    query.includes("check in") ||
    query.includes("check-out") ||
    query.includes("check out") ||
    query.includes("till resort") ||
    query.includes("until checkout") ||
    query.includes("until check out") ||
    query.includes("only booking") ||
    query.includes("not only booking") ||
    query.includes("support only") ||
    query.includes("what support")
  );
}

function buildMemoryTripGuidanceAnswer() {
  return "Pinoxx support is not limited to booking. We help you compare and get the best possible cheap price, plan Dandeli sightseeing, understand activities and inclusions, and guide you from resort check-in to check-out.";
}

function memorySupportNumber() {
  return process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179";
}

function formattedMemorySupportNumber() {
  const digits = memorySupportNumber();
  return digits.startsWith("91") && digits.length === 12 ? `+91 ${digits.slice(2)}` : `+${digits}`;
}

function isMemoryContactQuery(query) {
  return (
    query.includes("contact") ||
    query.includes("call") ||
    query.includes("phone") ||
    query.includes("whatsapp") ||
    query.includes("sms") ||
    query.includes("text") ||
    query.includes("email") ||
    query.includes("callback") ||
    query.includes("call back") ||
    query.includes("support") ||
    query.includes("booking help") ||
    query.includes("talk")
  );
}

function buildMemoryContactAnswer(query) {
  const phone = formattedMemorySupportNumber();

  if (query.includes("email") || query.includes("mail")) {
    return "You can email Pinoxx at admin@pinoxx.in. For faster help with best prices, sightseeing, and stay guidance, WhatsApp or call +91 9353431179.";
  }

  if (query.includes("callback") || query.includes("call back") || query.includes("later")) {
    return "Open the Contact page and choose Call later. Add your name, phone number, people count, preferred date, and preferred time. Pinoxx will receive it in the admin contact panel.";
  }

  if (query.includes("sms") || query.includes("text")) {
    return `You can send Pinoxx an SMS/text message at ${phone}. The Contact page also has a Text message option for quick trip support.`;
  }

  if (query.includes("whatsapp")) {
    return `WhatsApp Pinoxx at ${phone} for quick Dandeli trip help. Share your travel date, number of members, budget, preferred stay type, and sightseeing needs.`;
  }

  if (query.includes("call") || query.includes("phone") || query.includes("talk")) {
    return `Call Pinoxx at ${phone} for best-price help, arrival, pickup, sightseeing, or resort guidance. You can also use the Contact page to request Call now or Call later.`;
  }

  return `You can contact Pinoxx in different ways:\nWhatsApp: ${phone}\nPhone call: ${phone}\nSMS/Text message: ${phone}\nEmail: admin@pinoxx.in\nContact page: choose Call now, Call later, or Message.\n\nFor the fastest answer, share your dates, member count, budget, preferred resort style, and sightseeing needs.`;
}

function buildMemoryPriceAnswer(query) {
  const groups = groupedMemoryPriceLines();
  const wantsBudget = query.includes("budget") || query.includes("low") || query.includes("cheap");
  const wantsComfort = query.includes("comfort") || query.includes("comport") || query.includes("mid");
  const wantsPremium = query.includes("premium") || query.includes("luxury") || query.includes("high");
  const wantsOverview =
    query.includes("all") ||
    query.includes("category") ||
    query.includes("categories") ||
    [wantsBudget, wantsComfort, wantsPremium].filter(Boolean).length > 1;

  const selectedGroup = !wantsOverview
    ? wantsBudget
      ? ["Budget", groups.budget]
      : wantsComfort
      ? ["Comfort", groups.comfort]
      : wantsPremium
      ? ["Premium", groups.premium]
      : null
    : null;

  if (selectedGroup) {
    const [label, items] = selectedGroup;
    if (!items.length) return `No ${label.toLowerCase()} resorts are active right now.`;
    return `${label} resorts based on current resort prices:\n${items.map(memoryResortPriceLine).join("\n")}\n\nPrices can change by date, meals, room type, and activity inclusions. Pinoxx helps compare options for the best possible cheap price.`;
  }

  const sections = [
    ["Budget", groups.budget],
    ["Comfort", groups.comfort],
    ["Premium", groups.premium]
  ]
    .filter(([, items]) => items.length)
    .map(([label, items]) => `${label}:\n${items.map(memoryResortPriceLine).join("\n")}`)
    .join("\n\n");

  return `Current resort prices by category:\n${sections}\n\nShare your date and member count so Pinoxx can help find the best-value and cheap-price option for your trip.`;
}

function answerFromMemory(message) {
  const query = String(message || "").toLowerCase();
  const activeResorts = store.resorts.filter((item) => item.isActive !== false);
  const resort = activeResorts.find((item) => query.includes(item.name.toLowerCase()));
  const target = resort || activeResorts[0];

  if (!target) {
    return "Pinoxx can help with best-price Dandeli resort options, sightseeing, rafting plans, room options, and check-in to check-out guidance. Share your travel dates and member count.";
  }

  if (isMemoryTripGuidanceQuery(query)) {
    return buildMemoryTripGuidanceAnswer();
  }

  if (isMemoryContactQuery(query)) {
    return buildMemoryContactAnswer(query);
  }

  if (query.includes("distance") || query.includes("bus")) {
    if (!resort) return buildMemoryDistanceAnswer(query);
    return `${target.name} is about ${target.distanceFromBusStandKm} km from Dandeli bus stand. Pinoxx can guide you with pickup options and route support.`;
  }

  if (
    query.includes("price") ||
    query.includes("cost") ||
    query.includes("package") ||
    query.includes("budget") ||
    query.includes("cheap") ||
    query.includes("best price") ||
    query.includes("best-price") ||
    query.includes("deal") ||
    query.includes("discount") ||
    query.includes("comfort") ||
    query.includes("comport") ||
    query.includes("premium")
  ) {
    if (!resort) return buildMemoryPriceAnswer(query);
    return `${target.name} starts from Rs ${target.startingPrice} per person/package depending on season and room type. Pinoxx can help compare options and get the best possible cheap price for your date and group size.`;
  }

  if (
    query.includes("facility") ||
    query.includes("amenity") ||
    query.includes("food") ||
    query.includes("meal") ||
    query.includes("breakfast") ||
    query.includes("lunch") ||
    query.includes("dinner") ||
    query.includes("pool") ||
    query.includes("swimming") ||
    query.includes("campfire") ||
    query.includes("music") ||
    query.includes("rain dance") ||
    query.includes("indoor") ||
    query.includes("carrom") ||
    query.includes("chess") ||
    query.includes("badminton") ||
    query.includes("archery")
  ) {
    return buildMemoryFacilitiesAnswer(query, target.name);
  }

  if (isMemoryExtraActivitiesQuery(query)) {
    return buildMemoryExtraActivitiesAnswer(query);
  }

  if (query.includes("rafting") || query.includes("activity") || query.includes("adventure")) {
    if (query.includes("rafting")) return buildMemoryRaftingAnswer(query);
    return `Dandeli adventure plans can include ${target.activities.slice(0, 5).join(", ")}. Availability depends on weather and river conditions.`;
  }

  return "I can help with distance, best-price options, facilities, rooms, rafting, sightseeing, and guidance from resort check-in to check-out. Tell me the resort name, travel dates, and number of members.";
}
