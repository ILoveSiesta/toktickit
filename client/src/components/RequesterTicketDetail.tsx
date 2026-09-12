import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRequester } from "../context/RequesterContext.js";
import { fetchTicketDetail, uploadTicketAttachments, removeAttachment, downloadAttachment } from "../api.js";

interface RequesterTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const RequesterTicketDetail: React.FC<RequesterTicketDetailProps> = ({ ticketId, onBack }) => {
  const { user } = useAuth();
  let requesterContext: any = null;
  try {
    requesterContext = useRequester();
  } catch {}

  const currentRequester = useMemo(() => {
    return (user ? { id: user.id, name: user.name, email: user.email, isActive: true } : null) || requesterContext?.currentRequester;
  }, [user?.id, user?.name, user?.email, requesterContext?.currentRequester]);

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Soft-remove modal state
  const [removingAttachment, setRemovingAttachment] = useState<any | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removingLoading, setRemovingLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Additional file upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const requesterId = currentRequester?.id;

  const loadTicket = useCallback(async () => {
    if (!requesterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketDetail(ticketId, requesterId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [ticketId, requesterId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const activeAttachments = ticket?.attachments?.filter((a: any) => !a.isRemoved) || [];
  const removedAttachments = ticket?.attachments?.filter((a: any) => a.isRemoved) || [];

  const handleDownload = async (attachment: any) => {
    if (!currentRequester || attachment.isRemoved) return;
    try {
      await downloadAttachment(attachment.id, currentRequester.id, attachment.originalFileName);
    } catch (err: any) {
      alert(`Cannot download file: ${err.message}`);
    }
  };

  const handleConfirmRemoval = async () => {
    if (!currentRequester || !removingAttachment || !removalReason.trim() || removalReason.trim().length < 3) return;
    setRemovingLoading(true);
    setModalError(null);
    try {
      await removeAttachment(removingAttachment.id, removalReason.trim(), currentRequester.id);
      setRemovingAttachment(null);
      setRemovalReason("");
      await loadTicket();
    } catch (err: any) {
      setModalError(err.message || "Failed to remove attachment");
    } finally {
      setRemovingLoading(false);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Check active quota (BR-16, BR-20)
    if (activeAttachments.length + selected.length > 5) {
      setUploadError(
        `You can only have up to 5 active attachments per ticket (current: ${activeAttachments.length}, selected: ${selected.length}).`
      );
      e.target.value = "";
      setUploadFiles([]);
      return;
    }

    // Validate allowed extensions and max size
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    for (const file of selected) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedExts.includes(ext)) {
        setUploadError(`File "${file.name}" has an unsupported format. Allowed: JPG, PNG, WEBP, PDF.`);
        e.target.value = "";
        setUploadFiles([]);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 5MB size limit.`);
        e.target.value = "";
        setUploadFiles([]);
        return;
      }
    }

    setUploadFiles(selected);
  };

  const handleUploadAdditional = async () => {
    if (!currentRequester || uploadFiles.length === 0) return;
    
    if (activeAttachments.length + uploadFiles.length > 5) {
      setUploadError("You can only have up to 5 active attachments per ticket.");
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    try {
      await uploadTicketAttachments(ticketId, uploadFiles, currentRequester.id);
      setUploadFiles([]);
      await loadTicket();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment");
    } finally {
      setUploadLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "zen-badge-new";
      case "OPEN":
        return "zen-badge-open";
      case "IN_PROGRESS":
        return "zen-badge-inprogress";
      case "RESOLVED":
        return "zen-badge-resolved";
      case "CLOSED":
        return "zen-badge-closed";
      default:
        return "zen-badge-open";
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "zen-badge-critical";
      case "HIGH":
        return "zen-badge-high";
      case "MEDIUM":
        return "zen-badge-medium";
      case "LOW":
        return "zen-badge-low";
      default:
        return "zen-badge-medium";
    }
  };

  if (loading) {
    return (
      <div className="zen-container" style={{ padding: "var(--space-2xl) var(--space-base)", textAlign: "center" }}>
        <p className="zen-text-muted">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    const isUnauthorized =
      error?.toLowerCase().includes("permission") ||
      error?.toLowerCase().includes("forbidden") ||
      error?.toLowerCase().includes("403") ||
      error?.toLowerCase().includes("unauthorized");

    return (
      <div className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
        <button
          type="button"
          onClick={onBack}
          className="zen-btn zen-btn-secondary"
          style={{ marginBottom: "var(--space-md)" }}
        >
          ← Back to My Tickets
        </button>
        <div
          className="zen-card"
          data-testid="unauthorized-error-view"
          style={{ textAlign: "center", padding: "var(--space-2xl)" }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>🚫</div>
          <h2 className="zen-title" style={{ fontSize: "1.25rem", color: "var(--color-error)" }}>
            {isUnauthorized ? "Unauthorized Access" : "Ticket Unavailable"}
          </h2>
          <p className="zen-text-muted" style={{ maxWidth: 480, margin: "0 auto var(--space-lg) auto" }}>
            {isUnauthorized
              ? "You do not have permission to view or manage this ticket. Tickets are strictly isolated to their original requester."
              : error || "Ticket not found."}
          </p>
          <button type="button" onClick={onBack} className="zen-btn zen-btn-secondary">
            Return to My Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-lg)",
          flexWrap: "wrap",
          gap: "var(--space-md)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="zen-btn zen-btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)" }}
        >
          ← Back to My Tickets
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <span className={`zen-badge ${getStatusBadgeClass(ticket.currentStatus)}`}>
            Status: {ticket.currentStatus.replace("_", " ")}
          </span>
          <span className={`zen-badge ${getPriorityBadgeClass(ticket.requestedPriority)}`}>
            Req. Priority: {ticket.requestedPriority}
          </span>
          {ticket.itPriority && (
            <span
              data-testid="it-priority-badge"
              className={`zen-badge ${getPriorityBadgeClass(ticket.itPriority)}`}
            >
              IT Priority: {ticket.itPriority}
            </span>
          )}
        </div>
      </div>

      {/* Main Ticket Card (Read-only UI - BR-26) */}
      <div className="zen-card" style={{ marginBottom: "var(--space-xl)" }}>
        <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
          <div className="zen-text-muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            TICKET NUMBER
          </div>
          <h1 className="zen-title" style={{ fontSize: "1.5rem", color: "var(--color-primary-green)", margin: 0 }}>
            {ticket.ticketNumber}
          </h1>
        </div>

        {/* Read-only Information Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-lg)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <div>
            <label className="zen-label">Category</label>
            <div
              style={{
                backgroundColor: "var(--color-field-readonly)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                fontWeight: 600,
              }}
            >
              {ticket.category?.name || "General"}
            </div>
          </div>

          <div>
            <label className="zen-label">Related System / Service</label>
            <div
              style={{
                backgroundColor: "var(--color-field-readonly)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                fontWeight: 600,
              }}
            >
              {ticket.relatedSystem?.name || "None / General"}
            </div>
          </div>

          <div>
            <label className="zen-label">Submitted By</label>
            <div
              style={{
                backgroundColor: "var(--color-field-readonly)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              {ticket.requester?.name} ({ticket.requester?.department || "General"})
            </div>
          </div>

          <div>
            <label className="zen-label">Date Submitted</label>
            <div
              style={{
                backgroundColor: "var(--color-field-readonly)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              {formatDateTime(ticket.createdAt || ticket.ticketDate)}
            </div>
          </div>

          <div>
            <label className="zen-label">Assigned IT Owner</label>
            <div
              style={{
                backgroundColor: "var(--color-field-readonly)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                fontWeight: 500,
              }}
            >
              {ticket.ticketOwner || "Unassigned"}
            </div>
          </div>
        </div>

        {/* Summary (Read-only) */}
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <label className="zen-label">Summary / Problem Title</label>
          <div
            data-testid="readonly-summary"
            style={{
              backgroundColor: "var(--color-field-readonly)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontWeight: 600,
              fontSize: "1rem",
              color: "var(--color-text-dark)",
            }}
          >
            {ticket.summary}
          </div>
        </div>

        {/* Description (Read-only) */}
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <label className="zen-label">Description & Symptoms</label>
          <div
            data-testid="readonly-description"
            style={{
              backgroundColor: "var(--color-field-readonly)",
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              minHeight: "100px",
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              color: "var(--color-text-dark)",
            }}
          >
            {ticket.description}
          </div>
        </div>

        {/* Attachments Management Section */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <h2 className="zen-title" style={{ fontSize: "1.125rem", margin: 0 }}>
              Attachments ({activeAttachments.length}/5 active)
            </h2>
          </div>

          {/* Active Attachments List */}
          {activeAttachments.length === 0 && removedAttachments.length === 0 ? (
            <p className="zen-text-muted" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
              No files attached to this ticket.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
              {activeAttachments.map((att: any) => (
                <div
                  key={att.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "#FFFFFF",
                    flexWrap: "wrap",
                    gap: "var(--space-sm)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <span style={{ fontSize: "1.2rem" }}>📎</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{att.originalFileName}</div>
                      <div className="zen-text-muted" style={{ fontSize: "0.75rem" }}>
                        {formatFileSize(att.fileSize)} • Uploaded {formatDateTime(att.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                    <button
                      type="button"
                      onClick={() => handleDownload(att)}
                      className="zen-btn zen-btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", height: "30px" }}
                    >
                      ⬇ Download
                    </button>
                    <button
                      type="button"
                      data-testid={`remove-attachment-${att.id}-btn`}
                      onClick={() => {
                        setRemovingAttachment(att);
                        setRemovalReason("");
                        setModalError(null);
                      }}
                      className="zen-btn"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        height: "30px",
                        backgroundColor: "#FEE2E2",
                        color: "#DC2626",
                        border: "1px solid #FCA5A5",
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Removed Attachments (BR-18, BR-19) */}
              {removedAttachments.map((att: any) => (
                <div
                  key={att.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px dashed #CBD5E1",
                    backgroundColor: "#F8FAFC",
                    opacity: 0.75,
                    flexWrap: "wrap",
                    gap: "var(--space-sm)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <span style={{ fontSize: "1.2rem" }}>🚫</span>
                    <div>
                      <div style={{ textDecoration: "line-through", color: "#64748B", fontSize: "0.9rem" }}>
                        {att.originalFileName}
                      </div>
                      <div className="zen-text-muted" style={{ fontSize: "0.75rem", color: "#EF4444" }}>
                        Removed on {formatDateTime(att.removedAt)} • Reason: <em>"{att.removalReason || "No reason specified"}"</em>
                      </div>
                    </div>
                  </div>

                  <span
                    data-testid="removed-badge"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#94A3B8",
                      padding: "2px 8px",
                      backgroundColor: "#E2E8F0",
                      borderRadius: "4px",
                    }}
                  >
                    [Removed]
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add Additional Attachment (BR-20 / UI-09) */}
          {activeAttachments.length < 5 && (
            <div
              style={{
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
                backgroundColor: "#FAFDFB",
              }}
            >
              <label className="zen-label" style={{ marginBottom: "var(--space-xs)" }}>
                Add Additional File ({5 - activeAttachments.length} remaining)
              </label>
              <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="file"
                  multiple
                  data-testid="add-attachment-input"
                  className="zen-input"
                  style={{ flex: "1 1 250px", padding: "4px 8px" }}
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelection}
                />
                <button
                  type="button"
                  data-testid="upload-attachment-btn"
                  onClick={handleUploadAdditional}
                  disabled={uploadFiles.length === 0 || uploadLoading}
                  className="zen-btn zen-btn-primary"
                  style={{ height: "38px" }}
                >
                  {uploadLoading ? "Uploading..." : `+ Upload File (${uploadFiles.length})`}
                </button>
              </div>

              {uploadError && (
                <div className="zen-text-error" style={{ marginTop: "var(--space-xs)" }}>
                  {uploadError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Soft-Removal Confirmation Modal (BR-19 / UI-07) */}
      {removingAttachment && (
        <div
          data-testid="removal-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: "var(--space-md)",
          }}
        >
          <div
            className="zen-card"
            style={{
              maxWidth: 480,
              width: "100%",
              padding: "var(--space-lg)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3 className="zen-title" style={{ fontSize: "1.125rem", color: "#DC2626", marginBottom: "var(--space-xs)" }}>
              Remove Attachment
            </h3>
            <p className="zen-text-muted" style={{ marginBottom: "var(--space-md)" }}>
              You are about to remove <strong>{removingAttachment.originalFileName}</strong>.
              A mandatory reason (at least 3 characters) must be recorded for audit and tracking.
            </p>

            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="zen-label">
                Removal Reason <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <textarea
                data-testid="removal-reason-input"
                className="zen-textarea"
                rows={3}
                placeholder="Please explain why this file is being removed..."
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
              />
            </div>

            {modalError && (
              <div className="zen-text-error" style={{ marginBottom: "var(--space-md)" }}>
                {modalError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-sm)" }}>
              <button
                type="button"
                data-testid="cancel-removal-btn"
                onClick={() => setRemovingAttachment(null)}
                className="zen-btn zen-btn-secondary"
                disabled={removingLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-removal-btn"
                onClick={handleConfirmRemoval}
                disabled={!removalReason.trim() || removalReason.trim().length < 3 || removingLoading}
                className="zen-btn"
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                }}
              >
                {removingLoading ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
