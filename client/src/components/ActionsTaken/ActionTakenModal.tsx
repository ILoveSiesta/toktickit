import React, { useState, useEffect } from "react";
import { AuthUser, ActionTaken, CreateActionTakenPayload, UpdateActionTakenPayload } from "../../types/index.js";

interface ActionTakenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateActionTakenPayload | UpdateActionTakenPayload) => Promise<void>;
  initialData?: ActionTaken | null;
  currentUser: AuthUser | null;
}

export const ActionTakenModal: React.FC<ActionTakenModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  currentUser,
}) => {
  const isEditMode = Boolean(initialData);

  // Form states
  const [actionDateTime, setActionDateTime] = useState<string>("");
  const [actionDescription, setActionDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");

  // Validation & Submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper to format ISO string to local input value "YYYY-MM-DDTHH:mm"
  const toLocalInputValue = (isoStr?: string) => {
    const d = isoStr ? new Date(isoStr) : new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setErrors({});
      if (initialData) {
        setActionDateTime(toLocalInputValue(initialData.actionDateTime));
        setActionDescription(initialData.actionDescription || "");
        setResult(initialData.result || "");
        setFollowUpRequired(Boolean(initialData.followUpRequired));
        setFollowUpNote(initialData.followUpNote || "");
        setAttachmentNotes(initialData.attachmentNotes || "");
      } else {
        setActionDateTime(toLocalInputValue());
        setActionDescription("");
        setResult("");
        setFollowUpRequired(false);
        setFollowUpNote("");
        setAttachmentNotes("");
      }
    }
  }, [isOpen, initialData]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isUserInactive = Boolean(currentUser && (currentUser as any).isActive === false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!actionDescription.trim()) {
      newErrors.actionDescription = "Action description is required.";
    }

    if (!result.trim()) {
      newErrors.result = "Result of action is required.";
    }

    if (followUpRequired && !followUpNote.trim()) {
      newErrors.followUpNote = "Follow-up note is required when follow-up is requested.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (isUserInactive) {
      setServerError("Your account is currently inactive. You cannot record or update actions taken.");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDateTime = actionDateTime ? new Date(actionDateTime).toISOString() : new Date().toISOString();

      if (isEditMode && initialData) {
        const payload: UpdateActionTakenPayload = {
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : undefined,
          attachmentNotes: attachmentNotes.trim() || undefined,
          actionDateTime: isoDateTime,
          expectedUpdatedAt: initialData.updatedAt,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateActionTakenPayload = {
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          followUpRequired,
          followUpNote: followUpRequired ? followUpNote.trim() : undefined,
          attachmentNotes: attachmentNotes.trim() || undefined,
          actionDateTime: isoDateTime,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: any) {
      // Safe Failure: preserve all user input, display server error
      setServerError(err.message || "Failed to save action taken. Please check inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const performerDisplayName = isEditMode && initialData?.performedBy
    ? `${initialData.performedBy.name} (${initialData.performedBy.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"})`
    : currentUser
    ? `${currentUser.name} (${currentUser.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"})`
    : "Current Staff";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 25, 20, 0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          border: "1px solid #CBD5E1",
          boxSizing: "border-box",
          padding: "1.75rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h2
              id="action-modal-title"
              style={{
                margin: 0,
                fontSize: "1.25rem",
                color: "#1A2E26",
                fontWeight: 700,
              }}
            >
              {isEditMode ? "Edit Action Taken" : "Record Action Taken"}
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#5F756B" }}>
              {isEditMode
                ? "Update technical findings and resolution progress for this ticket."
                : "Log technical work, troubleshooting steps, and operational results."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "#64748B",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Server Error Alert (Safe Failure) */}
        {serverError && (
          <div
            data-testid="action-form-error"
            role="alert"
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <span>⚠️</span>
            <div style={{ flex: 1 }}>{serverError}</div>
          </div>
        )}

        {isUserInactive && (
          <div
            role="alert"
            style={{
              backgroundColor: "#FFFBEB",
              border: "1px solid #FCD34D",
              color: "#92400E",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
            }}
          >
            ⚠️ Your account is currently inactive. You do not have permission to save actions taken.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Action Date & Performed By Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label
                htmlFor="action-datetime"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1A2E26",
                  marginBottom: "0.35rem",
                }}
              >
                Date & Time <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="action-datetime"
                data-testid="action-datetime-input"
                type="datetime-local"
                value={actionDateTime}
                onChange={(e) => setActionDateTime(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  backgroundColor: "#FFFFFF",
                  color: "#1A2E26",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="action-performer"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1A2E26",
                  marginBottom: "0.35rem",
                }}
              >
                Performed By <span style={{ fontSize: "0.75rem", color: "#5F756B" }}>(Auto-assigned)</span>
              </label>
              <input
                id="action-performer"
                data-testid="action-performer-input"
                type="text"
                value={performerDisplayName}
                disabled
                readOnly
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F1F5F3",
                  color: "#475569",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  cursor: "not-allowed",
                }}
              />
            </div>
          </div>

          {/* Action Description */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="action-description"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#1A2E26",
                marginBottom: "0.35rem",
              }}
            >
              Action Description <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <textarea
              id="action-description"
              data-testid="action-description-input"
              rows={3}
              value={actionDescription}
              onChange={(e) => {
                setActionDescription(e.target.value);
                if (errors.actionDescription) {
                  setErrors((prev) => ({ ...prev, actionDescription: "" }));
                }
              }}
              placeholder="Describe the technical steps performed (e.g., replaced RAM module, checked network socket...)"
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                border: `1px solid ${errors.actionDescription ? "#DC2626" : "#CBD5E1"}`,
                fontSize: "0.875rem",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            {errors.actionDescription && (
              <span
                data-testid="action-description-error"
                style={{ color: "#DC2626", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}
              >
                {errors.actionDescription}
              </span>
            )}
          </div>

          {/* Result */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="action-result"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#1A2E26",
                marginBottom: "0.35rem",
              }}
            >
              Result <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <textarea
              id="action-result"
              data-testid="action-result-input"
              rows={3}
              value={result}
              onChange={(e) => {
                setResult(e.target.value);
                if (errors.result) {
                  setErrors((prev) => ({ ...prev, result: "" }));
                }
              }}
              placeholder="State the outcome of the action (e.g., device booted normally, ping returned 0% packet loss...)"
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                border: `1px solid ${errors.result ? "#DC2626" : "#CBD5E1"}`,
                fontSize: "0.875rem",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            {errors.result && (
              <span
                data-testid="action-result-error"
                style={{ color: "#DC2626", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}
              >
                {errors.result}
              </span>
            )}
          </div>

          {/* Follow-up Required Checkbox */}
          <div
            style={{
              backgroundColor: followUpRequired ? "#FFFBEB" : "#F8FAFC",
              border: `1px solid ${followUpRequired ? "#FCD34D" : "#E2E8F0"}`,
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
              transition: "background-color 0.15s ease",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: followUpRequired ? "#92400E" : "#1A2E26",
                cursor: "pointer",
              }}
            >
              <input
                data-testid="follow-up-checkbox"
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFollowUpRequired(checked);
                  if (!checked) {
                    setErrors((prev) => ({ ...prev, followUpNote: "" }));
                  }
                }}
                style={{
                  width: "1.1rem",
                  height: "1.1rem",
                  accentColor: "#006B3C",
                  cursor: "pointer",
                }}
              />
              <span>Further follow-up action required</span>
            </label>

            {/* Conditional Follow-up Note */}
            {followUpRequired && (
              <div style={{ marginTop: "0.75rem" }}>
                <label
                  htmlFor="follow-up-note"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#92400E",
                    marginBottom: "0.3rem",
                  }}
                >
                  Follow-up Note <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <textarea
                  id="follow-up-note"
                  data-testid="follow-up-note-input"
                  rows={2}
                  value={followUpNote}
                  onChange={(e) => {
                    setFollowUpNote(e.target.value);
                    if (errors.followUpNote) {
                      setErrors((prev) => ({ ...prev, followUpNote: "" }));
                    }
                  }}
                  placeholder="Specify required follow-up (e.g., monitor battery temperature in 24 hours, check user feedback...)"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: `1px solid ${errors.followUpNote ? "#DC2626" : "#FCD34D"}`,
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    backgroundColor: "#FFFFFF",
                  }}
                />
                {errors.followUpNote && (
                  <span
                    data-testid="follow-up-note-error"
                    style={{ color: "#DC2626", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}
                  >
                    {errors.followUpNote}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Attachment Notes */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="attachment-notes"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#1A2E26",
                marginBottom: "0.35rem",
              }}
            >
              Attachment References / Notes <span style={{ fontSize: "0.75rem", color: "#5F756B" }}>(Optional)</span>
            </label>
            <input
              id="attachment-notes"
              data-testid="attachment-notes-input"
              type="text"
              value={attachmentNotes}
              onChange={(e) => setAttachmentNotes(e.target.value)}
              placeholder="e.g., Attached hardware photo #1, benchmark-log.txt, PSU report"
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                fontSize: "0.875rem",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              borderTop: "1px solid #E2E8F0",
              paddingTop: "1.25rem",
            }}
          >
            <button
              data-testid="cancel-action-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
              }}
            >
              Cancel
            </button>
            <button
              data-testid="save-action-btn"
              type="submit"
              disabled={isSubmitting || isUserInactive}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "6px",
                border: "none",
                background: "#006B3C",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: isSubmitting || isUserInactive ? "not-allowed" : "pointer",
                opacity: isSubmitting || isUserInactive ? 0.65 : 1,
                boxShadow: "0 1px 2px rgba(0, 107, 60, 0.2)",
                transition: "background 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "14px",
                      height: "14px",
                      border: "2px solid #FFFFFF",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Update Action Taken" : "Save Action Taken"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
