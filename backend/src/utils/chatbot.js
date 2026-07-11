import { Resort } from "../models/Resort.js";

function normalize(text) {
  return String(text || "").toLowerCase();
}

function formatPrice(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatPerPersonPrice(value) {
  return `${formatPrice(value)} PP`;
}

function bulletList(items = []) {
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}

function formatAnswer(title, points = [], note = "") {
  return [
    title,
    bulletList(points),
    note
  ].filter(Boolean).join("\n\n");
}

function supportNumber() {
  return process.env.BUSINESS_WHATSAPP_NUMBER || "919353431173";
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

const genericSearchWords = new Set([
  "about",
  "and",
  "are",
  "booking",
  "can",
  "check",
  "cost",
  "dandeli",
  "detail",
  "details",
  "does",
  "for",
  "from",
  "have",
  "help",
  "how",
  "info",
  "information",
  "is",
  "me",
  "of",
  "package",
  "price",
  "resort",
  "resorts",
  "room",
  "rooms",
  "stay",
  "stays",
  "tell",
  "the",
  "what",
  "which",
  "with"
]);

function searchWords(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !genericSearchWords.has(word));
}

function resortSearchKeywords(resort) {
  return [...new Set(searchWords(`${resort.name || ""} ${resort.slug || ""}`))];
}

function findMentionedResort(resorts, query) {
  const normalizedQuery = normalize(query).replace(/[^a-z0-9]+/g, " ");

  const exact = resorts.find((resort) => {
    const name = normalize(resort.name).replace(/[^a-z0-9]+/g, " ").trim();
    const slug = normalize(resort.slug).replace(/[^a-z0-9]+/g, " ").trim();
    return (name && normalizedQuery.includes(name)) || (slug && normalizedQuery.includes(slug));
  });
  if (exact) return exact;

  const scored = resorts
    .map((resort) => {
      const keywords = resortSearchKeywords(resort);
      const hits = keywords.filter((word) => normalizedQuery.includes(word));
      return { resort, keywords, score: hits.length, longestHit: hits.reduce((longest, word) => Math.max(longest, word.length), 0) };
    })
    .filter(({ keywords, score, longestHit }) => {
      const neededHits = keywords.length <= 2 ? 1 : 2;
      return score >= neededHits || longestHit >= 6;
    })
    .sort((first, second) => second.score - first.score || second.longestHit - first.longestHit);

  return scored[0]?.resort || null;
}

function resortTypeLabel(value) {
  if (value === "premium") return "Premium";
  if (value === "bamboo") return "Bamboo Stay";
  return "Budget";
}

function listItems(items = [], fallback = "Not listed") {
  const values = items.map((item) => String(item || "").trim()).filter(Boolean);
  return values.length ? values.join(", ") : fallback;
}

function roomLine(room) {
  return `${room.name}: ${formatPrice(room.price)} for up to ${room.capacity} guest${Number(room.capacity) === 1 ? "" : "s"}${room.description ? ` - ${room.description}` : ""}`;
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
  return `${resort.name}: from ${formatPerPersonPrice(resort.startingPrice)}`;
}

function activeResortsByDistance(resorts) {
  return resorts
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.distanceFromBusStandKm)))
    .sort((first, second) => Number(first.distanceFromBusStandKm) - Number(second.distanceFromBusStandKm));
}

function resortDistanceLine(resort) {
  return `${resort.name}: ${Number(resort.distanceFromBusStandKm).toFixed(1)} km from Dandeli bus stand`;
}

function buildDistanceAnswer(resorts, query) {
  const sorted = activeResortsByDistance(resorts);
  const wantsNearest = query.includes("near") || query.includes("nearest") || query.includes("closest");
  const wantsRoute = query.includes("pickup") || query.includes("route") || query.includes("travel");

  if (!sorted.length) {
    return "Distance details are not available right now. Pinoxx can confirm the exact route before booking.";
  }

  if (wantsRoute) {
    return formatAnswer(
      "Pickup and route help",
      [
        "Pinoxx can guide pickup and route planning from Dandeli bus stand.",
        ...sorted.map(resortDistanceLine)
      ],
      "Actual travel time can vary by road condition and pickup point."
    );
  }

  if (wantsNearest) {
    return formatAnswer(
      "Nearest active resorts",
      sorted.slice(0, 5).map(resortDistanceLine),
      "These distances come from the resort distance data saved in Pinoxx."
    );
  }

  return formatAnswer(
    "Current resort distances",
    sorted.map(resortDistanceLine),
    "Pinoxx can confirm pickup guidance after you choose a resort."
  );
}

