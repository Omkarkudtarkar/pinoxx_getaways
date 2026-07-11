import axios from "axios";
import { businessWhatsappNumber, formatPhoneNumber } from "./constants";
import { sampleResorts, sampleReviews } from "./sampleData";

const defaultApiUrl = import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
const apiBaseUrl = import.meta.env.VITE_API_URL || defaultApiUrl;
export const fallbackResortImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80";

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  let token = "";
  try {
    token = localStorage.getItem("pinoxx_token");
  } catch {
    token = "";
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function assetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiBaseUrl.replace(/\/api$/, "");
  return `${base}${url}`;
}

export function resortImageUrl(url) {
  return assetUrl(url) || fallbackResortImage;
}

export function useFallbackResortImage(event) {
  if (event.currentTarget.src !== fallbackResortImage) {
    event.currentTarget.src = fallbackResortImage;
  }
}

export async function getResorts(params) {
  try {
    const { data } = await api.get("/resorts", { params });
    return data.resorts;
  } catch {
    return filterLocalResorts(sampleResorts, params);
  }
}

function filterLocalResorts(resorts, params = {}) {
  return [...resorts]
    .filter((resort) => {
      const price = Number(resort.startingPrice || 0);
      const minPrice = Number(params.minPrice || 0);
      const maxPrice = Number(params.maxPrice || 0);
      const rating = Number(params.rating || 0);
      const location = params.location?.toLowerCase();
      const resortType = params.resortType;

      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      if (rating && Number(resort.rating || 0) < rating) return false;
      if (location && !resort.location?.toLowerCase().includes(location)) return false;
      if (resortType && resort.resortType !== resortType) return false;
      return resort.isActive !== false;
    })
    .sort((first, second) => Number(second.rating || 0) - Number(first.rating || 0) || Number(first.startingPrice || 0) - Number(second.startingPrice || 0));
}

export async function getResort(slug) {
  try {
    const { data } = await api.get(`/resorts/${slug}`);
    return data;
  } catch {
    const resort = sampleResorts.find((item) => item.slug === slug) || sampleResorts[0];
    return { resort, reviews: sampleReviews };
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formattedSupportNumber() {
  return formatPhoneNumber(businessWhatsappNumber);
}

function categoryForIndex(index, total) {
  if (total <= 1) return "budget";
  if (index < Math.ceil(total / 3)) return "budget";
  if (index < Math.ceil((total * 2) / 3)) return "comfort";
  return "premium";
}

function buildLocalPriceAnswer(resorts, message) {
  const text = message.toLowerCase();
  const sorted = [...(resorts || [])]
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.startingPrice)))
    .sort((first, second) => Number(first.startingPrice) - Number(second.startingPrice));
  const groups = { budget: [], comfort: [], premium: [] };

  sorted.forEach((resort, index) => {
    groups[categoryForIndex(index, sorted.length)].push(resort);
  });

  const line = (resort) => `${resort.name} - from ${formatPrice(resort.startingPrice)}`;
  const selected = text.includes("budget")
    ? "budget"
    : text.includes("comfort") || text.includes("comport")
    ? "comfort"
    : text.includes("premium")
    ? "premium"
    : "";
  const wantsOverview =
    text.includes("all") ||
    text.includes("category") ||
    text.includes("categories") ||
    ["budget", "comfort", "premium"].filter((word) => text.includes(word)).length > 1;
  const selectedGroup = !wantsOverview && selected
    ? selected === "budget"
      ? ["Budget", groups.budget]
      : selected === "comfort"
      ? ["Comfort", groups.comfort]
      : ["Premium", groups.premium]
    : null;

  if (selectedGroup) {
    const [label, items] = selectedGroup;
    return `${label} resorts based on current resort prices:\n${items.map(line).join("\n")}\n\nPrices can change by date, meals, room type, and activity inclusions. Pinoxx helps compare options for the best possible cheap price.`;
  }

  const sections = [
    ["Budget", groups.budget],
    ["Comfort", groups.comfort],
    ["Premium", groups.premium]
  ]
    .filter(([, items]) => items.length)
    .map(([label, items]) => `${label}:\n${items.map(line).join("\n")}`)
    .join("\n\n");

  return `Current resort prices by category:\n${sections}\n\nShare your date and member count so Pinoxx can help find the best-value and cheap-price option for your trip.`;
}

