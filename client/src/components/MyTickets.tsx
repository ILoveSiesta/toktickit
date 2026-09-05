import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext.js";
import { fetchTickets, fetchCategories } from "../api.js";
import { Category } from "../types/index.js";

interface MyTicketsProps {
  onSelectTicket: (ticketId: number) => void;
  onNavigateCreate: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onSelectTicket, onNavigateCreate }) => {
  const { currentRequester } = useRequester();

  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("");
  const [itPriority, setItPriority] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Load categories
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const loadTickets = useCallback(async () => {
    if (!currentRequester) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets(
        {
          search,
          categoryId: categoryId || undefined,
          requestedPriority: requestedPriority || undefined,
          itPriority: itPriority || undefined,
          currentStatus: currentStatus || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 8,
        },
        currentRequester.id
      );
      setTickets(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [currentRequester, search, categoryId, requestedPriority, itPriority, currentStatus, sortBy, sortOrder, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryId("");
    setRequestedPriority("");
    setItPriority("");
    setCurrentStatus("");
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return <span style={{ marginLeft: "4px" }}>{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  const hasActiveFilters = Boolean(search || categoryId || requestedPriority || itPriority || currentStatus);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "zen-badge-new";
      case "OPEN":
        return "zen-badge-open";
      case "IN_PROGRESS":
        return "zen-badge-inprogress";
      case "RESOLVED":
        return "zen-badge-resolved";
      case "CLOSED":
        return "zen-badge-closed";
      default:
        return "zen-badge-open";
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "zen-badge-critical";
      case "HIGH":
        return "zen-badge-high";
      case "MEDIUM":
        return "zen-badge-medium";
      case "LOW":
        return "zen-badge-low";
      default:
        return "zen-badge-medium";
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="zen-container" style={{ padding: "var(--space-xl) var(--space-base)" }}>
      {/* Header & Create Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-md)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div>
          <h1 className="zen-title" style={{ margin: 0 }}>
            My Tickets
          </h1>
          <p className="zen-text-muted" style={{ margin: 0, marginTop: "var(--space-xs)" }}>
            Track, view, and manage your submitted IT service requests
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateCreate}
          className="zen-btn zen-btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)" }}
        >
          <span>+</span> Create New Ticket
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="zen-card"
        style={{
          padding: "var(--space-md)",
          marginBottom: "var(--space-lg)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-md)",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label className="zen-label" style={{ marginBottom: "var(--space-xs)" }}>
            Search Tickets
          </label>
          <input
            type="text"
            className="zen-input"
            data-testid="ticket-search-input"
            placeholder="Search by ID, summary, or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div style={{ flex: "0 1 150px" }}>
          <label className="zen-label" style={{ marginBottom: "var(--space-xs)" }}>
            Category
          </label>
          <select
            className="zen-select"
            data-testid="category-filter"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "0 1 140px" }}>
          <label className="zen-label" style={{ marginBottom: "var(--space-xs)" }}>
            Req. Priority
          </label>
          <select
            className="zen-select"
            data-testid="req-priority-filter"
            value={requestedPriority}
            onChange={(e) => {
              setRequestedPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Req. Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div style={{ flex: "0 1 140px" }}>
          <label className="zen-label" style={{ marginBottom: "var(--space-xs)" }}>
            IT Priority
          </label>
          <select
            className="zen-select"
            data-testid="it-priority-filter"
            value={itPriority}
            onChange={(e) => {
              setItPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All IT Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div style={{ flex: "0 1 140px" }}>
          <label className="zen-label" style={{ marginBottom: "var(--space-xs)" }}>
            Status
          </label>
          <select
            className="zen-select"
            data-testid="status-filter"
            value={currentStatus}
            onChange={(e) => {
              setCurrentStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div style={{ alignSelf: "flex-end", paddingBottom: "2px" }}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="zen-btn zen-btn-secondary"
              style={{ height: "40px" }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="zen-alert-error" role="alert" style={{ marginBottom: "var(--space-lg)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <p className="zen-text-muted">Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        hasActiveFilters ? (
          /* No-Results State (BR-25) */
          <div
            className="zen-card"
            data-testid="no-results-state"
            style={{ textAlign: "center", padding: "var(--space-2xl)" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>🔍</div>
            <h3 className="zen-title" style={{ fontSize: "1.125rem", marginBottom: "var(--space-xs)" }}>
              No tickets found matching your filters
            </h3>
            <p className="zen-text-muted" style={{ marginBottom: "var(--space-lg)" }}>
              Try adjusting your search query or clearing selected filters to view other tickets.
            </p>
            <button type="button" onClick={handleClearFilters} className="zen-btn zen-btn-secondary">
              Reset Filters
            </button>
          </div>
        ) : (
          /* Empty State (BR-25) */
          <div
            className="zen-card"
            data-testid="empty-tickets-state"
            style={{ textAlign: "center", padding: "var(--space-2xl)" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>🎫</div>
            <h3 className="zen-title" style={{ fontSize: "1.125rem", marginBottom: "var(--space-xs)" }}>
              You haven't submitted any tickets yet
            </h3>
            <p className="zen-text-muted" style={{ maxWidth: 480, margin: "0 auto var(--space-lg) auto" }}>
              Need IT assistance with hardware, software, network, or account access? Submit your first request today.
            </p>
            <button type="button" onClick={onNavigateCreate} className="zen-btn zen-btn-primary">
              + Create Your First Ticket
            </button>
          </div>
        )
      ) : (
        /* Tickets Table & Mobile Cards */
        <div className="zen-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Desktop/Tablet Table View */}
          <div className="zen-table-responsive-desktop" style={{ overflowX: "auto" }}>
            <table className="zen-table">
              <thead>
                <tr>
                  <th
                    style={{ width: "140px", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("ticketNumber")}
                  >
                    Ticket No. {renderSortIndicator("ticketNumber")}
                  </th>
                  <th>Summary</th>
                  <th style={{ width: "130px" }}>Category</th>
                  <th style={{ width: "110px" }}>Req. Priority</th>
                  <th style={{ width: "110px" }}>IT Priority</th>
                  <th style={{ width: "120px" }}>Status</th>
                  <th
                    style={{ width: "120px", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("createdAt")}
                  >
                    Created Date {renderSortIndicator("createdAt")}
                  </th>
                  <th
                    style={{ width: "120px", cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("updatedAt")}
                  >
                    Last Updated {renderSortIndicator("updatedAt")}
                  </th>
                  <th style={{ width: "80px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong style={{ color: "var(--color-primary-green)" }}>
                        {t.ticketNumber}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-text-dark)" }}>
                        {t.summary}
                      </div>
                      {t.attachments && t.attachments.length > 0 && (
                        <span className="zen-text-muted" style={{ fontSize: "0.75rem" }}>
                          📎 {t.attachments.filter((a: any) => !a.isRemoved).length} file(s)
                        </span>
                      )}
                    </td>
                    <td>{t.category?.name || "-"}</td>
                    <td>
                      <span className={`zen-badge ${getPriorityBadgeClass(t.requestedPriority)}`}>
                        {t.requestedPriority}
                      </span>
                    </td>
                    <td>
                      <span className={`zen-badge ${getPriorityBadgeClass(t.itPriority || t.requestedPriority)}`}>
                        {t.itPriority || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`zen-badge ${getStatusBadgeClass(t.currentStatus)}`}>
                        {t.currentStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>{formatDate(t.createdAt || t.ticketDate)}</td>
                    <td>{formatDate(t.updatedAt || t.createdAt || t.ticketDate)}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="zen-btn zen-btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "0.8rem", height: "32px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="zen-card-responsive-mobile" style={{ padding: "var(--space-md)" }}>
            {tickets.map((t) => (
              <div
                key={`card-${t.id}`}
                className="zen-card"
                onClick={() => onSelectTicket(t.id)}
                style={{
                  padding: "var(--space-md)",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xs)" }}>
                  <strong style={{ color: "var(--color-primary-green)" }}>{t.ticketNumber}</strong>
                  <span className={`zen-badge ${getStatusBadgeClass(t.currentStatus)}`}>
                    {t.currentStatus.replace("_", " ")}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "var(--space-xs)" }}>
                  {t.summary}
                </div>

                <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap", marginBottom: "var(--space-sm)" }}>
                  <span className={`zen-badge ${getPriorityBadgeClass(t.requestedPriority)}`}>
                    Req: {t.requestedPriority}
                  </span>
                  {t.itPriority && (
                    <span className={`zen-badge ${getPriorityBadgeClass(t.itPriority)}`}>
                      IT: {t.itPriority}
                    </span>
                  )}
                  <span className="zen-badge" style={{ backgroundColor: "#F1F5F3", color: "#1A2E26" }}>
                    {t.category?.name || "General"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }} className="zen-text-muted">
                  <span>Created: {formatDate(t.createdAt || t.ticketDate)}</span>
                  <span>Updated: {formatDate(t.updatedAt || t.createdAt || t.ticketDate)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls (BR-24) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "var(--space-md)",
              borderTop: "1px solid var(--color-border)",
              backgroundColor: "#FAFCFB",
              flexWrap: "wrap",
              gap: "var(--space-md)",
            }}
          >
            <span className="zen-text-muted" style={{ fontSize: "0.85rem" }}>
              Showing {(page - 1) * 8 + 1} - {Math.min(page * 8, totalCount)} of {totalCount} tickets
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
              <button
                type="button"
                className="zen-btn zen-btn-secondary"
                style={{ padding: "4px 12px", height: "32px" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              <span style={{ margin: "0 var(--space-xs)", fontSize: "0.85rem", fontWeight: 600 }}>
                Page {page} of {totalPages || 1}
              </span>

              <button
                type="button"
                className="zen-btn zen-btn-secondary"
                style={{ padding: "4px 12px", height: "32px" }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
