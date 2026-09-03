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

export async function fetchTickets(
  params: {
    search?: string;
    categoryId?: string;
    requestedPriority?: string;
    itPriority?: string;
    currentStatus?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  },
  requesterId: number
): Promise<{
  items: any[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.requestedPriority) query.set("requestedPriority", params.requestedPriority);
  if (params.itPriority) query.set("itPriority", params.itPriority);
  if (params.currentStatus) query.set("currentStatus", params.currentStatus);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetchWithInterceptor(`${API_BASE}/tickets?${query.toString()}`, {
    headers: {
      "X-Requester-Id": String(requesterId),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load tickets (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to load tickets");
  }

  const items = Array.isArray(json.data) ? json.data : (json.data?.items || []);
  const pagination = json.pagination || {};

  return {
    items,
    totalCount: pagination.total ?? json.data?.totalCount ?? items.length,
    page: pagination.page ?? json.data?.page ?? 1,
    limit: pagination.limit ?? json.data?.limit ?? 8,
    totalPages: pagination.totalPages ?? json.data?.totalPages ?? 1,
  };
}

export async function fetchTicketDetail(ticketId: number, requesterId: number): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}`, {
    headers: {
      "X-Requester-Id": String(requesterId),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load ticket details (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || "Failed to load ticket details");
  }

  return json.data;
}

export async function uploadTicketAttachments(
  ticketId: number,
  files: File[],
  requesterId: number
): Promise<any[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "X-Requester-Id": String(requesterId),
    },
    body: formData,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error?.message || `Failed to upload attachments (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

export async function removeAttachment(
  attachmentId: number,
  removalReason: string,
  requesterId: number
): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/attachments/${attachmentId}/remove`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Requester-Id": String(requesterId),
    },
    body: JSON.stringify({ removalReason }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error?.message || `Failed to remove attachment (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

export async function downloadAttachment(attachmentId: number, requesterId: number, fileName: string) {
  const res = await fetchWithInterceptor(`${API_BASE}/attachments/${attachmentId}/download`, {
    headers: {
      "X-Requester-Id": String(requesterId),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download attachment (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  return { online: true, categories: [] };
}



