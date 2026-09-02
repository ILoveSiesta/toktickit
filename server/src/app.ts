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

// Multer in-memory/disk configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // allow up to 10MB to let custom validator handle 5MB with proper message
    files: 10,
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

export default app;


