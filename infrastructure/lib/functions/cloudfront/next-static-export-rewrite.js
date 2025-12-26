// biome-ignore lint/correctness/noUnusedVariables: CloudFront Functions entrypoint.
function handler(event) {
  const request = event.request;
  const uri = request.uri;

  // Don't rewrite assets or explicit files.
  const lastSegment = uri.split("/").pop();
  if (lastSegment && /\.[a-zA-Z0-9]+$/.test(lastSegment)) {
    return request;
  }

  // Next.js App Router client navigations request React Server Component payloads
  // (content-type: text/x-component). In CloudFront Functions, header names are
  // normalized to lowercase, so we read the "RSC" header via `headers.rsc`. The
  // Accept header check intentionally uses a substring match to handle multiple
  // values (e.g. "text/html, text/x-component").
  const headers = request.headers ?? {};
  const isRsc = headers.rsc?.value === "1" || headers.accept?.value?.includes("text/x-component");

  const indexFile = isRsc ? "index.txt" : "index.html";

  // The distribution is configured with defaultRootObject: "index.html", but we
  // still special-case "/" to avoid accidental double-slash paths and to support
  // rewriting RSC navigations to "/index.txt".
  if (uri === "/") {
    request.uri = `/${indexFile}`;
    return request;
  }

  request.uri = uri.endsWith("/") ? `${uri}${indexFile}` : `${uri}/${indexFile}`;
  return request;
}
