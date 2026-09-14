function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "https://wisecash.app";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getAppUrl(): string {
  // 1. In browser runtime, always prioritize the current window location origin.
  // This dynamically supports production (https://wisecash.app), preview deployments, and local dev.
  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeUrl(window.location.origin);
  }

  // 2. Fallback for SSR / static prerender environments
  const configuredUrl = import.meta.env.VITE_SITE_URL;
  if (configuredUrl && !configuredUrl.includes("localhost") && !configuredUrl.includes("127.0.0.1")) {
    return normalizeUrl(configuredUrl);
  }

  return "https://wisecash.app";
}
