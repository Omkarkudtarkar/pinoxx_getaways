import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Gem,
  Handshake,
  Headphones,
  IndianRupee,
  Leaf,
  MapPinned,
  PhoneCall,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  WalletCards,
  Waves
} from "lucide-react";
import { Link } from "react-router-dom";
import { sampleResorts } from "../lib/sampleData";
import { Seo } from "../lib/Seo";

const heroImage = sampleResorts[0]?.images?.[0]?.url;
const riverImage = sampleResorts[0]?.images?.[1]?.url;
const forestImage = sampleResorts[1]?.images?.[0]?.url;
const roomImage = sampleResorts[0]?.images?.[2]?.url;

const stats = [
  { value: "30+", label: "Verified resorts", note: "Reviewed listings across stay types" },
  { value: "15+", label: "Adventure activities", note: "Rafting, trails, kayaking, safari and more" },
  { value: "100%", label: "Transparent pricing", note: "Clear inclusions before you book" }
];

const offerings = [
  {
    icon: Gem,
    title: "Premium stays",
    text: "Riverside resorts, private pool retreats, and refined stays for couples, families, and groups."
  },
  {
    icon: WalletCards,
    title: "Smart value",
    text: "Budget-friendly Dandeli options with clean rooms, meals, activities, sightseeing help, and reliable support."
  },
  {
    icon: IndianRupee,
    title: "Clear packages",
    text: "Stay, meals, adventure inclusions, room choices, and add-ons explained before payment."
  },
  {
    icon: BadgeCheck,
    title: "Verified listings",
    text: "Every featured resort is checked for photos, location, guest fit, and booking clarity."
  }
];

const process = [
  {
    icon: SearchCheck,
    title: "Property verification",
    text: "We review stay quality, real images, location fit, amenities, and package suitability before listing."
  },
  {
    icon: ClipboardCheck,
    title: "Package clarity",
    text: "Guests see inclusions, exclusions, activity options, meal plans, and prices in plain language."
  },
  {
    icon: Headphones,
    title: "Trip coordination",
    text: "Our team helps with best-price options, arrival guidance, sightseeing, adventure slots, and stay coordination."
  }
];

const trustPoints = [
  { icon: ShieldCheck, label: "No hidden charges" },
  { icon: Star, label: "Real guest reviews" },
  { icon: CalendarCheck, label: "Easy cancellations" },
  { icon: PhoneCall, label: "Fast trip help" },
  { icon: MapPinned, label: "Local Dandeli expertise" },
  { icon: CheckCircle2, label: "Verified inclusions" }
];

const highlights = [
  { icon: Waves, label: "River adventures", value: "Rafting-ready stays" },
  { icon: Leaf, label: "Forest escapes", value: "Nature-first retreats" },
  { icon: Compass, label: "Trip fit", value: "Couples, families, groups" },
  { icon: Award, label: "Quality signal", value: "Curated resort partners" }
];

const trustProof = [
  {
    icon: ShieldCheck,
    title: "Verified resort partners",
    text: "We check resort photos, stay type, amenities, location context, and package details before presenting an option."
  },
  {
    icon: IndianRupee,
    title: "Best-price guidance",
    text: "Guests get clear package information, practical comparisons, and support for budget-friendly plus premium stays."
  },
  {
    icon: Handshake,
    title: "Human booking support",
    text: "Pinoxx helps from first call to check-out with arrivals, sightseeing, adventure slots, and resort coordination."
  }
];

