import React from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { RequesterProvider } from "./context/RequesterContext.js";
import { GlobalErrorProvider } from "./context/GlobalErrorContext.js";
import { AppHeader } from "./components/AppHeader.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail.js";
import { GlobalErrorBanner } from "./components/GlobalErrorBanner.js";
import { Login } from "./components/Login.js";
import { ChangePassword } from "./components/ChangePassword.js";
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

function ProtectedLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentTab = location.pathname.includes("create")
    ? "create-ticket"
    : location.pathname.includes("queue")
    ? "queue"
    : location.pathname.includes("admin")
    ? "admin-users"
    : "my-tickets";

  return (
    <div>
      <AppHeader
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === "create-ticket") navigate("/tickets/create");
          else if (tab === "queue") navigate("/queue");
          else if (tab === "admin-users") navigate("/admin/users");
          else navigate("/tickets");
        }}
        onLogout={handleLogout}
      />
      <GlobalErrorBanner />

      <main>
        <Outlet />
      </main>
    </div>
  );
}

function ChangePasswordRoute() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSuccess = () => {
    if (user?.role === "ADMINISTRATOR") {
      navigate("/admin/users");
    } else if (user?.role === "IT_STAFF") {
      navigate("/queue");
    } else {
      navigate("/tickets");
    }
  };

  return (
    <div>
      <header
        style={{
          backgroundColor: "var(--color-primary-green)",
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          color: "#FFFFFF",
          padding: "var(--space-xs) 0",
        }}
      >
        <div
          className="zen-container"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>TokTickIT</span>
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
      </header>
      <GlobalErrorBanner />
      <ChangePassword onSuccess={handleSuccess} />
    </div>
  );
}

function LoginRoute() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    if (user?.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    if (user?.role === "ADMINISTRATOR") {
      return <Navigate to="/admin/users" replace />;
    }
    if (user?.role === "IT_STAFF") {
      return <Navigate to="/queue" replace />;
    }
    return <Navigate to="/tickets" replace />;
  }

  return (
    <div>
      <GlobalErrorBanner />
      <Login
        onSuccess={(loggedInUser) => {
          if (loggedInUser.mustChangePassword) {
            navigate("/change-password");
          } else if (loggedInUser.role === "ADMINISTRATOR") {
            navigate("/admin/users");
          } else if (loggedInUser.role === "IT_STAFF") {
            navigate("/queue");
          } else {
            navigate("/tickets");
          }
        }}
        onRequirePasswordChange={() => {
          navigate("/change-password");
        }}
      />
    </div>
  );
}

function MainApp() {
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Handle Loading state during initial session restoration
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-page-bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="zen-spinner" style={{ width: 36, height: 36, margin: "0 auto var(--space-sm)" }} />
          <div style={{ color: "var(--color-text-muted)" }}>Loading TokTickIT...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/change-password" element={<ChangePasswordRoute />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
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
              onTicketCreated={() => navigate("/tickets")}
              onCancel={() => navigate("/tickets")}
            />
          }
        />
        <Route path="/tickets/:id" element={<TicketDetailWrapper />} />
        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalErrorProvider>
        <AuthProvider>
          <RequesterProvider>
            <MainApp />
          </RequesterProvider>
        </AuthProvider>
      </GlobalErrorProvider>
    </BrowserRouter>
  );
}
