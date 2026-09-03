import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getPrisma } from "./prisma.js";
import { generateTicketNumber } from "./utils/ticketGenerator.js";
import { validateAttachment } from "./utils/attachmentValidator.js";
import { generateSafeStorageFileName } from "./utils/safeStorageName.js";
import { PriorityLevel } from "@prisma/client";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory for uploaded attachments
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer in-memory configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,
  },
});

// API Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// GET /api/requesters - List active development requesters
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
      },
      orderBy: { id: "asc" },
    });

    res.status(200).json(requesters);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve development requesters",
    });
  }
});

// GET /api/categories - List active categories
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve categories",
    });
  }
});

// GET /api/related-systems - List active related systems
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve related systems",
    });
  }
});

// POST /api/tickets - Create a new support ticket
app.post(
  "/api/tickets",
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      // 1. Authenticate Requester Context via Header
      const rawRequesterId = req.headers["x-requester-id"];
      const requesterId = Number(rawRequesterId);

      if (!rawRequesterId || isNaN(requesterId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "UNAUTHORIZED_CONTEXT",
            message: "Missing or invalid X-Requester-Id header",
          },
        });
      }

      const requester = await prisma.requesterUser.findUnique({
        where: { id: requesterId },
      });

      if (!requester || !requester.isActive) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_REQUESTER",
            message: "Specified requester does not exist or is inactive",
          },
        });
      }

      // 2. Validate Body Fields
      const { summary, description, categoryId, relatedSystemId, requestedPriority } = req.body;
      const validationErrors: Array<{ field: string; message: string }> = [];

      const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
      if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 200) {
        validationErrors.push({
          field: "summary",
          message: "Summary must be between 5 and 200 characters",
        });
      }

      const trimmedDescription = typeof description === "string" ? description.trim() : "";
      if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
        validationErrors.push({
          field: "description",
          message: "Description must be between 10 and 2000 characters",
        });
      }

      const numCategoryId = Number(categoryId);
      if (isNaN(numCategoryId)) {
        validationErrors.push({
          field: "categoryId",
          message: "Category ID is required and must be an integer",
        });
      }

      const numRelatedSystemId = Number(relatedSystemId);
      if (isNaN(numRelatedSystemId)) {
        validationErrors.push({
          field: "relatedSystemId",
          message: "Related System ID is required and must be an integer",
        });
      }

      const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      if (!requestedPriority || !validPriorities.includes(String(requestedPriority).toUpperCase())) {
        validationErrors.push({
          field: "requestedPriority",
          message: "Requested priority must be one of: LOW, MEDIUM, HIGH, CRITICAL",
        });
      }

      // 3. Validate Attached Files
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length > 5) {
        validationErrors.push({
          field: "files",
          message: "A ticket can have at most 5 attachments",
        });
      }

      for (const file of files) {
        const check = validateAttachment({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
        if (!check.isValid) {
          validationErrors.push({
            field: "files",
            message: check.error || `Invalid file ${file.originalname}`,
          });
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: validationErrors,
          },
        });
      }

      // 4. Verify Category & Related System exist
      const [category, system] = await Promise.all([
        prisma.category.findUnique({ where: { id: numCategoryId } }),
        prisma.relatedSystem.findUnique({ where: { id: numRelatedSystemId } }),
      ]);

      if (!category || !category.isActive) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Category not found or inactive",
          },
        });
      }

      if (!system || !system.isActive) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Related system not found or inactive",
          },
        });
      }

      // 5. Save Files to Disk & Create Ticket Transaction
      const savedAttachmentsData: Array<{
        originalFileName: string;
        storageFileName: string;
        fileSize: number;
        fileType: string;
        storagePath: string;
      }> = [];

      for (const file of files) {
        const storageFileName = generateSafeStorageFileName(file.originalname);
        const filePath = path.join(UPLOADS_DIR, storageFileName);
        fs.writeFileSync(filePath, file.buffer);

        savedAttachmentsData.push({
          originalFileName: file.originalname,
          storageFileName,
          fileSize: file.size,
          fileType: file.mimetype || "application/octet-stream",
          storagePath: filePath,
        });
      }

      // 6. DB Transaction to create ticket and generate unique ticket number
      const result = await prisma.$transaction(async (tx) => {
        // Create initial ticket placeholder
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber: `TEMP-${Date.now()}-${Math.random()}`,
            summary: trimmedSummary,
            description: trimmedDescription,
            requestedPriority: requestedPriority.toUpperCase() as PriorityLevel,
            itPriority: PriorityLevel.MEDIUM,
            currentStatus: "NEW",
            requesterId,
            categoryId: numCategoryId,
            relatedSystemId: numRelatedSystemId,
            attachments: {
              create: savedAttachmentsData,
            },
          },
          include: {
            attachments: {
              select: {
                id: true,
                originalFileName: true,
                storageFileName: true,
                fileSize: true,
                fileType: true,
                isRemoved: true,
                uploadedAt: true,
              },
            },
          },
        });

        // Generate official ticketNumber based on ticket.id
        const officialTicketNumber = generateTicketNumber(ticket.id, ticket.createdAt);
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: { ticketNumber: officialTicketNumber },
          include: {
            attachments: {
              select: {
                id: true,
                originalFileName: true,
                storageFileName: true,
                fileSize: true,
                fileType: true,
                isRemoved: true,
                uploadedAt: true,
              },
            },
          },
        });

        return updatedTicket;
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error while creating ticket",
        },
      });
    }
  }
);

