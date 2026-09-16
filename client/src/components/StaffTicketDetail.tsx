import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  fetchStaffTicketDetail,
  fetchStaffAssignees,
  updateTicketAssignment,
  updateTicketPriority,
  updateTicketStatus,
  fetchPublicComments,
  postPublicComment,
  fetchInternalNotes,
  postInternalNote,
  downloadAttachment,
} from "../api.js";
import {
  StaffTicketDetailData,
  TicketComment,
  InternalNote,
  PriorityLevel,
  TicketStatus,
  PERMITTED_STATUS_TRANSITIONS,
  Role,
} from "../types/index.js";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const StaffTicketDetail: React.FC<StaffTicketDetailProps> = ({ ticketId, onBack }) => {
  const { user } = useAuth();

  const [ticket, setTicket] = useState<StaffTicketDetailData | null>(null);
  const [assignees, setAssignees] = useState<Array<{ id: number; name: string; email: string; role: Role }>>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [opSuccessMessage, setOpSuccessMessage] = useState<string | null>(null);

  // Active tab: 'comments' | 'notes'
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");

  // Input states
  const [newComment, setNewComment] = useState<string>("");
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [newNote, setNewNote] = useState<string>("");
  const [isPostingNote, setIsPostingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Updating operations loading
  const [isUpdatingOwner, setIsUpdatingOwner] = useState<boolean>(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, assigneesList, commentsList, notesList] = await Promise.all([
        fetchStaffTicketDetail(ticketId),
        fetchStaffAssignees().catch(() => []),
        fetchPublicComments(ticketId).catch(() => []),
        fetchInternalNotes(ticketId).catch(() => []),
      ]);

      setTicket(ticketData);
      setAssignees(assigneesList);
      setComments(commentsList);
      setNotes(notesList);
    } catch (err: any) {
      console.error("Error loading staff ticket detail:", err);
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flash operational feedback
  const showFeedback = (msg: string) => {
    setOpSuccessMessage(msg);
    setTimeout(() => {
      setOpSuccessMessage(null);
    }, 4000);
  };

  // 1. Handle Owner Assignment
  const handleOwnerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const targetOwnerId = val === "unassigned" || val === "" ? null : Number(val);

    setIsUpdatingOwner(true);
    setError(null);
    try {
      const res = await updateTicketAssignment(ticketId, targetOwnerId);
      setTicket((prev) => (prev ? { ...prev, ticketOwner: res.ticketOwner || null } : null));
      showFeedback("Ticket owner updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update ticket owner.");
    } finally {
      setIsUpdatingOwner(false);
    }
  };

  const handleClaimForMe = async () => {
    if (!user) return;
    setIsUpdatingOwner(true);
    setError(null);
    try {
      const res = await updateTicketAssignment(ticketId, user.id);
      setTicket((prev) => (prev ? { ...prev, ticketOwner: res.ticketOwner || { id: user.id, name: user.name, email: user.email } } : null));
      showFeedback("Ticket claimed successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to claim ticket.");
    } finally {
      setIsUpdatingOwner(false);
    }
  };

  // 2. Handle IT Priority Change
  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as PriorityLevel;
    setIsUpdatingPriority(true);
    setError(null);
    try {
      await updateTicketPriority(ticketId, newPriority);
      setTicket((prev) => (prev ? { ...prev, itPriority: newPriority } : null));
      showFeedback(`IT Priority updated to ${newPriority}.`);
    } catch (err: any) {
      setError(err.message || "Failed to update IT Priority.");
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  // 3. Handle Status Transition
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as TicketStatus;
    if (nextStatus === ticket?.currentStatus) return;

    setIsUpdatingStatus(true);
    setError(null);
    try {
      await updateTicketStatus(ticketId, nextStatus);
      setTicket((prev) => (prev ? { ...prev, currentStatus: nextStatus } : null));
      showFeedback(`Ticket status transitioned to ${nextStatus}.`);
    } catch (err: any) {
      setError(err.message || "Failed to update ticket status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 4. Handle Public Comment submission
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    if (trimmed.length > 2000) {
      setCommentError("Comment cannot exceed 2,000 characters.");
      return;
    }

    setIsPostingComment(true);
    setCommentError(null);
    try {
      const created = await postPublicComment(ticketId, trimmed);
      setComments((prev) => [...prev, created]);
      setNewComment("");
      showFeedback("Public comment posted.");
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment.");
    } finally {
      setIsPostingComment(false);
    }
  };

  // 5. Handle Internal Note submission
  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNote.trim();
    if (!trimmed) {
      setNoteError("Internal note cannot be empty.");
      return;
    }
    if (trimmed.length > 2000) {
      setNoteError("Internal note cannot exceed 2,000 characters.");
      return;
    }

    setIsPostingNote(true);
    setNoteError(null);
    try {
      const created = await postInternalNote(ticketId, trimmed);
      setNotes((prev) => [...prev, created]);
      setNewNote("");
      showFeedback("Internal note saved.");
    } catch (err: any) {
      setNoteError(err.message || "Failed to save internal note.");
    } finally {
      setIsPostingNote(false);
    }
  };

  // Helper for Badge Colors
  const getStatusBadgeStyle = (status: TicketStatus) => {
    switch (status) {
      case "NEW":
        return { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" };
      case "OPEN":
        return { bg: "#CCFBF1", text: "#0F766E", border: "#99F6E4" };
      case "IN_PROGRESS":
        return { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" };
      case "WAITING_FOR_REQUESTER":
        return { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };
      case "RESOLVED":
        return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" };
      case "CLOSED":
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
      case "REOPENED":
        return { bg: "#FCE7F3", text: "#9D174D", border: "#FBCFE8" };
      case "CANCELLED":
        return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" };
      default:
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
    }
  };

  const getPriorityBadgeStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case "CRITICAL":
        return { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" };
      case "HIGH":
        return { bg: "#FFEDD5", text: "#C2410C", border: "#FDBA74" };
      case "MEDIUM":
        return { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D" };
      case "LOW":
        return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" };
      default:
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case "ADMINISTRATOR":
        return { bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE", label: "Admin" };
      case "IT_STAFF":
        return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC", label: "IT Staff" };
      case "REQUESTER":
        return { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD", label: "Requester" };
      default:
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", label: role };
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <button
            onClick={onBack}
            style={{
              padding: "0.5rem 1rem",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#1A2E26",
              fontWeight: 500,
            }}
          >
            ← Back to Queue
          </button>
        </div>
        <div
          style={{
            background: "#FFFFFF",
            padding: "3rem",
            borderRadius: "8px",
            border: "1px solid #CBD5E1",
            textAlign: "center",
            color: "#5F756B",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "2.5rem",
              height: "2.5rem",
              border: "3px solid #EAF6EF",
              borderTopColor: "#006B3C",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: "1rem",
            }}
          />
          <p>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <button
          onClick={onBack}
          style={{
            padding: "0.5rem 1rem",
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          ← Back to Queue
        </button>
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Error</h3>
          <p style={{ margin: 0 }}>{error || "Ticket not found."}</p>
        </div>
      </div>
    );
  }

  // Calculate permitted transitions for the Status dropdown
  const allowedTransitions = PERMITTED_STATUS_TRANSITIONS[ticket.currentStatus] || [];
  const isTerminal = allowedTransitions.length === 0;

  const currentStatusStyle = getStatusBadgeStyle(ticket.currentStatus);
  const itPriorityStyle = getPriorityBadgeStyle(ticket.itPriority);
  const reqPriorityStyle = getPriorityBadgeStyle(ticket.requestedPriority);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      {/* Top Breadcrumb & Back Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.9rem",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#1A2E26",
              fontWeight: 500,
              fontSize: "0.9rem",
              transition: "all 0.15s ease",
            }}
          >
            ← Back to Queue
          </button>
          <span style={{ color: "#5F756B", fontSize: "0.9rem" }}>
            Queue &gt; <strong style={{ color: "#1A2E26" }}>{ticket.ticketNumber}</strong>
          </span>
        </div>

        {/* Claim for Me Quick Button */}
        {user && ticket.ticketOwner?.id !== user.id && (
          <button
            onClick={handleClaimForMe}
            disabled={isUpdatingOwner}
            style={{
              padding: "0.5rem 1rem",
              background: "#006B3C",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: isUpdatingOwner ? "not-allowed" : "pointer",
              opacity: isUpdatingOwner ? 0.7 : 1,
            }}
          >
            {isUpdatingOwner ? "Claiming..." : "Claim for Me"}
          </button>
        )}
      </div>

      {/* Global Success / Operational Feedback */}
      {opSuccessMessage && (
        <div
          role="status"
          style={{
            background: "#DCFCE7",
            border: "1px solid #86EFAC",
            color: "#15803D",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            marginBottom: "1.25rem",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✓</span>
          <span>{opSuccessMessage}</span>
        </div>
      )}

      {/* Requester Resolution Indication Banner (API-17 / UI-04) */}
      {ticket.resolvedIndicated && (
        <div
          style={{
            background: "#E0F2FE",
            border: "1px solid #7DD3FC",
            color: "#0369A1",
            padding: "0.9rem 1.25rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>💡</span>
          <div>
            <strong>Requester Indication:</strong> The requester indicated that this problem appears resolved. Please review and transition the ticket status to <em>RESOLVED</em> or <em>CLOSED</em> if satisfied.
          </div>
        </div>
      )}

      {/* ZONE 1: TICKET HEADER & OPERATIONAL CONTROLS */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Ticket Title & Status Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "1rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
              <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#1A2E26", fontWeight: 700 }}>
                {ticket.ticketNumber}
              </h1>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "9999px",
                  backgroundColor: currentStatusStyle.bg,
                  color: currentStatusStyle.text,
                  border: `1px solid ${currentStatusStyle.border}`,
                }}
              >
                {ticket.currentStatus}
              </span>
            </div>
            <div style={{ color: "#5F756B", fontSize: "0.875rem" }}>
              Created on {formatDate(ticket.ticketDate || ticket.createdAt)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#5F756B", display: "block", marginBottom: "0.2rem" }}>
                Req Priority
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.2rem 0.55rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: "9999px",
                  backgroundColor: reqPriorityStyle.bg,
                  color: reqPriorityStyle.text,
                  border: `1px solid ${reqPriorityStyle.border}`,
                }}
              >
                {ticket.requestedPriority}
              </span>
            </div>
          </div>
        </div>

        {/* Read-Only Metadata & Operational Controls Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Read-Only Info Panel */}
          <div
            style={{
              background: "#F1F5F3",
              padding: "1.25rem",
              borderRadius: "6px",
              border: "1px solid #E2E8F0",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.85rem 0",
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#5F756B",
                fontWeight: 700,
              }}
            >
              Ticket Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.875rem" }}>
              <div>
                <span style={{ color: "#5F756B", fontWeight: 500, display: "inline-block", width: "110px" }}>Category:</span>
                <span style={{ fontWeight: 600, color: "#1A2E26" }}>{ticket.category.name}</span>
              </div>
              <div>
                <span style={{ color: "#5F756B", fontWeight: 500, display: "inline-block", width: "110px" }}>Related System:</span>
                <span style={{ fontWeight: 600, color: "#1A2E26" }}>{ticket.relatedSystem.name}</span>
              </div>
              <div>
                <span style={{ color: "#5F756B", fontWeight: 500, display: "inline-block", width: "110px" }}>Requester:</span>
                <span style={{ fontWeight: 600, color: "#1A2E26" }}>{ticket.requester.name}</span>
                <span style={{ color: "#5F756B", fontSize: "0.8rem", marginLeft: "0.4rem" }}>({ticket.requester.email})</span>
              </div>
              {ticket.requester.department && (
                <div>
                  <span style={{ color: "#5F756B", fontWeight: 500, display: "inline-block", width: "110px" }}>Department:</span>
                  <span style={{ color: "#1A2E26" }}>{ticket.requester.department}</span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Controls Panel (Editable) */}
          <div
            style={{
              background: "#FFFFFF",
              padding: "1.25rem",
              borderRadius: "6px",
              border: "2px solid #EAF6EF",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.85rem 0",
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#006B3C",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>⚙</span> Operational Controls
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Ticket Owner Control */}
              <div>
                <label
                  htmlFor="ticket-owner-select"
                  style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#1A2E26", marginBottom: "0.25rem" }}
                >
                  Ticket Owner {isUpdatingOwner && <span style={{ color: "#006B3C" }}>(saving...)</span>}
                </label>
                <select
                  id="ticket-owner-select"
                  data-testid="ticket-owner-select"
                  value={ticket.ticketOwner?.id ? String(ticket.ticketOwner.id) : "unassigned"}
                  onChange={handleOwnerChange}
                  disabled={isUpdatingOwner}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    backgroundColor: "#FFFFFF",
                    color: "#1A2E26",
                    fontWeight: 500,
                  }}
                >
                  <option value="unassigned">— Unassigned —</option>
                  {user && (
                    <option value={String(user.id)}>
                      ★ Assign to Me ({user.name})
                    </option>
                  )}
                  {assignees
                    .filter((a) => a.id !== user?.id)
                    .map((assignee) => (
                      <option key={assignee.id} value={String(assignee.id)}>
                        {assignee.name} ({assignee.role === "ADMINISTRATOR" ? "Admin" : "Staff"})
                      </option>
                    ))}
                </select>
              </div>

              {/* IT Priority Control */}
              <div>
                <label
                  htmlFor="it-priority-select"
                  style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#1A2E26", marginBottom: "0.25rem" }}
                >
                  IT Priority {isUpdatingPriority && <span style={{ color: "#006B3C" }}>(saving...)</span>}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <select
                    id="it-priority-select"
                    data-testid="it-priority-select"
                    value={ticket.itPriority}
                    onChange={handlePriorityChange}
                    disabled={isUpdatingPriority}
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      backgroundColor: "#FFFFFF",
                      color: "#1A2E26",
                      fontWeight: 500,
                    }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "4px",
                      backgroundColor: itPriorityStyle.bg,
                      color: itPriorityStyle.text,
                      border: `1px solid ${itPriorityStyle.border}`,
                    }}
                  >
                    {ticket.itPriority}
                  </span>
                </div>
              </div>

              {/* Status Transition Control */}
              <div>
                <label
                  htmlFor="ticket-status-select"
                  style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#1A2E26", marginBottom: "0.25rem" }}
                >
                  Current Status (Transition Matrix) {isUpdatingStatus && <span style={{ color: "#006B3C" }}>(updating...)</span>}
                </label>
                <select
                  id="ticket-status-select"
                  data-testid="ticket-status-select"
                  value={ticket.currentStatus}
                  onChange={handleStatusChange}
                  disabled={isUpdatingStatus || isTerminal}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    backgroundColor: isTerminal ? "#F1F5F9" : "#FFFFFF",
                    color: "#1A2E26",
                    fontWeight: 600,
                    cursor: isTerminal ? "not-allowed" : "pointer",
                  }}
                >
                  <option value={ticket.currentStatus}>
                    {ticket.currentStatus} (Current)
                  </option>
                  {allowedTransitions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      → Transition to {statusOption}
                    </option>
                  ))}
                </select>
                {isTerminal && (
                  <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "#64748B", fontStyle: "italic" }}>
                    Terminal status — no further status transitions permitted.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Description */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#1A2E26", fontWeight: 600 }}>
            {ticket.summary}
          </h3>
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              padding: "1rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#334155",
              whiteSpace: "pre-wrap",
            }}
          >
            {ticket.description}
          </div>
        </div>

        {/* Attachments Section */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#5F756B", textTransform: "uppercase" }}>
              Attachments ({ticket.attachments.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {ticket.attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.4rem 0.75rem",
                    background: "#F1F5F3",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>📎</span>
                  <span style={{ fontWeight: 500 }}>{att.originalFileName}</span>
                  <span style={{ color: "#5F756B", fontSize: "0.75rem" }}>
                    ({Math.round(att.fileSize / 1024)} KB)
                  </span>
                  <button
                    onClick={() => downloadAttachment(att.id, ticket.requester.id, att.originalFileName)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#006B3C",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: "0 0.25rem",
                    }}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ZONE 2: COMMUNICATION & COLLABORATION TABS */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Tab Selection Bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E2E8F0",
            background: "#F8FAFC",
          }}
        >
          {/* Public Comments Tab Button */}
          <button
            data-testid="public-comments-tab"
            onClick={() => setActiveTab("comments")}
            style={{
              flex: 1,
              padding: "1rem 1.5rem",
              background: activeTab === "comments" ? "#FFFFFF" : "transparent",
              border: "none",
              borderBottom: activeTab === "comments" ? "3px solid #006B3C" : "3px solid transparent",
              color: activeTab === "comments" ? "#006B3C" : "#5F756B",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.15s ease",
            }}
          >
            <span>💬 Public Comments</span>
            <span
              style={{
                display: "inline-block",
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                backgroundColor: activeTab === "comments" ? "#EAF6EF" : "#E2E8F0",
                color: activeTab === "comments" ? "#006B3C" : "#475569",
              }}
            >
              {comments.length}
            </span>
          </button>

          {/* Internal Notes Tab Button */}
          <button
            data-testid="internal-notes-tab"
            onClick={() => setActiveTab("notes")}
            style={{
              flex: 1,
              padding: "1rem 1.5rem",
              background: activeTab === "notes" ? "#FFFFFF" : "transparent",
              border: "none",
              borderBottom: activeTab === "notes" ? "3px solid #D97706" : "3px solid transparent",
              color: activeTab === "notes" ? "#B45309" : "#5F756B",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.15s ease",
            }}
          >
            <span>🔒 Internal Notes</span>
            <span
              style={{
                display: "inline-block",
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                backgroundColor: activeTab === "notes" ? "#FEF3C7" : "#E2E8F0",
                color: activeTab === "notes" ? "#B45309" : "#475569",
              }}
            >
              {notes.length}
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ padding: "1.5rem" }}>
          {/* TAB 1: PUBLIC COMMENTS */}
          {activeTab === "comments" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1A2E26" }}>
                  Public Conversation
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#5F756B" }}>
                  Visible to requester and IT staff
                </span>
              </div>

              {/* Comments List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {comments.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#64748B",
                      background: "#F8FAFC",
                      borderRadius: "6px",
                      border: "1px dashed #CBD5E1",
                    }}
                  >
                    No public comments yet. Post the first message below.
                  </div>
                ) : (
                  comments.map((comment) => {
                    const roleStyle = getRoleBadgeStyle(comment.author.role);
                    return (
                      <div
                        key={comment.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "8px",
                          padding: "1rem 1.25rem",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                          {/* Initials Avatar */}
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#006B3C",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {getInitials(comment.author.name)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: "#1A2E26", fontSize: "0.9rem", marginRight: "0.5rem" }}>
                              {comment.author.name}
                            </span>
                            <span
                              style={{
                                padding: "0.15rem 0.45rem",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                borderRadius: "4px",
                                backgroundColor: roleStyle.bg,
                                color: roleStyle.text,
                                border: `1px solid ${roleStyle.border}`,
                              }}
                            >
                              {roleStyle.label}
                            </span>
                          </div>
                          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#64748B" }}>
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {comment.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment}>
                {commentError && (
                  <div style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {commentError}
                  </div>
                )}
                <div style={{ marginBottom: "0.75rem" }}>
                  <textarea
                    data-testid="public-comment-input"
                    rows={3}
                    placeholder="Type a public response to the requester..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    data-testid="post-comment-btn"
                    type="submit"
                    disabled={isPostingComment || !newComment.trim()}
                    style={{
                      padding: "0.6rem 1.25rem",
                      background: "#006B3C",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: isPostingComment || !newComment.trim() ? "not-allowed" : "pointer",
                      opacity: isPostingComment || !newComment.trim() ? 0.6 : 1,
                      transition: "background 0.15s ease",
                    }}
                  >
                    {isPostingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: INTERNAL NOTES */}
          {activeTab === "notes" && (
            <div>
              {/* Amber Warning Banner (UI-05 requirement) */}
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  color: "#92400E",
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                <span>🔒</span>
                <span>Private - Visible only to IT Staff and Administrators</span>
              </div>

              {/* Notes List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {notes.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#92400E",
                      background: "#FFFDF5",
                      borderRadius: "6px",
                      border: "1px dashed #FCD34D",
                    }}
                  >
                    No internal notes yet. Document technical investigations or internal discussions below.
                  </div>
                ) : (
                  notes.map((note) => {
                    const roleStyle = getRoleBadgeStyle(note.author.role);
                    return (
                      <div
                        key={note.id}
                        style={{
                          background: "#FFFBEB",
                          border: "1px solid #FCD34D",
                          borderRadius: "8px",
                          padding: "1rem 1.25rem",
                          boxShadow: "0 1px 2px rgba(245, 158, 11, 0.05)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#D97706",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {getInitials(note.author.name)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: "#78350F", fontSize: "0.9rem", marginRight: "0.5rem" }}>
                              {note.author.name}
                            </span>
                            <span
                              style={{
                                padding: "0.15rem 0.45rem",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                borderRadius: "4px",
                                backgroundColor: roleStyle.bg,
                                color: roleStyle.text,
                                border: `1px solid ${roleStyle.border}`,
                              }}
                            >
                              {roleStyle.label}
                            </span>
                          </div>
                          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#92400E" }}>
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#451A03", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {note.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handlePostNote}>
                {noteError && (
                  <div style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {noteError}
                  </div>
                )}
                <div style={{ marginBottom: "0.75rem" }}>
                  <textarea
                    data-testid="internal-note-input"
                    rows={3}
                    placeholder="Add confidential internal note (only visible to staff)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #FCD34D",
                      background: "#FFFDF5",
                      fontSize: "0.9rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    data-testid="post-note-btn"
                    type="submit"
                    disabled={isPostingNote || !newNote.trim()}
                    style={{
                      padding: "0.6rem 1.25rem",
                      background: "#D97706",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: isPostingNote || !newNote.trim() ? "not-allowed" : "pointer",
                      opacity: isPostingNote || !newNote.trim() ? 0.6 : 1,
                      transition: "background 0.15s ease",
                    }}
                  >
                    {isPostingNote ? "Saving Note..." : "Save Internal Note"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
