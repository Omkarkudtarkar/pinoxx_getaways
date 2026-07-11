import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Headphones,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
  Waves
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResortCard } from "../components/ResortCard";
import { getResorts, resortImageUrl } from "../lib/api";
import { businessWhatsappNumber, whatsappUrl } from "../lib/constants";
import { sampleResorts } from "../lib/sampleData";
import { Seo } from "../lib/Seo";

const stats = [
  { label: "Happy guests", value: "400+", icon: UsersRound },
  { label: "Verified stays", value: "30+", icon: ShieldCheck },
  { label: "Support", value: "24/7", icon: Headphones }
];

const tripTypes = ["Couples", "Families", "Groups", "Corporate"];

const experiences = [
  {
    icon: Waves,
    title: "River adventures",
    text: "Rafting, kayaking, boating, and riverside stays coordinated with clear timing and inclusions."
  },
  {
    icon: Compass,
    title: "Sightseeing guidance",
    text: "Dandeli sightseeing routes, local places, pickup guidance, and timing planned around your stay."
  },
  {
    icon: WalletCards,
    title: "Best price help",
    text: "We help you compare options and find suitable stays at the best possible cheap price."
  }
];

const trustPoints = [
  "Verified resort partners",
  "Best and cheap price support",
  "Dandeli sightseeing guidance",
  "Check-in to check-out help"
];

const bookingSteps = [
  { title: "Choose your resort", text: "Tell us your dates, group size, and budget.", icon: Search },
  { title: "Get the best price", text: "Compare stays, inclusions, sightseeing, and total trip value.", icon: BadgeCheck },
  { title: "Travel with support", text: "Pinoxx guides you from resort check-in to check-out.", icon: MessageCircle }
];

