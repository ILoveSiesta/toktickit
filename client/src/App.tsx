import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { AppHeader } from "./components/AppHeader.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import "./theme.css";

function MainApp() {
  const { currentRequester, clearRequester } = useRequester();
  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket">("my-tickets");
  const [showSelectorModal, setShowSelectorModal] = useState<boolean>(false);

  // If no requester selected or explicitly changing, show selector
  if (!currentRequester || showSelectorModal) {
    return (
      <div>
        <AppHeader
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          onChangeRequester={() => setShowSelectorModal(true)}
        />
        <RequesterSelector
          onSuccess={() => {
            setShowSelectorModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <AppHeader
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onChangeRequester={() => setShowSelectorModal(true)}
      />

      <main className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
        <div className="zen-card" style={{ textAlign: "center", padding: "var(--space-2xl) var(--space-lg)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)" }}>
            🌿 <strong>TokTickIT Service Desk</strong>
          </div>
          <h2 className="zen-title" style={{ fontSize: "1.25rem" }}>
            Welcome, {currentRequester.name}!
          </h2>
          <p className="zen-text-muted" style={{ maxWidth: 600, margin: "0 auto var(--space-lg) auto" }}>
            Development Requester Context is active: <strong>{currentRequester.email}</strong> ({currentRequester.department || "General User"}).
            You are ready for Issue 3 (Ticket Creation) and Issue 4 (My Tickets & Ticket Details).
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-md)" }}>
            <button
              onClick={() => setShowSelectorModal(true)}
              className="zen-btn zen-btn-secondary"
            >
              Change Requester
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainApp />
    </RequesterProvider>
  );
}
