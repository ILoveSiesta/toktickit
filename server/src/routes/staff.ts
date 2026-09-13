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
