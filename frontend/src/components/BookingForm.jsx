import { motion } from "framer-motion";
import { CalendarCheck, CheckCircle2, Clock3, CreditCard, Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/constants";

const today = new Date().toISOString().slice(0, 10);

function draftKey(resortSlug) {
  return `pinoxx_availability_request_${resortSlug}`;
}

function nextDay(date) {
  if (!date) return "";
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export function BookingForm({ resort }) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    members: 2,
    roomCategory: "",
    checkIn: "",
    checkOut: "",
    specialRequests: ""
  });
  const [result, setResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const selectedRoom = useMemo(
    () => resort.rooms?.find((room) => room.name === form.roomCategory),
    [resort.rooms, form.roomCategory]
  );

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey(resort.slug));
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setForm((value) => ({
          ...value,
          ...parsedDraft,
          roomCategory: parsedDraft.roomCategory || value.roomCategory || resort.rooms?.[0]?.name || ""
        }));
        return;
      } catch {
        localStorage.removeItem(draftKey(resort.slug));
      }
    }

    setForm((value) => ({
      ...value,
      roomCategory: value.roomCategory || resort.rooms?.[0]?.name || ""
    }));
  }, [resort]);

  useEffect(() => {
    localStorage.setItem(draftKey(resort.slug), JSON.stringify(form));
  }, [form, resort.slug]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "checkIn" && (!next.checkOut || next.checkOut <= value)) {
        next.checkOut = nextDay(value);
      }
      return next;
    });
    setResult(null);
    setPaymentResult(null);
    setError("");
  }

  function validateBookingFields() {
    if (!form.customerName || !form.phone || !form.roomCategory || !form.checkIn || !form.checkOut || !form.members) {
      setError("Fill name, phone, room, dates, and members before payment.");
      return false;
    }
    return true;
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const bookingUrl = window.location.href;
    const message = [
      "Availability request",
      `Name: ${form.customerName}`,
      `Number: ${form.phone}`,
      `Date: ${form.checkIn} to ${form.checkOut}`
    ].filter(Boolean).join("\n");

    try {
      const { data } = await api.post("/contact", {
        name: form.customerName,
        phone: form.phone,
        peopleCount: form.members,
        contactType: "availability_check",
        requestCall: true,
        resortName: resort.name,
        resortSlug: resort.slug,
        roomCategory: form.roomCategory,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        bookingUrl,
        preferredDate: form.checkIn,
        message
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Availability request could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  async function payAdvance() {
    setError("");
    if (!validateBookingFields()) return;
    setPaymentLoading(true);

    try {
      const { data } = await api.post("/bookings", {
        resortId: resort._id,
        ...form
      });
      setPaymentResult(data);
      window.location.assign(data.upiLink);
    } catch (err) {
      setError(err.response?.data?.message || "UPI booking could not be created.");
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft"
    >
      <div className="bg-slate-950 p-5 text-white">
        <div className="flex items-center gap-2">
          <CalendarCheck className="text-jungle-400" size={22} />
          <h2 className="text-xl font-black">Check Availability</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Send your dates to Pinoxx on WhatsApp. The team will confirm availability before booking.
        </p>
      </div>

      <form className="grid gap-3 p-5" onSubmit={submit}>
        <select className="rounded-lg border border-slate-200 px-3 py-3 font-semibold" name="roomCategory" value={form.roomCategory} onChange={update} required>
          {resort.rooms?.map((room) => (
            <option key={room.name} value={room.name}>
              {room.name} - {formatCurrency(room.price)}
            </option>
          ))}
        </select>

        {selectedRoom && (
          <div className="rounded-lg bg-jungle-50 px-3 py-3 text-sm text-jungle-950">
            <p className="font-black">{selectedRoom.name}</p>
            <p className="mt-1">Up to {selectedRoom.capacity} guests. Base price {formatCurrency(selectedRoom.price)}.</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-slate-200 px-3 py-3" name="checkIn" value={form.checkIn} onChange={update} type="date" min={today} required />
          <input className="rounded-lg border border-slate-200 px-3 py-3" name="checkOut" value={form.checkOut} onChange={update} type="date" min={nextDay(form.checkIn) || today} required />
        </div>

        <input className="rounded-lg border border-slate-200 px-3 py-3" name="customerName" value={form.customerName} onChange={update} placeholder="Name" required />
        <input className="rounded-lg border border-slate-200 px-3 py-3" name="phone" value={form.phone} onChange={update} placeholder="WhatsApp phone number" required />
        <input className="rounded-lg border border-slate-200 px-3 py-3" name="members" value={form.members} onChange={update} type="number" min="1" placeholder="Members" required />
        <textarea className="min-h-20 rounded-lg border border-slate-200 px-3 py-3" name="specialRequests" value={form.specialRequests} onChange={update} placeholder="Special requests" />

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-700 px-4 py-3 font-black text-white hover:bg-jungle-900" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          {loading ? "Sending..." : "Send WhatsApp Availability Request"}
        </button>
      </form>

      <div className="grid gap-3 border-t border-slate-100 p-5">
        {result ? (
          <div className="grid gap-3 rounded-lg border border-jungle-200 bg-jungle-50 p-4 text-jungle-950">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 shrink-0 text-jungle-700" size={21} />
              <p className="text-sm font-bold leading-6">
                You have sent a text to check the availability. Please wait for Pinoxx to confirm before booking.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 shrink-0 text-slate-500" size={18} />
              <p>After Pinoxx confirms availability, come back here and pay the UPI advance for the selected date.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 font-black text-slate-900"
              onClick={payAdvance}
              disabled={paymentLoading}
            >
              {paymentLoading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
              {paymentLoading ? "Opening UPI..." : "Pay UPI Advance"}
            </button>
          </div>
        )}

        {paymentResult && (
          <div className="grid gap-3 rounded-lg bg-slate-950 p-4 text-white">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 text-jungle-400" size={21} />
              <div>
                <p className="font-black">UPI advance booking created</p>
                <p className="mt-1 text-sm text-slate-300">Complete payment and notify Pinoxx with your transaction details.</p>
              </div>
            </div>
            <a className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-500 px-4 py-3 font-black text-slate-950" href={paymentResult.upiLink}>
              <CreditCard size={18} />
              Open UPI Payment
            </a>
            <a className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 font-bold" href={paymentResult.businessWhatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              Notify Pinoxx
            </a>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
      </div>
    </motion.div>
  );
}
