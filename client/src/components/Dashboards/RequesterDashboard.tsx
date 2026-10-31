import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRequesterDashboard } from "../../api.js";
import { RequesterDashboardData } from "../../types/index.js";
import { useAuth } from "../../context/AuthContext.js";

interface RequesterDashboardProps {
  onSelectTicket?: (ticketId: number) => void;
  onNavigateCreate?: () => void;
  onNavigateTickets?: (filterQuery?: string) => void;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({
  onSelectTicket,
  onNavigateCreate,
  onNavigateTickets,
}) => {
  let navigate: any = () => {};
  try {
    navigate = useNavigate();
  } catch {}
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequesterDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Failed to load requester dashboard:", err);
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDrilldown = (targetPath: string) => {
    if (onNavigateTickets) {
      onNavigateTickets(targetPath);
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

  const handleCreateClick = () => {
    if (onNavigateCreate) {
      onNavigateCreate();
    } else {
      navigate("/tickets/create");
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

  if (loading) {
    return (
      <div className="zen-container" style={{ padding: "var(--space-2xl) var(--space-base)", textAlign: "center" }}>
        <div className="zen-spinner" style={{ width: 36, height: 36, margin: "0 auto var(--space-sm)" }} />
        <div style={{ color: "var(--color-text-muted)" }}>Loading your dashboard...</div>
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
    totalOpen: 0,
    inProgress: 0,
    waitingForRequester: 0,
    recentlyResolved: 0,
    closed: 0,
  };

  const recentTickets = dashboardData?.recentTickets || [];

  return (
    <div className="zen-container" style={{ padding: "var(--space-lg) var(--space-base)" }}>
      {/* Welcome Banner */}
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
            data-testid="requester-welcome"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-text-main)",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Welcome, {user?.name || "Requester"}!
          </h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.95rem" }}>
            Here is the latest on your support requests.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          data-testid="refresh-requester-dashboard-btn"
          className="zen-btn zen-btn-secondary"
          style={{ fontSize: "var(--font-size-xs)", padding: "6px 12px" }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* 5 Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {/* 1. My Open Tickets */}
        <div
          data-testid="metric-open-tickets"
          className="zen-card"
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #0284C7",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              My Open Tickets
            </span>
            <div
              data-testid="metric-open-tickets-count"
              style={{ fontSize: "2rem", fontWeight: 700, color: "#0284C7", margin: "6px 0" }}
            >
              {summary.totalOpen}
            </div>
          </div>
          <button
            type="button"
            data-testid="drilldown-open-tickets"
            onClick={() => handleDrilldown("/my-tickets?status=OPEN_GROUP")}
            style={{
              background: "none",
              border: "none",
              color: "#0284C7",
              padding: 0,
              textAlign: "left",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all →
          </button>
        </div>

        {/* 2. In Progress */}
        <div
          data-testid="metric-in-progress"
          className="zen-card"
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #7C3AED",
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
              style={{ fontSize: "2rem", fontWeight: 700, color: "#7C3AED", margin: "6px 0" }}
            >
              {summary.inProgress}
            </div>
          </div>
          <button
            type="button"
            data-testid="drilldown-in-progress"
            onClick={() => handleDrilldown("/my-tickets?status=IN_PROGRESS")}
            style={{
              background: "none",
              border: "none",
              color: "#7C3AED",
              padding: 0,
              textAlign: "left",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all →
          </button>
        </div>

        {/* 3. Waiting for You */}
        <div
          data-testid="metric-waiting-requester"
          className="zen-card"
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #EA580C",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Waiting for You
            </span>
            <div
              data-testid="metric-waiting-requester-count"
              style={{ fontSize: "2rem", fontWeight: 700, color: "#EA580C", margin: "6px 0" }}
            >
              {summary.waitingForRequester}
            </div>
          </div>
          <button
            type="button"
            data-testid="drilldown-waiting-requester"
            onClick={() => handleDrilldown("/my-tickets?status=WAITING_FOR_REQUESTER")}
            style={{
              background: "none",
              border: "none",
              color: "#EA580C",
              padding: 0,
              textAlign: "left",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all →
          </button>
        </div>

        {/* 4. Recent Resolved */}
        <div
          data-testid="metric-recent-resolved"
          className="zen-card"
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #16A34A",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Recent Resolved
            </span>
            <div
              data-testid="metric-recent-resolved-count"
              style={{ fontSize: "2rem", fontWeight: 700, color: "#16A34A", margin: "6px 0" }}
            >
              {summary.recentlyResolved}
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>
                (Last 30d)
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="drilldown-recent-resolved"
            onClick={() => handleDrilldown("/my-tickets?status=RESOLVED&recent=true")}
            style={{
              background: "none",
              border: "none",
              color: "#16A34A",
              padding: 0,
              textAlign: "left",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all →
          </button>
        </div>

        {/* 5. Closed */}
        <div
          data-testid="metric-closed"
          className="zen-card"
          style={{
            padding: "var(--space-md)",
            borderLeft: "4px solid #64748B",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Closed
            </span>
            <div
              data-testid="metric-closed-count"
              style={{ fontSize: "2rem", fontWeight: 700, color: "#64748B", margin: "6px 0" }}
            >
              {summary.closed}
            </div>
          </div>
          <button
            type="button"
            data-testid="drilldown-closed"
            onClick={() => handleDrilldown("/my-tickets?status=CLOSED")}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              padding: 0,
              textAlign: "left",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all →
          </button>
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
        {/* Left (Recent Tickets) */}
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
              My Recent Tickets
            </h2>
            <button
              type="button"
              data-testid="view-all-recent-tickets-link"
              onClick={() => handleDrilldown("/my-tickets")}
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
              data-testid="no-recent-tickets"
              style={{
                textAlign: "center",
                padding: "var(--space-xl) var(--space-base)",
                color: "var(--color-text-muted)",
              }}
            >
              No tickets found. Create your first request!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  data-testid={`recent-ticket-row-${ticket.id}`}
                  onClick={() => handleTicketClick(ticket.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-sm) var(--space-md)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                >
                  <div style={{ minWidth: 0, flex: 1, marginRight: "var(--space-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", marginBottom: 2 }}>
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

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexShrink: 0 }}>
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
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(ticket.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (Quick Actions) */}
        <div className="zen-card" style={{ padding: "var(--space-lg)", flex: 1 }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, marginBottom: "var(--space-md)" }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {/* Create Ticket */}
            <button
              type="button"
              data-testid="quick-create-ticket-btn"
              onClick={handleCreateClick}
              className="zen-btn zen-btn-primary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "var(--space-md)",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>[+] Create Ticket</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.9, marginTop: 2, fontWeight: 400 }}>
                Submit a new support request
              </span>
            </button>

            {/* View My Tickets */}
            <button
              type="button"
              data-testid="quick-view-tickets-btn"
              onClick={() => handleDrilldown("/my-tickets")}
              className="zen-btn zen-btn-secondary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "var(--space-md)",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-main)" }}>
                [=] View My Tickets
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 2, fontWeight: 400 }}>
                Track existing requests & progress
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
