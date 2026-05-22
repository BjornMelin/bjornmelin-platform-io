const DEFAULT_SITE_BASE_URL = "https://bjornmelin.io";

const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;

const toSiteBaseUrl = (candidate: string | undefined): URL | null => {
  const trimmed = candidate?.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = HTTP_PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
};

/** Resolves the canonical public site base URL from supported environment variables. */
export function resolveSiteBaseUrl(): URL {
  return (
    toSiteBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    toSiteBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ??
    new URL(DEFAULT_SITE_BASE_URL)
  );
}
