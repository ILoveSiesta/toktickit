import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { PriorityLevel, Role, TicketStatus } from "@prisma/client";
import { authenticate, requireRole, enforcePasswordChanged } from "../middleware/auth.js";

export const staffRouter = Router();

// Protect all staff routes with JWT auth, password change check, and RBAC (IT_STAFF or ADMINISTRATOR)
staffRouter.use(authenticate, enforcePasswordChanged, requireRole(Role.IT_STAFF, Role.ADMINISTRATOR));

/**
 * GET /api/staff/tickets
 * IT Staff Ticket Queue with Search, Filter, Sort, and Pagination
 */
staffRouter.get("/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const currentUser = req.user!;

    const {
      search,
      category,
      status,
      requestedPriority,
      itPriority,
      assigned,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    // 1. Validate Pagination Parameters
    const parsedPage = parseInt(String(page), 10);
    if (isNaN(parsedPage) || parsedPage < 1 || String(page).includes(".")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY_PARAMETER",
          message: "Page must be a positive integer >= 1",
        },
      });
    }

    const parsedLimit = parseInt(String(limit), 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50 || String(limit).includes(".")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY_PARAMETER",
          message: "Limit must be an integer between 1 and 50",
        },
      });
    }

    // 2. Validate Sorting Parameters
    const validSortFields = ["createdAt", "updatedAt", "ticketNumber", "itPriority", "currentStatus"];
    const sortField = String(sortBy);
    if (!validSortFields.includes(sortField)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY_PARAMETER",
          message: `Invalid sortBy field. Allowed fields: ${validSortFields.join(", ")}`,
        },
      });
    }

    const normalizedSortOrder = String(sortOrder).toLowerCase();
    if (normalizedSortOrder !== "asc" && normalizedSortOrder !== "desc") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY_PARAMETER",
          message: "SortOrder must be 'asc' or 'desc'",
        },
      });
    }

    // 3. Build Prisma Where Clause
    const where: any = {};

    // Search query in ticketNumber and summary (case-insensitive)
    if (search && typeof search === "string" && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { ticketNumber: { contains: searchTerm, mode: "insensitive" } },
        { summary: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category !== undefined && category !== "") {
      const catId = Number(category);
      if (isNaN(catId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_QUERY_PARAMETER",
            message: "Category must be a valid numeric ID",
          },
        });
      }
      where.categoryId = catId;
    }

    // Status filter
    if (status !== undefined && status !== "") {
      const statusUpper = String(status).toUpperCase();
      if (!Object.values(TicketStatus).includes(statusUpper as TicketStatus)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_QUERY_PARAMETER",
            message: `Invalid status. Allowed values: ${Object.values(TicketStatus).join(", ")}`,
          },
        });
      }
      where.currentStatus = statusUpper as TicketStatus;
    }

    // Requested Priority filter
    if (requestedPriority !== undefined && requestedPriority !== "") {
      const reqPriorityUpper = String(requestedPriority).toUpperCase();
      if (!Object.values(PriorityLevel).includes(reqPriorityUpper as PriorityLevel)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_QUERY_PARAMETER",
            message: `Invalid requestedPriority. Allowed values: ${Object.values(PriorityLevel).join(", ")}`,
          },
        });
      }
      where.requestedPriority = reqPriorityUpper as PriorityLevel;
    }

    // IT Priority filter
    if (itPriority !== undefined && itPriority !== "") {
      const itPriorityUpper = String(itPriority).toUpperCase();
      if (!Object.values(PriorityLevel).includes(itPriorityUpper as PriorityLevel)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_QUERY_PARAMETER",
            message: `Invalid itPriority. Allowed values: ${Object.values(PriorityLevel).join(", ")}`,
          },
        });
      }
      where.itPriority = itPriorityUpper as PriorityLevel;
    }

    // Assignment filter: 'all', 'unassigned', 'mine', or numeric staff user ID
    if (assigned !== undefined && assigned !== "" && assigned !== "all") {
      const assignedVal = String(assigned).toLowerCase();
      if (assignedVal === "unassigned") {
        where.ticketOwnerId = null;
      } else if (assignedVal === "mine") {
        where.ticketOwnerId = currentUser.id;
      } else {
        const staffUserId = Number(assigned);
        if (isNaN(staffUserId)) {
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_QUERY_PARAMETER",
              message: "Assigned filter must be 'all', 'unassigned', 'mine', or a valid numeric User ID",
            },
          });
        }
        where.ticketOwnerId = staffUserId;
      }
    }

    // 4. Construct Deterministic Sorting
    const orderBy: any = [
      { [sortField]: normalizedSortOrder },
      { id: "desc" },
    ];

    // 5. Query Count and Paginated Data
    const skip = (parsedPage - 1) * parsedLimit;

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          ticketDate: true,
          summary: true,
          category: {
            select: { id: true, name: true },
          },
          requestedPriority: true,
          itPriority: true,
          currentStatus: true,
          resolvedIndicated: true,
          ticketOwner: {
            select: { id: true, name: true },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
          updatedAt: true,
        },
        orderBy,
        skip,
        take: parsedLimit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / parsedLimit) || (totalItems === 0 ? 0 : 1);
    const hasNext = parsedPage < totalPages;
    const hasPrev = parsedPage > 1 && totalPages > 0;

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalItems,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error("Error fetching staff ticket queue:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to retrieve staff ticket queue.",
      },
    });
  }
});

