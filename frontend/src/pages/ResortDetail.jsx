import { motion } from "framer-motion";
import { BedDouble, Building2, ChevronLeft, ChevronRight, Images, IndianRupee, MapPin, Share2, Star, UsersRound, Waves, Wifi, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminResortPanel } from "../components/AdminResortPanel";
import { BookingForm } from "../components/BookingForm";
import { ReviewForm } from "../components/ReviewForm";
import { assetUrl, getResort } from "../lib/api";
import { formatCurrency } from "../lib/constants";
import { Seo } from "../lib/Seo";

const resortTypeLabels = {
  mamboo: "Mamboo",
  budget: "Budget",
  premium: "Premium"
};

function formatDistance(value) {
  const distance = Number(value);
  if (!Number.isFinite(distance) || distance <= 0) return "Ask Pinoxx";
  return `${distance} km`;
}

function formatReviewDate(value) {
  if (!value) return "Recent review";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent review";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function reviewerInitial(name = "Guest") {
  return name.trim().charAt(0).toUpperCase() || "G";
}

function ratingAverage(reviews = [], fallbackRating = 0) {
  if (!reviews.length) return Number(fallbackRating || 0).toFixed(1);
  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return (total / reviews.length).toFixed(1);
}

export function ResortDetail() {
  const { slug } = useParams();
  const [resort, setResort] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [active, setActive] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    getResort(slug).then(({ resort: item, reviews: resortReviews }) => {
      setResort(item);
      setReviews(resortReviews || []);
    });
  }, [slug]);

  useEffect(() => {
    if (clicks >= 20) {
      setAdminOpen(true);
      setClicks(0);
    }
  }, [clicks]);

  const gallery = useMemo(() => resort?.images || [], [resort]);
  const roomImages = useMemo(() => (
    resort?.rooms?.flatMap((room) => (
      (room.images || []).map((image) => ({ ...image, alt: image.alt || room.name }))
    )) || []
  ), [resort]);
  const fullGallery = useMemo(() => [...gallery, ...roomImages].filter((image) => image?.url), [gallery, roomImages]);
  const heroGallery = fullGallery.length ? fullGallery : gallery;
  const resortTypeLabel = resortTypeLabels[resort?.resortType] || "Budget";
  const averageReviewRating = ratingAverage(reviews, resort?.rating);

  useEffect(() => {
    if (!viewer) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") setViewer(null);
      if (event.key === "ArrowLeft") moveViewer(-1);
      if (event.key === "ArrowRight") moveViewer(1);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewer]);

  useEffect(() => {
    if (heroGallery.length > 0 && active >= heroGallery.length) {
      setActive(0);
    }
  }, [active, heroGallery.length]);

  if (!resort) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-slate-600">Loading resort...</div>;
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: resort.name, text: resort.shortDescription, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function openViewer(images, index = 0, title = resort.name) {
    const items = (images || []).filter((image) => image?.url);
    if (items.length === 0) return;
    setViewer({ images: items, index: Math.min(index, items.length - 1), title });
  }

  function moveViewer(direction) {
    setViewer((current) => {
      if (!current) return current;
      const nextIndex = (current.index + direction + current.images.length) % current.images.length;
      return { ...current, index: nextIndex };
    });
  }

  return (
    <main className="bg-slate-50">
      <Seo title={resort.seoTitle || `${resort.name} | Pinoxx`} description={resort.seoDescription || resort.shortDescription} />
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <button
              className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100 text-left"
              onClick={() => {
                setClicks((value) => value + 1);
                openViewer(heroGallery, active, resort.name);
              }}
            >
              <img src={assetUrl(heroGallery[active]?.url)} alt={heroGallery[active]?.alt || resort.name} className="h-full w-full object-cover" />
            </button>
            {heroGallery.length > 0 && (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Images className="text-jungle-700" size={19} />
                    <h2 className="text-lg font-black text-slate-950">Photo Gallery</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{heroGallery.length} photos</span>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {heroGallery.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      className={`aspect-square overflow-hidden rounded-lg border-2 bg-slate-100 ${
                        active === index ? "border-jungle-700" : "border-transparent"
                      }`}
                      type="button"
                      onClick={() => setActive(index)}
                    >
                      <img src={assetUrl(image.url)} alt={image.alt || resort.name} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col justify-center">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                <Star size={16} fill="currentColor" /> {resort.rating}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-jungle-50 px-3 py-1 text-sm font-bold text-jungle-800">
                <MapPin size={16} /> {resort.distanceFromBusStandKm} km from bus stand
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-river-700">
                <Waves size={16} /> {formatDistance(resort.distanceToWaterActivitiesKm)} to water activities
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-800">
                <Building2 size={16} /> {resortTypeLabel}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-950 sm:text-5xl">{resort.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-slate-600">
              <MapPin size={18} /> {resort.location}
            </p>
            <p className="mt-5 leading-8 text-slate-700">{resort.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-black text-white">
                <IndianRupee size={18} /> Sharing {formatCurrency(resort.sharingPrice || resort.startingPrice)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-jungle-50 px-4 py-3 font-black text-jungle-900">
                <IndianRupee size={18} /> Couple {formatCurrency(resort.couplePrice || resort.startingPrice)}
              </span>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 font-bold" onClick={share}>
                <Share2 size={18} />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="grid gap-8">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Images className="text-jungle-700" size={22} />
              <h2 className="text-2xl font-black text-slate-950">Resort Information</h2>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Location</p>
                <p className="mt-1 font-black text-slate-950">{resort.location}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Distance from bus stand</p>
                <p className="mt-1 font-black text-slate-950">{resort.distanceFromBusStandKm} km</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Distance to water activities</p>
                <p className="mt-1 font-black text-slate-950">{formatDistance(resort.distanceToWaterActivitiesKm)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Resort type</p>
                <p className="mt-1 font-black text-slate-950">{resortTypeLabel}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Sharing price</p>
                <p className="mt-1 font-black text-slate-950">{formatCurrency(resort.sharingPrice || resort.startingPrice)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Couple price</p>
                <p className="mt-1 font-black text-slate-950">{formatCurrency(resort.couplePrice || resort.startingPrice)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Guest rating</p>
                <p className="mt-1 font-black text-slate-950">{resort.rating} / 5</p>
              </div>
            </div>
            <p className="mt-5 leading-8 text-slate-700">{resort.shortDescription}</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wifi className="text-jungle-700" size={22} />
              <h2 className="text-2xl font-black text-slate-950">Amenities & Activities</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-black">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {resort.amenities?.map((item) => (
                    <span key={item} className="rounded-full bg-jungle-50 px-3 py-2 text-sm font-semibold text-jungle-900">{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-black">Activities</h3>
                <div className="flex flex-wrap gap-2">
                  {resort.activities?.map((item) => (
                    <span key={item} className="rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-river-700">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BedDouble className="text-jungle-700" size={22} />
              <h2 className="text-2xl font-black text-slate-950">Room Categories</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {resort.rooms?.map((room) => (
                <div key={room.name} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="grid grid-cols-2 gap-1 bg-slate-100">
                    {(room.images?.length ? room.images : gallery.slice(0, 2)).slice(0, 4).map((image, index) => (
                      <button
                        key={`${room.name}-${image.url}-${index}`}
                        type="button"
                        className="overflow-hidden"
                        onClick={() => openViewer(room.images?.length ? room.images : gallery.slice(0, 2), index, room.name)}
                      >
                        <img
                          src={assetUrl(image.url || gallery[0]?.url)}
                          alt={image.alt || room.name}
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-black text-slate-950">{room.name}</h3>
                      <span className="font-black text-jungle-700">{formatCurrency(room.price)}</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                      <UsersRound size={16} /> Up to {room.capacity} guests
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{room.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ReviewForm resortId={resort._id} />

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="text-amber-500" size={22} fill="currentColor" />
                  <h2 className="text-2xl font-black text-slate-950">Guest Reviews</h2>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">Verified guest feedback for this resort.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-slate-950">{averageReviewRating}</span>
                  <div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={16} fill="currentColor" className={index < Math.round(Number(averageReviewRating)) ? "text-amber-500" : "text-slate-300"} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">{reviews.length || 0} {reviews.length === 1 ? "review" : "reviews"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-jungle-700 text-base font-black text-white">
                      {reviewerInitial(review.user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-slate-950">{review.user?.name || "Guest"}</p>
                          <p className="text-xs font-semibold text-slate-500">{formatReviewDate(review.createdAt)}</p>
                        </div>
                        <span className="rounded-full bg-jungle-50 px-3 py-1 text-xs font-black text-jungle-800">Verified stay</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={16} fill="currentColor" className={index < Math.round(Number(review.rating || 0)) ? "text-amber-500" : "text-slate-300"} />
                        ))}
                        <span className="ml-2 text-sm font-black text-slate-700">{Number(review.rating || 0).toFixed(1)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>
                      {review.images?.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {review.images.map((image, index) => (
                            <button
                              key={`${image.url}-${index}`}
                              type="button"
                              className="overflow-hidden rounded-lg bg-slate-100"
                              onClick={() => openViewer(review.images, index, `${review.user?.name || "Guest"} review`)}
                            >
                              <img src={assetUrl(image.url)} alt={image.alt || "Review"} className="aspect-square w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                  No guest reviews yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingForm resort={resort} />
        </aside>
      </section>

      {adminOpen && <AdminResortPanel resort={resort} onClose={() => setAdminOpen(false)} />}
      {viewer && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-slate-950 text-white"
          role="dialog"
          aria-modal="true"
          onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchStart === null) return;
            const delta = event.changedTouches[0].clientX - touchStart;
            if (Math.abs(delta) > 45) moveViewer(delta > 0 ? -1 : 1);
            setTouchStart(null);
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{viewer.title}</p>
              <p className="text-xs font-bold text-slate-400">{viewer.index + 1} / {viewer.images.length}</p>
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white" onClick={() => setViewer(null)} aria-label="Close image viewer">
              <X size={21} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-5">
            <button className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur" onClick={() => moveViewer(-1)} aria-label="Previous image">
              <ChevronLeft size={28} />
            </button>
            <img src={assetUrl(viewer.images[viewer.index]?.url)} alt={viewer.images[viewer.index]?.alt || viewer.title} className="max-h-full max-w-full object-contain" />
            <button className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur" onClick={() => moveViewer(1)} aria-label="Next image">
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
