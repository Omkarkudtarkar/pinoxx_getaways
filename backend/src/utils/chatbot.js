import { Resort } from "../models/Resort.js";

function normalize(text) {
  return String(text || "").toLowerCase();
}

function formatPrice(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function supportNumber() {
  return process.env.BUSINESS_WHATSAPP_NUMBER || "919353431179";
}

function formattedSupportNumber() {
  const digits = supportNumber();
  return digits.startsWith("91") && digits.length === 12 ? `+91 ${digits.slice(2)}` : `+${digits}`;
}

function activeResortsByPrice(resorts) {
  return resorts
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.startingPrice)))
    .sort((first, second) => Number(first.startingPrice) - Number(second.startingPrice));
}

function categoryForIndex(index, total) {
  if (total <= 1) return "budget";
  if (index < Math.ceil(total / 3)) return "budget";
  if (index < Math.ceil((total * 2) / 3)) return "comfort";
  return "premium";
}

function groupedPriceLines(resorts) {
  const sorted = activeResortsByPrice(resorts);
  const groups = {
    budget: [],
    comfort: [],
    premium: []
  };

  sorted.forEach((resort, index) => {
    groups[categoryForIndex(index, sorted.length)].push(resort);
  });

  return groups;
}

function resortPriceLine(resort) {
  return `${resort.name} - from ${formatPrice(resort.startingPrice)}`;
}

function activeResortsByDistance(resorts) {
  return resorts
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.distanceFromBusStandKm)))
    .sort((first, second) => Number(first.distanceFromBusStandKm) - Number(second.distanceFromBusStandKm));
}

function resortDistanceLine(resort) {
  return `${resort.name} - ${Number(resort.distanceFromBusStandKm).toFixed(1)} km from Dandeli bus stand`;
}

function buildDistanceAnswer(resorts, query) {
  const sorted = activeResortsByDistance(resorts);
  const wantsNearest = query.includes("near") || query.includes("nearest") || query.includes("closest");
  const wantsRoute = query.includes("pickup") || query.includes("route") || query.includes("travel");

  if (!sorted.length) {
    return "Distance details are not available right now. Pinoxx can confirm the exact route before booking.";
  }

  if (wantsRoute) {
    return `Pinoxx can guide pickup and route planning from Dandeli bus stand. Current resort distances:\n${sorted.map(resortDistanceLine).join("\n")}\n\nActual travel time can vary by road condition and pickup point.`;
  }

  if (wantsNearest) {
    return `Nearest active resorts from Dandeli bus stand:\n${sorted.slice(0, 5).map(resortDistanceLine).join("\n")}\n\nThese distances come from the resort distance data saved in Pinoxx.`;
  }

  return `Current resort distances from Dandeli bus stand:\n${sorted.map(resortDistanceLine).join("\n")}\n\nPinoxx can confirm pickup guidance after you choose a resort.`;
}

