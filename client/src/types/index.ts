export type Role = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  department?: string | null;
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department?: string | null;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface RelatedSystem {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; parameter?: string; message: string }>;
  };
}

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketStatus =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_REQUESTER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "CANCELLED";

export interface StaffTicketQueueItem {
  id: number;
  ticketNumber: string;
  ticketDate: string;
  summary: string;
  category: {
    id: number;
    name: string;
  };
  requestedPriority: PriorityLevel;
  itPriority: PriorityLevel;
  currentStatus: TicketStatus;
  resolvedIndicated: boolean;
  ticketOwner: {
    id: number;
    name: string;
  } | null;
  requester: {
    id: number;
    name: string;
    email: string;
  };
  updatedAt: string;
}

export interface StaffQueueQueryParams {
  search?: string;
  category?: string | number;
  status?: string;
  requestedPriority?: string;
  itPriority?: string;
  assigned?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface StaffQueueResponse {
  items: StaffTicketQueueItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

