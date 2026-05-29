import { Menu, MessageCircle, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ContactPopup } from "./ContactPopup";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/resorts", label: "Resorts" }
];

function displayName(user) {
  return user?.name?.trim() || user?.email?.split("@")[0] || "User";
}

function initials(name) {
  return String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const { user, logout } = useAuth();
  const name = displayName(user);
  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${isActive ? "bg-jungle-900 text-white" : "text-slate-700 hover:bg-jungle-50"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-jungle-900 text-lg font-black text-white">
            P
          </span>
          <span>
            <span className="block text-lg font-black leading-none text-slate-950">Pinoxx</span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-jungle-700">Dandeli bookings</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
          <button className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-jungle-50" onClick={() => setContactOpen(true)}>
            Contact
          </button>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-jungle-700 px-4 py-2 text-sm font-bold text-white hover:bg-jungle-900"
            to="/resorts"
          >
            <MessageCircle size={18} />
            Book Now
          </Link>
          {user ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-jungle-900 text-xs font-black text-white">
                {initials(name)}
              </span>
              <span className="max-w-32 truncate text-sm font-black text-slate-900">{name}</span>
              <button className="rounded-md px-2 py-1 text-xs font-black text-slate-600 hover:bg-white hover:text-slate-950" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold" to="/login">
              <UserRound size={17} />
              Login
            </Link>
          )}
        </div>

        <button className="rounded-lg border border-slate-200 p-2 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="grid gap-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <button className="rounded-full px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-jungle-50" onClick={() => { setContactOpen(true); setOpen(false); }}>
              Contact
            </button>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            )}
            {user ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-jungle-900 text-sm font-black text-white">
                    {initials(name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-left text-sm font-black text-slate-700" onClick={() => { logout(); setOpen(false); }}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
      <ContactPopup open={contactOpen} onClose={() => setContactOpen(false)} />
    </header>
  );
}
