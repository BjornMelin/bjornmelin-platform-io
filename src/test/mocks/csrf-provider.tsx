"use client";

import { createContext, useContext } from "react";

interface CSRFContextType {
  csrfToken: string | null;
  sessionId: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

// Mock CSRF Provider for tests
export function MockCSRFProvider({ children }: { children: React.ReactNode }) {
  const mockContext: CSRFContextType = {
    csrfToken: "test-csrf-token",
    sessionId: "test-session-id",
    isLoading: false,
    error: null,
    refreshToken: async () => {
      // Mock implementation
    },
  };

  return <CSRFContext.Provider value={mockContext}>{children}</CSRFContext.Provider>;
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
