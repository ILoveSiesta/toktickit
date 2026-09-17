import {
  RequesterUser,
  Category,
  RelatedSystem,
  ApiResponse,
  AuthUser,
  StaffQueueQueryParams,
  StaffQueueResponse,
  StaffTicketDetailData,
  TicketComment,
  InternalNote,
  PriorityLevel,
  TicketStatus,
  Role,
  AdminUser,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "./types/index.js";

const rawUrl = import.meta.env.VITE_API_URL || "/api";
const cleanUrl = rawUrl.replace(/\/$/, "");
const API_BASE = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

export const GLOBAL_SERVER_ERROR_EVENT = "toktickit:global-server-error";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("toktickit_auth_token");
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem("toktickit_auth_token", token);
    } else {
      localStorage.removeItem("toktickit_auth_token");
    }
  } catch (e) {
    console.error("Failed to set auth token", e);
  }
}

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
    const headers = new Headers(options?.headers || {});
    const token = getAuthToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const mergedOptions = { ...options, headers };
    const res = await fetch(url, mergedOptions);

    if (res.status === 401 && !url.includes("/api/auth/login")) {
      setAuthToken(null);
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent("toktickit:unauthorized"));
      }
    }

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

export async function loginApi(credentials: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetchWithInterceptor(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || "Invalid email or password.";
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetchWithInterceptor(`${API_BASE}/auth/logout`, {
      method: "POST",
    });
  } finally {
    setAuthToken(null);
  }
}

export async function getMeApi(): Promise<AuthUser> {
  const res = await fetchWithInterceptor(`${API_BASE}/auth/me`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || "Failed to get user profile");
  }
  return data.data;
}

export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ token: string; message: string }> {
  const res = await fetchWithInterceptor(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || "Failed to change password.";
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    throw err;
  }
  return data.data;
}

export async function fetchStaffTicketQueue(
  params: StaffQueueQueryParams = {}
): Promise<StaffQueueResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category !== undefined && params.category !== "") query.set("category", String(params.category));
  if (params.status) query.set("status", params.status);
  if (params.requestedPriority) query.set("requestedPriority", params.requestedPriority);
  if (params.itPriority) query.set("itPriority", params.itPriority);
  if (params.assigned) query.set("assigned", params.assigned);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();
  const url = `${API_BASE}/staff/tickets${queryString ? `?${queryString}` : ""}`;

  const res = await fetchWithInterceptor(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to fetch staff queue (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }

    return {
    items: data.data || [],
    pagination: data.pagination || {
      page: params.page || 1,
      limit: params.limit || 10,
      totalItems: data.data?.length || 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function fetchStaffTicketDetail(ticketId: number): Promise<StaffTicketDetailData> {
  const res = await fetchWithInterceptor(`${API_BASE}/staff/tickets/${ticketId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to fetch ticket details (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function fetchStaffAssignees(): Promise<Array<{ id: number; name: string; email: string; role: Role }>> {
  const res = await fetchWithInterceptor(`${API_BASE}/staff/assignees`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || "Failed to fetch assignees");
  }
  return data.data || [];
}

export async function updateTicketAssignment(ticketId: number, ticketOwnerId: number | null): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/staff/tickets/${ticketId}/assignment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketOwnerId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to update ticket assignment (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function updateTicketPriority(ticketId: number, itPriority: PriorityLevel): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itPriority }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to update IT Priority (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function updateTicketStatus(ticketId: number, status: TicketStatus): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to update ticket status (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function fetchPublicComments(ticketId: number): Promise<TicketComment[]> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}/comments`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || `Failed to load comments (HTTP ${res.status})`);
  }
  return data.data || [];
}

export async function postPublicComment(ticketId: number, body: string): Promise<TicketComment> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to post comment (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function fetchInternalNotes(ticketId: number): Promise<InternalNote[]> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}/notes`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || `Failed to load internal notes (HTTP ${res.status})`);
  }
  return data.data || [];
}

export async function postInternalNote(ticketId: number, body: string): Promise<InternalNote> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to save internal note (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function indicateProblemResolved(ticketId: number): Promise<any> {
  const res = await fetchWithInterceptor(`${API_BASE}/tickets/${ticketId}/resolve-indication`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to indicate resolution (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function fetchAdminUsers(params?: { search?: string; role?: string }): Promise<AdminUser[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search.trim());
  if (params?.role) searchParams.set("role", params.role);

  const query = searchParams.toString();
  const url = `${API_BASE}/admin/users${query ? `?${query}` : ""}`;

  const res = await fetchWithInterceptor(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to fetch users (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data || [];
}

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
  const res = await fetchWithInterceptor(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to create user (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function updateAdminUser(userId: number, payload: UpdateAdminUserPayload): Promise<AdminUser> {
  const res = await fetchWithInterceptor(`${API_BASE}/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to update user (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function resetAdminUserPassword(
  userId: number,
  newInitialPassword: string
): Promise<{ message: string; mustChangePassword: boolean }> {
  const res = await fetchWithInterceptor(`${API_BASE}/admin/users/${userId}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newInitialPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Failed to reset password (HTTP ${res.status})`;
    const err: any = new Error(errorMsg);
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

