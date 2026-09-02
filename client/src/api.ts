import { RequesterUser, Category, RelatedSystem, ApiResponse } from "./types/index.js";

const rawUrl = import.meta.env.VITE_API_URL || "/api";
const cleanUrl = rawUrl.replace(/\/$/, "");
const API_BASE = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

export const GLOBAL_SERVER_ERROR_EVENT = "toktickit:global-server-error";

/**
 * Dispatches a global server error event for App-level handling (BR-27)
 */
export function emitGlobalServerError(message: string) {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(
      new CustomEvent(GLOBAL_SERVER_ERROR_EVENT, {
        detail: { message },
      })
    );
  }
}

/**
 * Safe fetch wrapper that intercepts network disconnects and HTTP 500+ server errors
 */
async function fetchWithInterceptor(url: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, options);

    if (res.status >= 500) {
      emitGlobalServerError(
        `Cannot connect to TokTickIT Server (HTTP ${res.status}). Please check your server status.`
      );
    }

    return res;
  } catch (error: any) {
    // Network disconnection, server offline, or CORS failure
    emitGlobalServerError(
      "Cannot connect to TokTickIT Server. Please check your network or server status."
    );
    throw error;
  }
}

export async function fetchRequesters(): Promise<RequesterUser[]> {
  const res = await fetchWithInterceptor(`${API_BASE}/requesters`);
  if (!res.ok) {
    throw new Error(`Failed to load requesters (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && data.success && Array.isArray(data.data)) {
    return data.data;
  }
  throw new Error(data?.error?.message || "Failed to load requesters");
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetchWithInterceptor(`${API_BASE}/categories`);
  if (!res.ok) {
    throw new Error(`Failed to load categories (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && data.success && Array.isArray(data.data)) {
    return data.data;
  }
  throw new Error(data?.error?.message || "Failed to load categories");
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetchWithInterceptor(`${API_BASE}/related-systems`);
  if (!res.ok) {
    throw new Error(`Failed to load related systems (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && data.success && Array.isArray(data.data)) {
    return data.data;
  }
  throw new Error(data?.error?.message || "Failed to load related systems");
}

export async function createTicket(formData: FormData, requesterId: number): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets`, {
    method: "POST",
    headers: {
      "X-Requester-Id": String(requesterId),
    },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    const errorMsg = json.error?.message || `Failed to create ticket (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return json;
}


