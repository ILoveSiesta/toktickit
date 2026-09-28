import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { comparePassword, hashPassword, validatePasswordPolicy } from "../utils/passwordPolicy.js";
import { signToken } from "../utils/jwt.js";
import { authenticate } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    // BR-01: Inactive user cannot authenticate
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Account is inactive. Please contact administrator.",
        },
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  }
});

// POST /api/auth/logout
authRouter.post("/logout", (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      message: "Logged out successfully.",
    },
  });
});

// GET /api/auth/me
authRouter.get("/me", authenticate, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

// POST /api/auth/change-password
authRouter.post("/change-password", authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Current password, new password, and confirm password are all required.",
        },
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "New password and confirmation password do not match.",
        },
      });
    }

    // BR-03: Validate complexity
    const validation = validatePasswordPolicy(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PASSWORD_COMPLEXITY",
          message: validation.errors.join(" "),
          details: validation.errors,
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User account not found.",
        },
      });
    }

    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Current password is incorrect.",
        },
      });
    }

    const isSamePassword = await comparePassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SAME_PASSWORD",
          message: "New password cannot be the same as current password.",
        },
      });
    }

    const newPasswordHash = await hashPassword(newPassword);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    const newToken = signToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      mustChangePassword: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        token: newToken,
        message: "Password updated successfully. You can now use the application.",
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while changing password.",
      },
    });
  }
});
