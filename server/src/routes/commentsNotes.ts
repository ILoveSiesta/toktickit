import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authenticate, requireRole, enforcePasswordChanged } from "../middleware/auth.js";
import { Role } from "@prisma/client";

export const commentsNotesRouter = Router();

/**
 * GET /api/tickets/:id/comments
 * Retrieve public comments for a ticket (chronological order)
 * Accessible by: Ticket Requester, IT Staff, Administrator (API-18)
 */
commentsNotesRouter.get("/tickets/:id/comments", authenticate, enforcePasswordChanged, async (req: Request, res: Response) => {
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

    const currentUser = (req as any).user;
    if (currentUser.role === Role.REQUESTER && ticket.requesterId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only view comments on your own tickets" },
      });
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Error retrieving public comments:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to retrieve comments" },
    });
  }
});

/**
 * POST /api/tickets/:id/comments
 * Post a public comment (Append-only)
 * Accessible by: Ticket Requester, IT Staff, Administrator (API-18)
 */
commentsNotesRouter.post("/tickets/:id/comments", authenticate, enforcePasswordChanged, async (req: Request, res: Response) => {
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

    const currentUser = (req as any).user;
    if (currentUser.role === Role.REQUESTER && ticket.requesterId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only comment on your own tickets" },
      });
    }

    const rawContent = req.body.body !== undefined ? req.body.body : req.body.content;
    if (typeof rawContent !== "string" || rawContent.trim().length === 0 || rawContent.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_COMMENT",
          message: "Comment body must be between 1 and 2,000 characters",
        },
      });
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: currentUser.id,
        content: rawContent.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Error creating public comment:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to post comment" },
    });
  }
});

/**
 * GET /api/tickets/:id/notes
 * Retrieve internal notes for a ticket (chronological order)
 * Accessible by: IT Staff, Administrator ONLY (API-08, API-19)
 * Requesters must receive 403 Forbidden without leaking note existence or content.
 */
commentsNotesRouter.get(
  "/tickets/:id/notes",
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

      const notes = await prisma.internalNote.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: notes,
      });
    } catch (error) {
      console.error("Error retrieving internal notes:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to retrieve internal notes" },
      });
    }
  }
);

/**
 * POST /api/tickets/:id/notes
 * Post an internal note (Append-only)
 * Accessible by: IT Staff, Administrator ONLY (API-08, API-19)
 */
commentsNotesRouter.post(
  "/tickets/:id/notes",
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

      const rawContent = req.body.body !== undefined ? req.body.body : req.body.content;
      if (typeof rawContent !== "string" || rawContent.trim().length === 0 || rawContent.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_NOTE",
            message: "Internal note body must be between 1 and 2,000 characters",
          },
        });
      }

      const currentUser = (req as any).user;
      const note = await prisma.internalNote.create({
        data: {
          ticketId,
          authorId: currentUser.id,
          content: rawContent.trim(),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      console.error("Error creating internal note:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to post internal note" },
      });
    }
  }
);

/**
 * POST & PATCH /api/tickets/:id/resolve-indication (and /resolve-indicated)
 * Indicate problem appears resolved from Requester perspective (API-17, BR-15)
 * Updates resolvedIndicated = true WITHOUT altering current ticket status.
 */
const handleResolveIndication = async (req: Request, res: Response) => {
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
      select: { id: true, requesterId: true, currentStatus: true, resolvedIndicated: true },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    const currentUser = (req as any).user;
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
  } catch (error) {
    console.error("Error updating resolve indication:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to indicate resolution" },
    });
  }
};

commentsNotesRouter.post("/tickets/:id/resolve-indication", authenticate, enforcePasswordChanged, handleResolveIndication);
commentsNotesRouter.patch("/tickets/:id/resolve-indication", authenticate, enforcePasswordChanged, handleResolveIndication);
commentsNotesRouter.patch("/tickets/:id/resolve-indicated", authenticate, enforcePasswordChanged, handleResolveIndication);
