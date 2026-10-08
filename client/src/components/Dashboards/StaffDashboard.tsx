import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStaffDashboard } from "../../api.js";
import { StaffDashboardData } from "../../types/index.js";
import { useAuth } from "../../context/AuthContext.js";

interface StaffDashboardProps {
  onSelectTicket?: (ticketId: number) => void;
  onNavigateQueue?: (filterQuery?: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onSelectTicket,
  onNavigateQueue,
}) => {
  let navigate: any = () => {};
  try {
    navigate = useNavigate();
  } catch {}
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaffDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Failed to load staff dashboard:", err);
      setError(err.message || "Failed to load operational dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDrilldown = (targetPath: string) => {
    if (onNavigateQueue) {
      onNavigateQueue(targetPath);
    } else {
      navigate(targetPath);
    }
  };

  const handleTicketClick = (ticketId: number) => {
    if (onSelectTicket) {
      onSelectTicket(ticketId);
    } else {
      navigate(`/tickets/${ticketId}`);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "NEW":
        return { backgroundColor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" };
      case "OPEN":
        return { backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" };
      case "IN_PROGRESS":
        return { backgroundColor: "#EDE9FE", color: "#6D28D9", border: "1px solid #DDD6FE" };
      case "WAITING_FOR_REQUESTER":
        return { backgroundColor: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA" };
      case "RESOLVED":
        return { backgroundColor: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" };
      case "CLOSED":
        return { backgroundColor: "#F3F4F6", color: "#4B5563", border: "1px solid #E5E7EB" };
      case "CANCELLED":
        return { backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" };
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" };
      case "HIGH":
        return { backgroundColor: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA" };
      case "MEDIUM":
        return { backgroundColor: "#FEF9C3", color: "#854D0E", border: "1px solid #FEF08A" };
      case "LOW":
      default:
        return { backgroundColor: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" };
    }
  };

  if (loading) {
    return (
      <div className="zen-container" style={{ padding: "var(--space-2xl) var(--space-base)", textAlign: "center" }}>
        <div className="zen-spinner" style={{ width: 36, height: 36, margin: "0 auto var(--space-sm)" }} />
        <div style={{ color: "var(--color-text-muted)" }}>Loading operational dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
        <div className="zen-alert-error" role="alert" style={{ marginBottom: "var(--space-md)" }}>
          {error}
        </div>
        <button type="button" onClick={loadData} className="zen-btn zen-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const summary = dashboardData?.summary || {
    unassigned: 0,
    new: 0,
    open: 0,
    inProgress: 0,
    waitingForRequester: 0,
    myAssigned: 0,
    resolved: 0,
    closed: 0,
  };

  const trends = dashboardData?.trends || {
    unassigned: "0",
    new: "0",
    open: "0",
    inProgress: "0",
    waitingForRequester: "0",
    myAssigned: "0",
  };

  const byPriority = dashboardData?.byPriority || {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  const recentTickets = dashboardData?.recentTickets || [];
  const adminSummary = dashboardData?.adminSummary;

  return (
    <div className="zen-container" style={{ padding: "var(--space-lg) var(--space-base)" }}>
      {/* Header & Welcome Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "var(--space-lg)",
          gap: "var(--space-md)",
        }}
      >
        <div>
          <h1
            data-testid="staff-welcome"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-text-main)",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Welcome back, {user?.name || "Staff"}!
          </h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.95rem" }}>
            Here is what is happening with your queue today.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          data-testid="refresh-dashboard-btn"
          className="zen-btn zen-btn-secondary"
          style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* 6 Operational Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {/* 1. Unassigned Tickets */}
        <div
          data-testid="metric-unassigned"
          className="zen-card"
          onClick={() => handleDrilldown("/tickets?assigned=unassigned")}
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #DC2626",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Unassigned
            </span>
            <div
              data-testid="metric-unassigned-count"
              style={{ fontSize: "1.85rem", fontWeight: 700, color: "#DC2626", margin: "4px 0" }}
            >
              {summary.unassigned}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              data-testid="metric-unassigned-trend"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
            >
              {trends.unassigned} yest
            </span>
            <button
              type="button"
              data-testid="drilldown-unassigned"
              style={{
                background: "none",
                border: "none",
                color: "#DC2626",
                padding: 0,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View →
            </button>
          </div>
        </div>

        {/* 2. New */}
        <div
          data-testid="metric-new"
          className="zen-card"
          onClick={() => handleDrilldown("/tickets?status=NEW")}
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #0284C7",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              New
            </span>
            <div
              data-testid="metric-new-count"
              style={{ fontSize: "1.85rem", fontWeight: 700, color: "#0284C7", margin: "4px 0" }}
            >
              {summary.new}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span data-testid="metric-new-trend" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {trends.new} yest
            </span>
            <button
              type="button"
              data-testid="drilldown-new"
              style={{
                background: "none",
                border: "none",
                color: "#0284C7",
                padding: 0,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View →
            </button>
          </div>
        </div>

        {/* 3. Open */}
        <div
          data-testid="metric-open"
          className="zen-card"
          onClick={() => handleDrilldown("/tickets?status=OPEN")}
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #D97706",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Open
            </span>
            <div
              data-testid="metric-open-count"
              style={{ fontSize: "1.85rem", fontWeight: 700, color: "#D97706", margin: "4px 0" }}
            >
              {summary.open}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span data-testid="metric-open-trend" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {trends.open} yest
            </span>
            <button
              type="button"
              data-testid="drilldown-open"
              style={{
                background: "none",
                border: "none",
                color: "#D97706",
                padding: 0,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View →
            </button>
          </div>
        </div>

        {/* 4. In Progress */}
        <div
          data-testid="metric-in-progress"
          className="zen-card"
          onClick={() => handleDrilldown("/tickets?status=IN_PROGRESS")}
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #7C3AED",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              In Progress
            </span>
            <div
              data-testid="metric-in-progress-count"
              style={{ fontSize: "1.85rem", fontWeight: 700, color: "#7C3AED", margin: "4px 0" }}
            >
              {summary.inProgress}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              data-testid="metric-in-progress-trend"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
            >
              {trends.inProgress} yest
            </span>
            <button
              type="button"
              data-testid="drilldown-in-progress"
              style={{
                background: "none",
                border: "none",
                color: "#7C3AED",
                padding: 0,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View →
            </button>
          </div>
        </div>

        {/* 5. Waiting Req */}
        <div
          data-testid="metric-waiting-requester"
          className="zen-card"
          onClick={() => handleDrilldown("/tickets?status=WAITING_FOR_REQUESTER")}
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #EA580C",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Waiting Req
            </span>
            <div
              data-testid="metric-waiting-requester-count"
              style={{ fontSize: "1.85rem", fontWeight: 700, color: "#EA580C", margin: "4px 0" }}
            >
              {summary.waitingForRequester}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              data-testid="metric-waiting-requester-trend"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
            >
              {trends.waitingForRequester} yest
            </span>
            <button
              type="button"
              data-testid="drilldown-waiting-requester"
              style={{
                background: "none",
                border: "none",
                color: "#EA580C",
                padding: 0,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View →
            </button>
          </div>
        </div>

        {/* 6. My Assigned */}
        <div
          data-testid="metric-my-assigned"
          className="zen-card"
          onClick={() => handleDrilldown("/tickets?assigned=me")}
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #16A34A",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              My Assigned
            </span>
            <div
              data-testid="metric-my-assigned-count"
              style={{ fontSize: "1.85rem", fontWeight: 700, color: "#16A34A", margin: "4px 0" }}
            >
              {summary.myAssigned}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              data-testid="metric-my-assigned-trend"
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
            >
              {trends.myAssigned} yest
            </span>
            <button
              type="button"
              data-testid="drilldown-my-assigned"
              style={{
                background: "none",
                border: "none",
                color: "#16A34A",
                padding: 0,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: 70% Recent Tickets / 30% Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--space-lg)",
          alignItems: "start",
        }}
      >
        {/* Left: Recent Tickets */}
        <div className="zen-card" style={{ padding: "var(--space-lg)", flex: 2 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-md)",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)" }}>
              Recent Tickets
            </h2>
            <button
              type="button"
              data-testid="view-all-queue-link"
              onClick={() => handleDrilldown("/queue")}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary-green)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              View all →
            </button>
          </div>

          {recentTickets.length === 0 ? (
            <div
              data-testid="no-staff-recent-tickets"
              style={{
                textAlign: "center",
                padding: "var(--space-xl) var(--space-base)",
                color: "var(--color-text-muted)",
              }}
            >
              No tickets currently found in the system.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  data-testid={`staff-recent-ticket-row-${ticket.id}`}
                  onClick={() => handleTicketClick(ticket.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    padding: "var(--space-sm) var(--space-md)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    gap: "var(--space-xs)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                >
                  <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                    <div style={{ marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--color-primary-green)",
                        }}
                      >
                        {ticket.ticketNumber}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: "var(--color-text-main)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={ticket.summary}
                    >
                      {ticket.summary}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "6px",
                      flexShrink: 0,
                      marginLeft: "auto",
                    }}
                  >
                    {/* Top Right: Assigned Info */}
                    <div style={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
                      {ticket.ownerName ? (
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>
                          • {ticket.ownerName}
                        </span>
                      ) : (
                        <span style={{ color: "#DC2626", fontWeight: 600 }}>
                          • Unassigned
                        </span>
                      )}
                    </div>

                    {/* Bottom Right: Priority, Status, Date (shifted slightly down) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "10px",
                          ...getPriorityBadgeStyle(ticket.itPriority || ticket.priority || "MEDIUM"),
                        }}
                      >
                        {ticket.itPriority || ticket.priority || "MED"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          ...getStatusBadgeStyle(ticket.status),
                        }}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(ticket.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Actions & Priority Distribution */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", flex: 1 }}>
          {/* Quick Actions Card (STRICT ROLE ISOLATION: NO CREATE TICKET) */}
          <div className="zen-card" style={{ padding: "var(--space-lg)" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, marginBottom: "var(--space-md)" }}>
              Quick Actions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {/* [Q] Search Tickets */}
              <button
                type="button"
                data-testid="quick-search-tickets-btn"
                onClick={() => handleDrilldown("/queue?focus=search")}
                className="zen-btn zen-btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                  padding: "10px 14px",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span>🔍 [Q] Search Tickets</span>
              </button>

              {/* [=] My Queue */}
              <button
                type="button"
                data-testid="quick-my-queue-btn"
                onClick={() => handleDrilldown("/queue?assigned=me")}
                className="zen-btn zen-btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                  padding: "10px 14px",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span>📋 [=] My Queue</span>
              </button>

              {/* [!] View Unassigned */}
              <button
                type="button"
                data-testid="quick-view-unassigned-btn"
                onClick={() => handleDrilldown("/queue?assigned=unassigned")}
                className="zen-btn zen-btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)",
                  padding: "10px 14px",
                  textAlign: "left",
                  width: "100%",
                  color: "#B91C1C",
                }}
              >
                <span>⚠️ [!] View Unassigned</span>
              </button>
            </div>
          </div>

          {/* Priority Distribution Card */}
          <div data-testid="priority-distribution-box" className="zen-card" style={{ padding: "var(--space-lg)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, marginBottom: "var(--space-md)" }}>
              Priority Distribution
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-sm)",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "#991B1B", fontWeight: 600 }}>Critical</div>
                <div data-testid="priority-critical-count" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#991B1B" }}>
                  {byPriority.CRITICAL}
                </div>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#FFF7ED",
                  border: "1px solid #FED7AA",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "#C2410C", fontWeight: 600 }}>High</div>
                <div data-testid="priority-high-count" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#C2410C" }}>
                  {byPriority.HIGH}
                </div>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#FEFCE8",
                  border: "1px solid #FEF08A",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "#854D0E", fontWeight: 600 }}>Medium</div>
                <div data-testid="priority-medium-count" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#854D0E" }}>
                  {byPriority.MEDIUM}
                </div>
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Low</div>
                <div data-testid="priority-low-count" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#166534" }}>
                  {byPriority.LOW}
                </div>
              </div>
            </div>
          </div>

          {/* Administrator User Accounts Summary (if available) */}
          {user?.role === "ADMINISTRATOR" && adminSummary && (
            <div data-testid="admin-summary-box" className="zen-card" style={{ padding: "var(--space-lg)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, marginBottom: "var(--space-md)" }}>
                User Accounts Overview
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Total Users:</span>
                  <span data-testid="admin-total-users" style={{ fontWeight: 600 }}>{adminSummary.totalUsers}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Active Users:</span>
                  <span data-testid="admin-active-users" style={{ fontWeight: 600 }}>{adminSummary.activeUsers}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Requesters:</span>
                  <span style={{ fontWeight: 600 }}>{adminSummary.requestersCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>IT Staff:</span>
                  <span style={{ fontWeight: 600 }}>{adminSummary.staffCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Administrators:</span>
                  <span style={{ fontWeight: 600 }}>{adminSummary.adminCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
