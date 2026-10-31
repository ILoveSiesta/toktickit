import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authenticate, requireRole, enforcePasswordChanged } from "../middleware/auth.js";
import { Role } from "@prisma/client";

export const actionsTakenRouter = Router();

/**
 * GET /api/tickets/:id/actions-taken
 * Retrieve all actions taken for a ticket in stable descending order.
 * Accessible by: Ticket Requester (own tickets only), IT Staff, Administrator
 */
actionsTakenRouter.get(
  "/tickets/:id/actions-taken",
  authenticate,
  enforcePasswordChanged,
  async (req: Request, res: Response) => {
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
        select: { id: true, requesterId: true },
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Ticket not found" },
        });
      }

      const currentUser = req.user!;
      if (currentUser.role === Role.REQUESTER && ticket.requesterId !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only view actions taken on your own tickets",
          },
        });
      }

      const actions = await prisma.actionTaken.findMany({
        where: { ticketId },
        orderBy: [
          { actionDateTime: "desc" },
          { id: "desc" },
        ],
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: actions,
      });
    } catch (error) {
      console.error("GET /api/tickets/:id/actions-taken error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to retrieve actions taken" },
      });
    }
  }
);

/**
 * POST /api/tickets/:id/actions-taken
 * Record a new action taken under the specified ticket.
 * PerformedBy is automatically bound to the authenticated IT Staff / Administrator.
 */
actionsTakenRouter.post(
  "/tickets/:id/actions-taken",
  authenticate,
  enforcePasswordChanged,
  requireRole(Role.IT_STAFF, Role.ADMINISTRATOR),
  async (req: Request, res: Response) => {
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
        select: { id: true },
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Ticket not found" },
        });
      }

      const {
        actionDescription,
        result,
        followUpRequired = false,
        followUpNote,
        attachmentNotes,
        actionDateTime,
      } = req.body;

      if (!actionDescription || typeof actionDescription !== "string" || !actionDescription.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "actionDescription is required and cannot be empty",
          },
        });
      }

      if (!result || typeof result !== "string" || !result.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "result is required and cannot be empty",
          },
        });
      }

      const isFollowUpRequired = Boolean(followUpRequired);
      if (isFollowUpRequired) {
        if (!followUpNote || typeof followUpNote !== "string" || !followUpNote.trim()) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "followUpNote is required when followUpRequired is true",
            },
          });
        }
      }

      let parsedDateTime = new Date();
      if (actionDateTime) {
        const dt = new Date(actionDateTime);
        if (isNaN(dt.getTime())) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid actionDateTime format",
            },
          });
        }
        parsedDateTime = dt;
      }

      const action = await prisma.actionTaken.create({
        data: {
          ticketId,
          actionDateTime: parsedDateTime,
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          performedById: req.user!.id,
          followUpRequired: isFollowUpRequired,
          followUpNote: isFollowUpRequired ? followUpNote.trim() : (followUpNote ? String(followUpNote).trim() : null),
          attachmentNotes: attachmentNotes && typeof attachmentNotes === "string" ? attachmentNotes.trim() : null,
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: action,
      });
    } catch (error) {
      console.error("POST /api/tickets/:id/actions-taken error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create action taken" },
      });
    }
  }
);

/**
 * Handler for PUT / PATCH /api/tickets/:id/actions-taken/:actionId
 * Update an existing action taken record with Optimistic Concurrency Control.
 */
