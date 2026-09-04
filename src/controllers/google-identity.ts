interface GoogleIdApi {
  disableAutoSelect?: () => void;
}

function googleId(): GoogleIdApi | null {
  if (typeof window === "undefined") return null;
  const google = (window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } }).google;
  return google?.accounts?.id ?? null;
}

export function disableGoogleAutoSelect(): void {
  googleId()?.disableAutoSelect?.();
}
