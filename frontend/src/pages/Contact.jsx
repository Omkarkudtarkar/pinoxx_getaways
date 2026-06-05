import {
  CalendarDays,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  PhoneCall,
  Send,
  Smartphone,
  UsersRound
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { businessWhatsappNumber, whatsappUrl } from "../lib/constants";
import { Seo } from "../lib/Seo";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  peopleCount: 2,
  contactType: "call_later",
  preferredDate: "Today",
  preferredTime: "19:00"
};

const contactModes = [
  { id: "call_later", label: "Call me later", icon: CalendarDays, requestCall: true }
];

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-jungle-600 focus:ring-4 focus:ring-jungle-600/10";

export function Contact() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeMode = useMemo(
    () => contactModes.find((mode) => mode.id === form.contactType) || contactModes[1],
    [form.contactType]
  );

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function setContactType(contactType) {
    setForm((current) => ({ ...current, contactType }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);

    const fallbackMessage = `Please call me on ${form.preferredDate} at ${form.preferredTime}.`;

    try {
      const { data } = await api.post("/contact", {
        ...form,
        requestCall: activeMode.requestCall,
        message: fallbackMessage
      });
      setResult(data);
      setForm(initialForm);

      if (data.textMessageUrl) {
        window.location.href = data.textMessageUrl;
      } else if (data.notificationUrl || data.whatsappUrl) {
        window.open(data.notificationUrl || data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Contact request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Seo
        title="Contact Pinoxx | Dandeli Booking Support"
        description="Contact Pinoxx by WhatsApp, phone, callback request, or message for best-price Dandeli resort help, sightseeing, and check-in to check-out guidance."
      />

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-300">Contact Pinoxx</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Reach us the way that works for you.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Use direct WhatsApp for best-price stay help, Dandeli sightseeing guidance, and proper support from resort check-in to check-out.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Headphones, label: "Support", value: "24/7" },
              { icon: UsersRound, label: "Guest planning", value: "Groups" },
              { icon: Clock3, label: "Reply mode", value: "Fast" }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <item.icon className="text-cyan-300" size={22} />
                <p className="mt-3 text-2xl font-black">{item.value}</p>
                <p className="text-sm font-semibold text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="grid content-start gap-4">
          <a
            className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#25D366] hover:shadow-soft"
            href={whatsappUrl("Hi Pinoxx, I need help with Dandeli resort pricing, sightseeing, and check-in to check-out guidance.")}
            target="_blank"
            rel="noreferrer"
          >
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#25D366] text-slate-950">
              <MessageCircle size={25} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">WhatsApp trip help</h2>
              <p className="text-sm leading-6 text-slate-600">Chat directly for best prices, resort options, sightseeing, and package clarity.</p>
            </div>
          </a>

          <a
            className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-river-500 hover:shadow-soft"
            href={`tel:+${businessWhatsappNumber}`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-river-50 text-river-800">
              <PhoneCall size={25} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">Call us now to complete your booking</h2>
              <p className="text-sm leading-6 text-slate-600">Call +91 9353431179 for price help, arrival guidance, sightseeing, and stay support.</p>
            </div>
          </a>

          <a
            className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-soft"
            href={`sms:+${businessWhatsappNumber}?body=${encodeURIComponent("Hi Pinoxx, please contact me about Dandeli resort pricing, sightseeing, and trip support.")}`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-50 text-cyan-800">
              <Smartphone size={25} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">Text message: Call me later</h2>
              <p className="text-sm leading-6 text-slate-600">Send a quick SMS asking Pinoxx to call you later.</p>
            </div>
          </a>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-jungle-800">
                <MapPin size={25} />
              </span>
              <div>
                <h2 className="font-black text-slate-950">Local trip guidance</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Share your pickup point, member count, dates, and stay preference. Pinoxx will guide you with suitable options, sightseeing, and check-in to check-out support.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={submit}>
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Send request</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Request a call from Pinoxx</h2>
            </div>
            <a
              className="inline-flex items-center gap-2 text-sm font-black text-jungle-700"
              href={`mailto:admin@pinoxx.in?subject=${encodeURIComponent("Dandeli trip support")}`}
            >
              <Mail size={17} />
              Email Pinoxx
            </a>
          </div>

          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            <a
              className="flex min-h-16 items-center justify-center gap-2 rounded-lg border border-slate-950 bg-slate-950 px-3 py-3 text-sm font-black text-white shadow-soft transition hover:bg-jungle-900"
              href={`tel:+${businessWhatsappNumber}`}
            >
              <PhoneCall size={18} />
              Call us now
            </a>
            {contactModes.map((mode) => (
              <button
                key={mode.id}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-black transition ${
                  form.contactType === mode.id
                    ? "border-slate-950 bg-slate-950 text-white shadow-soft"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-jungle-600 hover:bg-white"
                }`}
                type="button"
                onClick={() => setContactType(mode.id)}
              >
                <mode.icon size={18} />
                {mode.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldClass} name="name" value={form.name} onChange={update} placeholder="Name" required />
            <input className={fieldClass} name="phone" value={form.phone} onChange={update} placeholder="Phone number" required />
            <input className={fieldClass} name="email" value={form.email} onChange={update} type="email" placeholder="Email optional" />
            <input className={fieldClass} name="peopleCount" value={form.peopleCount} onChange={update} type="number" min="1" placeholder="Number of people" required />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className={fieldClass} name="preferredDate" value={form.preferredDate} onChange={update}>
              <option>Today</option>
              <option>Tomorrow</option>
              <option>This weekend</option>
              <option>Next week</option>
            </select>
            <select className={fieldClass} name="preferredTime" value={form.preferredTime} onChange={update}>
              <option>10:00</option>
              <option>13:00</option>
              <option>16:00</option>
              <option>19:00</option>
              <option>21:00</option>
            </select>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
          {result && (
            <div className="mt-3 rounded-lg bg-jungle-50 px-3 py-3 text-sm font-bold text-jungle-900">
              Request submitted. Pinoxx has the contact details in the admin panel.
            </div>
          )}

          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-jungle-700 px-5 py-3 font-black text-white shadow-soft transition hover:bg-jungle-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={submitting}
          >
            <Send size={18} />
            {submitting ? "Submitting..." : "Request call back"}
          </button>
        </form>
      </section>
    </main>
  );
}
