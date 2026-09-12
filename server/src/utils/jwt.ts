import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export interface AuthPayload {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || "toktickit_super_secure_jwt_secret_key_2026";
const JWT_EXPIRES_IN = "24h";

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}
