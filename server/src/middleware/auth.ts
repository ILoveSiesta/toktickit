import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken, AuthPayload } from "../utils/jwt.js";
import { getPrisma } from "../prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware that strictly verifies JWT Bearer token and checks user activity.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token required.",
      },
    });
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token.",
      },
    });
  }

  // Verify in database that user still exists and is active
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, mustChangePassword: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User account no longer exists.",
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Account is inactive. Please contact administrator.",
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to authenticate request.",
      },
    });
  }
}

/**
 * Middleware that restricts access to specific Roles.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource.",
        },
      });
    }

    next();
  };
}

/**
 * Middleware that blocks normal requests if user must change password.
 */
export function enforcePasswordChanged(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      success: false,
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your password before continuing into the application.",
      },
    });
  }
  next();
}
