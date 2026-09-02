import React, { useState, useRef } from "react";

interface AttachmentSectionProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  files,
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File "${file.name}" has an unsupported format. Allowed formats: JPG, JPEG, PNG, WEBP, PDF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
    }
    return null;
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Check if adding these files would exceed quota
    if (files.length + selected.length > maxFiles) {
      setErrorMessage(`You can only attach up to ${maxFiles} files in total.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate each file
    for (const file of selected) {
      const error = validateFile(file);
      if (error) {
        setErrorMessage(error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    // Append files
    onFilesChange([...files, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setErrorMessage(null);
    onFilesChange(files.filter((_, idx) => idx !== indexToRemove));
  };

  const isLimitReached = files.length >= maxFiles;

  return (
    <div className="zen-form-group">
      <label className="zen-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Attachments (Optional)</span>
        <span className="zen-text-muted">
          {files.length}/{maxFiles} files (Max 5MB each: JPG, PNG, WEBP, PDF)
        </span>
      </label>

      {/* Dropzone & Input */}
      <div
        style={{
          border: isLimitReached ? "1px dashed var(--color-border-neutral)" : "2px dashed var(--color-secondary-green)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-base)",
          textAlign: "center",
          backgroundColor: isLimitReached ? "var(--color-field-readonly)" : "var(--color-pale-green)",
          transition: "all 0.15s ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          data-testid="file-input"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          disabled={disabled || isLimitReached}
          onChange={handleFileSelection}
          style={{ display: "none" }}
          id="file-upload-input"
        />

        {isLimitReached ? (
          <div data-testid="file-limit-reached" style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            🔒 Maximum {maxFiles} attachments reached
          </div>
        ) : (
          <div>
            <label
              htmlFor="file-upload-input"
              className="zen-btn zen-btn-secondary"
              style={{
                cursor: disabled ? "not-allowed" : "pointer",
                padding: "6px 14px",
                fontSize: "var(--font-size-sm)",
              }}
            >
              📎 Choose Files to Attach
            </label>
            <div className="zen-text-muted" style={{ marginTop: "var(--space-xs)", fontSize: "0.75rem" }}>
              or drag and drop files here
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          data-testid="attachment-error"
          style={{
            color: "var(--color-error)",
            fontSize: "var(--font-size-xs)",
            marginTop: "var(--space-xs)",
            fontWeight: 500,
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div style={{ marginTop: "var(--space-sm)", display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {files.map((file, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-neutral)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 10px",
                fontSize: "var(--font-size-xs)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", overflow: "hidden" }}>
                <span>📄</span>
                <span style={{ fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {file.name}
                </span>
                <span className="zen-text-muted">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                disabled={disabled}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-error)",
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: "2px 6px",
                }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
