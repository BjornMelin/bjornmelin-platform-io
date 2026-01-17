export function buildContactEndpoint(apiBaseUrl: string): string {
  const baseUrl = new URL(apiBaseUrl);
  if (!baseUrl.pathname.endsWith("/")) {
    baseUrl.pathname = `${baseUrl.pathname}/`;
  }
  return new URL("contact", baseUrl).toString();
}

export function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