const trustStrip = [
  "Verified Dandeli resorts",
  "Budget, comfort, premium options",
  "Best cheap price help",
  "Dandeli sightseeing support",
  "Rafting package clarity",
  "Distance from bus stand",
  "WhatsApp trip help",
  "Check-in to check-out guidance"
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function topRatedResorts(resorts) {
  return [...resorts]
    .sort((first, second) => Number(second.rating || 0) - Number(first.rating || 0))
    .slice(0, 6);
}

export function Home() {
  const [resorts, setResorts] = useState(() => topRatedResorts(sampleResorts));
  const featuredResorts = useMemo(() => topRatedResorts(resorts), [resorts]);
  const heroResort = featuredResorts[0] || sampleResorts[0];
  const heroImage = resortImageUrl(heroResort?.images?.[0]?.url || sampleResorts[0].images[0].url);
  const secondaryImage = resortImageUrl(sampleResorts[1]?.images?.[0]?.url);

  useEffect(() => {
    getResorts().then((items) => {
      setResorts(topRatedResorts(items || []));
    });
  }, []);

  return (
    <>
      <Seo
        title="Pinoxx | Trusted Resort & Adventure Booking in Dandeli"
        description="Plan Dandeli resorts, best-price stays, sightseeing, activities, and check-in to check-out trip guidance with Pinoxx."
      />

      <section className="relative isolate overflow-hidden bg-slate-950">
        <img
          src={secondaryImage || heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-30 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-20 bg-slate-950/70" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-white to-transparent" />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-4xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-jungle-100 backdrop-blur">
              <Sparkles size={16} />
              Dandeli trip support made clear
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
              Find your perfect Dandeli stay with Pinoxx.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
              We help you find the best and cheap price, plan Dandeli sightseeing, and get proper guidance from resort check-in to check-out.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-4 font-black text-slate-950 shadow-[0_0_0_4px_rgba(255,255,255,0.24),0_22px_55px_rgba(34,211,238,0.36)] ring-2 ring-white/70 transition hover:bg-cyan-300 hover:shadow-[0_0_0_5px_rgba(255,255,255,0.32),0_26px_70px_rgba(34,211,238,0.46)] sm:w-auto" to="/resorts">
                  Explore Resorts <ArrowRight size={19} />
                </Link>
              </motion.div>
              <motion.a
                animate={{ boxShadow: ["0 18px 45px rgba(16,185,129,0.22)", "0 18px 60px rgba(16,185,129,0.38)", "0 18px 45px rgba(16,185,129,0.22)"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-jungle-300/50 bg-[#25D366] px-6 py-4 font-black text-slate-950 shadow-soft transition hover:bg-jungle-300"
                href={whatsappUrl("Hi Pinoxx, I want help choosing a Dandeli resort.")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={19} />
                Chat on WhatsApp
              </motion.a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <motion.div key={stat.label} whileHover={{ y: -6, scale: 1.02 }} className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                  <stat.icon className="text-jungle-300" size={22} />
                  <div className="mt-3 text-3xl font-black">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-200">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto -mt-7 max-w-7xl overflow-hidden px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-white/15 bg-white/10 py-3 text-white backdrop-blur">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="flex w-max gap-3 px-3"
            >
              {[...trustStrip, ...trustStrip].map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">
                  <BadgeCheck size={16} className="text-jungle-700" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        className="bg-white py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={stagger}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-center lg:px-8">
          <motion.div variants={fadeUp} transition={{ duration: 0.55 }}>
            <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Plan by travel style</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              Resorts, activities, and support matched to your trip.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {tripTypes.map((type, index) => (
                <motion.span
                  key={type}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700"
                >
                  {type}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div className="grid gap-4 md:grid-cols-3" variants={stagger}>
            {experiences.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-soft"
              >
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-jungle-50 text-jungle-800">
                  <item.icon size={24} />
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="border-y border-slate-200 bg-slate-950 py-12 text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} transition={{ duration: 0.55 }} className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-jungle-300">Clear trip path</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Three simple steps from search to check-out.</h2>
            </div>
            <Link className="inline-flex items-center gap-2 font-black text-jungle-300" to="/resorts">
              Start now <ArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div className="grid gap-4 md:grid-cols-3" variants={stagger}>
            {bookingSteps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                transition={{ duration: 0.55 }}
                whileHover={{ y: -6 }}
                className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-jungle-400 text-slate-950">
                    <step.icon size={22} />
                  </span>
                  <span className="text-sm font-black uppercase tracking-wide text-slate-400">Step 0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="bg-slate-50 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={stagger}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-8">
          <motion.div className="grid gap-4 sm:grid-cols-[1fr_0.82fr]" variants={fadeUp} transition={{ duration: 0.6 }}>
            <motion.div whileHover={{ y: -6 }} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
              <motion.img
                src={heroImage}
                alt="Dandeli riverside resort"
                className="aspect-[4/5] h-full w-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
            <div className="grid gap-4 sm:pt-12">
              <motion.div whileHover={{ y: -6 }} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                <motion.img
                  src={secondaryImage}
                  alt="Dandeli forest retreat"
                  className="aspect-[4/3] h-full w-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-lg bg-slate-950 p-6 text-white shadow-soft"
              >
                <BadgeCheck className="text-jungle-300" size={26} />
                <p className="mt-4 text-2xl font-black leading-tight">Only clear, verified, bookable options.</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Why Pinoxx</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              Less confusion before booking. Better support until check-out.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Pinoxx helps you compare Dandeli stays by location, budget, room type, activities, meals, and group fit. We also help you get a best-price option, plan sightseeing, and stay guided from resort check-in to check-out.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07, duration: 0.4 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <ShieldCheck className="shrink-0 text-jungle-700" size={21} />
                  <span className="font-bold text-slate-800">{point}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-jungle-700 px-5 py-3 font-black text-white transition hover:bg-jungle-900" to="/about">
                About Pinoxx <ArrowRight size={18} />
              </Link>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-black text-slate-900 transition hover:border-jungle-700 hover:bg-jungle-50"
                href={`tel:+${businessWhatsappNumber}`}
              >
                <PhoneCall size={18} />
                Call trip help
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="bg-white py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={stagger}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} transition={{ duration: 0.55 }} className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Top rated stays</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">Best resorts based on ratings</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Browse verified Dandeli stays with ratings, pricing, location, and resort details so Pinoxx can help you choose the best-value option.
              </p>
            </div>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 font-black text-jungle-700 transition hover:bg-jungle-50" to="/resorts">
              View all <ArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div className="grid gap-6 md:grid-cols-3" variants={stagger}>
            {featuredResorts.map((resort) => (
              <motion.div key={resort._id || resort.slug} variants={fadeUp} transition={{ duration: 0.5 }} whileHover={{ y: -8 }}>
                <ResortCard resort={resort} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}
