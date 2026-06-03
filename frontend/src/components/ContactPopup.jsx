import { motion } from "framer-motion";
import { CalendarDays, MessageSquareText, Phone, Send, UserRound, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const tabs = [
  { id: "call_now", label: "Call us now", icon: Phone },
  { id: "call_later", label: "Call me later", icon: CalendarDays },
  { id: "message", label: "Leave a message", icon: MessageSquareText }
];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  peopleCount: 2,
  preferredDate: "Today",
  preferredTime: "19:00",
  message: ""
};

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-jungle-500 focus:ring-4 focus:ring-jungle-500/10";

const compactFieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 pb-2 pt-5 text-sm font-black text-slate-950 outline-none transition focus:border-jungle-500 focus:ring-4 focus:ring-jungle-500/10";

export function ContactPopup({ open, onClose, initialMode = "call_later" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [initialMode, open]);

  const title = useMemo(() => {
    if (mode === "call_now") return "Call us now to complete your booking";
    if (mode === "message") return "Send your booking request";
    return "Choose the best time for the callback";
  }, [mode]);

  if (!open) return null;

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const fallbackMessage =
      mode === "call_now"
        ? "Please call me now to complete my Dandeli booking and trip plan."
        : mode === "call_later"
        ? `Please call me later on ${form.preferredDate} at ${form.preferredTime}.`
        : "I want help with Dandeli resort pricing, sightseeing, and check-in to check-out guidance.";

    try {
      const { data } = await api.post("/contact", {
        ...form,
        contactType: mode,
        requestCall: mode !== "message",
        message: form.message || fallbackMessage
      });
      setMessage(
        mode === "call_now"
          ? "Request submitted. Text message is ready to send."
          : "Request submitted. Pinoxx will contact the customer."
      );
      if (data.textMessageUrl) {
        window.location.href = data.textMessageUrl;
      } else if (data.notificationUrl || data.whatsappUrl) {
        window.open(data.notificationUrl || data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      setForm(initialForm);
    } catch (err) {
      setMessage(err.response?.data?.message || "Contact request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/60 px-3 py-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative w-full overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jungle-500 via-river-500 to-ember" />
          <button className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" onClick={onClose} aria-label="Close contact popup">
            <X size={20} />
          </button>

          <div className="px-4 pb-3 pt-5 sm:px-5">
            <div className="flex items-center gap-3 pr-10">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-lg font-black text-jungle-300 shadow-soft"
              >
                P
              </motion.div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-jungle-700">Pinoxx</p>
                <h2 className="text-xl font-black leading-tight text-slate-950 sm:text-2xl">{title}</h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-y border-slate-200 bg-slate-50 px-3 py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black leading-tight transition sm:text-xs ${mode === tab.id ? "text-slate-950" : "text-slate-500 hover:bg-white"}`}
                type="button"
                onClick={() => setMode(tab.id)}
              >
                {mode === tab.id && <motion.span layoutId="contact-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                <span className="relative z-10 grid h-7 w-7 place-items-center rounded-lg bg-jungle-50 text-jungle-700">
                  <tab.icon size={16} />
                </span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <form className="grid gap-3 px-4 py-5 sm:px-5" onSubmit={submit}>
            {mode === "call_later" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <select className={fieldClass} name="preferredDate" value={form.preferredDate} onChange={update}>
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>This weekend</option>
                </select>
                <select className={fieldClass} name="preferredTime" value={form.preferredTime} onChange={update}>
                  <option>10:00</option>
                  <option>13:00</option>
                  <option>16:00</option>
                  <option>19:00</option>
                  <option>21:00</option>
                </select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative">
                <UserRound className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input className={`${fieldClass} pr-10`} name="name" value={form.name} onChange={update} placeholder="Name" required />
              </label>
              <input className={fieldClass} name="phone" value={form.phone} onChange={update} placeholder="Phone number" required />
              <label className="relative">
                <span className="absolute left-3 top-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Guests</span>
                <UsersRound className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input className={`${compactFieldClass} pr-10`} name="peopleCount" value={form.peopleCount} onChange={update} type="number" min="1" placeholder="People" required />
              </label>
              <input className={fieldClass} name="email" value={form.email} onChange={update} type="email" placeholder="Email optional" />
            </div>

            {mode === "message" && (
              <textarea className={`${fieldClass} min-h-24 resize-none`} name="message" value={form.message} onChange={update} placeholder="Message, dates, resort preference, or special request" required />
            )}

            {mode !== "message" && (
              <textarea className={`${fieldClass} min-h-16 resize-none`} name="message" value={form.message} onChange={update} placeholder="Optional message" />
            )}

            {message && <p className="rounded-lg bg-jungle-50 px-3 py-2 text-sm font-bold text-jungle-900">{message}</p>}

            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-base font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-jungle-900 disabled:translate-y-0" disabled={submitting}>
              <Send size={19} />
              {submitting ? "Submitting..." : mode === "call_now" ? "Call us now to complete your booking" : mode === "call_later" ? "Text message: Call me later" : "Send message"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
