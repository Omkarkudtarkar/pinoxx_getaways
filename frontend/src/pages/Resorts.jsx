import { Building2, IndianRupee, MapPin, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResortCard } from "../components/ResortCard";
import { getResorts } from "../lib/api";
import { Seo } from "../lib/Seo";

const priceFilters = [
  { label: "Any price", value: "any", minPrice: "", maxPrice: "" },
  { label: "Under Rs 2,000", value: "under-2000", minPrice: "", maxPrice: "2000" },
  { label: "Under Rs 2,500", value: "under-2500", minPrice: "", maxPrice: "2500" },
  { label: "Under Rs 3,000", value: "under-3000", minPrice: "", maxPrice: "3000" },
  { label: "Under Rs 5,000", value: "under-5000", minPrice: "", maxPrice: "5000" },
  { label: "Rs 5,000 and above", value: "5000-plus", minPrice: "5000", maxPrice: "" }
];

const resortTypeFilters = [
  { label: "All types", value: "" },
  { label: "Mamboo", value: "mamboo" },
  { label: "Budget", value: "budget" },
  { label: "Premium", value: "premium" }
];

const defaultLocation = "Dandeli";
const initialFilters = { minPrice: "", maxPrice: "", rating: "", location: defaultLocation, resortType: "" };

function filterSelectClassName() {
  return "min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 outline-none transition focus:border-jungle-700 focus:ring-2 focus:ring-jungle-100";
}

function FilterFields({ filters, locations, onFieldChange, onPriceChange }) {
  const activePriceFilter = priceFilters.find(
    (item) => item.minPrice === filters.minPrice && item.maxPrice === filters.maxPrice
  ) || priceFilters[0];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <label className="grid gap-2 text-sm font-black text-slate-800">
        <span className="flex items-center gap-2">
          <IndianRupee size={16} /> Select price
        </span>
        <select className={filterSelectClassName()} value={activePriceFilter.value} onChange={onPriceChange}>
          {priceFilters.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-black text-slate-800">
        <span className="flex items-center gap-2">
          <Building2 size={16} /> Resort type
        </span>
        <select className={filterSelectClassName()} name="resortType" value={filters.resortType} onChange={onFieldChange}>
          {resortTypeFilters.map((type) => (
            <option key={type.value || "all"} value={type.value}>{type.label}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-black text-slate-800">
        <span className="flex items-center gap-2">
          <Star size={16} /> Rating
        </span>
        <select className={filterSelectClassName()} name="rating" value={filters.rating} onChange={onFieldChange}>
          <option value="">Any rating</option>
          <option value="4.8">4.8+</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm font-black text-slate-800">
        <span className="flex items-center gap-2">
          <MapPin size={16} /> Location
        </span>
        <select className={filterSelectClassName()} name="location" value={filters.location} onChange={onFieldChange}>
          <option value={defaultLocation}>{defaultLocation}</option>
          {locations.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function Resorts() {
  const [resorts, setResorts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getResorts(filters).then((data) => {
      setResorts(data);
      setLoading(false);
    });
  }, [filters]);

  const locations = useMemo(
    () => Array.from(new Set(resorts.map((item) => item.location))).filter((location) => location && location !== defaultLocation),
    [resorts]
  );
  const activePriceFilter = priceFilters.find(
    (item) => item.minPrice === filters.minPrice && item.maxPrice === filters.maxPrice
  ) || priceFilters[0];
  const activeResortType = resortTypeFilters.find((item) => item.value === filters.resortType) || resortTypeFilters[0];
  const hasFilters = Object.keys(initialFilters).some((key) => filters[key] !== initialFilters[key]);

  function update(event) {
    setFilters((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  function updatePrice(event) {
    const option = priceFilters.find((item) => item.value === event.target.value) || priceFilters[0];

    setFilters((value) => ({
      ...value,
      minPrice: option.minPrice,
      maxPrice: option.maxPrice
    }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  return (
    <main className="bg-slate-50 pb-24 md:pb-0">
      <Seo title="Dandeli Resorts | Pinoxx" description="Explore Dandeli resort listings with price, rating, location filters, and shareable booking pages." />
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Explore resorts</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Dandeli resort stays</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Compare resorts by budget, guest rating, and location. Each resort page is shareable and includes rooms, gallery, amenities, reviews, and booking.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-slate-950">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-jungle-50 text-jungle-700">
                  <SlidersHorizontal size={19} />
                </span>
                Filters
              </div>
              <p className="mt-1 text-sm text-slate-500">Shortlist stays by package budget, rating, and area.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                {loading ? "Checking..." : `${resorts.length} ${resorts.length === 1 ? "resort" : "resorts"}`}
              </span>
              {hasFilters ? (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-jungle-500 hover:text-jungle-700"
                  type="button"
                  onClick={resetFilters}
                >
                  <X size={16} /> Reset
                </button>
              ) : null}
            </div>
          </div>

          <div className="p-4">
            <FilterFields filters={filters} locations={locations} onFieldChange={update} onPriceChange={updatePrice} />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div>
            <p className="text-sm font-black text-slate-950">{filters.location || defaultLocation}</p>
            <p className="text-xs font-semibold text-slate-500">
              {loading ? "Checking resorts" : `${activePriceFilter.label} · ${activeResortType.label} · ${resorts.length} ${resorts.length === 1 ? "resort" : "resorts"}`}
            </p>
          </div>
          {hasFilters ? (
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700" type="button" onClick={resetFilters}>
              Reset
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-600">Loading resorts...</div>
        ) : resorts.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-xl font-black text-slate-950">No resorts found</h2>
            <p className="mt-2 text-slate-600">Try a wider budget range or clear the filters.</p>
            <button
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-jungle-900"
              type="button"
              onClick={resetFilters}
            >
              <X size={16} /> Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resorts.map((resort) => (
              <ResortCard key={resort._id || resort.slug} resort={resort} />
            ))}
          </div>
        )}
      </section>

      <button
        className="fixed inset-x-4 bottom-4 z-40 flex min-h-14 items-center justify-between rounded-lg bg-slate-950 px-4 py-3 text-left text-white shadow-soft md:hidden"
        type="button"
        onClick={() => setMobileFiltersOpen(true)}
      >
        <span className="inline-flex items-center gap-2 text-sm font-black">
          <SlidersHorizontal size={18} /> Filters
        </span>
        <span className="max-w-[58%] truncate text-right text-xs font-bold text-slate-200">
          {filters.location || defaultLocation} · {activePriceFilter.label} · {activeResortType.label}
        </span>
      </button>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 md:hidden" role="dialog" aria-modal="true" aria-label="Resort filters">
          <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-lg bg-white shadow-soft">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Filter resorts</h2>
                <p className="text-sm font-semibold text-slate-500">{loading ? "Checking availability" : `${resorts.length} matching stays`}</p>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 px-4 py-5">
              <FilterFields filters={filters} locations={locations} onFieldChange={update} onPriceChange={updatePrice} />
            </div>

            <div className="sticky bottom-0 grid grid-cols-[0.8fr_1.2fr] gap-3 border-t border-slate-100 bg-white p-4">
              <button
                className="min-h-12 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50"
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
              >
                Reset
              </button>
              <button
                className="min-h-12 rounded-lg bg-jungle-700 px-4 py-3 text-sm font-black text-white"
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show resorts
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
