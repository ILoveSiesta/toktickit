import React, { useState, useEffect } from "react";
import { fetchRequesters } from "../api.js";
import { RequesterUser } from "../types/index.js";
import { useRequester } from "../context/RequesterContext.js";

interface RequesterSelectorProps {
  onSuccess?: () => void;
}

export const RequesterSelector: React.FC<RequesterSelectorProps> = ({ onSuccess }) => {
  const { selectRequester, currentRequester } = useRequester();
  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentRequester ? String(currentRequester.id) : "");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRequesters();
        if (isMounted) {
          setRequesters(data);
          if (data.length > 0 && !selectedId) {
            setSelectedId(String(data[0].id));
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load development requesters");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = requesters.find((r) => String(r.id) === selectedId);
    if (chosen) {
      selectRequester(chosen);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 56px)",
        padding: "var(--space-lg)",
      }}
    >
      <div className="zen-card" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>👤</div>
        <h1 className="zen-title" style={{ fontSize: "1.375rem", marginBottom: "var(--space-xs)" }}>
          Select Development Requester
        </h1>
        <p className="zen-text-muted" style={{ marginBottom: "var(--space-lg)", fontSize: "0.85rem" }}>
          Choose a development requester to simulate the current requester context for Lab 2.
          This is for testing only and is not a login screen.
        </p>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-xl)" }} data-testid="loading-indicator">
            <div className="zen-spinner zen-spinner-dark" style={{ width: 28, height: 28 }}></div>
          </div>
        )}

        {error && (
          <div className="zen-alert-error" role="alert" data-testid="error-alert">
            <strong>Connection Error:</strong> {error}
          </div>
        )}

        {!loading && !error && requesters.length === 0 && (
          <div className="zen-alert-info" role="status" data-testid="empty-alert">
            No active development requesters found in the database. Please run the database seed.
          </div>
        )}

        {!loading && !error && requesters.length > 0 && (
          <form onSubmit={handleContinue}>
            <div className="zen-form-group">
              <label htmlFor="requester-dropdown" className="zen-label">
                Development Requester <span className="zen-required">*</span>
              </label>
              <select
                id="requester-dropdown"
                data-testid="requester-dropdown"
                className="zen-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {requesters.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.name} ({req.email}) {req.department ? `— ${req.department}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="zen-alert-info" style={{ textAlign: "left", fontSize: "0.8rem", marginTop: "var(--space-md)" }}>
              🔒 <strong>Authentication coming in Lab 3:</strong> In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-lg)" }}>
              <button
                type="submit"
                className="zen-btn zen-btn-primary"
                disabled={!selectedId}
                data-testid="continue-btn"
                style={{ width: "100%" }}
              >
                Continue →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
