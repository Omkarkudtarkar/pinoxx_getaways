import { Instagram, MessageCircle, Phone, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import { businessWhatsappNumber, whatsappUrl } from "../lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <img src="/pinoxx-logo.svg" alt="Pinoxx logo" className="h-11 w-11 rounded-lg object-cover" />
            <span className="text-xl font-black">Pinoxx</span>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            Dandeli trip support for best-price resorts, sightseeing, activities, and guidance from resort check-in to check-out.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Pages</h3>
          <div className="grid gap-2 text-sm">
            <Link to="/about">About</Link>
            <Link to="/resorts">Resorts</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Support</h3>
          <div className="grid gap-3 text-sm text-slate-300">
            <a className="inline-flex items-center gap-2" href={`tel:+${businessWhatsappNumber}`}>
              <Phone size={16} /> 24/7 trip support
            </a>
            <a className="inline-flex items-center gap-2" href={whatsappUrl("Hi Pinoxx, I need Dandeli resort pricing, sightseeing, and trip support.")} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> WhatsApp Pinoxx
            </a>
            <a className="inline-flex items-center gap-2" href="https://www.instagram.com/pinoxxgetaways/" target="_blank" rel="noreferrer">
              <Instagram size={16} /> Instagram
            </a>
            <a className="inline-flex items-center gap-2" href="https://www.facebook.com/profile.php?id=61585874739421" target="_blank" rel="noreferrer">
              <Facebook size={16} /> Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
