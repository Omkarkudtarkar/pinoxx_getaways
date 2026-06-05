import { IndianRupee, SlidersHorizontal, Star, Trees, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  { label: "Budget", value: "budget", icon: IndianRupee, description: "Best-value stays for simple Dandeli trips." },
  { label: "Premium", value: "premium", icon: Star, description: "Higher comfort stays with stronger amenities." },
  { label: "Bamboo Stay", value: "mamboo", icon: Trees, description: "Nature-style stays for forest and group trips." }
];

const initialFilters = { minPrice: "", maxPrice: "", rating: "", resortType: "" };

function filterSelectClassName() {
  return "min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-jungle-700 focus:ring-2 focus:ring-jungle-100";
}

function CategorySections({ filters, onSelect, stacked = false }) {
  return (
    <div className={stacked ? "grid gap-3" : "grid gap-3 md:grid-cols-3"}>
      {resortTypeFilters.map((type) => (
        <button
          key={type.value}
          className={`flex min-h-28 items-start gap-4 rounded-lg border p-4 text-left transition ${
            filters.resortType === type.value
              ? "border-jungle-700 bg-jungle-50 shadow-soft"
              : "border-slate-200 bg-white hover:border-jungle-300 hover:bg-jungle-50/40"
          }`}
          type="button"
          onClick={() => onSelect(type.value)}
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${filters.resortType === type.value ? "bg-jungle-700 text-white" : "bg-slate-100 text-slate-700"}`}>
            <type.icon size={22} />
          </span>
          <span>
            <span className="block font-black text-slate-950">{type.label}</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{type.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function FilterFields({ filters, onFieldChange, onPriceChange, stacked = false }) {
  const activePriceFilter = priceFilters.find(
    (item) => item.minPrice === filters.minPrice && item.maxPrice === filters.maxPrice
  ) || priceFilters[0];
  const controlsDisabled = !filters.resortType;

  return (
    <div className={stacked ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
      <label className="grid gap-2 text-sm font-black text-slate-800">
        <span className="flex items-center gap-2">
          <IndianRupee size={16} /> Select price
        </span>
        <select className={filterSelectClassName()} value={activePriceFilter.value} onChange={onPriceChange} disabled={controlsDisabled}>
          {priceFilters.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-black text-slate-800">
        <span className="flex items-center gap-2">
          <Star size={16} /> Rating
        </span>
        <select className={filterSelectClassName()} name="rating" value={filters.rating} onChange={onFieldChange} disabled={controlsDisabled}>
          <option value="">Any rating</option>
          <option value="4.8">4.8+</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
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

  const activePriceFilter = priceFilters.find(
    (item) => item.minPrice === filters.minPrice && item.maxPrice === filters.maxPrice
  ) || priceFilters[0];
  const activeResortType = resortTypeFilters.find((item) => item.value === filters.resortType) || { label: "Choose stay section" };
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

  function updateResortType(resortType) {
    setFilters((value) => ({ ...value, resortType }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  return (
    <main className="bg-slate-50 pb-24 md:pb-0">
      <Seo title="Dandeli Resorts | Pinoxx" description="Explore Dandeli resort listings by Budget, Premium, and Bamboo Stay sections with price and rating filters." />
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Explore resorts</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Dandeli resort stays</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Choose Budget, Premium, or Bamboo Stay, then shortlist resorts by price and guest rating. Pinoxx can help you get the best-value option.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div>
            <p className="text-sm font-black text-slate-950">{activeResortType?.label || "Choose stay section"}</p>
            <p className="text-xs font-semibold text-slate-500">
              {loading ? "Checking resorts" : `${activePriceFilter.label} - ${resorts.length} ${resorts.length === 1 ? "resort" : "resorts"}`}
            </p>
          </div>
          {hasFilters ? (
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700" type="button" onClick={resetFilters}>
              Reset
            </button>
          ) : null}
        </div>

        <div className="grid gap-8 md:grid-cols-[310px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-2 font-black">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-jungle-300">
                    <SlidersHorizontal size={19} />
                  </span>
                  Resort filters
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Select a stay section first. Price and rating filters stay here on the left.</p>
              </div>

              <div className="grid gap-5 p-5">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
                  <span className="text-sm font-bold text-slate-600">Matching stays</span>
                  <span className="rounded-lg bg-white px-3 py-1 text-sm font-black text-slate-950 shadow-sm">
                    {loading ? "Checking" : resorts.length}
                  </span>
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Stay section</p>
                  <CategorySections filters={filters} onSelect={updateResortType} stacked />
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Price and rating</p>
                  <FilterFields filters={filters} onFieldChange={update} onPriceChange={updatePrice} stacked />
                </div>

                {!filters.resortType ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm font-bold leading-6 text-amber-800">
                    Choose Budget, Premium, or Bamboo Stay to enable price and rating.
                  </p>
                ) : null}

                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-jungle-500 hover:text-jungle-700 disabled:bg-slate-50"
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasFilters}
                >
                  <X size={16} /> Reset filters
                </button>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 hidden items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex">
              <div>
                <p className="text-sm font-black text-slate-950">{activeResortType.label}</p>
                <p className="text-xs font-semibold text-slate-500">{activePriceFilter.label} with {filters.rating ? `${filters.rating}+ rating` : "any rating"}</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                {loading ? "Checking..." : `${resorts.length} ${resorts.length === 1 ? "resort" : "resorts"}`}
              </span>
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
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {resorts.map((resort) => (
                  <ResortCard key={resort._id || resort.slug} resort={resort} />
                ))}
              </div>
            )}
          </div>
        </div>
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
          {activeResortType.label} - {activePriceFilter.label}
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
              <CategorySections filters={filters} onSelect={updateResortType} />
              <FilterFields filters={filters} onFieldChange={update} onPriceChange={updatePrice} />
              {!filters.resortType ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                  Select Budget, Premium, or Bamboo Stay to enable price and rating filters.
                </p>
              ) : null}
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
