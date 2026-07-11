import { OAuth2Client } from "google-auth-library";

let googleClient;

export async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    const error = new Error("Google login is not configured");
    error.status = 503;
    throw error;
  }

  if (!credential) {
    const error = new Error("Google credential is required");
    error.status = 400;
    throw error;
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(clientId);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: clientId
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.email_verified) {
    const error = new Error("Verified Google email is required");
    error.status = 401;
    throw error;
  }

  return {
    googleId: payload.sub,
    name: payload.name || payload.email.split("@")[0],
    email: payload.email.toLowerCase(),
    avatarUrl: payload.picture || ""
  };
}
