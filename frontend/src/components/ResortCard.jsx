import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { assetUrl } from "../lib/api";
import { formatCurrency } from "../lib/constants";

export function ResortCard({ resort }) {
  const image = resort.images?.[0]?.url;

  return (
    <Link
      to={`/resorts/${resort.slug}`}
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={assetUrl(image)}
          alt={resort.images?.[0]?.alt || resort.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">{resort.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
              <MapPin size={15} /> {resort.location}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-bold text-amber-700">
            <Star size={15} fill="currentColor" /> {resort.rating}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{resort.shortDescription}</p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">Starting from</span>
          <span className="text-lg font-black text-jungle-700">{formatCurrency(resort.startingPrice)}</span>
        </div>
      </div>
    </Link>
  );
}

