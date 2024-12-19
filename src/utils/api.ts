import { type ApiResponse } from "@/types/api";

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null as unknown as T,
      error: error instanceof Error ? error.message : "An error occurred",
      status: 500,
    };
  }
}

export function getQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}
