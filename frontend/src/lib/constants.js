export const HERO_VIDEO_URL = "https://cdn.pixabay.com/video/2024/08/16/226649_tiny.mp4";

export const supportPhoneNumbers = ["919353431173", "918147843271"];

export const businessWhatsappNumber =
  import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || supportPhoneNumbers[0];

export const formatPhoneNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+91 ${digits.slice(2)}`;
  if (digits.length === 10) return `+91 ${digits}`;
  return digits ? `+${digits}` : "";
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

export const formatPerPersonPrice = (value) => `${formatCurrency(value)} PP`;

export const whatsappUrl = (message) =>
  `https://wa.me/${businessWhatsappNumber}?text=${encodeURIComponent(message)}`;
