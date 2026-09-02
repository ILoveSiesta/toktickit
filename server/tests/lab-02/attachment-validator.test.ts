import { describe, it, expect } from "vitest";
import { validateAttachment } from "../../src/utils/attachmentValidator.js";

describe("UNIT-02: Attachment Validator", () => {
  it("should accept valid file types (JPG, JPEG, PNG, WEBP, PDF) under 5MB", () => {
    const validJpg = { originalname: "screenshot.jpg", mimetype: "image/jpeg", size: 1024 * 1024 };
    const validPng = { originalname: "diagram.png", mimetype: "image/png", size: 2 * 1024 * 1024 };
    const validWebp = { originalname: "image.webp", mimetype: "image/webp", size: 500 * 1024 };
    const validPdf = { originalname: "document.pdf", mimetype: "application/pdf", size: 4.9 * 1024 * 1024 };

    expect(validateAttachment(validJpg).isValid).toBe(true);
    expect(validateAttachment(validPng).isValid).toBe(true);
    expect(validateAttachment(validWebp).isValid).toBe(true);
    expect(validateAttachment(validPdf).isValid).toBe(true);
  });

  it("should reject files exceeding 5MB limit", () => {
    const oversizedFile = {
      originalname: "large_doc.pdf",
      mimetype: "application/pdf",
      size: 5.1 * 1024 * 1024, // 5.1 MB
    };

    const result = validateAttachment(oversizedFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("5MB");
  });

  it("should reject unpermitted file extensions and MIME types", () => {
    const exeFile = { originalname: "malware.exe", mimetype: "application/x-msdownload", size: 1024 };
    const txtFile = { originalname: "notes.txt", mimetype: "text/plain", size: 1024 };
    const zipFile = { originalname: "archive.zip", mimetype: "application/zip", size: 1024 };

    expect(validateAttachment(exeFile).isValid).toBe(false);
    expect(validateAttachment(txtFile).isValid).toBe(false);
    expect(validateAttachment(zipFile).isValid).toBe(false);
  });
});
