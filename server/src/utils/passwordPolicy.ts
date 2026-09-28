import bcrypt from "bcryptjs";

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password according to BR-03:
 * - At least 8 characters
 * - Includes uppercase letter (A-Z)
 * - Includes lowercase letter (a-z)
 * - Includes a number (0-9)
 * - Includes a special character
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number.");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must include at least one special character.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hashes a plain-text password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
