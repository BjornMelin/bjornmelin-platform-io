"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface CSRFContextType {
  csrfToken: string | null;
  sessionId: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCSRFToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Make a GET request to retrieve CSRF token from JSON response
      const response = await fetch("/api/csrf", {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error("CSRF token not found in response");
      }

      setCSRFToken(data.token);

      // Get session ID from response headers
      const sessionHeader = response.headers.get("X-Session-ID");
      if (sessionHeader) {
        setSessionId(sessionHeader);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      console.error("Failed to fetch CSRF token:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCSRFToken();

    // Refresh token every 45 minutes (before 1-hour expiry)
    const interval = setInterval(fetchCSRFToken, 45 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchCSRFToken]);

  const refreshToken = async () => {
    await fetchCSRFToken();
  };

  return (
    <CSRFContext.Provider value={{ csrfToken, sessionId, isLoading, error, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF() {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error("useCSRF must be used within CSRFProvider");
  }
  return context;
}

// Helper hook for forms
export function useCSRFHeaders() {
  const { csrfToken, sessionId } = useCSRF();

  return {
    "Content-Type": "application/json",
    ...(csrfToken && { "X-CSRF-Token": csrfToken }),
    ...(sessionId && { "X-Session-ID": sessionId }),
  };
}
