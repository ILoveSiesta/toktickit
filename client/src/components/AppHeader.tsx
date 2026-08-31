import React from "react";
import { useRequester } from "../context/RequesterContext.js";

interface AppHeaderProps {
  currentTab?: "my-tickets" | "create-ticket";
  onSelectTab?: (tab: "my-tickets" | "create-ticket") => void;
  onChangeRequester?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab = "my-tickets",
  onSelectTab,
  onChangeRequester,
}) => {
  const { currentRequester, clearRequester } = useRequester();

  const handleChangeRequester = () => {
    if (onChangeRequester) {
      onChangeRequester();
    } else {
      clearRequester();
    }
  };

  return (
    <header
      style={{
        backgroundColor: "var(--color-primary-green)",
        height: 56,
        display: "flex",
        alignItems: "center",
        color: "#FFFFFF",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="zen-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: Brand & Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
              TokTickIT
            </span>
          </div>

          <nav style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button
              onClick={() => onSelectTab && onSelectTab("my-tickets")}
              style={{
                background: currentTab === "my-tickets" ? "var(--color-secondary-green)" : "transparent",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: "var(--font-size-body)",
                cursor: "pointer",
              }}
            >
              My Tickets
            </button>
            <button
              onClick={() => onSelectTab && onSelectTab("create-ticket")}
              style={{
                background: currentTab === "create-ticket" ? "var(--color-secondary-green)" : "transparent",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: "var(--font-size-body)",
                cursor: "pointer",
              }}
            >
              + Create Ticket
            </button>
          </nav>
        </div>

        {/* Right: Requester info & Change Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          {currentRequester ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  fontWeight: 500,
                }}
                data-testid="requester-name-display"
              >
                👤 {currentRequester.name}
              </span>
              <button
                onClick={handleChangeRequester}
                className="zen-btn zen-btn-tertiary"
                style={{
                  color: "#FFFFFF",
                  fontSize: "var(--font-size-xs)",
                  padding: "4px 8px",
                }}
                data-testid="change-requester-btn"
              >
                Change Requester
              </button>
            </div>
          ) : (
            <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.8 }}>
              No requester selected
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
