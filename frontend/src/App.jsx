import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Chatbot } from "./components/Chatbot";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { useAuth } from "./lib/AuthContext";
import { whatsappUrl } from "./lib/constants";
import { About } from "./pages/About";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuthPage } from "./pages/Auth";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { ResortDetail } from "./pages/ResortDetail";
import { Resorts } from "./pages/Resorts";
import { Reviews } from "./pages/Reviews";
import { MessageCircle, X } from "lucide-react";

function WhatsAppLoginPrompt({ open, onClose }) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.96 }}
      className="fixed bottom-24 right-4 z-[70] w-[min(92vw,330px)] overflow-hidden rounded-lg border border-jungle-100 bg-white shadow-2xl"
    >
      <button className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Close WhatsApp support prompt">
        <X size={16} />
      </button>
      <div className="grid gap-3 p-4 pr-10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#25D366] text-slate-950">
            <MessageCircle size={22} />
          </span>
          <div>
            <p className="text-sm font-black text-slate-950">Need trip help?</p>
            <p className="text-xs font-semibold text-slate-500">Pinoxx helps with pricing, sightseeing, and stay guidance.</p>
          </div>
        </div>
        <a
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-black text-slate-950 shadow-soft transition hover:bg-jungle-300"
          href={whatsappUrl("Hi Pinoxx, I just logged in and need help with Dandeli pricing, sightseeing, and stay guidance.")}
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
        >
          <MessageCircle size={18} />
          Chat on WhatsApp
        </a>
      </div>
    </motion.div>
  );
}

export function App() {
  const { user } = useAuth();
  const [whatsappPromptOpen, setWhatsappPromptOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin") return undefined;
    if (sessionStorage.getItem("pinoxx_show_whatsapp_support") !== "1") return undefined;

    const timer = setTimeout(() => {
      setWhatsappPromptOpen(true);
      sessionStorage.removeItem("pinoxx_show_whatsapp_support");
    }, 650);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/resorts" element={<Resorts />} />
        <Route path="/resorts/:slug" element={<ResortDetail />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Footer />
      <WhatsAppLoginPrompt open={whatsappPromptOpen} onClose={() => setWhatsappPromptOpen(false)} />
      <Chatbot />
    </div>
  );
}
