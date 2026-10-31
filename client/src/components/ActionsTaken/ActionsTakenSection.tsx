import React, { useState, useEffect, useCallback } from "react";
import { AuthUser, ActionTaken, CreateActionTakenPayload, UpdateActionTakenPayload } from "../../types/index.js";
import { fetchActionsTaken, createActionTaken, updateActionTaken } from "../../api.js";
import { ActionTakenModal } from "./ActionTakenModal.js";

interface ActionsTakenSectionProps {
  ticketId: number;
  currentUser: AuthUser | null;
  isReadOnly?: boolean;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  currentUser,
  isReadOnly = false,
}) => {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  const isStaffOrAdmin =
    !isReadOnly &&
    currentUser !== null &&
    (currentUser.role === "IT_STAFF" || currentUser.role === "ADMINISTRATOR");

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActionsTaken(ticketId);
      // Ensure stable ordering: actionDateTime DESC, id DESC
      const sorted = [...data].sort((a, b) => {
        const timeDiff = new Date(b.actionDateTime).getTime() - new Date(a.actionDateTime).getTime();
        return timeDiff !== 0 ? timeDiff : b.id - a.id;
      });
      setActions(sorted);
    } catch (err: any) {
      if (process.env.NODE_ENV !== "test") {
        console.error("Failed to load actions taken:", err);
      }
      setError(err.message || "Unable to load actions taken.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingAction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (action: ActionTaken) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload: CreateActionTakenPayload | UpdateActionTakenPayload) => {
    if (editingAction) {
      await updateActionTaken(ticketId, editingAction.id, payload as UpdateActionTakenPayload);
      showSuccess("Action taken record updated successfully.");
    } else {
      await createActionTaken(ticketId, payload as CreateActionTakenPayload);
      showSuccess("Action taken recorded successfully.");
    }
    await loadActions();
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE", label: "Admin" };
      case "IT_STAFF":
        return { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", label: "IT Staff" };
      default:
        return { bg: "#E2E8F0", text: "#334155", border: "#CBD5E1", label: "Requester" };
    }
  };

  return (
    <div
      data-testid="actions-taken-section"
      style={{
        background: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #CBD5E1",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: "1rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1A2E26",
            }}
          >
            Actions Taken
          </h2>
          <span
            data-testid="actions-count-badge"
            style={{
              padding: "0.2rem 0.6rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              borderRadius: "9999px",
              backgroundColor: "#EAF6EF",
              color: "#006B3C",
              border: "1px solid #B8E2CB",
            }}
          >
            {actions.length} {actions.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        {/* Add Action Button - Only for Staff / Admin */}
        {isStaffOrAdmin && (
          <button
            data-testid="add-action-btn"
            type="button"
            onClick={handleOpenCreateModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1rem",
              background: "#006B3C",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0, 107, 60, 0.15)",
              transition: "background 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
            <span>Add Action Taken</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          data-testid="action-success-alert"
          role="status"
          style={{
            backgroundColor: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          data-testid="actions-error-alert"
          role="alert"
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadActions}
            style={{
              padding: "0.3rem 0.75rem",
              background: "#FFFFFF",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div
          data-testid="actions-loading-spinner"
          style={{
            padding: "2.5rem 1rem",
            textAlign: "center",
            color: "#5F756B",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "28px",
              height: "28px",
              border: "3px solid #E2E8F0",
              borderTopColor: "#006B3C",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: "0.75rem",
            }}
          />
          <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Loading actions taken history...</div>
        </div>
      ) : actions.length === 0 ? (
        /* Empty State */
        <div
          data-testid={isStaffOrAdmin ? "actions-empty-staff" : "actions-empty-requester"}
          style={{
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            background: "#F8FAFC",
            borderRadius: "8px",
            border: "1px dashed #CBD5E1",
            color: "#5F756B",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1A2E26", marginBottom: "0.25rem" }}>
            No actions taken recorded yet.
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "450px", margin: "0 auto" }}>
            {isStaffOrAdmin
              ? "Click '+ Add Action Taken' to log technical steps, diagnostic findings, and operational results."
              : "Technical steps and troubleshooting notes recorded by IT Staff will appear here once logged."}
          </div>
        </div>
      ) : (
        /* Data Display */
        <>
          {/* Desktop & Tablet Table View (Hidden on Small Mobile < 768px via CSS) */}
          <div
            className="actions-taken-desktop-table"
            style={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <table
              data-testid="actions-taken-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F1F5F3",
                    borderBottom: "2px solid #CBD5E1",
                    color: "#1A2E26",
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: "0.75rem 0.85rem", whiteSpace: "nowrap" }}>Date / Time</th>
                  <th style={{ padding: "0.75rem 0.85rem", whiteSpace: "nowrap" }}>Performed By</th>
                  <th style={{ padding: "0.75rem 0.85rem" }}>Action Description</th>
                  <th style={{ padding: "0.75rem 0.85rem" }}>Result</th>
                  <th style={{ padding: "0.75rem 0.85rem", whiteSpace: "nowrap" }}>Follow-up</th>
                  <th style={{ padding: "0.75rem 0.85rem" }}>Notes / Attachments</th>
                  {isStaffOrAdmin && (
                    <th style={{ padding: "0.75rem 0.85rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {actions.map((action, idx) => {
                  const roleStyle = getRoleBadgeStyle(action.performedBy?.role || "");
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={action.id}
                      data-testid={`action-row-${action.id}`}
                      style={{
                        backgroundColor: isEven ? "#FFFFFF" : "#F8FAFC",
                        borderBottom: "1px solid #E2E8F0",
                        verticalAlign: "top",
                        transition: "background 0.1s ease",
                      }}
                    >
                      {/* Date / Time */}
                      <td style={{ padding: "0.85rem", whiteSpace: "nowrap", color: "#1A2E26", fontWeight: 500 }}>
                        {formatDate(action.actionDateTime)}
                      </td>

                      {/* Performed By */}
                      <td style={{ padding: "0.85rem", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600, color: "#1A2E26", marginBottom: "0.15rem" }}>
                          {action.performedBy?.name || "Unknown Staff"}
                        </div>
                        <span
                          style={{
                            display: "inline-block",
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
                      </td>

                      {/* Action Description */}
                      <td
                        style={{
                          padding: "0.85rem",
                          color: "#1A2E26",
                          lineHeight: 1.5,
                          maxWidth: "280px",
                          wordBreak: "break-word",
                        }}
                      >
                        {action.actionDescription}
                      </td>

                      {/* Result */}
                      <td
                        style={{
                          padding: "0.85rem",
                          color: "#1A2E26",
                          lineHeight: 1.5,
                          maxWidth: "240px",
                          wordBreak: "break-word",
                        }}
                      >
                        {action.result}
                      </td>

                      {/* Follow-up */}
                      <td style={{ padding: "0.85rem", minWidth: "150px" }}>
                        {action.followUpRequired ? (
                          <div>
                            <span
                              data-testid={`follow-up-badge-${action.id}`}
                              style={{
                                display: "inline-block",
                                padding: "0.2rem 0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                borderRadius: "4px",
                                backgroundColor: "#FEF3C7",
                                color: "#92400E",
                                border: "1px solid #FCD34D",
                                marginBottom: "0.3rem",
                              }}
                            >
                              Follow-up Required
                            </span>
                            {action.followUpNote && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#78350F",
                                  background: "#FFFBEB",
                                  padding: "0.35rem 0.5rem",
                                  borderRadius: "4px",
                                  border: "1px dashed #FCD34D",
                                  marginTop: "0.2rem",
                                  wordBreak: "break-word",
                                }}
                              >
                                <strong>Note:</strong> {action.followUpNote}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.15rem 0.45rem",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              borderRadius: "4px",
                              backgroundColor: "#F1F5F9",
                              color: "#64748B",
                            }}
                          >
                            None
                          </span>
                        )}
                      </td>

                      {/* Notes / Attachments */}
                      <td style={{ padding: "0.85rem", color: "#475569", maxWidth: "200px", wordBreak: "break-word" }}>
                        {action.attachmentNotes ? (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.35rem" }}>
                            <span>📎</span>
                            <span>{action.attachmentNotes}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>—</span>
                        )}
                      </td>

                      {/* Edit Action Button */}
                      {isStaffOrAdmin && (
                        <td style={{ padding: "0.85rem", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            data-testid={`edit-action-btn-${action.id}`}
                            type="button"
                            onClick={() => handleOpenEditModal(action)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              background: "#FFFFFF",
                              border: "1px solid #CBD5E1",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "#006B3C",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View (Displayed on Small Viewports < 768px) */}
          <div
            className="actions-taken-mobile-cards"
            data-testid="actions-taken-mobile-list"
            style={{
              display: "none",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {actions.map((action) => {
              const roleStyle = getRoleBadgeStyle(action.performedBy?.role || "");
              return (
                <div
                  key={`mobile-${action.id}`}
                  data-testid={`mobile-action-card-${action.id}`}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    padding: "1rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      borderBottom: "1px solid #F1F5F9",
                      paddingBottom: "0.5rem",
                      marginBottom: "0.75rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1A2E26" }}>
                        {action.performedBy?.name}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.15rem 0.45rem",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          borderRadius: "4px",
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.text,
                          border: `1px solid ${roleStyle.border}`,
                          marginTop: "0.2rem",
                        }}
                      >
                        {roleStyle.label}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {formatDate(action.actionDateTime)}
                      </div>
                      {isStaffOrAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(action)}
                          style={{
                            marginTop: "0.25rem",
                            padding: "0.25rem 0.6rem",
                            background: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#006B3C",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Description
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#1A2E26", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      {action.actionDescription}
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Result
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#1A2E26", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      {action.result}
                    </div>
                  </div>

                  {action.followUpRequired && (
                    <div
                      style={{
                        backgroundColor: "#FFFBEB",
                        border: "1px solid #FCD34D",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400E" }}>
                        ⚠️ Follow-up Required
                      </div>
                      {action.followUpNote && (
                        <div style={{ fontSize: "0.8125rem", color: "#78350F", marginTop: "0.2rem" }}>
                          {action.followUpNote}
                        </div>
                      )}
                    </div>
                  )}

                  {action.attachmentNotes && (
                    <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.5rem", display: "flex", gap: "0.3rem" }}>
                      <span>📎</span>
                      <span>{action.attachmentNotes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal for Create / Edit Action Taken */}
      <ActionTakenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingAction}
        currentUser={currentUser}
      />
    </div>
  );
};
