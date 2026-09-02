import { describe, it, expect } from "vitest";
import { generateSafeStorageFileName } from "../../src/utils/safeStorageName.js";

describe("UNIT-03: Safe Storage Filename Sanitizer", () => {
  it("should generate a sanitized, unique filename preserving original extension", () => {
    const original = "my report photo 2026.png";
    const storageName = generateSafeStorageFileName(original);

    expect(storageName).not.toBe(original);
    expect(storageName.endsWith(".png")).toBe(true);
    expect(storageName).not.toContain(" ");
  });

  it("should prevent directory traversal characters from persisting in storage name", () => {
    const malicious = "../../../etc/passwd.pdf";
    const storageName = generateSafeStorageFileName(malicious);

    expect(storageName).not.toContain("..");
    expect(storageName).not.toContain("/");
    expect(storageName).not.toContain("\\");
    expect(storageName.endsWith(".pdf")).toBe(true);
  });
});