export function About() {
  return (
    <main className="bg-white">
      <Seo
        title="About Pinoxx Getaways | Trusted Dandeli Resort Booking Hub"
        description="Learn about Pinoxx Getaways, a trusted Dandeli trip support hub with verified resorts, best-price help, sightseeing, and local guidance."
      />

      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <img src={heroImage} alt="Dandeli river and resort landscape" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-slate-950/75" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-white via-white/70 to-transparent" />

        <div className="mx-auto grid min-h-[720px] max-w-7xl gap-12 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-8">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-jungle-100 backdrop-blur">
              <Sparkles size={16} />
              Est. January 2026
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
              Pinoxx Getaways
              <span className="block text-jungle-300">Dandeli's trusted resort and adventures booking hub.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100 sm:text-xl">
              Pinoxx is Dandeli's trusted resort and adventures booking support for travellers who want verified stays, best-price help, sightseeing guidance, and local support from check-in to check-out.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-400 px-6 py-4 font-black text-slate-950 shadow-soft transition hover:bg-jungle-100" to="/resorts">
                Explore Verified Resorts <ArrowRight size={19} />
              </Link>
              <Link className="inline-flex items-center justify-center rounded-lg border border-white/35 px-6 py-4 font-black text-white backdrop-blur transition hover:bg-white/10" to="/contact">
                Talk to Pinoxx
              </Link>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <p className="text-3xl font-black text-jungle-300">{stat.value}</p>
                  <p className="mt-2 text-sm font-black uppercase tracking-wide text-white">{stat.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{stat.note}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.65 }}
            className="relative hidden min-h-[560px] lg:block"
          >
            <div className="absolute left-0 top-6 w-[72%] overflow-hidden rounded-lg border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <img src={riverImage} alt="Premium resort pool in Dandeli" className="aspect-[4/5] w-full rounded-md object-cover" />
            </div>
            <div className="absolute right-0 top-0 w-[52%] overflow-hidden rounded-lg border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <img src={forestImage} alt="Forest resort retreat in Dandeli" className="aspect-[4/3] w-full rounded-md object-cover" />
            </div>
            <div className="absolute bottom-8 right-8 w-[58%] rounded-lg border border-white/20 bg-white p-5 text-slate-950 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Pinoxx promise</p>
                  <p className="mt-2 text-2xl font-black leading-tight">Verified stay. Best price. Full trip support.</p>
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-slate-950 text-jungle-300">
                  <ShieldCheck size={28} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative isolate -mt-14 overflow-hidden bg-slate-950 py-12">
        <img src={riverImage} alt="Dandeli resort experience" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-slate-950/78" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-lg border border-white/15 bg-black/45 shadow-2xl backdrop-blur-md lg:grid-cols-[0.84fr_1.16fr]">
            <div className="relative hidden min-h-72 lg:block">
              <img src={forestImage} alt="Dandeli resort stay" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/35 to-black/75" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-sm font-black uppercase tracking-wide text-jungle-200">Resort-ready trips</p>
                <p className="mt-2 text-3xl font-black leading-tight text-white">Stays, adventures, and guest fit in one place.</p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-jungle-200">Pinoxx stay signals</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight text-white">Quick reasons to trust the resort selection.</h2>
                </div>
                <span className="w-fit rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-200">
                  Curated by Pinoxx
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {highlights.map((item, index) => (
                  <div key={item.label} className="group flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.07] p-4 transition hover:border-jungle-300/60 hover:bg-white/10">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-slate-950 shadow-sm">
                      <item.icon size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-jungle-200">0{index + 1} / {item.label}</p>
                      <p className="mt-1 text-lg font-black leading-tight text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm font-bold leading-6 text-orange-100">
                Designed for guests comparing river activities, forest stays, family comfort, and trusted resort partners before booking.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-slate-950 py-20 text-white">
        <img src={forestImage} alt="Dandeli forest resort background" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-slate-950/82" />
        <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-white to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-jungle-300">Who we are</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Pinoxx is Dandeli's trusted resort and adventures booking partner.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
              We help customers choose the right stay with verified resort details, clear package pricing, adventure guidance, and personal support before they pay.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-2xl font-black text-jungle-300">{stat.value}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-white/15 bg-black/45 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8">
              <p className="text-lg leading-9 text-slate-100">
                Founded in January 2026, Pinoxx Getaways was created to solve one real problem: finding reliable, honest Dandeli resort options with best-price support, sightseeing help, activity planning, and no hidden confusion.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {trustProof.map((item) => (
                <div key={item.title} className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-jungle-400 text-slate-950">
                    <item.icon size={22} />
                  </div>
                  <h3 className="mt-4 font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                <Camera className="text-jungle-300" size={26} />
                <h3 className="mt-4 text-xl font-black text-white">Real property clarity</h3>
                <p className="mt-3 leading-7 text-slate-300">
                  Hand-picked resorts are presented with useful photos, room context, activity details, and honest suitability notes.
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
                <Route className="text-cyan-300" size={26} />
                <h3 className="mt-4 text-xl font-black text-white">Local trip guidance</h3>
                <p className="mt-3 leading-7 text-slate-300">
                  Our team matches your group size, budget, travel style, and adventure plans with the right Dandeli stay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-jungle-700">What we offer</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Curated stays for every kind of Dandeli escape.
              </h2>
            </div>
            <p className="max-w-3xl leading-8 text-slate-600 lg:justify-self-end">
              Whether you are planning a honeymoon, family break, student trip, corporate outing, or activity-focused weekend, Pinoxx keeps the stay options polished, practical, and easy to compare.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {offerings.map((offer) => (
              <div key={offer.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-jungle-50 text-jungle-800">
                  <offer.icon size={24} />
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">{offer.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{offer.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-8">
          <div className="grid gap-4 sm:grid-cols-[0.92fr_1.08fr]">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:mt-14">
              <img src={forestImage} alt="Dandeli forest resort setting" className="aspect-[4/5] h-full w-full object-cover" />
            </div>
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                <img src={roomImage} alt="Premium room arranged for a Dandeli stay" className="aspect-[4/3] h-full w-full object-cover" />
              </div>
              <div className="rounded-lg bg-slate-950 p-6 text-white shadow-soft">
                <p className="text-sm font-black uppercase tracking-wide text-jungle-300">Operating standard</p>
                <p className="mt-3 text-2xl font-black leading-tight">Every listing should be easy to trust before you call.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-wide text-jungle-700">How we work</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              Verification, price clarity, and personal guidance.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Every listing includes practical resort details, honest package information, activity inclusions, sightseeing support, and check-in to check-out guidance so travellers can compare and choose with peace of mind.
            </p>
            <div className="mt-8 grid gap-4">
              {process.map((item, index) => (
                <div key={item.title} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-sky-50 text-river-700">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Step 0{index + 1}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-jungle-300">Why travellers trust us</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">The right stay depends on your trip.</h2>
            <p className="mt-5 leading-8 text-slate-300">
              The best resort in Dandeli changes by group size, budget, occasion, room preference, and adventure plan. Pinoxx keeps that decision personal instead of pushing every traveller into the same package.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <div key={point.label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <point.icon className="shrink-0 text-jungle-300" size={22} />
                <span className="font-bold text-slate-100">{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-white/10 bg-white p-8 text-slate-950 shadow-2xl sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Pinoxx Getaways</p>
                <h2 className="mt-3 text-3xl font-black leading-tight">Trusted Dandeli resort and adventure booking hub</h2>
                <p className="mt-4 max-w-3xl leading-8 text-slate-600">
                  Serving adventure seekers since January 2026 with verified resorts, Dandeli packages with price clarity, and premium plus budget-friendly stay options.
                </p>
              </div>
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 py-4 font-black text-white transition hover:bg-jungle-900" to="/resorts">
                View Resorts <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
