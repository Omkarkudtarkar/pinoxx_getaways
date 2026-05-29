import { motion } from "framer-motion";
import { BedDouble, CalendarCheck, ChevronLeft, ChevronRight, Images, MapPin, Share2, Star, UsersRound, Wifi, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminResortPanel } from "../components/AdminResortPanel";
import { BookingForm } from "../components/BookingForm";
import { ReviewForm } from "../components/ReviewForm";
import { assetUrl, getResort } from "../lib/api";
import { formatCurrency } from "../lib/constants";
import { Seo } from "../lib/Seo";

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
                openViewer(gallery, active, resort.name);
              }}
            >
              <img src={assetUrl(gallery[active]?.url)} alt={gallery[active]?.alt || resort.name} className="h-full w-full object-cover" />
            </button>
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {gallery.map((image, index) => (
                <button key={`${image.url}-${index}`} className={`aspect-square overflow-hidden rounded-lg border-2 ${active === index ? "border-jungle-700" : "border-transparent"}`} onClick={() => setActive(index)}>
                  <img src={assetUrl(image.url)} alt={image.alt || resort.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col justify-center">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                <Star size={16} fill="currentColor" /> {resort.rating}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-jungle-50 px-3 py-1 text-sm font-bold text-jungle-800">
                <MapPin size={16} /> {resort.distanceFromBusStandKm} km from bus stand
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-950 sm:text-5xl">{resort.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-slate-600">
              <MapPin size={18} /> {resort.location}
            </p>
            <p className="mt-5 leading-8 text-slate-700">{resort.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-lg bg-slate-950 px-4 py-3 font-black text-white">
                Starts {formatCurrency(resort.startingPrice)}
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
                <p className="font-bold text-slate-500">Starting price</p>
                <p className="mt-1 font-black text-slate-950">{formatCurrency(resort.startingPrice)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-500">Guest rating</p>
                <p className="mt-1 font-black text-slate-950">{resort.rating} / 5</p>
              </div>
            </div>
            <p className="mt-5 leading-8 text-slate-700">{resort.shortDescription}</p>
          </section>

          {fullGallery.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Images className="text-jungle-700" size={22} />
                <h2 className="text-2xl font-black text-slate-950">Photo Gallery</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fullGallery.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    className="overflow-hidden rounded-lg bg-slate-100 text-left"
                    onClick={() => openViewer(fullGallery, index, resort.name)}
                  >
                    <img src={assetUrl(image.url)} alt={image.alt || resort.name} className="aspect-[4/3] w-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

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

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarCheck className="text-jungle-700" size={22} />
              <h2 className="text-2xl font-black text-slate-950">Availability Confirmation</h2>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Availability is verified manually by the Pinoxx admin team. Share your dates, room preference, and group size using the request form, and the team will confirm the latest status directly.
            </p>
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
              <Images className="text-jungle-700" size={22} />
              <h2 className="text-2xl font-black text-slate-950">Guest Reviews</h2>
            </div>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-black text-slate-950">{review.user?.name || "Guest"}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                      <Star size={15} fill="currentColor" /> {review.rating}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{review.comment}</p>
                  {review.images?.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {review.images.map((image, index) => (
                        <img key={`${image.url}-${index}`} src={assetUrl(image.url)} alt={image.alt || "Review"} className="aspect-square rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <ReviewForm resortId={resort._id} />
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
