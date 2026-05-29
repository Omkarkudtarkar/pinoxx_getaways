import { ImagePlus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export function AdminResortPanel({ resort, onClose }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  async function upload(event) {
    event.preventDefault();
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("images", file));
    await api.post(`/admin/resorts/${resort._id}/images`, body);
    setMessage("Images uploaded. Refresh to see the updated gallery.");
    setFiles([]);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur">
      <div className="mx-auto mt-16 max-w-lg rounded-lg bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-jungle-700" size={22} />
            <h2 className="text-xl font-black">Resort Admin</h2>
          </div>
          <button onClick={onClose} aria-label="Close admin panel">
            <X size={21} />
          </button>
        </div>

        {user?.role === "admin" ? (
          <form className="grid gap-4" onSubmit={upload}>
            <p className="text-sm text-slate-600">{resort.name}</p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-sm font-semibold text-slate-700">
              <ImagePlus size={20} />
              Select unlimited gallery images
              <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setFiles(event.target.files)} />
            </label>
            {files.length > 0 && <p className="text-sm text-slate-600">{files.length} file(s) selected</p>}
            {message && <p className="rounded-lg bg-jungle-50 px-3 py-2 text-sm text-jungle-800">{message}</p>}
            <button className="rounded-lg bg-jungle-700 px-4 py-3 font-bold text-white">Upload Images</button>
            <Link className="rounded-lg border border-slate-200 px-4 py-3 text-center font-bold" to="/admin">
              Open Admin Dashboard
            </Link>
          </form>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-600">Admin access is required.</p>
            <Link className="rounded-lg bg-jungle-700 px-4 py-3 text-center font-bold text-white" to="/login">
              Login as Admin
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

