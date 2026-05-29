export const HERO_VIDEO_URL = "https://cdn.pixabay.com/video/2024/08/16/226649_tiny.mp4";

export const businessWhatsappNumber =
  import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER || "919353431179";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

export const whatsappUrl = (message) =>
  `https://wa.me/${businessWhatsappNumber}?text=${encodeURIComponent(message)}`;
