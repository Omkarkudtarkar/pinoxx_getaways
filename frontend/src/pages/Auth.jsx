import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Seo } from "../lib/Seo";

export function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  function update(event) {
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const user = isSignup ? await signup(form) : await login({ email: form.email, password: form.password });
      navigate(user.role === "admin" ? "/admin" : location.state?.from || "/resorts");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Authentication failed because the backend API is offline. Start MongoDB and run npm run dev."
      );
    }
  }

  return (
    <main className="bg-slate-50 py-16">
      <Seo title={`${isSignup ? "Signup" : "Login"} | Pinoxx`} description="Pinoxx account access for reviews, uploads, and admin management." />
      <div className="mx-auto max-w-md px-4">
        <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submit}>
          <h1 className="text-3xl font-black text-slate-950">{isSignup ? "Create Account" : "Login"}</h1>
          <p className="mt-2 text-sm text-slate-600">Required for reviews, image uploads, and admin access.</p>
          <div className="mt-6 grid gap-3">
            {isSignup && (
              <>
                <input className="rounded-lg border border-slate-200 px-3 py-2" name="name" value={form.name} onChange={update} placeholder="Name" required />
                <input className="rounded-lg border border-slate-200 px-3 py-2" name="phone" value={form.phone} onChange={update} placeholder="Phone" />
              </>
            )}
            <input className="rounded-lg border border-slate-200 px-3 py-2" name="email" value={form.email} onChange={update} type="email" placeholder="Email" required />
            <input className="rounded-lg border border-slate-200 px-3 py-2" name="password" value={form.password} onChange={update} type="password" placeholder="Password" required minLength="8" />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="rounded-lg bg-jungle-700 px-4 py-3 font-bold text-white hover:bg-jungle-900" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Signup" : "Login"}
            </button>
          </div>
          <p className="mt-5 text-sm text-slate-600">
            {isSignup ? "Already have an account?" : "Need an account?"}{" "}
            <Link className="font-bold text-jungle-700" to={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Login" : "Signup"}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
