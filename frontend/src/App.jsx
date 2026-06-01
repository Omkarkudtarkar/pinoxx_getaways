import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { Chatbot } from "./components/Chatbot";
import { ContactPopup } from "./components/ContactPopup";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { About } from "./pages/About";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuthPage } from "./pages/Auth";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { ResortDetail } from "./pages/ResortDetail";
import { Resorts } from "./pages/Resorts";

export function App() {
  const [callPopupOpen, setCallPopupOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCallPopupOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/resorts" element={<Resorts />} />
        <Route path="/resorts/:slug" element={<ResortDetail />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Footer />
      <ContactPopup open={callPopupOpen} onClose={() => setCallPopupOpen(false)} initialMode="call_now" />
      <Chatbot />
    </div>
  );
}
