import { Resort } from "../models/Resort.js";

function normalize(text) {
  return String(text || "").toLowerCase();
}

function formatPrice(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
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
    return `Sightseeing places included:\n${sightseeingPlaces.join("\n")}\n\nPinoxx can confirm route, timing, and vehicle details before booking.`;
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

  return `Extra activities available:\nSightseeing:\n${sightseeingPlaces.join("\n")}\n\nJungle safari\nMid rafting - 6 km - Rs 1,450: Includes 6 km rafting plus all water activities.\nLong rafting - 12 km - Rs 1,750: Includes only the 12 km rafting experience.\n\nPinoxx can confirm timing, availability, transport, and final pricing before booking.`;
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
    return `${label} resorts based on current resort prices:\n${items.map(resortPriceLine).join("\n")}\n\nPrices can change by date, meals, room type, and activity inclusions.`;
  }

  const sections = [
    ["Budget", groups.budget],
    ["Comfort", groups.comfort],
    ["Premium", groups.premium]
  ]
    .filter(([, items]) => items.length)
    .map(([label, items]) => `${label}:\n${items.map(resortPriceLine).join("\n")}`)
    .join("\n\n");

  return `Current resort prices by category:\n${sections}\n\nShare your date and member count for the exact package quote.`;
}

export async function answerLocally(message) {
  const query = normalize(message);
  const resorts = await Resort.find({ isActive: true }).sort({ startingPrice: 1 }).lean();
  const resort = resorts.find((item) => query.includes(item.name.toLowerCase()));
  const target = resort || resorts[0];

  if (!target) {
    return "Pinoxx can help with Dandeli resort booking, rafting plans, room options, and pricing. Share your travel dates and member count.";
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
    query.includes("comfort") ||
    query.includes("comport") ||
    query.includes("premium")
  ) {
    if (!resort) return buildPriceAnswer(resorts, query);
    return `${target.name} starts from Rs ${target.startingPrice} per person/package depending on season and room type. Share your dates and group size for the best quote.`;
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

  return "I can help with distance, pricing, facilities, rooms, rafting, and booking support. Tell me the resort name, travel dates, and number of members.";
}
