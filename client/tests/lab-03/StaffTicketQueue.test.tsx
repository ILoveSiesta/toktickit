import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketQueue } from "../../src/components/StaffTicketQueue.js";
import * as api from "../../src/api.js";
import { StaffTicketQueueItem, StaffQueueResponse } from "../../src/types/index.js";

const mockCategories = [
  { id: 1, name: "Hardware" },
  { id: 2, name: "Software" },
  { id: 3, name: "Network" },
];

const mockTickets: StaffTicketQueueItem[] = [
  {
    id: 101,
    ticketNumber: "TKT-2026-000101",
    ticketDate: "2026-09-12T09:14:00.000Z",
    summary: "Laptop battery drains quickly after Windows update",
    category: { id: 1, name: "Hardware" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    resolvedIndicated: false,
    ticketOwner: { id: 2, name: "Alex Thompson" },
    requester: { id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it" },
    updatedAt: "2026-09-12T10:30:00.000Z",
  },
  {
    id: 102,
    ticketNumber: "TKT-2026-000102",
    ticketDate: "2026-09-12T09:30:00.000Z",
    summary: "Cannot connect to VPN from home network",
    category: { id: 3, name: "Network" },
    requestedPriority: "CRITICAL",
    itPriority: "CRITICAL",
    currentStatus: "OPEN",
    resolvedIndicated: false,
    ticketOwner: null,
    requester: { id: 6, name: "Michael Brown", email: "michael@toktick.it" },
    updatedAt: "2026-09-12T09:30:00.000Z",
  },
];

const mockQueueResponse: StaffQueueResponse = {
  items: mockTickets,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};

describe("UI-03: StaffTicketQueue Table & Filters Component Tests", () => {
  const onSelectTicketMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueResponse);
  });

  it("renders queue table with headers, count summary, and ticket rows", async () => {
    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    // Initially shows skeleton or loads
    await waitFor(() => {
      expect(screen.getByText("My Queue")).toBeInTheDocument();
      expect(screen.getByTestId("queue-count-summary")).toHaveTextContent("Showing 1 to 2 of 2 tickets");
    });

    // Verify tickets rendered in desktop table and mobile cards
    expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Laptop battery drains quickly after Windows update")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Alex Thompson")[0]).toBeInTheDocument();

    // Verify unassigned owner label
    expect(screen.getAllByText("Unassigned")[0]).toBeInTheDocument();

    // Verify Badges
    const itBadges = screen.getAllByTestId("it-priority-badge");
    expect(itBadges.length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Open")[0]).toBeInTheDocument();
  });

  it("handles search input and queries the backend", async () => {
    const queueSpy = vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueResponse);
    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "VPN");

    await waitFor(() => {
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "VPN",
        })
      );
    });
  });

  it("toggles filter toolbar and filters by status, category, and priority", async () => {
    const queueSpy = vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(mockQueueResponse);
    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("filter-button")).toBeInTheDocument();
    });

    // Open filters panel
    const filterBtn = screen.getByTestId("filter-button");
    await userEvent.click(filterBtn);

    // Filter selects are now in the document
    expect(screen.getByTestId("status-filter")).toBeInTheDocument();
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
    expect(screen.getByTestId("it-priority-filter")).toBeInTheDocument();
    expect(screen.getByTestId("assigned-filter")).toBeInTheDocument();

    // Change status filter
    await userEvent.selectOptions(screen.getByTestId("status-filter"), "IN_PROGRESS");

    await waitFor(() => {
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "IN_PROGRESS",
        })
      );
    });
  });

  it("displays empty state when totalItems is 0 and no filters applied", async () => {
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("No tickets in queue")).toBeInTheDocument();
    });
  });

  it("displays no-results state with Clear Filters button when search has no matches", async () => {
    vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });

    // Type non-existent query
    await userEvent.type(screen.getByTestId("search-input"), "XYZ999");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
      expect(screen.getByText("No matching tickets found")).toBeInTheDocument();
      expect(screen.getByTestId("clear-filters-btn")).toBeInTheDocument();
    });

    // Clicking Clear Filters resets the search input
    await userEvent.click(screen.getByTestId("clear-filters-btn"));
    expect(screen.getByTestId("search-input")).toHaveValue("");
  });

  it("navigates to ticket detail when ticket link or row is clicked", async () => {
    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
    });

    const ticketLink = screen.getAllByTestId("ticket-link")[0];
    await userEvent.click(ticketLink);

    expect(onSelectTicketMock).toHaveBeenCalledWith(101);
  });

  it("renders pagination buttons and handles page navigation", async () => {
    const multiPageResponse: StaffQueueResponse = {
      items: mockTickets,
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    };

    const queueSpy = vi.spyOn(api, "fetchStaffTicketQueue").mockResolvedValue(multiPageResponse);
    render(<StaffTicketQueue onSelectTicket={onSelectTicketMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-bar")).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
      expect(screen.getByTestId("next-page")).toBeInTheDocument();
    });

    // Click next page
    await userEvent.click(screen.getByTestId("next-page"));

    await waitFor(() => {
      expect(queueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });
});
