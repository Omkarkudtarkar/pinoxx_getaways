import dotenv from "dotenv";
import path from "path";
import { connectDb } from "./config/db.js";
import { Availability } from "./models/Availability.js";
import { Booking } from "./models/Booking.js";
import { Contact } from "./models/Contact.js";
import { Resort } from "./models/Resort.js";
import { Review } from "./models/Review.js";
import { User } from "./models/User.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const resortImages = {
  river: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  pool: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
  cottage: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
  room: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80",
  dining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80"
};

const resorts = [
  {
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
    seoDescription: "Plan Kali River Edge Resort in Dandeli with rafting support, best-price help, meals, sightseeing, and Pinoxx trip guidance."
  },
  {
    name: "Hornbill Jungle Retreat",
    slug: "hornbill-jungle-retreat",
    location: "Ganeshgudi, Dandeli",
    shortDescription: "Forest retreat with nature trails, birding, adventure activities, and group packages.",
    description:
      "A nature-first Dandeli resort for guests who want a quieter stay near forest routes while still having access to rafting and adventure activities through Pinoxx coordination.",
    resortType: "bamboo",
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
    seoDescription: "Compare and book Hornbill Jungle Retreat with Pinoxx support for forest stays and Dandeli adventures."
  },
  {
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
    seoDescription: "Plan Adventure Nest Dandeli for rafting, group activities, best-price help, and Pinoxx trip support."
  }
];

async function seed() {
  await connectDb();

  await Promise.all([
    Resort.deleteMany({}),
    Availability.deleteMany({}),
    Review.deleteMany({}),
    Booking.deleteMany({}),
    Contact.deleteMany({}),
    User.deleteMany({})
  ]);

  const admin = await User.create({
    name: "Pinoxx Admin",
    email: "admin@pinoxx.in",
    phone: "919999999999",
    password: "Admin@12345",
    role: "admin"
  });

  const guest = await User.create({
    name: "Aarav Guest",
    email: "guest@example.com",
    phone: "919888888888",
    password: "Guest@12345"
  });

  const createdResorts = await Resort.insertMany(resorts);

  await Review.insertMany([
    {
      resort: createdResorts[0]._id,
      user: guest._id,
      rating: 5,
      comment: "Pinoxx helped us compare resorts and kept the rafting plan clear. The stay was clean and close to the river.",
      status: "approved",
      images: [{ url: resortImages.river, alt: "Guest river view" }]
    },
    {
      resort: createdResorts[1]._id,
      user: guest._id,
      rating: 4,
      comment: "Good forest stay and quick support on food preferences. Best for a quiet group trip.",
      status: "approved",
      images: [{ url: resortImages.forest, alt: "Guest forest stay" }]
    }
  ]);

  await Booking.create({
    resort: createdResorts[0]._id,
    customerName: "Sample Booking",
    phone: "919777777777",
    members: 5,
    roomCategory: "River View Cottage",
    checkIn: new Date("2026-06-14"),
    checkOut: new Date("2026-06-16"),
    status: "pending_payment"
  });

  await Availability.insertMany([
    {
      resortName: createdResorts[0].name,
      resortSlug: createdResorts[0].slug,
      roomCategory: "River View Cottage",
      date: new Date("2026-06-14"),
      availableRooms: 4,
      status: "available",
      price: 2499,
      note: "Seed Excel-style availability"
    },
    {
      resortName: createdResorts[0].name,
      resortSlug: createdResorts[0].slug,
      roomCategory: "Family Deluxe Room",
      date: new Date("2026-06-14"),
      availableRooms: 1,
      status: "limited",
      price: 1999,
      note: "Limited rooms"
    },
    {
      resortName: createdResorts[1].name,
      resortSlug: createdResorts[1].slug,
      roomCategory: "Jungle Cottage",
      date: new Date("2026-06-14"),
      availableRooms: 0,
      status: "sold_out",
      price: 1899,
      note: "Sold out"
    }
  ]);

  console.log("Seed complete");
  console.log("Admin login: admin@pinoxx.in / Admin@12345");
  console.log("Guest login: guest@example.com / Guest@12345");
  await process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
