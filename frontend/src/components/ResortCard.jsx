import { Star, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { resortImageUrl, useFallbackResortImage } from "../lib/api";
import { formatPerPersonPrice } from "../lib/constants";

const resortTypeLabels = {
  bamboo: "Bamboo Stay",
  mamboo: "Bamboo Stay",
  budget: "Budget",
  premium: "Premium"
};

export function ResortCard({ resort }) {
  const images = useMemo(() => (
    (resort.images || []).filter((image) => image?.url)
  ), [resort.images]);
  const [activeImage, setActiveImage] = useState(0);
  const typeLabel = resortTypeLabels[resort.resortType] || "Budget";
  const meals = resort.meals?.length ? resort.meals : ["Breakfast", "Lunch", "Dinner"];

  useEffect(() => {
    setActiveImage(0);
  }, [resort.slug]);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveImage((index) => (index + 1) % images.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [images.length]);

  const fallbackAlt = resort.name || "Resort";

  return (
    <Link
      to={`/resort/${resort.slug}`}
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {(images.length ? images : [{ url: "", alt: fallbackAlt }]).map((image, index) => (
          <img
            key={`${image.url || "fallback"}-${index}`}
            src={resortImageUrl(image.url)}
            alt={image.alt || fallbackAlt}
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
              index === activeImage ? "opacity-100" : "opacity-0"
            }`}
            loading={index === 0 ? "eager" : "lazy"}
            onError={useFallbackResortImage}
          />
        ))}
        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((image, index) => (
              <span
                key={`${image.url}-dot-${index}`}
                className={`h-1.5 rounded-full bg-white shadow-sm transition-all ${
                  index === activeImage ? "w-5 opacity-95" : "w-1.5 opacity-60"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">{resort.name}</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-bold text-amber-700">
            <Star size={15} fill="currentColor" /> {resort.rating}
          </span>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
          {typeLabel}
        </span>
        <div className="flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-900">
          <Utensils className="mt-0.5 shrink-0" size={15} />
          <span className="line-clamp-2">Meals: {meals.join(", ")}</span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{resort.shortDescription}</p>
        <div className="grid gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Sharing</span>
            <span className="font-black text-jungle-700">{formatPerPersonPrice(resort.sharingPrice || resort.startingPrice)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Couple</span>
            <span className="font-black text-slate-950">{formatPerPersonPrice(resort.couplePrice || resort.startingPrice)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
