import {
  BarChart3,
  Building2,
  Check,
  Edit3,
  ImagePlus,
  MessageCircle,
  PhoneCall,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  UsersRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, assetUrl, getResorts } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { whatsappUrl } from "../lib/constants";
import { Seo } from "../lib/Seo";

const tabs = [
  { id: "requests", label: "Call Requests", icon: PhoneCall },
  { id: "bookings", label: "Bookings", icon: Check },
  { id: "resorts", label: "Resorts", icon: Building2 },
  { id: "reviews", label: "Reviews", icon: ShieldAlert },
  { id: "analytics", label: "Customer Graph", icon: BarChart3 }
];

const graphRanges = [
  { id: "day", label: "Day", days: 1, bucket: "hour" },
  { id: "week", label: "Week", days: 7, bucket: "day" },
  { id: "15days", label: "15 Days", days: 15, bucket: "day" },
  { id: "month", label: "Month", days: 30, bucket: "day" },
  { id: "6months", label: "6 Months", days: 180, bucket: "month" },
  { id: "year", label: "Year", days: 365, bucket: "month" }
];

const resortTypes = [
  { value: "mamboo", label: "Mamboo" },
  { value: "budget", label: "Budget" },
  { value: "premium", label: "Premium" }
];

const initialResortForm = {
  slug: "",
  name: "",
  location: "Dandeli",
  resortType: "budget",
  shortDescription: "",
  description: "",
  startingPrice: "",
  sharingPrice: "",
  couplePrice: "",
  rating: "4.5",
  distanceFromBusStandKm: "",
  distanceToWaterActivitiesKm: "",
  amenities: "",
  activities: "",
  seoTitle: "",
  seoDescription: "",
  availabilitySheetUrl: "",
  images: []
};

const emptyRoom = {
  name: "",
  price: "",
  capacity: 2,
  description: "",
  images: [],
  imageFiles: []
};

function dateRange(booking) {
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return `${new Date(booking.checkIn).toLocaleDateString("en-IN", options)} - ${new Date(booking.checkOut).toLocaleDateString("en-IN", options)}`;
}

function toCsv(items = []) {
  return items.join(", ");
}

function resortToForm(resort) {
  return {
    slug: resort.slug || "",
    name: resort.name || "",
    location: resort.location || "Dandeli",
    resortType: resort.resortType || "budget",
    shortDescription: resort.shortDescription || "",
    description: resort.description || "",
    startingPrice: resort.startingPrice || "",
    sharingPrice: resort.sharingPrice || "",
    couplePrice: resort.couplePrice || "",
    rating: resort.rating || "4.5",
    distanceFromBusStandKm: resort.distanceFromBusStandKm || "",
    distanceToWaterActivitiesKm: resort.distanceToWaterActivitiesKm || "",
    amenities: toCsv(resort.amenities),
    activities: toCsv(resort.activities),
    seoTitle: resort.seoTitle || "",
    seoDescription: resort.seoDescription || "",
    availabilitySheetUrl: resort.availabilitySheetUrl || "",
    images: resort.images || []
  };
}

function normalizeRooms(rooms) {
  return rooms
    .filter((room) => room.name?.trim())
    .map((room) => ({
      name: room.name.trim(),
      price: Number(room.price || 0),
      capacity: Number(room.capacity || 1),
      description: room.description?.trim() || "",
      images: room.images || []
    }));
}

function appendResortPayload(body, form, rooms, files) {
  const resortFiles = Array.from(files || []);
  const roomFileLists = rooms.map((room) => Array.from(room.imageFiles || []));

  Object.entries(form).forEach(([key, value]) => {
    if (key === "images") {
      body.append("images", JSON.stringify(value || []));
    } else {
      body.append(key, value);
    }
  });
  body.append("resortImageCount", String(resortFiles.length));
  body.append("roomImageCounts", JSON.stringify(roomFileLists.map((items) => items.length)));
  body.append("rooms", JSON.stringify(normalizeRooms(rooms)));
  resortFiles.forEach((file) => body.append("images", file));
  roomFileLists.flat().forEach((file) => body.append("images", file));
}

