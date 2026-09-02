import path from "path";

export interface AttachmentValidationInput {
  originalname: string;
  mimetype?: string;
  size: number;
}

export interface AttachmentValidationResult {
  isValid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Validates attachment file size and allowed type.
 */
export function validateAttachment(file: AttachmentValidationInput): AttachmentValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File "${file.originalname}" exceeds the 5MB size limit.`,
    };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `File "${file.originalname}" has an unsupported format. Allowed formats: JPG, JPEG, PNG, WEBP, PDF.`,
    };
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return {
      isValid: false,
      error: `File "${file.originalname}" has an invalid MIME type (${file.mimetype}).`,
    };
  }

  return { isValid: true };
}
