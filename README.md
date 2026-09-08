# Pinoxx Getaways

A React + Express travel booking app with Google login, resort browsing, booking flows, and admin tools.

## Google login setup

The app already includes Google sign-in UI and backend verification. To make it work for your own site, complete these steps:

1. Open Google Cloud Console and create or select a project.
2. Enable the Google Identity Services / OAuth consent screen for your project.
3. Create an OAuth client ID for a Web application.
4. Add your app origins under Authorized JavaScript origins:
   - http://localhost:5173
   - https://your-domain.com
5. Copy the generated client ID and set it in your environment files:
   - Frontend: [frontend/.env](frontend/.env) or Vercel environment variable `VITE_GOOGLE_CLIENT_ID`
   - Backend: root [.env](.env) or Vercel environment variable `GOOGLE_CLIENT_ID`
6. Restart the frontend and backend, then rebuild if needed.

Example values:

- Frontend: `VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`
- Backend: `GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`

## Local development

- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && npm install && npm run dev`

## Production deployment

For Vercel, deploy from the repository root, not from `frontend`. The root `vercel.json` defines two services: `frontend` from `frontend/` and `backend` from `backend/`. A fallback `frontend/vercel.json` is also included for Vercel imports that accidentally set the root directory to `frontend`, but the repository root setup is preferred.

Required Vercel environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_USERNAME=pinoxx@getaways.in`
- `ADMIN_PASSWORD=pinoxx@getaways`
- `ADMIN_RESET_PASSWORD=true`
- `VITE_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_ID`

After redeploying, open `/api/health` on the production domain. It should return JSON with `service: "pinoxx-api"`, `ok: true`, `mongoConfigured: true`, and `jwtConfigured: true`. Then login with username `pinoxx@getaways.in` and password `pinoxx@getaways`.

