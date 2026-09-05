import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { GlobalErrorProvider } from "./context/GlobalErrorContext.js";
import { AppHeader } from "./components/AppHeader.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail.js";
import { GlobalErrorBanner } from "./components/GlobalErrorBanner.js";
import "./theme.css";

function TicketDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  if (isNaN(ticketId)) {
    return (
      <div className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
        <button
          type="button"
          onClick={() => navigate("/tickets")}
          className="zen-btn zen-btn-secondary"
          style={{ marginBottom: "var(--space-md)" }}
        >
          ← Back to My Tickets
        </button>
        <div className="zen-alert-error" role="alert">
          Invalid ticket ID.
        </div>
      </div>
    );
  }

  return (
    <RequesterTicketDetail
      ticketId={ticketId}
      onBack={() => navigate("/tickets")}
    />
  );
}

function MainApp() {
  const { currentRequester } = useRequester();
  const [showSelectorModal, setShowSelectorModal] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.includes("create")
    ? "create-ticket"
    : "my-tickets";

  // If no requester selected or explicitly changing, show selector
  if (!currentRequester || showSelectorModal) {
    return (
      <div>
        <AppHeader
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === "create-ticket") navigate("/tickets/create");
            else navigate("/tickets");
          }}
          onChangeRequester={() => setShowSelectorModal(true)}
        />
        <GlobalErrorBanner />
        <RequesterSelector
          onSuccess={() => {
            setShowSelectorModal(false);
            navigate("/tickets");
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <AppHeader
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === "create-ticket") navigate("/tickets/create");
          else navigate("/tickets");
        }}
        onChangeRequester={() => setShowSelectorModal(true)}
      />
      <GlobalErrorBanner />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <MyTickets
                onSelectTicket={(ticketId) => navigate(`/tickets/${ticketId}`)}
                onNavigateCreate={() => navigate("/tickets/create")}
              />
            }
          />
          <Route
            path="/tickets"
            element={
              <MyTickets
                onSelectTicket={(ticketId) => navigate(`/tickets/${ticketId}`)}
                onNavigateCreate={() => navigate("/tickets/create")}
              />
            }
          />
          <Route
            path="/tickets/create"
            element={
              <CreateTicket
                onCancel={() => navigate("/tickets")}
              />
            }
          />
          <Route path="/tickets/:id" element={<TicketDetailWrapper />} />
          <Route
            path="*"
            element={
              <MyTickets
                onSelectTicket={(ticketId) => navigate(`/tickets/${ticketId}`)}
                onNavigateCreate={() => navigate("/tickets/create")}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalErrorProvider>
        <RequesterProvider>
          <MainApp />
        </RequesterProvider>
      </GlobalErrorProvider>
    </BrowserRouter>
  );
}
