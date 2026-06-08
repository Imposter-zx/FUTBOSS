type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string = "API_ERROR",
    public statusCode: number = 500,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function request<T>(
  path: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, params, cache, next, signal } = options;

  const url = buildUrl(path, params);

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    signal,
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  if (cache) {
    fetchOptions.cache = cache;
  }

  if (next) {
    (fetchOptions as Record<string, unknown>).next = next;
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiError;
      throw new ApiClientError(
        errorData.error?.message ?? `HTTP ${response.status}`,
        errorData.error?.code ?? "HTTP_ERROR",
        response.status,
        errorData.error?.details,
      );
    }

    return data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError("Request was cancelled", "ABORTED", 499);
    }

    throw new ApiClientError(
      error instanceof Error ? error.message : "Network error",
      "NETWORK_ERROR",
      0,
    );
  }
}

export const api = {
  get<T>(path: string, options?: ApiOptions): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: ApiOptions): Promise<ApiResponse<T>> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

export { ApiClientError };
export type { ApiResponse, ApiError, ApiOptions };
export default api;
