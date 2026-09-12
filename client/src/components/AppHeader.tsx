import React from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRequester } from "../context/RequesterContext.js";

interface AppHeaderProps {
  currentTab?: "my-tickets" | "create-ticket" | "queue" | "admin-users";
  onSelectTab?: (tab: "my-tickets" | "create-ticket" | "queue" | "admin-users") => void;
  onChangeRequester?: () => void;
  onLogout?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab = "my-tickets",
  onSelectTab,
  onChangeRequester,
  onLogout,
}) => {
  const { user, logout } = useAuth();
  let requesterContext: any = null;
  try {
    requesterContext = useRequester();
  } catch {}

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
  };

  const handleChangeRequester = () => {
    if (onChangeRequester) {
      onChangeRequester();
    } else {
      requesterContext?.clearRequester();
    }
  };

  const displayName = user?.name || requesterContext?.currentRequester?.name;
  const userRole = user?.role || "REQUESTER";

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "IT_STAFF":
        return {
          backgroundColor: "#DCFCE7",
          color: "#15803D",
          border: "1px solid #86EFAC",
        };
      case "ADMINISTRATOR":
        return {
          backgroundColor: "#EDE9FE",
          color: "#6D28D9",
          border: "1px solid #DDD6FE",
        };
      case "REQUESTER":
      default:
        return {
          backgroundColor: "#E0F2FE",
          color: "#0369A1",
          border: "1px solid #BAE6FD",
        };
    }
  };

  return (
    <header
      style={{
        backgroundColor: "var(--color-primary-green)",
        minHeight: 56,
        display: "flex",
        alignItems: "center",
        color: "#FFFFFF",
        boxShadow: "var(--shadow-sm)",
        padding: "var(--space-xs) 0",
      }}
    >
      <div
        className="zen-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
        }}
      >
        {/* Left: Brand & Role-Based Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
              TokTickIT
            </span>
          </div>

          <nav style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
            {userRole === "REQUESTER" && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab("my-tickets")}
                  style={{
                    background: currentTab === "my-tickets" ? "var(--color-secondary-green)" : "transparent",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    fontSize: "var(--font-size-body)",
                    cursor: "pointer",
                  }}
                >
                  My Tickets
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab("create-ticket")}
                  style={{
                    background: currentTab === "create-ticket" ? "var(--color-secondary-green)" : "transparent",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    fontSize: "var(--font-size-body)",
                    cursor: "pointer",
                  }}
                >
                  + Create Ticket
                </button>
              </>
            )}

            {userRole === "IT_STAFF" && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab("queue")}
                  style={{
                    background: currentTab === "queue" ? "var(--color-secondary-green)" : "transparent",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    fontSize: "var(--font-size-body)",
                    cursor: "pointer",
                  }}
                >
                  📋 My Queue
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab("create-ticket")}
                  style={{
                    background: currentTab === "create-ticket" ? "var(--color-secondary-green)" : "transparent",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    fontSize: "var(--font-size-body)",
                    cursor: "pointer",
                  }}
                >
                  + Create Ticket
                </button>
              </>
            )}

            {userRole === "ADMINISTRATOR" && (
              <button
                type="button"
                onClick={() => onSelectTab && onSelectTab("admin-users")}
                style={{
                  background: currentTab === "admin-users" ? "var(--color-secondary-green)" : "transparent",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 500,
                  fontSize: "var(--font-size-body)",
                  cursor: "pointer",
                }}
              >
                ⚙️ User Management
              </button>
            )}
          </nav>
        </div>

        {/* Right: User identity, Role badge, and Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          {displayName ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", flexWrap: "wrap" }}>
              {/* User Name */}
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "4px 8px",
                  borderRadius: "16px",
                  fontWeight: 500,
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                data-testid="user-name-display"
                data-test-requester={displayName}
                id="header-user-display"
                title={displayName}
              >
                👤 <span data-testid="requester-name-display">{displayName}</span>
              </span>

              {/* Role Badge */}
              <span
                data-testid="user-role-badge"
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  ...getRoleBadgeStyle(userRole),
                }}
              >
                {userRole.replace("_", " ")}
              </span>

              {/* Change Requester button - only rendered if onChangeRequester prop is provided (e.g. in Lab 2 tests) */}
              {onChangeRequester && (
                <button
                  type="button"
                  onClick={handleChangeRequester}
                  className="zen-btn zen-btn-secondary"
                  style={{
                    color: "#FFFFFF",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    background: "rgba(255, 255, 255, 0.1)",
                    fontSize: "var(--font-size-xs)",
                    padding: "4px 8px",
                    minHeight: "30px",
                  }}
                  data-testid="change-requester-btn"
                >
                  Change Requester
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="zen-btn zen-btn-secondary"
                style={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.1)",
                  fontSize: "var(--font-size-xs)",
                  padding: "4px 8px",
                  minHeight: "30px",
                }}
                data-testid="logout-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.8 }}>
              Not signed in
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
