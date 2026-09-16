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

export interface StaffTicketDetailData {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: PriorityLevel;
  itPriority: PriorityLevel;
  currentStatus: TicketStatus;
  resolvedIndicated: boolean;
  ticketDate: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string; email: string; department?: string | null };
  ticketOwner: { id: number; name: string; email: string } | null;
  attachments: Array<{
    id: number;
    originalFileName: string;
    fileSize: number;
    fileType: string;
    isRemoved: boolean;
    uploadedAt: string;
  }>;
  attachmentsCount: number;
  commentsCount: number;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: Role;
    email: string;
  };
}

export interface InternalNote {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: Role;
    email: string;
  };
}

export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};


