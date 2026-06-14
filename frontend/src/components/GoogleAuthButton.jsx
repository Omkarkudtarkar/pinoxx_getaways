import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

const defaultGoogleClientId = "611343899369-2itb08p2u9rhumhh9a308c82r82mektg.apps.googleusercontent.com";
const defaultMissingMessage = "Google login is not configured. Add VITE_GOOGLE_CLIENT_ID in Vercel and the root .env file, then rebuild.";

export function GoogleAuthButton({
  onCredential,
  onError,
  text = "signin_with",
  disabled = false,
  missingMessage = defaultMissingMessage
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || defaultGoogleClientId;

  function handleSuccess(response) {
    if (!response?.credential) {
      onError?.("Google did not return a credential. Please try again.");
      return;
    }

    onCredential(response.credential);
  }

  function handleError() {
    onError?.("Google login failed. Please try again.");
  }

  if (!clientId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
        {missingMessage}
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${disabled ? "pointer-events-none opacity-70" : ""}`}>
      <GoogleOAuthProvider clientId={clientId}>
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} text={text} size="large" />
      </GoogleOAuthProvider>
    </div>
  );
}