function buildLocalDistanceAnswer(resorts, message) {
  const text = message.toLowerCase();
  const sorted = [...(resorts || [])]
    .filter((resort) => resort?.isActive !== false && Number.isFinite(Number(resort.distanceFromBusStandKm)))
    .sort((first, second) => Number(first.distanceFromBusStandKm) - Number(second.distanceFromBusStandKm));
  const line = (resort) => `${resort.name} - ${Number(resort.distanceFromBusStandKm).toFixed(1)} km from Dandeli bus stand`;

  if (!sorted.length) {
    return "Distance details are not available right now. Pinoxx can confirm the exact route before booking.";
  }

  if (text.includes("pickup") || text.includes("route") || text.includes("travel")) {
    return `Pinoxx can guide pickup and route planning from Dandeli bus stand. Current resort distances:\n${sorted.map(line).join("\n")}\n\nActual travel time can vary by road condition and pickup point.`;
  }

  if (text.includes("near") || text.includes("nearest") || text.includes("closest")) {
    return `Nearest active resorts from Dandeli bus stand:\n${sorted.slice(0, 5).map(line).join("\n")}\n\nThese distances come from the resort distance data saved in Pinoxx.`;
  }

  return `Current resort distances from Dandeli bus stand:\n${sorted.map(line).join("\n")}\n\nPinoxx can confirm pickup guidance after you choose a resort.`;
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

function buildLocalRaftingAnswer(message) {
  const text = message.toLowerCase();
  const line = (item) => `${item.title} - ${item.price}: ${item.details}`;
  const selected = raftingPackages.find((item) =>
    text.includes(item.key) ||
    (item.key === "mid" && text.includes("6")) ||
    (item.key === "long" && text.includes("12"))
  );

  if (selected) {
    return `${line(selected)}\n\nAvailability depends on season, river condition, and slot timing. Pinoxx can confirm before booking.`;
  }

  return `Dandeli rafting options:\n${raftingPackages.map(line).join("\n")}\n\nShort rafting is package-included, mid rafting includes all water activities, and long rafting includes only rafting.`;
}

function buildLocalFacilitiesAnswer(message) {
  const text = message.toLowerCase();
  const wantsFood = text.includes("food") || text.includes("meal") || text.includes("breakfast") || text.includes("lunch") || text.includes("dinner");
  const wantsPool = text.includes("pool") || text.includes("swimming") || text.includes("campfire") || text.includes("music") || text.includes("rain");
  const wantsIndoor = text.includes("indoor") || text.includes("carrom") || text.includes("chess") || text.includes("badminton") || text.includes("archery");
  const wantsOverview = text.includes("all") || text.includes("inclusion") || [wantsFood, wantsPool, wantsIndoor].filter(Boolean).length > 1;

  if (!wantsOverview && wantsFood) {
    return "Food included:\nBreakfast\nLunch\nDinner\n\nPinoxx can confirm veg/non-veg and meal timing before booking.";
  }

  if (!wantsOverview && wantsPool) {
    return "Activity and entertainment inclusions:\nSwimming pool\nCampfire with music\nRain dance\n\nTiming can depend on resort rules and group schedule.";
  }

  if (!wantsOverview && wantsIndoor) {
    return "Indoor and outdoor games included:\nCarrom\nChess\nBadminton\nArchery\n\nPinoxx can confirm availability before your visit.";
  }

  return "Dandeli resort package inclusions:\nMeals:\nBreakfast\nLunch\nDinner\n\nAmenities and activities:\nSwimming pool\nCampfire with music\nRain dance\nCarrom\nChess\nBadminton\nArchery\n\nExact timing and availability can vary by resort and date, so Pinoxx will confirm before booking.";
}

const sightseeingPlaces = [
  "Crocodile Park",
  "Moulangi Eco Park",
  "Honey Park",
  "Butterfly Park",
  "Syntheri Rocks"
];

function isExtraActivitiesQuestion(text) {
  return (
    text.includes("extra") ||
    text.includes("sightseeing") ||
    text.includes("sight seeing") ||
    text.includes("jungle safari") ||
    text.includes("safari") ||
    text.includes("crocodile") ||
    text.includes("moulangi") ||
    text.includes("maulangi") ||
    text.includes("honey") ||
    text.includes("butterfly") ||
    text.includes("syntheri") ||
    text.includes("sethori") ||
    text.includes("rocks")
  );
}

function buildLocalExtraActivitiesAnswer(message) {
  const text = message.toLowerCase();
  const wantsSightseeing = text.includes("sightseeing") || text.includes("sight seeing") || text.includes("crocodile") || text.includes("moulangi") || text.includes("maulangi") || text.includes("honey") || text.includes("butterfly") || text.includes("syntheri") || text.includes("sethori") || text.includes("rocks");
  const wantsSafari = text.includes("jungle safari") || text.includes("safari");
  const wantsMidRafting = text.includes("mid") || text.includes("6");
  const wantsLongRafting = text.includes("long") || text.includes("12");

  if (wantsSightseeing && !wantsSafari && !wantsMidRafting && !wantsLongRafting) {
    return `Sightseeing places Pinoxx can help with:\n${sightseeingPlaces.join("\n")}\n\nPinoxx can guide route, timing, vehicle planning, and coordination around your resort check-in to check-out schedule.`;
  }

  if (wantsSafari && !wantsSightseeing && !wantsMidRafting && !wantsLongRafting) {
    return "Jungle safari is available as an extra activity. Timing, entry, and availability depend on forest rules and slot availability, so Pinoxx will confirm before booking.";
  }

  if (wantsMidRafting && !wantsSightseeing && !wantsSafari && !wantsLongRafting) {
    return buildLocalRaftingAnswer("mid rafting 6 km");
  }

  if (wantsLongRafting && !wantsSightseeing && !wantsSafari && !wantsMidRafting) {
    return buildLocalRaftingAnswer("long rafting 12 km");
  }

  return `Extra activities available:\nSightseeing:\n${sightseeingPlaces.join("\n")}\n\nJungle safari\nMid rafting - 6 km - Rs 1,450: Includes 6 km rafting plus all water activities.\nLong rafting - 12 km - Rs 1,750: Includes only the 12 km rafting experience.\n\nPinoxx can confirm timing, availability, transport, final pricing, and how it fits with your stay plan.`;
}

function isTripGuidanceQuestion(text) {
  return (
    text.includes("trip help") ||
    text.includes("guidance") ||
    text.includes("guide") ||
    text.includes("check-in") ||
    text.includes("check in") ||
    text.includes("check-out") ||
    text.includes("check out") ||
    text.includes("till resort") ||
    text.includes("until checkout") ||
    text.includes("until check out") ||
    text.includes("only booking") ||
    text.includes("not only booking") ||
    text.includes("support only") ||
    text.includes("what support")
  );
}

function buildLocalTripGuidanceAnswer() {
  return "Pinoxx support is not limited to booking. We help you compare and get the best possible cheap price, plan Dandeli sightseeing, understand activities and inclusions, and guide you from resort check-in to check-out.";
}

function isContactQuestion(text) {
  return (
    text.includes("contact") ||
    text.includes("call") ||
    text.includes("phone") ||
    text.includes("whatsapp") ||
    text.includes("sms") ||
    text.includes("text") ||
    text.includes("email") ||
    text.includes("callback") ||
    text.includes("call back") ||
    text.includes("support") ||
    text.includes("booking help") ||
    text.includes("talk")
  );
}

function buildLocalContactAnswer(message) {
  const text = message.toLowerCase();
  const phone = formattedSupportNumber();

  if (text.includes("email") || text.includes("mail")) {
    return `You can email Pinoxx at admin@pinoxx.in. For faster help with best prices, sightseeing, and stay guidance, WhatsApp or call ${phone}.`;
  }

  if (text.includes("callback") || text.includes("call back") || text.includes("later")) {
    return "Open the Contact page and choose Call later. Add your name, phone number, people count, preferred date, and preferred time. Pinoxx will receive it in the admin contact panel.";
  }

  if (text.includes("sms") || text.includes("text")) {
    return `You can send Pinoxx an SMS/text message at ${phone}. The Contact page also has a Text message option for quick trip support.`;
  }

  if (text.includes("whatsapp")) {
    return `WhatsApp Pinoxx at ${phone} for quick Dandeli trip help. Share your travel date, number of members, budget, preferred stay type, and sightseeing needs.`;
  }

  if (text.includes("call") || text.includes("phone") || text.includes("talk")) {
    return `Call Pinoxx at ${phone} for best-price help, arrival, pickup, sightseeing, or resort guidance. You can also use the Contact page to request Call now or Call later.`;
  }

  return `You can contact Pinoxx in different ways:\nWhatsApp: ${phone}\nPhone call: ${phone}\nSMS/Text message: ${phone}\nEmail: admin@pinoxx.in\nContact page: choose Call now, Call later, or Message.\n\nFor the fastest answer, share your dates, member count, budget, preferred resort style, and sightseeing needs.`;
}

export async function askChatbot(message) {
  try {
    const { data } = await api.post("/chatbot", { message }, { timeout: 700 });
    return data.answer;
  } catch {
    const text = message.toLowerCase();
    if (isTripGuidanceQuestion(text)) return buildLocalTripGuidanceAnswer();
    if (isContactQuestion(text)) return buildLocalContactAnswer(message);
    if (
      text.includes("price") ||
      text.includes("package") ||
      text.includes("budget") ||
      text.includes("cheap") ||
      text.includes("best price") ||
      text.includes("best-price") ||
      text.includes("deal") ||
      text.includes("discount") ||
      text.includes("comfort") ||
      text.includes("comport") ||
      text.includes("premium")
    ) {
      return buildLocalPriceAnswer(sampleResorts, message);
    }
    if (text.includes("distance") || text.includes("bus") || text.includes("pickup") || text.includes("route")) {
      return buildLocalDistanceAnswer(sampleResorts, message);
    }
    if (isExtraActivitiesQuestion(text)) return buildLocalExtraActivitiesAnswer(message);
    if (text.includes("rafting")) return buildLocalRaftingAnswer(message);
    if (
      text.includes("facility") ||
      text.includes("amenity") ||
      text.includes("food") ||
      text.includes("meal") ||
      text.includes("breakfast") ||
      text.includes("lunch") ||
      text.includes("dinner") ||
      text.includes("pool") ||
      text.includes("swimming") ||
      text.includes("campfire") ||
      text.includes("music") ||
      text.includes("rain dance") ||
      text.includes("indoor") ||
      text.includes("carrom") ||
      text.includes("chess") ||
      text.includes("badminton") ||
      text.includes("archery")
    ) {
      return buildLocalFacilitiesAnswer(message);
    }
    return "Share your dates, member count, budget, and preferred resort. Pinoxx will help with best-price options, sightseeing, activities, and guidance from check-in to check-out.";
  }
}