const raftingPackages = [
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

function raftingLine(item) {
  return `${item.title} - ${item.price}: ${item.details}`;
}

function buildRaftingAnswer(query) {
  const selected = raftingPackages.find((item) => query.includes(item.key) || (item.key === "mid" && query.includes("6")) || (item.key === "long" && query.includes("12")));

  if (selected) {
    return `${raftingLine(selected)}\n\nAvailability depends on season, river condition, and slot timing. Pinoxx can confirm before booking.`;
  }

  return `Dandeli rafting options:\n${raftingPackages.map(raftingLine).join("\n")}\n\nShort rafting is package-included, mid rafting includes all water activities, and long rafting includes only rafting.`;
}

function buildFacilitiesAnswer(query, resortName = "") {
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

const sightseeingPlaces = [
  "Crocodile Park",
  "Moulangi Eco Park",
  "Honey Park",
  "Butterfly Park",
  "Syntheri Rocks"
];

function isExtraActivitiesQuery(query) {
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

function buildExtraActivitiesAnswer(query) {
  const wantsSightseeing = query.includes("sightseeing") || query.includes("sight seeing") || query.includes("crocodile") || query.includes("moulangi") || query.includes("maulangi") || query.includes("honey") || query.includes("butterfly") || query.includes("syntheri") || query.includes("sethori") || query.includes("rocks");
  const wantsSafari = query.includes("jungle safari") || query.includes("safari");
  const wantsMidRafting = query.includes("mid") || query.includes("6");
  const wantsLongRafting = query.includes("long") || query.includes("12");

  if (wantsSightseeing && !wantsSafari && !wantsMidRafting && !wantsLongRafting) {
    return `Sightseeing places Pinoxx can help with:\n${sightseeingPlaces.join("\n")}\n\nPinoxx can guide route, timing, vehicle planning, and coordination around your resort check-in to check-out schedule.`;
  }

  if (wantsSafari && !wantsSightseeing && !wantsMidRafting && !wantsLongRafting) {
    return "Jungle safari is available as an extra activity. Timing, entry, and availability depend on forest rules and slot availability, so Pinoxx will confirm before booking.";
  }

  if (wantsMidRafting && !wantsSightseeing && !wantsSafari && !wantsLongRafting) {
    return buildRaftingAnswer("mid rafting 6 km");
  }

  if (wantsLongRafting && !wantsSightseeing && !wantsSafari && !wantsMidRafting) {
    return buildRaftingAnswer("long rafting 12 km");
  }

  return `Extra activities available:\nSightseeing:\n${sightseeingPlaces.join("\n")}\n\nJungle safari\nMid rafting - 6 km - Rs 1,450: Includes 6 km rafting plus all water activities.\nLong rafting - 12 km - Rs 1,750: Includes only the 12 km rafting experience.\n\nPinoxx can confirm timing, availability, transport, final pricing, and how it fits with your stay plan.`;
}

function isTripGuidanceQuery(query) {
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

function buildTripGuidanceAnswer() {
  return "Pinoxx support is not limited to booking. We help you compare and get the best possible cheap price, plan Dandeli sightseeing, understand activities and inclusions, and guide you from resort check-in to check-out.";
}

function isContactQuery(query) {
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

function buildContactAnswer(query) {
  const phone = formattedSupportNumber();

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

function buildPriceAnswer(resorts, query) {
  const groups = groupedPriceLines(resorts);
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
    return `${label} resorts based on current resort prices:\n${items.map(resortPriceLine).join("\n")}\n\nPrices can change by date, meals, room type, and activity inclusions. Pinoxx helps compare options for the best possible cheap price.`;
  }

  const sections = [
    ["Budget", groups.budget],
    ["Comfort", groups.comfort],
    ["Premium", groups.premium]
  ]
    .filter(([, items]) => items.length)
    .map(([label, items]) => `${label}:\n${items.map(resortPriceLine).join("\n")}`)
    .join("\n\n");

  return `Current resort prices by category:\n${sections}\n\nShare your date and member count so Pinoxx can help find the best-value and cheap-price option for your trip.`;
}

export async function answerLocally(message) {
  const query = normalize(message);
  const resorts = await Resort.find({ isActive: true }).sort({ startingPrice: 1 }).lean();
  const resort = resorts.find((item) => query.includes(item.name.toLowerCase()));
  const target = resort || resorts[0];

  if (!target) {
    return "Pinoxx can help with best-price Dandeli resort options, sightseeing, rafting plans, room options, and check-in to check-out guidance. Share your travel dates and member count.";
  }

  if (isTripGuidanceQuery(query)) {
    return buildTripGuidanceAnswer();
  }

  if (isContactQuery(query)) {
    return buildContactAnswer(query);
  }

  if (query.includes("distance") || query.includes("bus")) {
    if (!resort) return buildDistanceAnswer(resorts, query);
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
    if (!resort) return buildPriceAnswer(resorts, query);
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
    return buildFacilitiesAnswer(query, target.name);
  }

  if (isExtraActivitiesQuery(query)) {
    return buildExtraActivitiesAnswer(query);
  }

  if (query.includes("rafting") || query.includes("activity") || query.includes("adventure")) {
    if (query.includes("rafting")) return buildRaftingAnswer(query);
    return `Dandeli adventure plans can include ${target.activities.slice(0, 5).join(", ")}. Availability depends on weather and river conditions.`;
  }

  return "I can help with distance, best-price options, facilities, rooms, rafting, sightseeing, and guidance from resort check-in to check-out. Tell me the resort name, travel dates, and number of members.";
}
