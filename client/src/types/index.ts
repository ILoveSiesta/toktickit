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

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  isActive?: boolean;
  initialPassword: string;
}

export interface UpdateAdminUserPayload {
  name?: string;
  email?: string;
  role?: Role;
  department?: string | null;
  isActive?: boolean;
}

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  actionDescription: string;
  result: string;
  performedById: number;
  performedBy: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionTakenPayload {
  actionDescription: string;
  result: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
  actionDateTime?: string;
}

export interface UpdateActionTakenPayload {
  actionDescription?: string;
  result?: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
  actionDateTime?: string;
  expectedUpdatedAt?: string;
}

// Lab 4 Issue 5: Dashboard Types
export interface RequesterDashboardSummary {
  totalOpen: number;
  inProgress: number;
  waitingForRequester: number;
  recentlyResolved: number;
  closed: number;
}

export interface RequesterRecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: TicketStatus;
  priority: PriorityLevel;
  itPriority?: PriorityLevel | null;
  requestedPriority?: PriorityLevel | null;
  updatedAt: string;
  createdAt?: string;
}

export interface RequesterDashboardData {
  summary: RequesterDashboardSummary;
  recentTickets: RequesterRecentTicket[];
}

export interface StaffDashboardSummary {
  unassigned: number;
  new: number;
  open: number;
  inProgress: number;
  waitingForRequester: number;
  myAssigned: number;
  resolved: number;
  closed: number;
}

export interface StaffDashboardTrends {
  unassigned: string;
  new: string;
  open: string;
  inProgress: string;
  waitingForRequester: string;
  myAssigned: string;
}

export interface PriorityDistribution {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

export interface StaffRecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: TicketStatus;
  itPriority: PriorityLevel;
  priority?: PriorityLevel;
  ownerId: number | null;
  ownerName: string | null;
  updatedAt: string;
  createdAt?: string;
}

export interface AdminUserSummary {
  totalUsers: number;
  activeUsers: number;
  requestersCount: number;
  staffCount: number;
  adminCount: number;
}

export interface StaffDashboardData {
  summary: StaffDashboardSummary;
  trends: StaffDashboardTrends;
  byPriority: PriorityDistribution;
  recentTickets: StaffRecentTicket[];
  adminSummary?: AdminUserSummary;
}