/**
 * Permitted Status Transition Matrix (BR-14)
 */
export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.WAITING_FOR_REQUESTER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.CANCELLED]: [],
};

/**
 * GET /api/staff/assignees
 * Retrieve list of active IT Staff and Administrators for ticket assignment
 */
staffRouter.get("/assignees", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const assignees = await prisma.user.findMany({
      where: {
        role: { in: [Role.IT_STAFF, Role.ADMINISTRATOR] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: assignees,
    });
  } catch (error) {
    console.error("Error fetching staff assignees:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch assignees" },
    });
  }
});

/**
 * GET /api/staff/tickets/:id
 * Retrieve full ticket details for IT Staff / Administrator operations (API-12)
 */
staffRouter.get("/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid ticket ID" },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
        ticketOwner: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { isRemoved: false },
          select: {
            id: true,
            originalFileName: true,
            fileSize: true,
            fileType: true,
            isRemoved: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "asc" },
        },
        _count: {
          select: {
            attachments: { where: { isRemoved: false } },
            comments: true,
            internalNotes: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        summary: ticket.summary,
        description: ticket.description,
        requestedPriority: ticket.requestedPriority,
        itPriority: ticket.itPriority,
        currentStatus: ticket.currentStatus,
        resolvedIndicated: ticket.resolvedIndicated,
        ticketDate: ticket.ticketDate,
        category: ticket.category,
        relatedSystem: ticket.relatedSystem,
        requester: ticket.requester,
        ticketOwner: ticket.ticketOwner,
        attachments: ticket.attachments,
        attachmentsCount: ticket._count.attachments,
        commentsCount: ticket._count.comments,
        notesCount: ticket._count.internalNotes,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving staff ticket detail:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to retrieve ticket details" },
    });
  }
});

/**
 * PATCH /api/staff/tickets/:id/assignment (and /owner)
 * Claim, reassign, or unassign ticket ownership (API-13)
 */
const handleAssignment = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid ticket ID" },
      });
    }

    const { ticketOwnerId } = req.body;
    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    // Handle unassign
    if (ticketOwnerId === null || ticketOwnerId === undefined || ticketOwnerId === "") {
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { ticketOwnerId: null },
        select: {
          id: true,
          ticketOwnerId: true,
          ticketOwner: { select: { id: true, name: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: updated,
      });
    }

    const ownerId = Number(ticketOwnerId);
    if (isNaN(ownerId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_TICKET_OWNER",
          message: "ticketOwnerId must be a valid number or null",
        },
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive || targetUser.role === Role.REQUESTER) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_TICKET_OWNER",
          message: "Ticket owner must be an active IT Staff or Administrator account",
        },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ticketOwnerId: targetUser.id },
      select: {
        id: true,
        ticketOwnerId: true,
        ticketOwner: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating ticket assignment:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update ticket assignment" },
    });
  }
};

staffRouter.patch("/tickets/:id/assignment", handleAssignment);
staffRouter.patch("/tickets/:id/owner", handleAssignment);

/**
 * PATCH /api/staff/tickets/:id/priority (and /it-priority)
 * Update IT Priority without altering Requested Priority (API-14)
 */
const handlePriority = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid ticket ID" },
      });
    }

    const priorityVal = req.body.itPriority || req.body.priority;
    if (!priorityVal || typeof priorityVal !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PRIORITY",
          message: "itPriority is required",
        },
      });
    }

    const upperPriority = priorityVal.toUpperCase();
    if (!Object.values(PriorityLevel).includes(upperPriority as PriorityLevel)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PRIORITY",
          message: `itPriority must be one of: ${Object.values(PriorityLevel).join(", ")}`,
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority: upperPriority as PriorityLevel },
      select: {
        id: true,
        itPriority: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating IT Priority:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update IT Priority" },
    });
  }
};

staffRouter.patch("/tickets/:id/priority", handlePriority);
staffRouter.patch("/tickets/:id/it-priority", handlePriority);

/**
 * PATCH /api/staff/tickets/:id/status
 * Transition ticket status according to BR-14 Permitted Status Transition Matrix (API-15, API-16)
 */
staffRouter.patch("/tickets/:id/status", async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid ticket ID" },
      });
    }

    const { status } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STATUS", message: "Status is required" },
      });
    }

    const upperStatus = status.toUpperCase();
    if (!Object.values(TicketStatus).includes(upperStatus as TicketStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: `Status must be one of: ${Object.values(TicketStatus).join(", ")}`,
        },
      });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    const currentStatus = ticket.currentStatus;
    const targetStatus = upperStatus as TicketStatus;

    // Check transition rules against BR-14 Matrix
    const allowedNext = PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `Cannot transition status from ${currentStatus} to ${targetStatus}. Permitted transitions: ${allowedNext.length > 0 ? allowedNext.join(", ") : "none (terminal state)"}`,
        },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { currentStatus: targetStatus },
      select: {
        id: true,
        currentStatus: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update ticket status" },
    });
  }
});

