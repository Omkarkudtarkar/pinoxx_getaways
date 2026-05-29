import { Headphones, MessageCircle, PhoneCall, Send } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import { whatsappUrl } from "../lib/constants";
import { Seo } from "../lib/Seo";

export function Contact() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    peopleCount: 2,
    requestCall: false,
    contactType: "message",
    preferredDate: "",
    preferredTime: "",
    message: ""
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/contact", form);
      setResult(data);
      if (data.textMessageUrl) {
        window.location.href = data.textMessageUrl;
      } else {
        window.open(data.notificationUrl || data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Contact request could not be submitted.");
    }
  }

  return (
    <main>
      <Seo title="Contact Pinoxx | Dandeli Booking Support" description="Contact Pinoxx for Dandeli resort booking, adventure planning, and 24/7 guest support." />
      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-jungle-500">Contact</p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">24/7 Dandeli booking support</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">Use WhatsApp for urgent booking support or send the form for resort partnerships, guest queries, and package planning.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="grid gap-4">
          <a className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" href={whatsappUrl("Hi Pinoxx, I need help with Dandeli resort booking.")} target="_blank" rel="noreferrer">
            <MessageCircle className="text-jungle-700" size={26} />
            <div>
              <h2 className="font-black text-slate-950">WhatsApp</h2>
              <p className="text-sm text-slate-600">Fast booking support</p>
            </div>
          </a>
          <a className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" href="tel:+919999999999">
            <PhoneCall className="text-river-700" size={26} />
            <div>
              <h2 className="font-black text-slate-950">Phone</h2>
              <p className="text-sm text-slate-600">Guest guidance and resort help</p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Headphones className="text-orange-600" size={26} />
            <div>
              <h2 className="font-black text-slate-950">24/7 Support</h2>
              <p className="text-sm text-slate-600">Booking, arrival, and follow-up</p>
            </div>
          </div>
        </div>

        <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submit}>
          <h2 className="mb-5 text-2xl font-black text-slate-950">Send a booking request</h2>
          <div className="grid gap-3">
            <input className="rounded-lg border border-slate-200 px-3 py-2" name="name" value={form.name} onChange={update} placeholder="Name" required />
            <input className="rounded-lg border border-slate-200 px-3 py-2" name="phone" value={form.phone} onChange={update} placeholder="Phone" required />
            <input className="rounded-lg border border-slate-200 px-3 py-2" name="email" value={form.email} onChange={update} type="email" placeholder="Email" />
            <input className="rounded-lg border border-slate-200 px-3 py-2" name="peopleCount" value={form.peopleCount} onChange={update} type="number" min="1" placeholder="Number of people" required />
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
              <input className="h-4 w-4 accent-jungle-700" type="checkbox" name="requestCall" checked={form.requestCall} onChange={update} />
              Request a call back
            </label>
            <textarea className="min-h-32 rounded-lg border border-slate-200 px-3 py-2" name="message" value={form.message} onChange={update} placeholder="Message, dates, resort preference, or special request" required />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
            {result && (
              <div className="grid gap-2 rounded-lg bg-jungle-50 px-3 py-3 text-sm text-jungle-900">
                <p className="font-bold">Request submitted. It is visible in the admin panel.</p>
                <a className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-700 px-4 py-3 font-bold text-white" href={result.notificationUrl || result.whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle size={18} />
                  {result.textMessageUrl ? "Open Text Message" : "Notify Pinoxx on WhatsApp"}
                </a>
              </div>
            )}
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-700 px-4 py-3 font-bold text-white hover:bg-jungle-900">
              <Send size={18} />
              Submit Request
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