async function handleUpdateActionTaken(req: Request, res: Response) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const actionId = parseInt(req.params.actionId, 10);

    if (isNaN(ticketId) || isNaN(actionId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid ticket or action ID" },
      });
    }

    const prisma = getPrisma();
    const existingAction = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
    });

    if (!existingAction) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Action taken record not found for this ticket",
        },
      });
    }

    // Optimistic Concurrency Check (Stale Update)
    if (req.body.expectedUpdatedAt) {
      const expectedTime = new Date(req.body.expectedUpdatedAt).getTime();
      const actualTime = new Date(existingAction.updatedAt).getTime();
      if (actualTime > expectedTime) {
        return res.status(409).json({
          success: false,
          error: {
            code: "STALE_UPDATE_CONFLICT",
            message: "The action taken has been modified by another user. Please refresh and try again.",
          },
        });
      }
    }

    const {
      actionDescription,
      result,
      followUpRequired,
      followUpNote,
      attachmentNotes,
      actionDateTime,
    } = req.body;

    if (actionDescription !== undefined) {
      if (typeof actionDescription !== "string" || !actionDescription.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "actionDescription cannot be empty",
          },
        });
      }
    }

    if (result !== undefined) {
      if (typeof result !== "string" || !result.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "result cannot be empty",
          },
        });
      }
    }

    const effectiveFollowUpRequired = followUpRequired !== undefined
      ? Boolean(followUpRequired)
      : existingAction.followUpRequired;

    const effectiveFollowUpNote = followUpNote !== undefined
      ? followUpNote
      : existingAction.followUpNote;

    if (effectiveFollowUpRequired) {
      if (!effectiveFollowUpNote || typeof effectiveFollowUpNote !== "string" || !effectiveFollowUpNote.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "followUpNote is required when followUpRequired is true",
          },
        });
      }
    }

    let parsedDateTime: Date | undefined = undefined;
    if (actionDateTime !== undefined) {
      const dt = new Date(actionDateTime);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid actionDateTime format",
          },
        });
      }
      parsedDateTime = dt;
    }

    const updated = await prisma.actionTaken.update({
      where: { id: actionId },
      data: {
        actionDescription: actionDescription !== undefined ? actionDescription.trim() : undefined,
        result: result !== undefined ? result.trim() : undefined,
        actionDateTime: parsedDateTime,
        followUpRequired: effectiveFollowUpRequired,
        followUpNote: effectiveFollowUpRequired
          ? (effectiveFollowUpNote ? effectiveFollowUpNote.trim() : null)
          : (effectiveFollowUpNote !== undefined ? (effectiveFollowUpNote ? effectiveFollowUpNote.trim() : null) : undefined),
        attachmentNotes: attachmentNotes !== undefined
          ? (attachmentNotes ? attachmentNotes.trim() : null)
          : undefined,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("PUT/PATCH /api/tickets/:id/actions-taken/:actionId error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to update action taken" },
    });
  }
}

actionsTakenRouter.put(
  "/tickets/:id/actions-taken/:actionId",
  authenticate,
  enforcePasswordChanged,
  requireRole(Role.IT_STAFF, Role.ADMINISTRATOR),
  handleUpdateActionTaken
);

actionsTakenRouter.patch(
  "/tickets/:id/actions-taken/:actionId",
  authenticate,
  enforcePasswordChanged,
  requireRole(Role.IT_STAFF, Role.ADMINISTRATOR),
  handleUpdateActionTaken
);

/**
 * DELETE /api/tickets/:id/actions-taken/:actionId
 * Remove an action taken record.
 */
actionsTakenRouter.delete(
  "/tickets/:id/actions-taken/:actionId",
  authenticate,
  enforcePasswordChanged,
  requireRole(Role.IT_STAFF, Role.ADMINISTRATOR),
  async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const actionId = parseInt(req.params.actionId, 10);

      if (isNaN(ticketId) || isNaN(actionId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ID", message: "Invalid ticket or action ID" },
        });
      }

      const prisma = getPrisma();
      const existingAction = await prisma.actionTaken.findFirst({
        where: { id: actionId, ticketId },
      });

      if (!existingAction) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Action taken record not found" },
        });
      }

      await prisma.actionTaken.delete({
        where: { id: actionId },
      });

      return res.status(200).json({
        success: true,
        data: { id: actionId, message: "Action taken record deleted successfully" },
      });
    } catch (error) {
      console.error("DELETE /api/tickets/:id/actions-taken/:actionId error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to delete action taken" },
      });
    }
  }
);