function customerWhatsappUrl(contact) {
  const phone = String(contact.phone || "").replace(/[^\d]/g, "");
  const message = [
    "Hi, this is Pinoxx.",
    "We received your request.",
    `Name: ${contact.name}`,
    `People: ${contact.peopleCount || 1}`,
    contact.requestCall ? "You requested a call back." : "",
    "How can we help with your Dandeli booking?"
  ].filter(Boolean).join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function availabilityReplyUrl(contact, available) {
  const phone = String(contact.phone || "").replace(/[^\d]/g, "");
  const bookingUrl = contact.bookingUrl ||
    (contact.resortSlug ? `${window.location.origin}/resorts/${contact.resortSlug}` : `${window.location.origin}/resorts`);
  const dateText = [contact.checkIn || contact.preferredDate, contact.checkOut].filter(Boolean).join(" to ");
  const message = available
    ? [
        `Hi ${contact.name}, availability is confirmed.`,
        contact.resortName ? `Resort: ${contact.resortName}` : "",
        contact.roomCategory ? `Room: ${contact.roomCategory}` : "",
        dateText ? `Date: ${dateText}` : "",
        "You can now open this page, select the same date, and pay the UPI advance:",
        bookingUrl
      ].filter(Boolean).join("\n")
    : [
        `Hi ${contact.name}, sorry, availability is not available for the selected date.`,
        contact.resortName ? `Resort: ${contact.resortName}` : "",
        contact.roomCategory ? `Room: ${contact.roomCategory}` : "",
        dateText ? `Date: ${dateText}` : "",
        "Please share another date and we will check again."
      ].filter(Boolean).join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function businessContactMessage(contact) {
  return [
    "Want to contact this customer",
    contact.contactType ? `Request type: ${contact.contactType.replaceAll("_", " ")}` : "",
    contact.resortName ? `Resort: ${contact.resortName}` : "",
    contact.roomCategory ? `Room: ${contact.roomCategory}` : "",
    contact.checkIn ? `Check-in: ${contact.checkIn}` : "",
    contact.checkOut ? `Check-out: ${contact.checkOut}` : "",
    `Name: ${contact.name}`,
    `Phone: ${contact.phone}`,
    contact.email ? `Email: ${contact.email}` : "",
    `People: ${contact.peopleCount || 1}`,
    contact.requestCall ? "Request: Call back requested" : "",
    contact.preferredDate ? `Preferred date: ${contact.preferredDate}` : "",
    contact.preferredTime ? `Preferred time: ${contact.preferredTime}` : "",
    contact.bookingUrl ? `Booking page: ${contact.bookingUrl}` : "",
    `Message: ${contact.message}`
  ].filter(Boolean).join("\n");
}

function buildCustomerGraph(contacts, bookings, rangeId) {
  const range = graphRanges.find((item) => item.id === rangeId) || graphRanges[1];
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - range.days + 1);
  start.setHours(0, 0, 0, 0);

  const source = [
    ...contacts.map((item) => ({ type: "request", date: item.createdAt })),
    ...bookings.map((item) => ({ type: "booking", date: item.createdAt }))
  ].filter((item) => item.date && new Date(item.date) >= start);

  if (range.bucket === "hour") {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour),
      label: `${String(hour).padStart(2, "0")}:00`,
      requests: 0,
      bookings: 0
    }));
    source.forEach((item) => {
      const date = new Date(item.date);
      const index = date.getHours();
      buckets[index][item.type === "booking" ? "bookings" : "requests"] += 1;
    });
    return buckets;
  }

  if (range.bucket === "month") {
    const bucketCount = range.id === "year" ? 12 : 6;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - bucketCount + 1 + index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        requests: 0,
        bookings: 0
      };
    });
    source.forEach((item) => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.find((entry) => entry.key === key);
      if (bucket) bucket[item.type === "booking" ? "bookings" : "requests"] += 1;
    });
    return buckets;
  }

  const buckets = Array.from({ length: range.days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      requests: 0,
      bookings: 0
    };
  });
  source.forEach((item) => {
    const key = new Date(item.date).toISOString().slice(0, 10);
    const bucket = buckets.find((entry) => entry.key === key);
    if (bucket) bucket[item.type === "booking" ? "bookings" : "requests"] += 1;
  });
  return buckets;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedResort, setSelectedResort] = useState("");
  const [files, setFiles] = useState([]);
  const [resortFiles, setResortFiles] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [resortForm, setResortForm] = useState(initialResortForm);
  const [rooms, setRooms] = useState([{ ...emptyRoom }]);
  const [editingResortId, setEditingResortId] = useState("");
  const [editForm, setEditForm] = useState(initialResortForm);
  const [editRooms, setEditRooms] = useState([{ ...emptyRoom }]);
  const [savingResort, setSavingResort] = useState(false);
  const [graphRange, setGraphRange] = useState("week");

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([
      api.get("/admin/summary"),
      api.get("/admin/bookings"),
      api.get("/admin/contacts"),
      api.get("/admin/reviews"),
      getResorts()
    ]).then(([summaryResponse, bookingsResponse, contactsResponse, reviewsResponse, resortList]) => {
      setSummary(summaryResponse.data);
      setBookings(bookingsResponse.data.bookings || []);
      setContacts(contactsResponse.data.contacts || []);
      setReviews(reviewsResponse.data.reviews || []);
      setResorts(resortList || []);
      setSelectedResort(resortList?.[0]?._id || "");
    });
  }, [user]);

  const graphData = useMemo(() => buildCustomerGraph(contacts, bookings, graphRange), [contacts, bookings, graphRange]);
  const graphMax = Math.max(1, ...graphData.map((item) => item.requests + item.bookings));
  const newContactCount = contacts.filter((contact) => contact.status === "new").length;
  const availabilityRequestCount = contacts.filter((contact) => contact.contactType === "availability_check").length;
  const metricItems = [
    { label: "Resorts", value: summary?.resorts || resorts.length || 0, icon: Building2 },
    { label: "Bookings", value: summary?.bookings || bookings.length || 0, icon: Check },
    { label: "New Requests", value: newContactCount, icon: PhoneCall },
    { label: "Users", value: summary?.users || 0, icon: UsersRound },
    { label: "Pending Reviews", value: summary?.pendingReviews || 0, icon: ShieldAlert }
  ];

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/resorts" replace />;

  async function moderate(id, status) {
    const { data } = await api.patch(`/admin/reviews/${id}`, { status });
    setReviews((items) => items.map((item) => (item._id === id ? data.review : item)));
  }

  async function updateBooking(id, status) {
    const { data } = await api.patch(`/admin/bookings/${id}`, { status });
    setBookings((items) => items.map((item) => (item._id === id ? data.booking : item)));
  }

  async function updateContact(id, status) {
    const { data } = await api.patch(`/admin/contacts/${id}`, { status });
    setContacts((items) => items.map((item) => (item._id === id ? data.contact : item)));
  }

  async function uploadImages(event) {
    event.preventDefault();
    if (!selectedResort) return;
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("images", file));
    const { data } = await api.post(`/admin/resorts/${selectedResort}/images`, body);
    setResorts((items) => items.map((item) => (item._id === selectedResort ? data.resort : item)));
    setMessage("Images uploaded successfully.");
    setFiles([]);
  }

  function updateResortForm(event) {
    setResortForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  function updateEditForm(event) {
    setEditForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  }

  function updateRoom(setter, index, field, value) {
    setter((items) => items.map((room, roomIndex) => (
      roomIndex === index ? { ...room, [field]: value } : room
    )));
  }

  function addRoom(setter) {
    setter((items) => [...items, { ...emptyRoom }]);
  }

  function removeRoom(setter, index) {
    setter((items) => items.length === 1 ? items : items.filter((_, roomIndex) => roomIndex !== index));
  }

  function removeRoomImage(setter, roomIndex, imageIndex) {
    setter((items) => items.map((room, index) => (
      index === roomIndex
        ? { ...room, images: (room.images || []).filter((_, currentIndex) => currentIndex !== imageIndex) }
        : room
    )));
  }

  async function createResort(event) {
    event.preventDefault();
    setSavingResort(true);
    setMessage("");

    const preparedRooms = normalizeRooms(rooms);
    if (preparedRooms.length === 0) {
      setMessage("Add at least one room category before creating the resort.");
      setSavingResort(false);
      return;
    }

    try {
      const body = new FormData();
      appendResortPayload(body, resortForm, rooms, resortFiles);
      const { data } = await api.post("/admin/resorts", body);
      const createdResort = data.resort;
      setResorts((items) => [createdResort, ...items]);
      setSelectedResort(createdResort._id);
      setSummary((value) => value ? { ...value, resorts: (value.resorts || 0) + 1 } : value);
      setResortForm(initialResortForm);
      setRooms([{ ...emptyRoom }]);
      setResortFiles([]);
      setMessage(`Created ${createdResort.name}.`);
    } catch (err) {
      setMessage(err.response?.data?.message || "Resort could not be created.");
    } finally {
      setSavingResort(false);
    }
  }

  function startEditResort(resort) {
    setEditingResortId(resort._id);
    setEditForm(resortToForm(resort));
    setEditRooms((resort.rooms?.length ? resort.rooms : [{ ...emptyRoom }]).map((room) => ({ ...emptyRoom, ...room, imageFiles: [] })));
    setEditFiles([]);
  }

  async function saveResort(event) {
    event.preventDefault();
    if (!editingResortId) return;
    const preparedRooms = normalizeRooms(editRooms);
    if (preparedRooms.length === 0) {
      setMessage("Add at least one room category before saving the resort.");
      return;
    }

    try {
      const body = new FormData();
      appendResortPayload(body, editForm, editRooms, editFiles);
      const { data } = await api.patch(`/admin/resorts/${editingResortId}`, body);
      setResorts((items) => items.map((item) => (item._id === editingResortId ? data.resort : item)));
      setSelectedResort(data.resort._id);
      setEditingResortId("");
      setEditFiles([]);
      setMessage(`Updated ${data.resort.name}.`);
    } catch (err) {
      setMessage(err.response?.data?.message || "Resort could not be updated.");
    }
  }

  async function deleteResort(id) {
    const resort = resorts.find((item) => item._id === id);
    const confirmed = window.confirm(`Delete ${resort?.name || "this resort"} from public listings?`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/resorts/${id}`);
      setResorts((items) => items.filter((item) => item._id !== id));
      setSelectedResort((value) => value === id ? "" : value);
      setSummary((value) => value ? { ...value, resorts: Math.max(0, (value.resorts || 1) - 1) } : value);
      setMessage("Resort deleted from public listings.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Resort could not be deleted.");
    }
  }

  function renderRoomEditor(roomItems, setter) {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-black text-slate-950">Room Categories</h3>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => addRoom(setter)}>
            <Plus size={16} />
            Add Room
          </button>
        </div>
        {roomItems.map((room, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
            <input className="rounded-lg border border-slate-200 px-3 py-2" value={room.name} onChange={(event) => updateRoom(setter, index, "name", event.target.value)} placeholder="Room name" required={index === 0} />
            <input className="rounded-lg border border-slate-200 px-3 py-2" value={room.price} onChange={(event) => updateRoom(setter, index, "price", event.target.value)} type="number" min="0" placeholder="Price" required={index === 0} />
            <input className="rounded-lg border border-slate-200 px-3 py-2" value={room.capacity} onChange={(event) => updateRoom(setter, index, "capacity", event.target.value)} type="number" min="1" placeholder="Capacity" required={index === 0} />
            <button type="button" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-slate-700" onClick={() => removeRoom(setter, index)} aria-label="Remove room">
              <Trash2 size={18} />
            </button>
            <textarea className="min-h-16 rounded-lg border border-slate-200 px-3 py-2 md:col-span-4" value={room.description} onChange={(event) => updateRoom(setter, index, "description", event.target.value)} placeholder="Room description" />
            <div className="grid gap-3 md:col-span-4">
              {room.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {room.images.map((image, imageIndex) => (
                    <div key={`${image.url}-${imageIndex}`} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img src={assetUrl(image.url)} alt={image.alt || room.name || "Room"} className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm"
                        onClick={() => removeRoomImage(setter, index, imageIndex)}
                        aria-label="Remove room image"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm font-semibold text-slate-700">
                <ImagePlus size={18} />
                Add images for this room
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => updateRoom(setter, index, "imageFiles", event.target.files)}
                />
              </label>
              {room.imageFiles?.length > 0 && <p className="text-sm text-slate-600">{room.imageFiles.length} room image(s) selected</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderResortFields(form, update) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="name" value={form.name} onChange={update} placeholder="Resort name" required />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="location" value={form.location} onChange={update} placeholder="Location" required />
        <select className="rounded-lg border border-slate-200 px-3 py-2" name="resortType" value={form.resortType} onChange={update}>
          {resortTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="startingPrice" value={form.startingPrice} onChange={update} type="number" min="0" placeholder="Base starting price optional" />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="sharingPrice" value={form.sharingPrice} onChange={update} type="number" min="0" placeholder="Sharing price" />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="couplePrice" value={form.couplePrice} onChange={update} type="number" min="0" placeholder="Couple price" />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="distanceFromBusStandKm" value={form.distanceFromBusStandKm} onChange={update} type="number" min="0" step="0.1" placeholder="Distance from bus stand (km)" required />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="distanceToWaterActivitiesKm" value={form.distanceToWaterActivitiesKm} onChange={update} type="number" min="0" step="0.1" placeholder="Distance to water activities (km)" />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="rating" value={form.rating} onChange={update} type="number" min="0" max="5" step="0.1" placeholder="Rating" />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="seoTitle" value={form.seoTitle} onChange={update} placeholder="SEO title optional" />
        <input className="rounded-lg border border-slate-200 px-3 py-2 md:col-span-2" name="shortDescription" value={form.shortDescription} onChange={update} placeholder="Short description" required />
        <textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 md:col-span-2" name="description" value={form.description} onChange={update} placeholder="Full resort description" required />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="amenities" value={form.amenities} onChange={update} placeholder="Amenities, comma separated" />
        <input className="rounded-lg border border-slate-200 px-3 py-2" name="activities" value={form.activities} onChange={update} placeholder="Activities, comma separated" />
        <input className="rounded-lg border border-slate-200 px-3 py-2 md:col-span-2" name="availabilitySheetUrl" value={form.availabilitySheetUrl} onChange={update} placeholder="Google Sheet availability URL" />
        <textarea className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 md:col-span-2" name="seoDescription" value={form.seoDescription} onChange={update} placeholder="SEO description optional" />
      </div>
    );
  }

  return (
    <main className="bg-slate-50 py-8">
      <Seo title="Pinoxx Admin Dashboard" description="Pinoxx admin dashboard for requests, bookings, resorts, reviews, and customer analytics." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-jungle-700">Personal Admin Dashboard</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Pinoxx bookings and requests</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Manage call requests, availability leads, bookings, resort information, customer trends, and review moderation from one admin panel.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metricItems.map((item) => (
            <button key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
              <item.icon className="text-jungle-700" size={24} />
              <div className="mt-4 text-3xl font-black text-slate-950">{item.value}</div>
              <div className="text-sm font-bold text-slate-500">{item.label}</div>
            </button>
          ))}
        </section>

        <nav className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black ${activeTab === tab.id ? "bg-jungle-700 text-white" : "text-slate-700 hover:bg-jungle-50"}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {message && <p className="rounded-lg bg-jungle-50 px-4 py-3 text-sm font-bold text-jungle-900">{message}</p>}

        {activeTab === "requests" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-slate-950">Call & Availability Requests</h2>
                <p className="mt-1 text-sm text-slate-500">{availabilityRequestCount} availability request(s), {newContactCount} new request(s).</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 py-2">Customer</th>
                    <th className="border-b border-slate-200 py-2">Phone</th>
                    <th className="border-b border-slate-200 py-2">People</th>
                    <th className="border-b border-slate-200 py-2">Request</th>
                    <th className="border-b border-slate-200 py-2">Call</th>
                    <th className="border-b border-slate-200 py-2">Message</th>
                    <th className="border-b border-slate-200 py-2">Status</th>
                    <th className="border-b border-slate-200 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact._id}>
                      <td className="border-b border-slate-100 py-3">
                        <p className="font-semibold text-slate-950">{contact.name}</p>
                        {contact.email && <p className="text-xs text-slate-500">{contact.email}</p>}
                      </td>
                      <td className="border-b border-slate-100 py-3">{contact.phone}</td>
                      <td className="border-b border-slate-100 py-3">{contact.peopleCount || 1}</td>
                      <td className="border-b border-slate-100 py-3">
                        <p className="font-semibold capitalize text-slate-700">{contact.contactType?.replaceAll("_", " ") || "message"}</p>
                        {(contact.preferredDate || contact.preferredTime) && (
                          <p className="text-xs text-slate-500">{[contact.preferredDate, contact.preferredTime].filter(Boolean).join(" at ")}</p>
                        )}
                        {contact.resortName && <p className="mt-1 text-xs font-bold text-jungle-700">{contact.resortName}</p>}
                        {(contact.checkIn || contact.checkOut) && (
                          <p className="text-xs text-slate-500">{[contact.checkIn, contact.checkOut].filter(Boolean).join(" to ")}</p>
                        )}
                      </td>
                      <td className="border-b border-slate-100 py-3">{contact.requestCall ? "Requested" : "-"}</td>
                      <td className="max-w-sm border-b border-slate-100 py-3 text-slate-600">{contact.message}</td>
                      <td className="border-b border-slate-100 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">{contact.status}</span>
                      </td>
                      <td className="border-b border-slate-100 py-3">
                        <div className="flex flex-wrap gap-2">
                          <a className="inline-flex items-center gap-1 rounded-lg bg-jungle-700 px-3 py-2 text-xs font-bold text-white" href={customerWhatsappUrl(contact)} target="_blank" rel="noreferrer">
                            <MessageCircle size={15} /> Customer
                          </a>
                          <a className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" href={whatsappUrl(businessContactMessage(contact))} target="_blank" rel="noreferrer">
                            <MessageCircle size={15} /> Pinoxx
                          </a>
                          {contact.contactType === "availability_check" && (
                            <>
                              <a className="inline-flex items-center gap-1 rounded-lg bg-jungle-700 px-3 py-2 text-xs font-bold text-white" href={availabilityReplyUrl(contact, true)} target="_blank" rel="noreferrer">
                                <MessageCircle size={15} /> Yes
                              </a>
                              <a className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700" href={availabilityReplyUrl(contact, false)} target="_blank" rel="noreferrer">
                                <MessageCircle size={15} /> No
                              </a>
                            </>
                          )}
                          <a className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" href={`tel:${contact.phone}`}>
                            <PhoneCall size={15} /> Call
                          </a>
                          <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" onClick={() => updateContact(contact._id, "contacted")}>Contacted</button>
                          <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" onClick={() => updateContact(contact._id, "closed")}>Close</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td className="py-4 text-slate-500" colSpan={8}>No contact requests yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "bookings" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-slate-950">Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 py-2">Guest</th>
                    <th className="border-b border-slate-200 py-2">Phone</th>
                    <th className="border-b border-slate-200 py-2">Resort</th>
                    <th className="border-b border-slate-200 py-2">Room</th>
                    <th className="border-b border-slate-200 py-2">Dates</th>
                    <th className="border-b border-slate-200 py-2">Members</th>
                    <th className="border-b border-slate-200 py-2">Payment</th>
                    <th className="border-b border-slate-200 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="border-b border-slate-100 py-3 font-semibold">{booking.customerName}</td>
                      <td className="border-b border-slate-100 py-3">{booking.phone}</td>
                      <td className="border-b border-slate-100 py-3">{booking.resort?.name}</td>
                      <td className="border-b border-slate-100 py-3">{booking.roomCategory || "Not selected"}</td>
                      <td className="border-b border-slate-100 py-3">{dateRange(booking)}</td>
                      <td className="border-b border-slate-100 py-3">{booking.members}</td>
                      <td className="border-b border-slate-100 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">{booking.status?.replaceAll("_", " ")}</span>
                      </td>
                      <td className="border-b border-slate-100 py-3">
                        <div className="flex flex-wrap gap-2">
                          <a className="inline-flex items-center gap-1 rounded-lg bg-jungle-700 px-3 py-2 text-xs font-bold text-white" href={booking.whatsapp?.businessUrl} target="_blank" rel="noreferrer">
                            <MessageCircle size={15} /> WhatsApp
                          </a>
                          <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" onClick={() => updateBooking(booking._id, "confirmed")}>Confirm</button>
                          <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" onClick={() => updateBooking(booking._id, "cancelled")}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td className="py-4 text-slate-500" colSpan={8}>No bookings yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "resorts" && (
          <div className="grid gap-8">
            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={createResort}>
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="text-jungle-700" size={22} />
                <h2 className="text-xl font-black text-slate-950">Create Resort Profile</h2>
              </div>
              {renderResortFields(resortForm, updateResortForm)}
              <div className="mt-5">{renderRoomEditor(rooms, setRooms)}</div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm font-semibold text-slate-700">
                  <ImagePlus size={18} />
                  Add resort images
                  <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setResortFiles(event.target.files)} />
                </label>
                <button className="rounded-lg bg-jungle-700 px-5 py-3 font-bold text-white" disabled={savingResort}>
                  {savingResort ? "Creating..." : "Create Resort"}
                </button>
              </div>
              {resortFiles.length > 0 && <p className="mt-2 text-sm text-slate-600">{resortFiles.length} image(s) selected</p>}
            </form>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-black text-slate-950">Manage Resorts</h2>
              <div className="grid gap-4">
                {resorts.map((resort) => (
                  <div key={resort._id} className="rounded-lg border border-slate-200 p-4">
                    {editingResortId === resort._id ? (
                      <form className="grid gap-4" onSubmit={saveResort}>
                        {renderResortFields(editForm, updateEditForm)}
                        {renderRoomEditor(editRooms, setEditRooms)}
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm font-semibold text-slate-700">
                          <ImagePlus size={18} />
                          Add more images
                          <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setEditFiles(event.target.files)} />
                        </label>
                        {editFiles.length > 0 && <p className="text-sm text-slate-600">{editFiles.length} image(s) selected</p>}
                        <div className="flex flex-wrap gap-2">
                          <button className="inline-flex items-center gap-2 rounded-lg bg-jungle-700 px-4 py-3 text-sm font-bold text-white">
                            <Save size={17} /> Save Changes
                          </button>
                          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold" onClick={() => setEditingResortId("")}>
                            <X size={17} /> Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                          <h3 className="text-lg font-black text-slate-950">{resort.name}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {resort.location} - {resort.resortType || "budget"} - {resort.rooms?.length || 0} room category(s)
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            Sharing {resort.sharingPrice ? `Rs ${resort.sharingPrice}` : "not set"} - Couple {resort.couplePrice ? `Rs ${resort.couplePrice}` : "not set"}
                          </p>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{resort.shortDescription}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => startEditResort(resort)}>
                            <Edit3 size={16} /> Update
                          </button>
                          <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700" onClick={() => deleteResort(resort._id)}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={uploadImages}>
              <div className="mb-4 flex items-center gap-2">
                <ImagePlus className="text-jungle-700" size={22} />
                <h2 className="text-xl font-black text-slate-950">Upload Resort Images</h2>
              </div>
              <div className="grid gap-3">
                <select className="rounded-lg border border-slate-200 px-3 py-2" value={selectedResort} onChange={(event) => setSelectedResort(event.target.value)}>
                  {resorts.map((resort) => (
                    <option key={resort._id} value={resort._id}>{resort.name}</option>
                  ))}
                </select>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-10 text-sm font-semibold text-slate-700">
                  Select resort images
                  <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setFiles(event.target.files)} />
                </label>
                {files.length > 0 && <p className="text-sm text-slate-600">{files.length} image(s) selected</p>}
                <button className="rounded-lg bg-jungle-700 px-4 py-3 font-bold text-white">Upload Images</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "reviews" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-slate-950">Review Moderation</h2>
            <div className="grid gap-3">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-black text-slate-950">{review.resort?.name}</p>
                      <p className="text-sm text-slate-600">{review.comment}</p>
                      <p className="mt-1 text-xs font-bold uppercase text-slate-500">{review.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-jungle-700 px-3 py-2 text-sm font-bold text-white" onClick={() => moderate(review._id, "approved")}>Approve</button>
                      <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => moderate(review._id, "rejected")}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
            </div>
          </section>
        )}

        {activeTab === "analytics" && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-xl font-black text-slate-950">Customer Graph</h2>
                <p className="mt-1 text-sm text-slate-500">Tracks request leads and bookings by selected period.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {graphRanges.map((range) => (
                  <button
                    key={range.id}
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${graphRange === range.id ? "bg-jungle-700 text-white" : "border border-slate-200 text-slate-700"}`}
                    onClick={() => setGraphRange(range.id)}
                    type="button"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex min-w-[760px] items-end gap-2" style={{ height: 320 }}>
                  {graphData.map((item) => {
                    const total = item.requests + item.bookings;
                    const height = Math.max(8, (total / graphMax) * 250);
                    const requestHeight = total ? (item.requests / total) * height : 0;
                    const bookingHeight = total ? (item.bookings / total) * height : 0;
                    return (
                      <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-[260px] w-full max-w-10 items-end justify-center rounded-t-lg bg-white">
                          <div className="w-full overflow-hidden rounded-t-lg border border-slate-200 bg-slate-100" style={{ height }}>
                            <div className="bg-river-500" style={{ height: bookingHeight }} />
                            <div className="bg-jungle-700" style={{ height: requestHeight }} />
                          </div>
                        </div>
                        <span className="h-8 text-center text-[11px] font-bold leading-4 text-slate-500">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid content-start gap-3">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-500">Total Customers</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{graphData.reduce((sum, item) => sum + item.requests + item.bookings, 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-500">Requests</p>
                  <p className="mt-2 text-3xl font-black text-jungle-700">{graphData.reduce((sum, item) => sum + item.requests, 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-500">Bookings</p>
                  <p className="mt-2 text-3xl font-black text-river-700">{graphData.reduce((sum, item) => sum + item.bookings, 0)}</p>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-600">
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-jungle-700" /> Requests</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-river-500" /> Bookings</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
