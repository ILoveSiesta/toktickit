import React from "react";
import { useGlobalError } from "../context/GlobalErrorContext.js";

export const GlobalErrorBanner: React.FC = () => {
  const { globalError, clearGlobalError } = useGlobalError();

  if (!globalError) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="global-error-banner"
      style={{
        backgroundColor: "#FEE2E2",
        borderBottom: "1px solid #FCA5A5",
        color: "#991B1B",
        padding: "10px 16px",
        fontSize: "var(--font-size-sm)",
        fontWeight: 600,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "var(--shadow-sm)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="zen-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span style={{ fontSize: "1.1rem" }}>⚠️</span>
          <span>{globalError}</span>
        </div>

        <button
          type="button"
          onClick={clearGlobalError}
          data-testid="dismiss-global-error-btn"
          style={{
            background: "transparent",
            border: "none",
            color: "#991B1B",
            cursor: "pointer",
            fontSize: "1.1rem",
            fontWeight: 700,
            padding: "2px 8px",
            lineHeight: 1,
            borderRadius: "var(--radius-sm)",
          }}
          title="Dismiss Error"
          aria-label="Dismiss Error"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
