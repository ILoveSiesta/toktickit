import { Router, Request, Response } from "express";
import { Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { hashPassword } from "../utils/passwordPolicy.js";
import { authenticate, requireRole, enforcePasswordChanged } from "../middleware/auth.js";

export const adminRouter = Router();

// Apply security guardrails to all Administrator endpoints (BR-22, BR-02)
adminRouter.use(authenticate);
adminRouter.use(enforcePasswordChanged);
adminRouter.use(requireRole(Role.ADMINISTRATOR));

/**
 * GET /api/admin/users (API-20)
 * List all users with optional name/email search and role filtering.
 */
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;
    const prisma = getPrisma();

    const where: any = {};

    if (role && typeof role === "string" && role.trim() !== "ALL") {
      const normalizedRole = role.trim().toUpperCase();
      if (normalizedRole === "ADMIN" || normalizedRole === "ADMINISTRATOR") {
        where.role = Role.ADMINISTRATOR;
      } else if (
        normalizedRole === "STAFF" ||
        normalizedRole === "IT_STAFF" ||
        normalizedRole === "IT STAFF"
      ) {
        where.role = Role.IT_STAFF;
      } else if (normalizedRole === "REQUESTER") {
        where.role = Role.REQUESTER;
      } else if (Object.values(Role).includes(normalizedRole as Role)) {
        where.role = normalizedRole as Role;
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while fetching users.",
      },
    });
  }
});

/**
 * POST /api/admin/users (API-21, API-22)
 * Create a new user with initial password and mandatory first-login password change (BR-24).
 */
adminRouter.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, email, role, department, isActive, initialPassword } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Name must be between 2 and 100 characters.",
        },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid email is required.",
        },
      });
    }

    if (!role || !Object.values(Role).includes(role as Role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid role is required (REQUESTER, IT_STAFF, ADMINISTRATOR).",
        },
      });
    }

    if (!initialPassword || typeof initialPassword !== "string" || initialPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Initial password must be at least 8 characters long.",
        },
      });
    }

    const prisma = getPrisma();
    const normalizedEmail = email.trim().toLowerCase();

    // BR-23: Case-insensitive unique email check
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email address is already in use.",
        },
      });
    }

    const passwordHash = await hashPassword(initialPassword);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: role as Role,
        department: typeof department === "string" ? department.trim() : null,
        isActive: typeof isActive === "boolean" ? isActive : true,
        mustChangePassword: true, // BR-24: Always require password change on first login
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while creating user.",
      },
    });
  }
});

/**
 * PATCH /api/admin/users/:id (API-23, API-24, API-25)
 * Update basic user details, role, or activation status with safety guardrails.
 */
adminRouter.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid user ID.",
        },
      });
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });
    }

    const { name, email, role, department, isActive } = req.body;

    // BR-25: Prevent Self-Deactivation
    if (targetUser.id === req.user!.id && isActive === false) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SELF_DEACTIVATION_PROHIBITED",
          message: "You cannot deactivate your own administrator account.",
        },
      });
    }

    // BR-26: Prevent Deactivation or Role Demotion of Last Active Administrator
    const isTargetActiveAdmin = targetUser.role === Role.ADMINISTRATOR && targetUser.isActive;
    const isDeactivating = isActive === false;
    const isDemotingRole = role !== undefined && role !== Role.ADMINISTRATOR;

    if (isTargetActiveAdmin && (isDeactivating || isDemotingRole)) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: Role.ADMINISTRATOR,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: "LAST_ACTIVE_ADMIN_PROTECTION",
            message: "Cannot deactivate or demote the last active administrator.",
          },
        });
      }
    }

    // BR-23: Case-insensitive Email Uniqueness Validation
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid email is required.",
          },
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            id: { not: targetId },
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message: "Email address is already in use.",
            },
          });
        }
      }
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name must be between 2 and 100 characters.",
          },
        });
      }
    }

    if (role !== undefined) {
      if (!Object.values(Role).includes(role as Role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid role is required (REQUESTER, IT_STAFF, ADMINISTRATOR).",
          },
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role as Role;
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while updating user.",
      },
    });
  }
});

/**
 * POST /api/admin/users/:id/reset-password (API-26)
 * Reset user password with an initial password and enforce first-login password change (BR-24).
 */
adminRouter.post("/users/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid user ID.",
        },
      });
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        },
      });
    }

    const password = req.body.newInitialPassword || req.body.initialPassword;
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Initial password must be at least 8 characters long.",
        },
      });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: targetId },
      data: {
        passwordHash,
        mustChangePassword: true, // BR-24: Force user to change on next login
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: "Initial password reset successfully. User must change it at next login.",
        mustChangePassword: true,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while resetting password.",
      },
    });
  }
});
