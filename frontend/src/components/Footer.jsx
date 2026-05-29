import { MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { whatsappUrl } from "../lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-jungle-500 text-lg font-black">P</span>
            <span className="text-xl font-black">Pinoxx</span>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            Resort booking and adventure coordination agency for Dandeli stays, rafting plans, guest support, and verified resort marketing.
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
            <a className="inline-flex items-center gap-2" href="tel:+919999999999">
              <Phone size={16} /> 24/7 booking support
            </a>
            <a className="inline-flex items-center gap-2" href={whatsappUrl("Hi Pinoxx, I need Dandeli booking support.")} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> WhatsApp Pinoxx
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