// GET /api/tickets - List owned tickets with search, filter, sort, pagination
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"];
    const requesterId = Number(rawRequesterId);

    if (!rawRequesterId || isNaN(requesterId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED_CONTEXT",
          message: "Missing or invalid X-Requester-Id header",
        },
      });
    }

    // Query parameters
    const {
      search,
      categoryId,
      requestedPriority,
      itPriority,
      currentStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "8",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 8));
    const skip = (pageNum - 1) * limitNum;

    // Build Where Clause (Strict Ownership)
    const where: any = {
      requesterId,
    };

    if (search && typeof search === "string" && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { summary: { contains: searchTerm, mode: "insensitive" } },
        { ticketNumber: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      const catId = Number(categoryId);
      if (!isNaN(catId)) where.categoryId = catId;
    }

    if (requestedPriority && typeof requestedPriority === "string") {
      where.requestedPriority = requestedPriority.toUpperCase() as PriorityLevel;
    }

    if (itPriority && typeof itPriority === "string") {
      where.itPriority = itPriority.toUpperCase() as PriorityLevel;
    }

    if (currentStatus && typeof currentStatus === "string") {
      where.currentStatus = currentStatus.toUpperCase() as any;
    }

    // Build Order By with Secondary Sort for Deterministic Pagination
    const validSortFields = ["createdAt", "ticketNumber", "updatedAt", "ticketDate"];
    const orderField = validSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const orderDirection = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    const orderBy: any = [
      { [orderField]: orderDirection },
      { id: "desc" },
    ];

    const [totalCount, items] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            select: {
              id: true,
              originalFileName: true,
              storageFileName: true,
              fileSize: true,
              fileType: true,
              isRemoved: true,
              uploadedAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error retrieving tickets:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to retrieve tickets",
      },
    });
  }
});

// GET /api/tickets/:id - Get ticket detail with ownership check
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = Number(req.params.id);
    const rawRequesterId = req.headers["x-requester-id"];
    const requesterId = Number(rawRequesterId);

    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid ticket ID" },
      });
    }

    if (!rawRequesterId || isNaN(requesterId)) {
      return res.status(400).json({
        success: false,
        error: { code: "UNAUTHORIZED_CONTEXT", message: "Missing or invalid X-Requester-Id header" },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
        attachments: {
          select: {
            id: true,
            originalFileName: true,
            storageFileName: true,
            fileSize: true,
            fileType: true,
            isRemoved: true,
            removedAt: true,
            removalReason: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    // Ownership Enforcement (BR-22)
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to view this ticket.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Error retrieving ticket detail:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to retrieve ticket details" },
    });
  }
});

