import { Router, Request, Response } from "express";
import { TicketStatus, Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { authenticate, enforcePasswordChanged } from "../middleware/auth.js";

export const ticketsRouter = Router();

/**
 * Permitted Status Transition Matrix (BR-08)
 */
export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.WAITING_FOR_REQUESTER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.CANCELLED]: [],
};

/**
 * Helper: Handler for PATCH /api/tickets/:id/status (and PATCH /api/tickets/:id)
 * Handles both:
 * 1) Advisory Resolution Indication (Requester / Staff): problemAppearsResolved: true
 * 2) Status Transitions with Permitted Matrix & Resolution Prerequisites
 */
export const handleTicketWorkflowStatus = async (req: Request, res: Response) => {
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
        actionsTaken: true,
        ticketOwner: { select: { id: true, name: true, email: true, isActive: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    const currentUser = (req as any).user;
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    // Optimistic Concurrency Check (Stale Update Guard - BR-11, AC-12)
    if (req.body.expectedUpdatedAt) {
      const expectedTime = new Date(req.body.expectedUpdatedAt).getTime();
      const actualTime = new Date(ticket.updatedAt).getTime();
      if (actualTime > expectedTime) {
        return res.status(409).json({
          success: false,
          error: {
            code: "STALE_UPDATE_CONFLICT",
            message: "The ticket has been modified by another user. Please refresh and try again.",
          },
        });
      }
    }

    // Case 1: Requester Advisory Indication (BR-09, AC-08, FLOW-03)
    if (req.body.problemAppearsResolved === true || req.body.resolvedIndicated === true) {
      if (currentUser.role === Role.REQUESTER && ticket.requesterId !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You can only indicate resolution on your own tickets" },
        });
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { resolvedIndicated: true },
        select: {
          id: true,
          ticketNumber: true,
          currentStatus: true,
          resolvedIndicated: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: updated,
      });
    }

    // Case 2: Status Transition
    const { status, resolutionNote } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "status or problemAppearsResolved is required",
        },
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

    const currentStatus = ticket.currentStatus;
    const targetStatus = upperStatus as TicketStatus;

    // Terminal State Check
    if (currentStatus === TicketStatus.CLOSED || currentStatus === TicketStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `Cannot transition status from ${currentStatus} to ${targetStatus}. Permitted transitions: none (terminal state)`,
        },
      });
    }

    // Permitted Transition Matrix Check (BR-08)
    const allowedNext = PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `Cannot transition status from ${currentStatus} to ${targetStatus}. Permitted transitions: ${allowedNext.join(", ")}`,
        },
      });
    }

    // Role-specific Authorization Checks (BR-08)
    if (currentUser.role === Role.REQUESTER) {
      // Must be ticket owner
      if (ticket.requesterId !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to modify this ticket",
          },
        });
      }

      // Requesters can ONLY cancel tickets in NEW status
      if (currentStatus === TicketStatus.NEW && targetStatus === TicketStatus.CANCELLED) {
        // Allowed
      } else {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Requesters are only permitted to cancel tickets that are currently in NEW status",
          },
        });
      }
    } else if (currentUser.role === Role.IT_STAFF || currentUser.role === Role.ADMINISTRATOR) {
      // Resolution Prerequisites Enforcement (BR-10, AC-09, AC-14, FLOW-04)
      if (targetStatus === TicketStatus.RESOLVED) {
        const hasOwner = ticket.ticketOwnerId !== null;
        const hasActionsTaken = Array.isArray(ticket.actionsTaken) && ticket.actionsTaken.length > 0;

        if (!hasOwner || !hasActionsTaken) {
          return res.status(400).json({
            success: false,
            error: {
              code: "RESOLUTION_PREREQUISITE_FAILED",
              message: "Cannot transition to RESOLVED: ticket must have an assigned ticket owner and at least one recorded action taken.",
            },
          });
        }
      }
    } else {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Unauthorized role for status transition",
        },
      });
    }

    // Append-only audit trail: record resolution note if provided (BR-03)
    if (resolutionNote && typeof resolutionNote === "string" && resolutionNote.trim()) {
      await prisma.internalNote.create({
        data: {
          ticketId: ticket.id,
          authorId: currentUser.id,
          content: `[Resolution Note]: ${resolutionNote.trim()}`,
        },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatus: targetStatus,
      },
      select: {
        id: true,
        ticketNumber: true,
        summary: true,
        currentStatus: true,
        resolvedIndicated: true,
        ticketOwnerId: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating ticket workflow status:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update ticket status" },
    });
  }
};

/**
 * GET /api/tickets/:id/workflow
 * Returns workflow transitions metadata and resolution prerequisite readiness
 */
export const getTicketWorkflowMetadata = async (req: Request, res: Response) => {
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
        actionsTaken: true,
        ticketOwner: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    const currentUser = (req as any).user;
    const currentStatus = ticket.currentStatus;
    const isTerminal = currentStatus === TicketStatus.CLOSED || currentStatus === TicketStatus.CANCELLED;

    let permittedNext: TicketStatus[] = [];
    if (!isTerminal) {
      if (currentUser?.role === Role.REQUESTER) {
        if (currentStatus === TicketStatus.NEW && ticket.requesterId === currentUser?.id) {
          permittedNext = [TicketStatus.CANCELLED];
        }
      } else if (currentUser?.role === Role.IT_STAFF || currentUser?.role === Role.ADMINISTRATOR) {
        permittedNext = PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
      }
    }

    const hasOwner = ticket.ticketOwnerId !== null;
    const hasActionsTaken = Array.isArray(ticket.actionsTaken) && ticket.actionsTaken.length > 0;

    return res.status(200).json({
      success: true,
      data: {
        ticketId: ticket.id,
        currentStatus: ticket.currentStatus,
        resolvedIndicated: ticket.resolvedIndicated,
        isTerminal,
        permittedTransitions: permittedNext,
        resolutionPrerequisites: {
          hasOwner,
          hasActionsTaken,
          readyToResolve: hasOwner && hasActionsTaken,
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving ticket workflow metadata:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to retrieve workflow metadata" },
    });
  }
};

// Mount workflow routes
ticketsRouter.patch("/tickets/:id/status", authenticate, enforcePasswordChanged, handleTicketWorkflowStatus);
ticketsRouter.patch("/tickets/:id", authenticate, enforcePasswordChanged, handleTicketWorkflowStatus);
ticketsRouter.get("/tickets/:id/workflow", authenticate, enforcePasswordChanged, getTicketWorkflowMetadata);