function buildResortOverviewAnswer(resort) {
  const description = resort.shortDescription || resort.description || "Details are available with Pinoxx.";
  const distance = Number.isFinite(Number(resort.distanceFromBusStandKm))
    ? `${Number(resort.distanceFromBusStandKm).toFixed(1)} km from Dandeli bus stand`
    : "distance can be confirmed by Pinoxx";
  const activityDistance = Number(resort.distanceToWaterActivitiesKm || 0) > 0
    ? ` and ${Number(resort.distanceToWaterActivitiesKm).toFixed(1)} km from water activities`
    : "";

  return formatAnswer(`${resort.name} overview`, [
    `Type: ${resortTypeLabel(resort.resortType)}`,
    `Location: ${resort.location}`,
    `Details: ${description}`,
    `Sharing price: ${formatPerPersonPrice(resort.sharingPrice || resort.startingPrice)}`,
    `Couple price: ${formatPerPersonPrice(resort.couplePrice || resort.startingPrice)}`,
    `Distance: ${distance}${activityDistance}`,
    `Amenities: ${listItems(resort.amenities)}`,
    `Activities: ${listItems(resort.activities)}`
  ]);
}

function buildResortPriceAnswer(resort) {
  const pricePoints = [
    `Sharing: ${formatPerPersonPrice(resort.sharingPrice || resort.startingPrice)}`,
    `Couple: ${formatPerPersonPrice(resort.couplePrice || resort.startingPrice)}`
  ];
  const roomPoints = resort.rooms?.length ? resort.rooms.map(roomLine) : [];

  return [
    formatAnswer(`${resort.name} pricing`, pricePoints),
    roomPoints.length ? formatAnswer("Room prices", roomPoints) : "",
    "Prices can change by date, meals, room type, and activity inclusions. Pinoxx can confirm the final best price for your dates and guest count."
  ].filter(Boolean).join("\n\n");
}

function buildResortRoomsAnswer(resort) {
  if (!resort.rooms?.length) {
    return `${resort.name} room categories are not listed yet. Pinoxx can confirm current room options for your dates.`;
  }

  return formatAnswer(
    `${resort.name} room categories`,
    resort.rooms.map(roomLine),
    "Share your dates and members so Pinoxx can confirm availability."
  );
}

function buildResortFacilitiesAnswer(resort) {
  return formatAnswer(
    `${resort.name} saved resort information`,
    [
      `Amenities: ${listItems(resort.amenities)}`,
      `Activities: ${listItems(resort.activities)}`,
      resort.description ? `Details: ${resort.description}` : ""
    ],
    "Exact inclusions can vary by package and date, so Pinoxx will confirm before booking."
  );
}

function buildResortTimingAnswer(resort) {
  const checkIn = resort.checkInTime || "12:00 PM";
  const checkOut = resort.checkOutTime || "11:00 AM";
  return formatAnswer(
    `${resort.name} stay timing`,
    [`Check-in: ${checkIn}`, `Check-out: ${checkOut}`],
    "Pinoxx can confirm any early check-in or late check-out request with the resort."
  );
}

function buildResortLocationAnswer(resort) {
  const busStandDistance = Number.isFinite(Number(resort.distanceFromBusStandKm))
    ? `${Number(resort.distanceFromBusStandKm).toFixed(1)} km from Dandeli bus stand`
    : "Distance from Dandeli bus stand can be confirmed by Pinoxx";
  const waterDistance = Number(resort.distanceToWaterActivitiesKm || 0) > 0
    ? `${Number(resort.distanceToWaterActivitiesKm).toFixed(1)} km from water activities`
    : "Water activity distance can be confirmed by Pinoxx";

  return formatAnswer(
    `${resort.name} location`,
    [resort.location, busStandDistance, waterDistance],
    "Pinoxx can guide pickup, route, and sightseeing planning around this stay."
  );
}

