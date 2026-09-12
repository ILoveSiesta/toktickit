import React, { useState, useEffect, useMemo } from "react";
import { fetchCategories, fetchRelatedSystems, createTicket } from "../api.js";
import { Category, RelatedSystem } from "../types/index.js";
import { useAuth } from "../context/AuthContext.js";
import { useRequester } from "../context/RequesterContext.js";
import { AttachmentSection } from "./AttachmentSection.js";

interface CreateTicketProps {
  onTicketCreated?: (ticket: any) => void;
  onCancel?: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({ onTicketCreated, onCancel }) => {
  const { user } = useAuth();
  let requesterContext: any = null;
  try {
    requesterContext = useRequester();
  } catch {}

  const currentRequester = useMemo(() => {
    return (user ? { id: user.id, name: user.name, email: user.email, isActive: true } : null) || requesterContext?.currentRequester;
  }, [user?.id, user?.name, user?.email, requesterContext?.currentRequester]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingRefData, setLoadingRefData] = useState<boolean>(true);

  // Form Fields State
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("MEDIUM");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdTicketData, setCreatedTicketData] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadRefData() {
      setLoadingRefData(true);
      try {
        const [cats, systems] = await Promise.all([fetchCategories(), fetchRelatedSystems()]);
        if (isMounted) {
          setCategories(cats);
          setRelatedSystems(systems);
          if (cats.length > 0) setCategoryId(String(cats[0].id));
          if (systems.length > 0) setRelatedSystemId(String(systems[0].id));
        }
      } catch (err: any) {
        console.error("Failed to load reference data", err);
      } finally {
        if (isMounted) setLoadingRefData(false);
      }
    }
    loadRefData();
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      newErrors.summary = "Summary is required (5–200 characters)";
    } else if (trimmedSummary.length < 5) {
      newErrors.summary = "Summary must be at least 5 characters";
    } else if (trimmedSummary.length > 200) {
      newErrors.summary = "Summary cannot exceed 200 characters";
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      newErrors.description = "Description is required (10–2000 characters)";
    } else if (trimmedDescription.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (trimmedDescription.length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters";
    }

    if (!categoryId) {
      newErrors.categoryId = "Please select a Category";
    }

    if (!relatedSystemId) {
      newErrors.relatedSystemId = "Please select a Related System";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    if (!currentRequester) {
      setServerError("Please select a Development Requester context first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("summary", summary.trim());
      formData.append("description", description.trim());
      formData.append("categoryId", categoryId);
      formData.append("relatedSystemId", relatedSystemId);
      formData.append("requestedPriority", requestedPriority);

      attachments.forEach((file) => {
        formData.append("files", file);
      });

      const response = await createTicket(formData, currentRequester.id);
      if (response && response.success) {
        setCreatedTicketData(response.data);
        if (onTicketCreated) {
          onTicketCreated(response.data);
        }
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSummary("");
    setDescription("");
    setAttachments([]);
    setErrors({});
    setServerError(null);
    setCreatedTicketData(null);
    if (categories.length > 0) setCategoryId(String(categories[0].id));
    if (relatedSystems.length > 0) setRelatedSystemId(String(relatedSystems[0].id));
    setRequestedPriority("MEDIUM");
  };

  // Success Screen
  if (createdTicketData) {
    return (
      <div className="zen-container" style={{ padding: "var(--space-xl) 0" }}>
        <div className="zen-card" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", color: "var(--color-success)", marginBottom: "var(--space-sm)" }}>
            ✓
          </div>
          <h2 className="zen-title" style={{ color: "var(--color-primary-green)" }}>
            Ticket Submitted Successfully!
          </h2>
          <p className="zen-text-muted" style={{ marginBottom: "var(--space-lg)" }}>
            Your support request has been logged. An IT technician will review it shortly.
          </p>

          <div
            style={{
              background: "var(--color-pale-green)",
              border: "1px solid #A7F3D0",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-base)",
              marginBottom: "var(--space-xl)",
            }}
          >
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
              Ticket Number
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-primary-green)",
                letterSpacing: "1px",
              }}
              data-testid="success-ticket-number"
            >
              {createdTicketData.ticketNumber}
            </div>
            <div style={{ marginTop: "var(--space-xs)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              Summary: {createdTicketData.summary}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-md)" }}>
            <button
              onClick={resetForm}
              className="zen-btn zen-btn-primary"
              data-testid="create-another-btn"
            >
              + Create Another Ticket
            </button>
            {onCancel && (
              <button onClick={onCancel} className="zen-btn zen-btn-secondary">
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zen-container" style={{ padding: "var(--space-xl) 0" }}>
      <div className="zen-card" style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ borderBottom: "1px solid var(--color-border-neutral)", paddingBottom: "var(--space-base)", marginBottom: "var(--space-lg)" }}>
          <h1 className="zen-title" style={{ marginBottom: "var(--space-xs)" }}>
            Create Support Ticket
          </h1>
          <p className="zen-text-muted" style={{ margin: 0 }}>
            Fill in the details below to request IT assistance. Required fields are marked with a red asterisk (<span className="zen-required">*</span>).
          </p>
        </div>

        {serverError && (
          <div className="zen-alert-error" role="alert" style={{ marginBottom: "var(--space-lg)" }}>
            <strong>Submission Error:</strong> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Read-only System Metadata Box per UI-Spec 4.3 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-md)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-neutral)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              marginBottom: "var(--space-xl)",
            }}
          >
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                Ticket Number
              </div>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }} data-testid="generated-ticket-number">
                [Generated on Submission]
              </div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                Ticket Date
              </div>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-main)", marginTop: "2px" }} data-testid="ticket-date-readonly">
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} (Today)
              </div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                Requester
              </div>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-primary-green)", fontWeight: 600, marginTop: "2px" }} data-testid="requester-name-readonly">
                {currentRequester?.name || "Somchai"} ({currentRequester?.department || "IT Support"})
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "var(--space-xl)",
            }}
          >
            {/* Left Column: Classification & Metadata */}
            <div>
              <h2 className="zen-subtitle" style={{ fontSize: "1rem", borderBottom: "1px solid var(--color-border-neutral)", paddingBottom: "var(--space-xs)" }}>
                1. Request Information
              </h2>

              {/* Category */}
              <div className="zen-form-group">
                <label htmlFor="ticket-category" className="zen-label">
                  Category <span className="zen-required">*</span>
                </label>
                <select
                  id="ticket-category"
                  data-testid="category-select"
                  className="zen-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={loadingRefData || isSubmitting}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <div style={{ color: "var(--color-error)", fontSize: "var(--font-size-xs)", marginTop: "4px" }}>
                    {errors.categoryId}
                  </div>
                )}
              </div>

              {/* Related System */}
              <div className="zen-form-group">
                <label htmlFor="ticket-related-system" className="zen-label">
                  Related System <span className="zen-required">*</span>
                </label>
                <select
                  id="ticket-related-system"
                  data-testid="related-system-select"
                  className="zen-select"
                  value={relatedSystemId}
                  onChange={(e) => setRelatedSystemId(e.target.value)}
                  disabled={loadingRefData || isSubmitting}
                >
                  {relatedSystems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.relatedSystemId && (
                  <div style={{ color: "var(--color-error)", fontSize: "var(--font-size-xs)", marginTop: "4px" }}>
                    {errors.relatedSystemId}
                  </div>
                )}
              </div>

              {/* Requested Priority */}
              <div className="zen-form-group">
                <label htmlFor="ticket-priority" className="zen-label">
                  Requested Priority <span className="zen-required">*</span>
                </label>
                <select
                  id="ticket-priority"
                  data-testid="priority-select"
                  className="zen-select"
                  value={requestedPriority}
                  onChange={(e) => setRequestedPriority(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="LOW">Low — Minor issue, minimal impact</option>
                  <option value="MEDIUM">Medium — Standard request, normal priority</option>
                  <option value="HIGH">High — Urgent issue affecting daily work</option>
                  <option value="CRITICAL">Critical — System outage or major blocking incident</option>
                </select>
              </div>

              {/* Requester Info Box */}
              <div
                style={{
                  background: "var(--color-field-readonly)",
                  border: "1px solid var(--color-border-neutral)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-md)",
                  marginTop: "var(--space-lg)",
                }}
              >
                <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  REQUESTER CONTEXT
                </div>
                <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginTop: "2px" }}>
                  👤 {currentRequester?.name || "No Requester"}
                </div>
                <div className="zen-text-muted">
                  {currentRequester?.email} ({currentRequester?.department || "General"})
                </div>
              </div>
            </div>

            {/* Right Column: Issue Description & Attachments */}
            <div>
              <h2 className="zen-subtitle" style={{ fontSize: "1rem", borderBottom: "1px solid var(--color-border-neutral)", paddingBottom: "var(--space-xs)" }}>
                2. Issue Description & Attachments
              </h2>

              {/* Summary */}
              <div className="zen-form-group">
                <label htmlFor="ticket-summary" className="zen-label">
                  Summary <span className="zen-required">*</span>
                </label>
                <input
                  id="ticket-summary"
                  data-testid="summary-input"
                  type="text"
                  className="zen-input"
                  placeholder="e.g., Cannot connect to VPN from home network"
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    if (errors.summary) {
                      setErrors({ ...errors, summary: "" });
                    }
                  }}
                  disabled={isSubmitting}
                  maxLength={200}
                />
                {errors.summary ? (
                  <div
                    data-testid="summary-error"
                    style={{ color: "var(--color-error)", fontSize: "var(--font-size-xs)", marginTop: "4px", fontWeight: 500 }}
                  >
                    ⚠️ {errors.summary}
                  </div>
                ) : (
                  <div className="zen-text-muted" style={{ marginTop: "4px", textAlign: "right" }}>
                    {summary.length}/200 characters (min 5)
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="zen-form-group">
                <label htmlFor="ticket-description" className="zen-label">
                  Description <span className="zen-required">*</span>
                </label>
                <textarea
                  id="ticket-description"
                  data-testid="description-textarea"
                  className="zen-textarea"
                  rows={5}
                  placeholder="Describe what happened, error messages, and steps to reproduce..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors({ ...errors, description: "" });
                    }
                  }}
                  disabled={isSubmitting}
                  maxLength={2000}
                />
                {errors.description ? (
                  <div
                    data-testid="description-error"
                    style={{ color: "var(--color-error)", fontSize: "var(--font-size-xs)", marginTop: "4px", fontWeight: 500 }}
                  >
                    ⚠️ {errors.description}
                  </div>
                ) : (
                  <div className="zen-text-muted" style={{ marginTop: "4px", textAlign: "right" }}>
                    {description.length}/2000 characters (min 10)
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <AttachmentSection
                files={attachments}
                onFilesChange={setAttachments}
                maxFiles={5}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--space-md)",
              borderTop: "1px solid var(--color-border-neutral)",
              paddingTop: "var(--space-lg)",
              marginTop: "var(--space-lg)",
            }}
          >
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="zen-btn zen-btn-secondary"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              data-testid="submit-ticket-btn"
              disabled={isSubmitting}
              className="zen-btn zen-btn-primary"
              style={{ minWidth: 160 }}
            >
              {isSubmitting ? (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                  <div className="zen-spinner" style={{ width: 14, height: 14 }}></div>
                  <span>Submitting Ticket...</span>
                </div>
              ) : (
                "Submit Ticket"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
