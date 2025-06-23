import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

// Ensure test environment variables are set
beforeAll(() => {
  // Set required environment variables for tests
  Object.assign(process.env, {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    RESEND_API_KEY: "test-api-key",
    RESEND_FROM_EMAIL: "test@example.com",
    CONTACT_EMAIL: "test-contact@example.com",
    AWS_REGION: "us-east-1",
    CSRF_SECRET: "test-csrf-secret-for-testing-only-must-be-32-chars",
    SKIP_ENV_VALIDATION: "true",
  });

  // Validate that critical environment variables are set
  const requiredEnvVars = ["NEXT_PUBLIC_APP_URL", "RESEND_FROM_EMAIL", "CONTACT_EMAIL"];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Reset mocks after each test
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock crypto for CSRF token generation
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  } as Crypto;
}

// Mock fetch for CSRF and other API calls in tests
const originalFetch = global.fetch;
global.fetch = vi.fn().mockImplementation((url: string | Request, options?: RequestInit) => {
  const urlString = typeof url === "string" ? url : url.url;

  // Handle CSRF token requests
  if (urlString.includes("/api/csrf")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({
        "X-Session-ID": "test-session-id",
        "Content-Type": "application/json",
      }),
      json: async () => ({
        token: "test-csrf-token",
        sessionId: "test-session-id",
      }),
    } as Response);
  }

  // For other requests, use the original fetch if available or return a mock
  if (originalFetch) {
    return originalFetch(url, options);
  }

  // Default mock response
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({}),
    text: async () => "",
  } as Response);
});

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning: ReactDOM.render")) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
