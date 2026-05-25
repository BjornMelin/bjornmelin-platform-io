#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

const static404Path = path.join(process.cwd(), "out", "404.html");

const robotsNoindexPattern =
  /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b[^"']*["'])[^>]*\/?>/i;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPageNotFoundSegment(html) {
  const headingIndex = html.indexOf("Page Not Found");
  return headingIndex === -1 ? "" : html.slice(headingIndex, headingIndex + 4000);
}

function hrefMatches(actualHref, expectedHref) {
  if (expectedHref === "/") {
    return actualHref === expectedHref;
  }

  return actualHref === expectedHref || actualHref === `${expectedHref}/`;
}

function hasRenderedLink(segment, expectedHref, label) {
  const anchorPattern = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  return Array.from(segment.matchAll(anchorPattern)).some((match) => {
    const [, href, content] = match;
    return hrefMatches(href, expectedHref) && content.includes(label);
  });
}

function hasSerializedLink(segment, expectedHref, label) {
  const escapedHref = escapeRegExp(expectedHref);
  const escapedLabel = escapeRegExp(label);
  const hrefToken = String.raw`(?:\\?"href\\?"\s*:\s*\\?"${escapedHref}\\?")`;
  const labelToken = String.raw`(?:\\?"children\\?"\s*:\s*\\?"${escapedLabel}\\?")`;
  const linkedTextPattern = new RegExp(
    `${hrefToken}[\\s\\S]{0,800}${labelToken}|${labelToken}[\\s\\S]{0,800}${hrefToken}`,
  );

  return linkedTextPattern.test(segment);
}

function hasPageRecoveryLink(html, expectedHref, label) {
  const pageSegment = getPageNotFoundSegment(html);
  return (
    hasRenderedLink(pageSegment, expectedHref, label) ||
    hasSerializedLink(pageSegment, expectedHref, label)
  );
}

const checks = [
  {
    label: "custom heading",
    matches: (html) => html.includes("Page Not Found"),
  },
  {
    label: "home recovery link",
    matches: (html) => hasPageRecoveryLink(html, "/", "Go home"),
  },
  {
    label: "contact recovery link",
    matches: (html) => hasPageRecoveryLink(html, "/contact", "Contact"),
  },
  {
    label: "404 noindex metadata",
    matches: (html) => robotsNoindexPattern.test(html),
  },
];

try {
  const html = await readFile(static404Path, "utf8");
  const missingLabels = checks.filter((check) => !check.matches(html)).map((check) => check.label);

  if (missingLabels.length > 0) {
    throw new Error(`Static export 404 artifact is missing: ${missingLabels.join(", ")}.`);
  }

  console.log(`Verified static export 404 artifact at ${static404Path}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
