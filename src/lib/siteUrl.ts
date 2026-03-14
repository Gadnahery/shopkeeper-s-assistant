function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "https://wisecash.app";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getAppUrl(): string {
  const configuredUrl = import.meta.env.VITE_SITE_URL;
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "https://wisecash.app";
    }
    return normalizeUrl(origin);
  }

  return "https://wisecash.app";
}
