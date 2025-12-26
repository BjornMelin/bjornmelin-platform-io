// biome-ignore lint/correctness/noUnusedVariables: CloudFront Functions entrypoint.
function handler(event) {
  const request = event.request;
  const uri = request.uri;

  // Don't rewrite assets or explicit files.
  const lastSegment = uri.split("/").pop();
  if (lastSegment?.includes(".")) {
    return request;
  }

  // Next.js App Router client navigations request React Server Component payloads
  // (content-type: text/x-component) and include the 'RSC' header.
  const headers = request.headers ?? {};
  const isRsc = headers.rsc?.value === "1" || headers.accept?.value?.includes("text/x-component");

  const indexFile = isRsc ? "index.txt" : "index.html";
  request.uri = uri.endsWith("/") ? `${uri}${indexFile}` : `${uri}/${indexFile}`;
  return request;
}