function buildResortActivitiesAnswer(resort) {
  const activities = listItems(resort.activities, "");
  if (!activities) {
    return `${resort.name} activity details are not listed yet. Pinoxx can confirm rafting, sightseeing, and available activities for your date.`;
  }

  return formatAnswer(
    `${resort.name} activities`,
    activities.split(",").map((item) => item.trim()),
    "Availability depends on weather, river condition, resort rules, and your travel date."
  );
}

function buildResortRatingAnswer(resort) {
  return formatAnswer(`${resort.name} rating`, [`Guest rating: ${Number(resort.rating || 0).toFixed(1)} / 5`]);
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
  return `${item.title}: ${item.price} - ${item.details}`;
}

function buildRaftingAnswer(query) {
  const selected = raftingPackages.find((item) => query.includes(item.key) || (item.key === "mid" && query.includes("6")) || (item.key === "long" && query.includes("12")));

  if (selected) {
    return formatAnswer("Dandeli rafting option", [raftingLine(selected)], "Availability depends on season, river condition, and slot timing. Pinoxx can confirm before booking.");
  }

  return formatAnswer(
    "Dandeli rafting options",
    raftingPackages.map(raftingLine),
    "Short rafting is package-included, mid rafting includes all water activities, and long rafting includes only rafting."
  );
}

function buildFacilitiesAnswer(query, resortName = "") {
  const prefix = resortName ? `${resortName} package inclusions:\n` : "Dandeli resort package inclusions:\n";
  const wantsFood = query.includes("food") || query.includes("meal") || query.includes("breakfast") || query.includes("lunch") || query.includes("dinner");
  const wantsPool = query.includes("pool") || query.includes("swimming") || query.includes("campfire") || query.includes("music") || query.includes("rain");
  const wantsIndoor = query.includes("indoor") || query.includes("carrom") || query.includes("chess") || query.includes("badminton") || query.includes("archery");
  const wantsOverview = query.includes("all") || query.includes("inclusion") || [wantsFood, wantsPool, wantsIndoor].filter(Boolean).length > 1;

  if (!wantsOverview && wantsFood) {
    return formatAnswer(`${prefix}Food included`, ["Breakfast", "Lunch", "Dinner"], "Pinoxx can confirm veg/non-veg and meal timing before booking.");
  }

  if (!wantsOverview && wantsPool) {
    return formatAnswer(`${prefix}Activity and entertainment inclusions`, ["Swimming pool", "Campfire with music", "Rain dance"], "Timing can depend on resort rules and group schedule.");
  }

  if (!wantsOverview && wantsIndoor) {
    return formatAnswer(`${prefix}Indoor and outdoor games included`, ["Carrom", "Chess", "Badminton", "Archery"], "Pinoxx can confirm availability before your visit.");
  }

  return [
    formatAnswer(`${prefix}Meals`, ["Breakfast", "Lunch", "Dinner"]),
    formatAnswer("Amenities and activities", ["Swimming pool", "Campfire with music", "Rain dance", "Carrom", "Chess", "Badminton", "Archery"]),
    "Exact timing and availability can vary by resort and date, so Pinoxx will confirm before booking."
  ].join("\n\n");
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
    return formatAnswer("Sightseeing places Pinoxx can help with", sightseeingPlaces, "Pinoxx can guide route, timing, vehicle planning, and coordination around your resort check-in to check-out schedule.");
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

  return formatAnswer(
    "Extra activities available",
    [
      ...sightseeingPlaces.map((place) => `Sightseeing: ${place}`),
      "Jungle safari",
      "Mid rafting - 6 km: Rs 1,450 - Includes 6 km rafting plus all water activities",
      "Long rafting - 12 km: Rs 1,750 - Includes only the 12 km rafting experience"
    ],
    "Pinoxx can confirm timing, availability, transport, final pricing, and how it fits with your stay plan."
  );
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
  return formatAnswer("Pinoxx trip support", [
    "Compare resort options and prices",
    "Find the best possible cheap price for your dates",
    "Plan Dandeli sightseeing",
    "Understand activities and inclusions",
    "Get guidance from resort check-in to check-out"
  ]);
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
    return formatAnswer("Pinoxx email contact", [`Email: admin@pinoxx.in`, `For faster help, WhatsApp or call ${phone}`]);
  }

  if (query.includes("callback") || query.includes("call back") || query.includes("later")) {
    return formatAnswer("Request a call back", [
      "Open the Contact page",
      "Choose Call later",
      "Add your name, phone number, people count, preferred date, and preferred time",
      "Pinoxx will receive it in the admin contact panel"
    ]);
  }

  if (query.includes("sms") || query.includes("text")) {
    return formatAnswer("SMS contact", [`Send an SMS/text message to ${phone}`, "The Contact page also has a Text message option for quick trip support"]);
  }

  if (query.includes("whatsapp")) {
    return formatAnswer("WhatsApp Pinoxx", [`Number: ${phone}`, "Share travel date, member count, budget, preferred stay type, and sightseeing needs"]);
  }

  if (query.includes("call") || query.includes("phone") || query.includes("talk")) {
    return formatAnswer("Call Pinoxx", [`Phone: ${phone}`, "Use it for best-price help, arrival, pickup, sightseeing, or resort guidance", "You can also use the Contact page to request Call now or Call later"]);
  }

  return formatAnswer(
    "You can contact Pinoxx in different ways",
    [
      `WhatsApp: ${phone}`,
      `Phone call: ${phone}`,
      `SMS/Text message: ${phone}`,
      "Email: admin@pinoxx.in",
      "Contact page: choose Call now, Call later, or Message"
    ],
    "For the fastest answer, share your dates, member count, budget, preferred resort style, and sightseeing needs."
  );
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
    return formatAnswer(
      `${label} resorts based on current prices`,
      items.map(resortPriceLine),
      "Prices can change by date, meals, room type, and activity inclusions. Pinoxx helps compare options for the best possible cheap price."
    );
  }

  const sections = [
    ["Budget", groups.budget],
    ["Comfort", groups.comfort],
    ["Premium", groups.premium]
  ]
    .filter(([, items]) => items.length)
    .map(([label, items]) => formatAnswer(label, items.map(resortPriceLine)))
    .join("\n\n");

  return `Current resort prices by category\n\n${sections}\n\nShare your date and member count so Pinoxx can help find the best-value and cheap-price option for your trip.`;
}

