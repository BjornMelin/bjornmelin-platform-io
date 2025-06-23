"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface CSRFContextType {
  csrfToken: string | null;
  sessionId: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
  version: string;
  isReady: boolean;
}

interface CSRFTokenResponse {
  token: string;
  sessionId: string;
  expiresIn: number;
  algorithm: string;
  version: string;
  issued: string;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

export function CSRFProviderModern({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState<string>("2.0");
  const [isReady, setIsReady] = useState(false);

  // Use refs to prevent unnecessary re-renders
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const baseRetryDelay = 1000; // 1 second

  const clearTimers = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const fetchCSRFToken = useCallback(
    async (isRetry = false) => {
      try {
        if (!isRetry) {
          setIsLoading(true);
          setError(null);
        }

        const response = await fetch("/api/csrf-modern", {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
        }

        const data: CSRFTokenResponse = await response.json();

        if (!data.token || !data.sessionId) {
          throw new Error("Invalid CSRF token response format");
        }

        setCSRFToken(data.token);
        setSessionId(data.sessionId);
        setVersion(data.version);
        setIsReady(true);
        retryCountRef.current = 0; // Reset retry count on success

        // Set up automatic refresh before expiry
        clearTimers();
        const refreshTime = (data.expiresIn - 300) * 1000; // Refresh 5 minutes before expiry

        if (refreshTime > 0) {
          refreshIntervalRef.current = setTimeout(() => {
            fetchCSRFToken();
          }, refreshTime);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        const errorObj = new Error(`CSRF token fetch failed: ${errorMessage}`);

        console.error("Failed to fetch CSRF token:", errorObj);
        setError(errorObj);
        setIsReady(false);

        // Implement exponential backoff for retries
        if (retryCountRef.current < maxRetries) {
          const delay = baseRetryDelay * 2 ** retryCountRef.current;
          retryCountRef.current++;

          console.log(
            `Retrying CSRF token fetch in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`,
          );

          retryTimeoutRef.current = setTimeout(() => {
            fetchCSRFToken(true);
          }, delay);
        }
      } finally {
        if (!isRetry) {
          setIsLoading(false);
        }
      }
    },
    [clearTimers],
  );

  const refreshToken = useCallback(async () => {
    clearTimers();
    await fetchCSRFToken();
  }, [fetchCSRFToken, clearTimers]);

  // Initialize CSRF token on mount
  useEffect(() => {
    fetchCSRFToken();

    // Cleanup on unmount
    return () => {
      clearTimers();
    };
  }, [fetchCSRFToken, clearTimers]);

  // Listen for token refresh requests from the server
  useEffect(() => {
    const handleNewToken = (event: CustomEvent<{ token: string; sessionId: string }>) => {
      setCSRFToken(event.detail.token);
      setSessionId(event.detail.sessionId);
      setIsReady(true);
    };

    window.addEventListener("csrf-token-refresh", handleNewToken as EventListener);

    return () => {
      window.removeEventListener("csrf-token-refresh", handleNewToken as EventListener);
    };
  }, []);

  const contextValue: CSRFContextType = {
    csrfToken,
    sessionId,
    isLoading,
    error,
    refreshToken,
    version,
    isReady,
  };

  return <CSRFContext.Provider value={contextValue}>{children}</CSRFContext.Provider>;
}

export function useCSRF(): CSRFContextType {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error("useCSRF must be used within CSRFProviderModern");
  }
  return context;
}

// Enhanced helper hook for forms with automatic retry
export function useCSRFHeaders() {
  const { csrfToken, sessionId, isReady, refreshToken } = useCSRF();

  const getHeaders = useCallback((): Record<string, string> => {
    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-CSRF-Version": "2.0",
    };

    if (isReady && csrfToken && sessionId) {
      baseHeaders["X-CSRF-Token"] = csrfToken;
      baseHeaders["X-Session-ID"] = sessionId;
    }

    return baseHeaders;
  }, [csrfToken, sessionId, isReady]);

  const getHeadersWithRetry = useCallback(async (): Promise<Record<string, string>> => {
    const headers = getHeaders();

    // If we don't have a token, try to refresh
    if (!headers["X-CSRF-Token"]) {
      try {
        await refreshToken();
        return getHeaders();
      } catch (error) {
        console.warn("Failed to refresh CSRF token:", error);
        return headers;
      }
    }

    return headers;
  }, [getHeaders, refreshToken]);

  return {
    headers: getHeaders(),
    getHeaders,
    getHeadersWithRetry,
    isReady,
  };
}

// Helper hook for handling server responses with new tokens
export function useCSRFResponseHandler() {
  const handleResponse = useCallback((response: Response) => {
    const newToken = response.headers.get("X-New-CSRF-Token");
    const newSessionId = response.headers.get("X-Session-ID");

    if (newToken && newSessionId) {
      // Dispatch custom event to update token
      window.dispatchEvent(
        new CustomEvent("csrf-token-refresh", {
          detail: { token: newToken, sessionId: newSessionId },
        }),
      );
    }
  }, []);

  return { handleResponse };
}
