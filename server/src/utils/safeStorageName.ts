import crypto from "crypto";
import path from "path";

/**
 * Generates a unique, sanitized storage filename preventing path traversal.
 * @param originalFileName Name of the uploaded file
 */
export function generateSafeStorageFileName(originalFileName: string): string {
  // Strip any leading/trailing directory paths
  const baseName = path.basename(originalFileName);
  const ext = path.extname(baseName).toLowerCase();
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();

  return `${timestamp}_${uniqueId}${ext}`;
}
