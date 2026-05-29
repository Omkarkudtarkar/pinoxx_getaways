import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResortCard } from "../components/ResortCard";
import { getResorts } from "../lib/api";
import { Seo } from "../lib/Seo";

export function Resorts() {
  const [resorts, setResorts] = useState([]);
  const [filters, setFilters] = useState({ maxPrice: "", rating: "", location: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResorts(filters).then((data) => {
      setResorts(data);
      setLoading(false);
    });
  }, [filters]);

  const locations = useMemo(() => Array.from(new Set(resorts.map((item) => item.location))).filter(Boolean), [resorts]);

  function update(event) {
    setFilters((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  return (
    <main className="bg-slate-50">
      <Seo title="Dandeli Resorts | Pinoxx" description="Explore Dandeli resort listings with price, rating, location filters, and shareable booking pages." />
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Explore resorts</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Dandeli resort stays</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Compare resorts by budget, guest rating, and location. Each resort page is shareable and includes rooms, gallery, amenities, reviews, and booking.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-black text-slate-950">
            <SlidersHorizontal size={20} /> Filters
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select className="rounded-lg border border-slate-200 px-3 py-2" name="maxPrice" value={filters.maxPrice} onChange={update}>
              <option value="">Any price</option>
              <option value="1500">Under Rs 1,500</option>
              <option value="2000">Under Rs 2,000</option>
              <option value="3000">Under Rs 3,000</option>
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-2" name="rating" value={filters.rating} onChange={update}>
              <option value="">Any rating</option>
              <option value="4.8">4.8+</option>
              <option value="4.5">4.5+</option>
              <option value="4">4.0+</option>
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-2" name="location" value={filters.location} onChange={update}>
              <option value="">Any location</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-600">Loading resorts...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resorts.map((resort) => (
              <ResortCard key={resort._id || resort.slug} resort={resort} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

