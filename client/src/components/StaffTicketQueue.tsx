import React, { useState, useEffect, useCallback } from "react";
import { fetchStaffTicketQueue, fetchCategories } from "../api.js";
import { Category, StaffTicketQueueItem, StaffQueueResponse } from "../types/index.js";

interface StaffTicketQueueProps {
  onSelectTicket: (ticketId: number) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onSelectTicket }) => {
  const [tickets, setTickets] = useState<StaffTicketQueueItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<StaffQueueResponse["pagination"]>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("");
  const [itPriority, setItPriority] = useState<string>("");
  const [assigned, setAssigned] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);

  // Filter toolbar collapse toggle
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStaffTicketQueue({
        search: search.trim() || undefined,
        category: category || undefined,
        status: status || undefined,
        requestedPriority: requestedPriority || undefined,
        itPriority: itPriority || undefined,
        assigned: assigned !== "all" ? assigned : undefined,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      });

      setTickets(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error("Error loading staff ticket queue:", err);
      setError(err.message || "Failed to load ticket queue.");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, requestedPriority, itPriority, assigned, sortBy, sortOrder, page]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const hasActiveFilters = Boolean(
    search.trim() || category || status || requestedPriority || itPriority || assigned !== "all"
  );

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setRequestedPriority("");
    setItPriority("");
    setAssigned("all");
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
    return <span style={{ marginLeft: 4, fontSize: "0.75rem" }}>{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "NEW":
        return "zen-badge-new";
      case "OPEN":
        return "zen-badge-open";
      case "IN_PROGRESS":
        return "zen-badge-inprogress";
      case "WAITING_FOR_REQUESTER":
        return "zen-badge-waiting";
      case "RESOLVED":
        return "zen-badge-resolved";
      case "CLOSED":
        return "zen-badge-closed";
      case "REOPENED":
        return "zen-badge-reopened";
      case "CANCELLED":
        return "zen-badge-cancelled";
      default:
        return "zen-badge-open";
    }
  };

  const formatStatusLabel = (s: string) => {
    switch (s) {
      case "IN_PROGRESS":
        return "In Progress";
      case "WAITING_FOR_REQUESTER":
        return "Waiting for Req";
      case "RESOLVED":
        return "Resolved";
      case "CLOSED":
        return "Closed";
      case "REOPENED":
        return "Reopened";
      case "CANCELLED":
        return "Cancelled";
      case "NEW":
        return "New";
      case "OPEN":
        return "Open";
      default:
        return s;
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
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

  // Pagination calculation
  const startItem = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.totalItems);

  return (
    <div className="zen-container" style={{ padding: "var(--space-lg) var(--space-base)" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-md)",
          marginBottom: "var(--space-md)",
        }}
      >
        <div>
          <h1 className="zen-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📋</span> My Queue
          </h1>
          <p
            className="zen-text-muted"
            style={{ margin: 0, marginTop: "var(--space-xs)" }}
            data-testid="queue-count-summary"
          >
            {pagination.totalItems > 0
              ? `Showing ${startItem} to ${endItem} of ${pagination.totalItems} tickets`
              : "Showing 0 tickets"}
          </p>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="zen-alert-error" role="alert" style={{ marginBottom: "var(--space-md)" }}>
          <span>{error}</span>
          <button
            type="button"
            onClick={loadQueue}
            className="zen-btn zen-btn-tertiary"
            style={{ marginLeft: "var(--space-md)", padding: "2px 8px", fontSize: "var(--font-size-xs)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Toolbar: Search input & Filter toggle button */}
      <div
        className="zen-card"
        style={{
          padding: "var(--space-md)",
          marginBottom: "var(--space-lg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            flexWrap: "wrap",
          }}
        >
          {/* Search Input */}
          <div style={{ flex: "1 1 280px", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
                fontSize: "1rem",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              className="zen-input"
              style={{ paddingLeft: "36px" }}
              placeholder="Search by ticket number or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-testid="search-input"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            className={`zen-btn ${showFilters || hasActiveFilters ? "zen-btn-primary" : "zen-btn-secondary"}`}
            onClick={() => setShowFilters((prev) => !prev)}
            style={{ minHeight: 40, padding: "var(--space-xs) var(--space-md)" }}
            data-testid="filter-button"
          >
            <span>⚙️ Filters</span>
            {hasActiveFilters && (
              <span
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "var(--color-primary-green)",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  marginLeft: 4,
                }}
              >
                !
              </span>
            )}
          </button>

          {/* Quick Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="zen-btn zen-btn-tertiary"
              onClick={handleClearFilters}
              style={{ minHeight: 40, fontSize: "var(--font-size-xs)" }}
              data-testid="clear-filters-quick"
            >
              ✕ Clear All
            </button>
          )}
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div
            style={{
              marginTop: "var(--space-md)",
              paddingTop: "var(--space-md)",
              borderTop: "1px solid var(--color-border-neutral)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "var(--space-md)",
            }}
          >
            {/* Category Filter */}
            <div className="zen-form-group" style={{ marginBottom: 0 }}>
              <label className="zen-label">Category</label>
              <select
                className="zen-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="zen-form-group" style={{ marginBottom: 0 }}>
              <label className="zen-label">Status</label>
              <select
                className="zen-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                data-testid="status-filter"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* IT Priority Filter */}
            <div className="zen-form-group" style={{ marginBottom: 0 }}>
              <label className="zen-label">IT Priority</label>
              <select
                className="zen-select"
                value={itPriority}
                onChange={(e) => {
                  setItPriority(e.target.value);
                  setPage(1);
                }}
                data-testid="it-priority-filter"
              >
                <option value="">All IT Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Assignment Filter */}
            <div className="zen-form-group" style={{ marginBottom: 0 }}>
              <label className="zen-label">Assignment</label>
              <select
                className="zen-select"
                value={assigned}
                onChange={(e) => {
                  setAssigned(e.target.value);
                  setPage(1);
                }}
                data-testid="assigned-filter"
              >
                <option value="all">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                <option value="mine">Assigned to Me</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div data-testid="skeleton-loader" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="zen-skeleton"
              style={{
                height: "54px",
                width: "100%",
                borderRadius: "var(--radius-md)",
              }}
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        /* Empty / No-Results States */
        <div
          className="zen-card"
          style={{
            padding: "var(--space-2xl) var(--space-lg)",
            textAlign: "center",
          }}
          data-testid={hasActiveFilters ? "no-results-state" : "empty-state"}
        >
          {hasActiveFilters ? (
            <div>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>🔍</div>
              <h3 className="zen-subtitle" style={{ marginBottom: "var(--space-xs)" }}>
                No matching tickets found
              </h3>
              <p className="zen-text-muted" style={{ marginBottom: "var(--space-base)" }}>
                Try adjusting or clearing your search and filters to find what you are looking for.
              </p>
              <button
                type="button"
                className="zen-btn zen-btn-primary"
                onClick={handleClearFilters}
                data-testid="clear-filters-btn"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>📦</div>
              <h3 className="zen-subtitle" style={{ marginBottom: "var(--space-xs)" }}>
                No tickets in queue
              </h3>
              <p className="zen-text-muted" style={{ margin: 0 }}>
                All incoming IT service tickets have been resolved or the queue is currently empty.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Data Display: Desktop Table + Mobile Stacked Cards */
        <>
          {/* Desktop Table Layout */}
          <div className="zen-table-responsive-desktop zen-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="zen-table">
              <thead>
                <tr>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("ticketNumber")}
                    title="Sort by Ticket Number"
                  >
                    Ticket No. {renderSortIndicator("ticketNumber")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("createdAt")}
                    title="Sort by Created Date"
                  >
                    Created Date {renderSortIndicator("createdAt")}
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Req Priority</th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("itPriority")}
                    title="Sort by IT Priority"
                  >
                    IT Priority {renderSortIndicator("itPriority")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort("currentStatus")}
                    title="Sort by Status"
                  >
                    Status {renderSortIndicator("currentStatus")}
                  </th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    data-testid="ticket-row"
                    style={{
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={() => onSelectTicket(t.id)}
                  >
                    {/* Ticket No */}
                    <td>
                      <button
                        type="button"
                        className="zen-btn-tertiary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        style={{
                          padding: 0,
                          fontWeight: 700,
                          color: "var(--color-primary-green)",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                        data-testid="ticket-link"
                      >
                        {t.ticketNumber}
                      </button>
                    </td>

                    {/* Created Date */}
                    <td style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(t.ticketDate)}
                    </td>

                    {/* Summary with Ellipsis */}
                    <td
                      style={{
                        maxWidth: "260px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 500,
                      }}
                      title={t.summary}
                    >
                      {t.summary}
                    </td>

                    {/* Category */}
                    <td style={{ fontSize: "var(--font-size-sm)", whiteSpace: "nowrap" }}>
                      {t.category?.name || "-"}
                    </td>

                    {/* Req Priority */}
                    <td>
                      <span className={`zen-badge ${getPriorityBadgeClass(t.requestedPriority)}`}>
                        {t.requestedPriority}
                      </span>
                    </td>

                    {/* IT Priority */}
                    <td>
                      <span
                        className={`zen-badge ${getPriorityBadgeClass(t.itPriority)}`}
                        data-testid="it-priority-badge"
                      >
                        {t.itPriority || "-"}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`zen-badge ${getStatusBadgeClass(t.currentStatus)}`}>
                        {formatStatusLabel(t.currentStatus)}
                      </span>
                    </td>

                    {/* Owner */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {t.ticketOwner ? (
                        <span style={{ fontWeight: 500 }}>{t.ticketOwner.name}</span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards Layout (< 768px) */}
          <div className="zen-card-responsive-mobile">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="zen-card"
                data-testid="ticket-card"
                onClick={() => onSelectTicket(t.id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xs)",
                  padding: "var(--space-md)",
                  transition: "all 0.15s ease",
                  borderLeft: "4px solid var(--color-primary-green)",
                }}
              >
                {/* Header: Ticket Number & Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontWeight: 700,
                      color: "var(--color-primary-green)",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {t.ticketNumber}
                  </button>
                  <span className={`zen-badge ${getStatusBadgeClass(t.currentStatus)}`}>
                    {formatStatusLabel(t.currentStatus)}
                  </span>
                </div>

                {/* Summary */}
                <div style={{ fontWeight: 600, fontSize: "var(--font-size-body)", color: "var(--color-text-primary)" }}>
                  {t.summary}
                </div>

                {/* Badges metadata row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {t.category?.name}
                  </span>
                  <span style={{ color: "var(--color-border-neutral)" }}>•</span>
                  <span className={`zen-badge ${getPriorityBadgeClass(t.itPriority)}`}>
                    IT: {t.itPriority}
                  </span>
                  <span className={`zen-badge ${getPriorityBadgeClass(t.requestedPriority)}`}>
                    Req: {t.requestedPriority}
                  </span>
                </div>

                {/* Footer: Owner and Date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "6px",
                    paddingTop: "6px",
                    borderTop: "1px dashed var(--color-border-neutral)",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span>
                    Owner:{" "}
                    {t.ticketOwner ? (
                      <strong style={{ color: "var(--color-text-primary)" }}>{t.ticketOwner.name}</strong>
                    ) : (
                      <em>Unassigned</em>
                    )}
                  </span>
                  <span>{formatDate(t.ticketDate)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div
              data-testid="pagination-bar"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "var(--space-xs)",
                marginTop: "var(--space-lg)",
                flexWrap: "wrap",
              }}
            >
              {/* Previous Button */}
              <button
                type="button"
                className="zen-btn zen-btn-secondary"
                disabled={!pagination.hasPrev || page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                style={{ padding: "6px 12px", minHeight: 36, fontSize: "var(--font-size-sm)" }}
                data-testid="prev-page"
              >
                ‹ Previous
              </button>

              {/* Page Number Buttons */}
              {[...Array(pagination.totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`zen-btn ${isActive ? "zen-btn-primary" : "zen-btn-secondary"}`}
                    onClick={() => setPage(pageNum)}
                    style={{
                      minHeight: 36,
                      minWidth: 36,
                      padding: "6px 10px",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: isActive ? 700 : 500,
                    }}
                    data-testid={`page-btn-${pageNum}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                className="zen-btn zen-btn-secondary"
                disabled={!pagination.hasNext || page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                style={{ padding: "6px 12px", minHeight: 36, fontSize: "var(--font-size-sm)" }}
                data-testid="next-page"
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
