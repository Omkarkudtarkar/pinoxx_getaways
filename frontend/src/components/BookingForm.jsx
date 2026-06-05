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
    adults: 2,
    children5To11: 0,
    childrenUnder5: 0,
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
  const adults = Math.max(0, Number(form.adults || 0));
  const children5To11 = Math.max(0, Number(form.children5To11 || 0));
  const childrenUnder5 = Math.max(0, Number(form.childrenUnder5 || 0));
  const totalGuests = adults + children5To11 + childrenUnder5;
  const chargeableGuests = adults + children5To11 * 0.5;
  const estimatedBaseAmount = selectedRoom ? selectedRoom.price * chargeableGuests : 0;
  const adultTotal = selectedRoom ? selectedRoom.price * adults : 0;
  const childHalfPrice = selectedRoom ? selectedRoom.price * 0.5 : 0;
  const child5To11Total = childHalfPrice * children5To11;
  const guestPricingNote = `Adults: ${adults}, Children 5-11: ${children5To11} at 50%, Children under 5: ${childrenUnder5} free. Chargeable guests: ${chargeableGuests}.`;

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey(resort.slug));
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setForm((value) => ({
          ...value,
          ...parsedDraft,
          adults: parsedDraft.adults ?? parsedDraft.members ?? value.adults,
          children5To11: parsedDraft.children5To11 ?? 0,
          childrenUnder5: parsedDraft.childrenUnder5 ?? 0,
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
    if (!form.customerName || !form.phone || !form.roomCategory || !form.checkIn || !form.checkOut || adults < 1) {
      setError("Fill name, phone, room, dates, and at least one adult before payment.");
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
    const availabilityMessage = [
      guestPricingNote,
      form.specialRequests.trim() ? `Special request: ${form.specialRequests.trim()}` : ""
    ].filter(Boolean).join("\n");

    try {
      const { data } = await api.post("/contact", {
        name: form.customerName,
        phone: form.phone,
        peopleCount: totalGuests,
        contactType: "availability_check",
        requestCall: true,
        resortName: resort.name,
        resortSlug: resort.slug,
        roomCategory: form.roomCategory,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        bookingUrl,
        preferredDate: form.checkIn,
        message: availabilityMessage
      });
      setResult(data);

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
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
        ...form,
        members: totalGuests,
        specialRequests: [guestPricingNote, form.specialRequests].filter(Boolean).join("\n")
      });
      setPaymentResult(data);
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
          Send your dates to Pinoxx. The team will confirm availability before booking.
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
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
            <p className="font-black text-slate-950">{selectedRoom.name}</p>
            <p className="mt-1 text-orange-900">Up to {selectedRoom.capacity} guests.</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-slate-200 px-3 py-3" name="checkIn" value={form.checkIn} onChange={update} type="date" min={today} required />
          <input className="rounded-lg border border-slate-200 px-3 py-3" name="checkOut" value={form.checkOut} onChange={update} type="date" min={nextDay(form.checkIn) || today} required />
        </div>

        <input className="rounded-lg border border-slate-200 px-3 py-3" name="customerName" value={form.customerName} onChange={update} placeholder="Name" required />
        <input className="rounded-lg border border-slate-200 px-3 py-3" name="phone" value={form.phone} onChange={update} placeholder="WhatsApp phone number" required />
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
              Adults
              <input className="rounded-lg border border-slate-200 px-3 py-3 text-base font-semibold text-slate-950" name="adults" value={form.adults} onChange={update} type="number" min="1" placeholder="Adults" required />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
              Kids 5-11 years
              <input className="rounded-lg border border-slate-200 px-3 py-3 text-base font-semibold text-slate-950" name="children5To11" value={form.children5To11} onChange={update} type="number" min="0" placeholder="50% charge" />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
              Under 5 years
              <input className="rounded-lg border border-slate-200 px-3 py-3 text-base font-semibold text-slate-950" name="childrenUnder5" value={form.childrenUnder5} onChange={update} type="number" min="0" placeholder="Free" />
            </label>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-xs font-bold leading-5 text-orange-950">
            <ul className="grid gap-1.5">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                <span>
                  Adults: {adults} x {selectedRoom ? formatCurrency(selectedRoom.price) : "full price"} = {formatCurrency(adultTotal)}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                <span>
                  Kids 5-11 years: {children5To11} x {selectedRoom ? formatCurrency(childHalfPrice) : "50% price"} = {formatCurrency(child5To11Total)}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                <span>Kids under 5 years: {childrenUnder5} x free = {formatCurrency(0)}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                <span>Total guests: {totalGuests}; chargeable guests: {chargeableGuests}.</span>
              </li>
            </ul>
            {selectedRoom ? (
              <div className="mt-4 rounded-lg bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Final price for selected guests</p>
                <p className="mt-1 text-3xl font-black leading-tight text-orange-600">{formatCurrency(estimatedBaseAmount)}</p>
              </div>
            ) : null}
          </div>
        </div>
        <textarea className="min-h-20 rounded-lg border border-slate-200 px-3 py-3" name="specialRequests" value={form.specialRequests} onChange={update} placeholder="Special requests (optional)" />

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-700 px-4 py-3 font-black text-white hover:bg-jungle-900" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          {loading ? "Sending..." : "Send Availability on WhatsApp"}
        </button>
      </form>

      <div className="grid gap-3 border-t border-slate-100 p-5">
        {result ? (
          <div className="grid gap-3 rounded-lg border border-jungle-200 bg-jungle-50 p-4 text-jungle-950">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 shrink-0 text-jungle-700" size={21} />
              <p className="text-sm font-bold leading-6">
                Availability request saved in admin portal and opened on WhatsApp. Please wait for Pinoxx to confirm before booking.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 rounded-lg bg-orange-50 px-3 py-3 text-sm leading-6 text-orange-950">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 shrink-0 text-orange-600" size={18} />
              <p>After Pinoxx confirms availability, come back here and pay the UPI advance for the selected date.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-4 py-3 font-black text-white shadow-soft transition hover:bg-orange-600"
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
            <a className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-4 py-3 font-black text-white" href={paymentResult.upiLink}>
              <CreditCard size={18} />
              Open UPI Payment
            </a>
            <p className="text-xs font-semibold leading-5 text-slate-300">
              Opens on mobile devices with a UPI app installed. If it does not open, try from Chrome on Android or your phone browser.
            </p>
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
