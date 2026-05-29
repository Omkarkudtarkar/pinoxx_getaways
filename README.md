# Pinoxx Resort Booking Platform

Production-ready full-stack website for Pinoxx, a Dandeli resort booking and marketing agency.

## Folder Structure

```text
pinoxx-platform/
  backend/            Express API, MongoDB schemas, JWT auth, uploads
  frontend/           React, Tailwind, Framer Motion website
  chatbot-python/     Optional FastAPI chatbot service
  .env.example        Shared environment template
```

## Features

- Fullscreen rafting video hero with Pinoxx tagline, stats, CTAs, and Framer Motion animations.
- About, resort listing, resort detail mini-sites, login/signup, contact, and admin dashboard.
- Resort filters by price, rating, and location.
- Resort detail gallery, rooms, amenities, bus stand distance, image reviews, and shareable slug links.
- Hidden admin trigger: click the main resort image 20 times to open the resort admin upload panel.
- JWT auth for reviews, image uploads, and admin routes.
- Booking flow creates a Rs 1000 UPI deep link and WhatsApp deep links for Pinoxx admin plus a customer confirmation slip.
- The "Call me now" request flow opens a pre-filled text message to `CALL_NOW_TEXT_NUMBER`.
- Resort booking checks the resort availability sheet, holds an available room for 15 minutes, then opens a UPI advance payment link.
- Admin management for resort images, all bookings, users, contacts, imported availability, and review moderation.
- Admin can create resort profiles with room categories, attach a resort-specific Google Sheet, and upload `.xlsx` / `.csv` availability. Users can check that availability before booking.
- Chatbot popup with local backend answers and optional Python FastAPI service.
- SEO metadata, mobile responsive layouts, lazy images, and upload limits.

## Environment

Copy `.env.example` to `.env` in the project root or to `backend/.env`.

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/pinoxx
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
BUSINESS_WHATSAPP_NUMBER=919353431179
CALL_NOW_TEXT_NUMBER=918147843271
UPI_ID=pinoxx@upi
UPI_NAME=Pinoxx
ADVANCE_AMOUNT=1000
PYTHON_CHATBOT_URL=http://localhost:8000/chat
VITE_API_URL=http://localhost:5000/api
VITE_BUSINESS_WHATSAPP_NUMBER=919353431179
```

## Setup

```bash
npm install
npm run seed
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5000`.

Seed logins:

```text
Admin: admin@pinoxx.in / Admin@12345
Guest: guest@example.com / Guest@12345
```

## Optional Python Chatbot

```bash
cd chatbot-python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

When `PYTHON_CHATBOT_URL` is set, the Node backend tries the Python chatbot first and falls back to the built-in deterministic chatbot if the service is offline.

## Backend API

Core endpoints:

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
GET  /api/resorts
GET  /api/resorts/:slug
POST /api/resorts/:id/reviews
GET  /api/availability
GET  /api/availability/check
POST /api/bookings
POST /api/contact
POST /api/chatbot
GET  /api/admin/summary
GET  /api/admin/bookings
PATCH /api/admin/bookings/:id
GET  /api/admin/users
GET  /api/admin/reviews
PATCH /api/admin/reviews/:id
GET  /api/admin/availability
POST /api/admin/availability/import
POST /api/admin/resorts
PATCH /api/admin/resorts/:id
POST /api/admin/resorts/:id/images
DELETE /api/admin/resorts/:id
```

Admin routes require a JWT user with role `admin`.

## Database Schema

`User`

- `name`, `email`, `phone`, hashed `password`, `role`

`Resort`

- `name`, `slug`, `location`, `description`, `startingPrice`, `rating`
- `distanceFromBusStandKm`, `amenities`, `activities`, `images`, `rooms`
- SEO fields and `isActive`

`Review`

- `resort`, `user`, `rating`, `comment`, `images`, moderation `status`

`Booking`

- `resort`, customer details, dates, members, Rs 1000 advance
- selected `roomCategory`, special requests, payment status
- Rs 100 commission per guest calculation
- UPI link, WhatsApp business/customer URLs, payment status

`Availability`

- `resortName`, `resortSlug`, `roomCategory`, `date`
- `availableRooms`, `status`, `price`, `note`, `sourceUrl`

## Excel Availability Format

Use these columns in Excel, CSV, or Google Sheets:

```text
Resort | Resort Slug | Room Category | Date | Available Rooms | Status | Price | Note
```

Example:

```text
Kali River Edge Resort | kali-river-edge-resort | River View Cottage | 2026-06-14 | 4 | available | 2499 | Weekend package
```

For Google Sheets, use **Share > General access > Anyone with the link > Viewer** or publish the sheet as CSV, then paste the link in the admin dashboard.

When importing availability for a selected resort, `Resort` and `Resort Slug` are optional. The admin dashboard uses the selected resort profile automatically, so the sheet can contain only:

```text
Room Category | Date | Available Rooms | Status | Price | Note
```

Dates can be `YYYY-MM-DD` or `DD/MM/YYYY`. If a price contains a comma, keep it as a normal sheet cell or quote it in CSV, for example `"Rs 1,800"`.

`Contact`

- `name`, `phone`, `email`, `message`, `status`

## Deployment Guide

Frontend:

1. Set `VITE_API_URL` to the deployed API URL.
2. Run `npm run build --workspace frontend`.
3. Deploy `frontend/dist` to Vercel, Netlify, Cloudflare Pages, or static hosting.

Backend:

1. Provision MongoDB Atlas.
2. Set environment variables from `.env.example`.
3. Deploy `backend` to Render, Railway, Fly.io, or a VPS.
4. Persist `backend/uploads` with a mounted disk or replace local uploads with S3/Cloudinary for horizontal scaling.
5. Set `CLIENT_URL` to the production frontend domain for CORS.

Python chatbot:

1. Deploy `chatbot-python` as a FastAPI service.
2. Set `PYTHON_CHATBOT_URL=https://your-chatbot-domain/chat` on the backend.

Production notes:

- Replace seed credentials immediately.
- Use a strong `JWT_SECRET`.
- Use a verified WhatsApp Business API provider for true server-side WhatsApp sending. The included implementation uses compliant WhatsApp deep links because regular WhatsApp cannot be silently sent from a browser.
- For real payment reconciliation, connect a payment gateway or UPI payment provider webhook. UPI deep links can open the payment app but cannot prove payment success by themselves.