export async function answerLocally(message) {
  const query = normalize(message);
  const resorts = await Resort.find({ isActive: true }).sort({ startingPrice: 1 }).lean();
  const resort = findMentionedResort(resorts, query);

  if (!resorts.length) {
    return "Pinoxx can help with best-price Dandeli resort options, sightseeing, rafting plans, room options, and check-in to check-out guidance. Share your travel dates and member count.";
  }

  if (resort && (query.includes("check-in") || query.includes("check in") || query.includes("check-out") || query.includes("check out") || query.includes("timing") || query.includes("time"))) {
    return buildResortTimingAnswer(resort);
  }

  if (resort && (query.includes("room") || query.includes("rooms") || query.includes("cottage") || query.includes("category") || query.includes("capacity") || query.includes("guest"))) {
    return buildResortRoomsAnswer(resort);
  }

  if (isTripGuidanceQuery(query)) {
    return buildTripGuidanceAnswer();
  }

  if (isContactQuery(query)) {
    return buildContactAnswer(query);
  }

  if (query.includes("distance") || query.includes("bus") || query.includes("location") || query.includes("where") || query.includes("address") || query.includes("route") || query.includes("pickup")) {
    if (!resort) return buildDistanceAnswer(resorts, query);
    return buildResortLocationAnswer(resort);
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
    return buildResortPriceAnswer(resort);
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
    if (!resort) return buildFacilitiesAnswer(query);
    return buildResortFacilitiesAnswer(resort);
  }

  if (isExtraActivitiesQuery(query)) {
    return buildExtraActivitiesAnswer(query);
  }

  if (query.includes("rafting") || query.includes("activity") || query.includes("adventure")) {
    if (query.includes("rafting")) return buildRaftingAnswer(query);
    if (!resort) return "Dandeli adventure plans can include rafting, sightseeing, jungle safari, water activities, and resort activities. Pinoxx can confirm what fits your date and stay.";
    return buildResortActivitiesAnswer(resort);
  }

  if (resort && (query.includes("rating") || query.includes("review"))) {
    return buildResortRatingAnswer(resort);
  }

  if (resort) {
    return buildResortOverviewAnswer(resort);
  }

  return "I can help with uploaded resort information, distance, best-price options, facilities, rooms, rafting, sightseeing, and guidance from resort check-in to check-out. Tell me the resort name, travel dates, and number of members.";
}
