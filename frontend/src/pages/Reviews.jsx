import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Send, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Seo } from "../lib/Seo";

const initialForm = {
  rating: 5,
  comment: ""
};

function formatReviewDate(value) {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name = "Guest") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "G";
}

function Avatar({ src, name, size = "h-12 w-12" }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-jungle-700 text-sm font-black text-white ring-2 ring-white`}>
      {initials(name)}
    </span>
  );
}

function GoogleReviewLogin({ onCredential, disabled }) {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;

    let cancelled = false;

    function renderButton() {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => onCredential(credential)
      });
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_blue",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: Math.min(buttonRef.current.offsetWidth || 320, 360)
      });
    }

    if (window.google?.accounts?.id) {
      renderButton();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const script = existing || document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    script.onerror = () => setError("Google login could not load. Please try again.");
    if (!existing) document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential]);

  if (!clientId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
        Google review login is not configured yet. Add `VITE_GOOGLE_CLIENT_ID` in Vercel and `.env`.
      </div>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-70" : ""}>
      <div ref={buttonRef} className="min-h-11 w-full" />
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}

export function Reviews() {
  const { user, googleLogin, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const googleVerified = user?.authProvider === "google";

  useEffect(() => {
    api.get("/pinoxx-reviews")
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "5.0";
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  async function handleGoogleCredential(credential) {
    setMessage("");
    try {
      await googleLogin(credential);
      setMessage("Google verified. You can now add one Pinoxx review.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Google login failed. Please try again.");
    }
  }

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const { data } = await api.post("/pinoxx-reviews", form);
      setReviews((items) => [data.review, ...items]);
      setForm(initialForm);
      setMessage("Thank you. Your verified Google review has been added.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Review could not be submitted right now.");
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(reviewId, voteType) {
    const storageKey = `pinoxx_review_vote_${reviewId}`;
    const existingVote = localStorage.getItem(storageKey);

    if (existingVote) {
      setMessage("You already marked this review from this device.");
      return;
    }

    try {
      const { data } = await api.post(`/pinoxx-reviews/${reviewId}/vote`, { vote: voteType });
      localStorage.setItem(storageKey, voteType);
      setReviews((items) => items.map((item) => (item._id === reviewId ? data.review : item)));
      setMessage(voteType === "useful" ? "Marked as useful." : "Marked as not useful.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Vote could not be saved right now.");
    }
  }

  return (
    <main className="bg-slate-50">
      <Seo title="Pinoxx Reviews | Dandeli Trip Support" description="Share and read verified Google reviews for Pinoxx Dandeli resort pricing, sightseeing, and trip guidance." />

      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-jungle-200">
              <CheckCircle2 size={16} />
              Verified Google reviews
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Real reviews from Google-verified guests.</h1>
            <p className="mt-4 max-w-2xl leading-8 text-slate-200">
              Each person can add one Pinoxx review after Google verification. Their Gmail profile photo is shown with the review to keep feedback authentic.
            </p>
            <div className="mt-7 inline-flex items-center gap-4 rounded-lg border border-white/10 bg-white/10 px-5 py-4">
              <span className="text-4xl font-black">{averageRating}</span>
              <div>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-1 text-sm font-bold text-slate-300">{reviews.length || 0} verified reviews</p>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl"
            onSubmit={submit}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-jungle-50 text-jungle-700">
                <MessageCircle size={22} />
              </span>
              <div>
                <h2 className="text-xl font-black">Add your Pinoxx review</h2>
                <p className="text-sm font-semibold text-slate-500">Google verification is required. One review per person.</p>
              </div>
            </div>

            {googleVerified ? (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-jungle-100 bg-jungle-50 p-3">
                  <Avatar src={user.avatarUrl} name={user.name} />
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">{user.name}</p>
                    <p className="truncate text-sm font-semibold text-slate-600">{user.email}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-black text-jungle-800">
                      <CheckCircle2 size={14} />
                      Google verified
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-black text-slate-700">
                  <Star size={18} className="text-amber-500" fill="currentColor" />
                  Rating
                  <select className="ml-auto rounded-lg border border-slate-200 px-3 py-2 outline-none" name="rating" value={form.rating} onChange={update}>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} stars</option>
                    ))}
                  </select>
                </label>

                <textarea className="mt-3 min-h-32 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-jungle-700" name="comment" value={form.comment} onChange={update} placeholder="Write your Pinoxx review" required />

                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-jungle-700 px-4 py-3 font-black text-white transition hover:bg-jungle-900" disabled={submitting}>
                  <Send size={18} />
                  {submitting ? "Submitting..." : "Submit verified review"}
                </button>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">
                  Continue with Google to verify your Gmail account and profile photo before reviewing Pinoxx.
                </p>
                <GoogleReviewLogin onCredential={handleGoogleCredential} disabled={authLoading} />
              </div>
            )}

            {message && <p className="mt-3 rounded-lg bg-jungle-50 px-3 py-2 text-sm font-bold text-jungle-900">{message}</p>}
          </motion.form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Recent reviews</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">What guests say about Pinoxx</h2>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-600">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center font-semibold text-slate-600">
            No Pinoxx reviews yet. Be the first verified guest to share your experience.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <motion.article
                key={review._id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar src={review.avatarUrl} name={review.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{review.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{formatReviewDate(review.createdAt)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                        <Star size={13} fill="currentColor" />
                        {Number(review.rating || 5).toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-black text-jungle-800">
                      <CheckCircle2 size={13} />
                      Google verified
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full bg-jungle-50 px-3 py-2 text-xs font-black text-jungle-800 transition hover:bg-jungle-100"
                        type="button"
                        onClick={() => vote(review._id, "useful")}
                      >
                        <ThumbsUp size={14} />
                        Useful {Number(review.usefulCount || 0)}
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                        type="button"
                        onClick={() => vote(review._id, "not_useful")}
                      >
                        <ThumbsDown size={14} />
                        Not useful {Number(review.notUsefulCount || 0)}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
