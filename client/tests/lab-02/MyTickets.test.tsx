import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyTickets } from "../../src/components/MyTickets.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockTickets = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    summary: "VPN Connection Timeout Issue",
    description: "Cannot connect to VPN from home.",
    requestedPriority: "HIGH",
    itPriority: "CRITICAL",
    currentStatus: "IN_PROGRESS",
    ticketOwner: "John IT",
    ticketDate: "2026-08-30T10:00:00.000Z",
    createdAt: "2026-08-30T10:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
    requesterId: 1,
    categoryId: 4,
    relatedSystemId: 3,
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 3, name: "VPN" },
    attachments: [],
  },
];

describe("UI-05: MyTickets Component (Table, Search, Filter, Empty vs No-Results)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Jennifer Anderson", email: "jennifer@toktick.it", isActive: true })
    );

    vi.spyOn(api, "fetchCategories").mockResolvedValue([{ id: 4, name: "Network" }]);
  });

  it("renders ticket list table with columns, IT Priority badge, and sortable headers", async () => {
    const fetchTicketsSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
      items: mockTickets,
      totalCount: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    });

    render(
      <RequesterProvider>
        <MyTickets onSelectTicket={vi.fn()} onNavigateCreate={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      const ticketNumbers = screen.getAllByText("TKT-2026-000001");
      expect(ticketNumbers.length).toBeGreaterThanOrEqual(1);
      const summaries = screen.getAllByText("VPN Connection Timeout Issue");
      expect(summaries.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId("it-priority-filter")).toBeInTheDocument();
    });

    // Test sorting by clicking on header
    const createdHeader = screen.getByText(/Created Date/i);
    await userEvent.click(createdHeader);

    expect(fetchTicketsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "createdAt" }),
      1
    );
  });

  it("renders Empty State when requester has no tickets yet", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      limit: 8,
      totalPages: 0,
    });

    const handleCreate = vi.fn();

    render(
      <RequesterProvider>
        <MyTickets onSelectTicket={vi.fn()} onNavigateCreate={handleCreate} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-tickets-state")).toBeInTheDocument();
      expect(screen.getByText(/You haven't submitted any tickets yet/i)).toBeInTheDocument();
    });
  });

  it("renders No-Results State when search filter finds no matches", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      limit: 8,
      totalPages: 0,
    });

    render(
      <RequesterProvider>
        <MyTickets onSelectTicket={vi.fn()} onNavigateCreate={vi.fn()} />
      </RequesterProvider>
    );

    // Type in search box
    const searchInput = screen.getByTestId("ticket-search-input");
    await userEvent.type(searchInput, "NonexistentQuery123");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
      expect(screen.getByText(/No tickets found matching your filters/i)).toBeInTheDocument();
    });
  });
});
