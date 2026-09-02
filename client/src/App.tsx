import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { GlobalErrorProvider } from "./context/GlobalErrorContext.js";
import { AppHeader } from "./components/AppHeader.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { GlobalErrorBanner } from "./components/GlobalErrorBanner.js";
import "./theme.css";

function MainApp() {
  const { currentRequester } = useRequester();
  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket">("create-ticket");
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
        <GlobalErrorBanner />
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
      <GlobalErrorBanner />

      <main>
        {activeTab === "create-ticket" ? (
          <CreateTicket
            onTicketCreated={() => {
              // Stay on success or navigate if needed
            }}
            onCancel={() => {
              setActiveTab("my-tickets");
            }}
          />
        ) : (
          <div className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
            <div className="zen-card" style={{ textAlign: "center", padding: "var(--space-2xl) var(--space-lg)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)" }}>
                🌿 <strong>TokTickIT Service Desk</strong>
              </div>
              <h2 className="zen-title" style={{ fontSize: "1.25rem" }}>
                Welcome, {currentRequester.name}!
              </h2>
              <p className="zen-text-muted" style={{ maxWidth: 600, margin: "0 auto var(--space-lg) auto" }}>
                Development Requester Context is active: <strong>{currentRequester.email}</strong> ({currentRequester.department || "General User"}).
                Click <strong>+ Create Ticket</strong> above to submit a new IT support request.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-md)" }}>
                <button
                  onClick={() => setActiveTab("create-ticket")}
                  className="zen-btn zen-btn-primary"
                >
                  + Create New Ticket
                </button>
                <button
                  onClick={() => setShowSelectorModal(true)}
                  className="zen-btn zen-btn-secondary"
                >
                  Change Requester
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GlobalErrorProvider>
      <RequesterProvider>
        <MainApp />
      </RequesterProvider>
    </GlobalErrorProvider>
  );
}
