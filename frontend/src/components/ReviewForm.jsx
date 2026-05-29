import { ImagePlus, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export function ReviewForm({ resortId }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="font-black text-slate-950">Share Your Stay</h3>
        <p className="mt-2 text-sm text-slate-600">Login is required for reviews and image uploads.</p>
        <Link className="mt-4 inline-flex rounded-lg bg-jungle-700 px-4 py-2 text-sm font-bold text-white" to="/login">
          Login
        </Link>
      </div>
    );
  }

  async function submit(event) {
    event.preventDefault();
    const body = new FormData();
    body.append("rating", rating);
    body.append("comment", comment);
    Array.from(images).forEach((file) => body.append("images", file));

    await api.post(`/resorts/${resortId}/reviews`, body);
    setComment("");
    setImages([]);
    setMessage("Review submitted for moderation.");
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5" onSubmit={submit}>
      <h3 className="mb-4 font-black text-slate-950">Share Your Stay</h3>
      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Star size={17} className="text-amber-500" fill="currentColor" />
        <select className="rounded-lg border border-slate-200 px-3 py-2" value={rating} onChange={(event) => setRating(event.target.value)}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
      </label>
      <textarea className="mb-3 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Your review" required />
      <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
        <ImagePlus size={18} />
        Upload review images
        <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setImages(event.target.files)} />
      </label>
      {images.length > 0 && <p className="mb-3 text-sm text-slate-500">{images.length} image(s) selected</p>}
      {message && <p className="mb-3 rounded-lg bg-jungle-50 px-3 py-2 text-sm text-jungle-800">{message}</p>}
      <button className="rounded-lg bg-jungle-700 px-4 py-2 text-sm font-bold text-white">Submit Review</button>
    </form>
  );
}