// POST /api/tickets/:id/attachments - Add attachment to existing ticket (BR-20)
app.post(
  "/api/tickets/:id/attachments",
  upload.array("files", 5),
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticketId = Number(req.params.id);
      const rawRequesterId = req.headers["x-requester-id"];
      const requesterId = Number(rawRequesterId);

      if (isNaN(ticketId) || !rawRequesterId || isNaN(requesterId)) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "Invalid ticket ID or X-Requester-Id header" },
        });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          attachments: {
            where: { isRemoved: false },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Ticket not found" },
        });
      }

      if (ticket.requesterId !== requesterId) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You do not have permission to modify this ticket." },
        });
      }

      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: "NO_FILES", message: "No files provided for upload" },
        });
      }

      const currentActiveCount = ticket.attachments.length;
      if (currentActiveCount + files.length > 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: "LIMIT_EXCEEDED",
            message: `Cannot exceed 5 active attachments per ticket. Current: ${currentActiveCount}, Trying to add: ${files.length}`,
          },
        });
      }

      for (const file of files) {
        const check = validateAttachment({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
        if (!check.isValid) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_FILE", message: check.error },
          });
        }
      }

      const createdAttachments: any[] = [];
      for (const file of files) {
        const storageFileName = generateSafeStorageFileName(file.originalname);
        const filePath = path.join(UPLOADS_DIR, storageFileName);
        fs.writeFileSync(filePath, file.buffer);

        const record = await prisma.attachment.create({
          data: {
            ticketId,
            originalFileName: file.originalname,
            storageFileName,
            fileSize: file.size,
            fileType: file.mimetype || "application/octet-stream",
            storagePath: filePath,
          },
          select: {
            id: true,
            originalFileName: true,
            storageFileName: true,
            fileSize: true,
            fileType: true,
            isRemoved: true,
            uploadedAt: true,
          },
        });
        createdAttachments.push(record);
      }

      return res.status(201).json({
        success: true,
        data: createdAttachments,
      });
    } catch (error) {
      console.error("Error adding attachments:", error);
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to upload attachments" },
      });
    }
  }
);

// GET /api/attachments/:id/download - Download active attachment
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = Number(req.params.id);
    const rawRequesterId = req.headers["x-requester-id"] || req.query.requesterId;
    const requesterId = Number(rawRequesterId);

    if (isNaN(attachmentId) || !rawRequesterId || isNaN(requesterId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "Missing or invalid parameters" },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: { select: { requesterId: true } },
      },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Attachment not found" },
      });
    }

    // Ownership check (BR-22)
    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied to attachment" },
      });
    }

    // Soft-removed block (BR-18)
    if (attachment.isRemoved) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ATTACHMENT_REMOVED",
          message: "This attachment has been removed and cannot be downloaded.",
        },
      });
    }

    if (!fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({
        success: false,
        error: { code: "FILE_UNAVAILABLE", message: "Attachment file missing from storage" },
      });
    }

    return res.download(attachment.storagePath, attachment.originalFileName);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to download attachment" },
    });
  }
});

// PATCH /api/attachments/:id/remove - Soft-remove an attachment (BR-17, BR-19)
app.patch("/api/attachments/:id/remove", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = Number(req.params.id);
    const rawRequesterId = req.headers["x-requester-id"];
    const requesterId = Number(rawRequesterId);
    const { removalReason } = req.body;

    if (isNaN(attachmentId) || !rawRequesterId || isNaN(requesterId)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "Invalid attachment ID or X-Requester-Id" },
      });
    }

    const trimmedReason = typeof removalReason === "string" ? removalReason.trim() : "";
    if (!trimmedReason || trimmedReason.length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REASON_REQUIRED",
          message: "A removal reason of at least 3 characters is mandatory when removing an attachment.",
        },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: { select: { requesterId: true } },
      },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Attachment not found" },
      });
    }

    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied to remove attachment" },
      });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: trimmedReason,
      },
      select: {
        id: true,
        ticketId: true,
        originalFileName: true,
        storageFileName: true,
        fileSize: true,
        fileType: true,
        isRemoved: true,
        removedAt: true,
        removalReason: true,
        uploadedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error removing attachment:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to remove attachment" },
    });
  }
});

// Express Error Handling Middleware (Catches Multer LIMIT_FILE_SIZE, etc.)
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "LIMIT_FILE_SIZE",
          message: "File size exceeds the 5MB limit",
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: err.code || "UPLOAD_ERROR",
        message: err.message || "File upload error",
      },
    });
  }

  if (err) {
    console.error("Unhandled server error:", err);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: err.message || "An unexpected server error occurred",
      },
    });
  }

  next();
});

export default app;



