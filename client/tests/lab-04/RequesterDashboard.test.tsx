import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterDashboard } from "../../src/components/Dashboards/RequesterDashboard.js";
import * as api from "../../src/api.js";
import { RequesterDashboardData } from "../../src/types/index.js";

// Mock Auth Context
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: {
      id: 5,
      name: "Jennifer Anderson",
      email: "jennifer@toktick.it",
      role: "REQUESTER",
    },
    isAuthenticated: true,
  }),
}));

const mockDashboardData: RequesterDashboardData = {
  summary: {
    totalOpen: 4,
    inProgress: 2,
    waitingForRequester: 1,
    recentlyResolved: 3,
    closed: 8,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Broken Monitor Screen",
      status: "IN_PROGRESS",
      priority: "HIGH",
      updatedAt: "2026-10-06T10:00:00.000Z",
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-000102",
      summary: "VPN configuration issue",
      status: "RESOLVED",
      priority: "MEDIUM",
      updatedAt: "2026-10-05T15:30:00.000Z",
    },
  ],
};

describe("COMP-03: Requester Dashboard Component Tests (FR-12, FR-15)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 5 metric cards with accurate authoritative counts", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    render(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-welcome")).toHaveTextContent("Jennifer Anderson");
    });

    // 1. My Open Tickets
    expect(screen.getByTestId("metric-open-tickets-count")).toHaveTextContent("4");
    // 2. In Progress
    expect(screen.getByTestId("metric-in-progress-count")).toHaveTextContent("2");
    // 3. Waiting for You
    expect(screen.getByTestId("metric-waiting-requester-count")).toHaveTextContent("1");
    // 4. Recent Resolved
    expect(screen.getByTestId("metric-recent-resolved-count")).toHaveTextContent("3");
    // 5. Closed
    expect(screen.getByTestId("metric-closed-count")).toHaveTextContent("8");
  });

  it("navigates with correct drill-down filter query params when clicking metric card links", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);
    const mockNavigateTickets = vi.fn();

    render(<RequesterDashboard onNavigateTickets={mockNavigateTickets} />);

    await waitFor(() => {
      expect(screen.getByTestId("metric-open-tickets-count")).toBeInTheDocument();
    });

    // Click My Open Tickets
    await userEvent.click(screen.getByTestId("drilldown-open-tickets"));
    expect(mockNavigateTickets).toHaveBeenCalledWith("/my-tickets?status=OPEN_GROUP");

    // Click In Progress
    await userEvent.click(screen.getByTestId("drilldown-in-progress"));
    expect(mockNavigateTickets).toHaveBeenCalledWith("/my-tickets?status=IN_PROGRESS");

    // Click Waiting for You
    await userEvent.click(screen.getByTestId("drilldown-waiting-requester"));
    expect(mockNavigateTickets).toHaveBeenCalledWith("/my-tickets?status=WAITING_FOR_REQUESTER");

    // Click Recent Resolved
    await userEvent.click(screen.getByTestId("drilldown-recent-resolved"));
    expect(mockNavigateTickets).toHaveBeenCalledWith("/my-tickets?status=RESOLVED&recent=true");

    // Click Closed
    await userEvent.click(screen.getByTestId("drilldown-closed"));
    expect(mockNavigateTickets).toHaveBeenCalledWith("/my-tickets?status=CLOSED");
  });

  it("renders recent tickets and allows navigating to ticket detail", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);
    const mockSelectTicket = vi.fn();

    render(<RequesterDashboard onSelectTicket={mockSelectTicket} />);

    await waitFor(() => {
      expect(screen.getByText("Broken Monitor Screen")).toBeInTheDocument();
    });

    expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
    expect(screen.getByText("VPN configuration issue")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("recent-ticket-row-101"));
    expect(mockSelectTicket).toHaveBeenCalledWith(101);
  });

  it("renders quick actions: [+] Create Ticket and [=] View My Tickets", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);
    const mockNavigateCreate = vi.fn();
    const mockNavigateTickets = vi.fn();

    render(
      <RequesterDashboard
        onNavigateCreate={mockNavigateCreate}
        onNavigateTickets={mockNavigateTickets}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("quick-create-ticket-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("quick-create-ticket-btn"));
    expect(mockNavigateCreate).toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("quick-view-tickets-btn"));
    expect(mockNavigateTickets).toHaveBeenCalledWith("/my-tickets");
  });

  it("handles empty zero-state gracefully without crashing", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue({
      summary: {
        totalOpen: 0,
        inProgress: 0,
        waitingForRequester: 0,
        recentlyResolved: 0,
        closed: 0,
      },
      recentTickets: [],
    });

    render(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("metric-open-tickets-count")).toHaveTextContent("0");
    });

    expect(screen.getByTestId("no-recent-tickets")).toBeInTheDocument();
  });

  it("renders safe error message and allows retry when API fails", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchRequesterDashboard")
      .mockRejectedValueOnce(new Error("Database connection timed out"))
      .mockResolvedValueOnce(mockDashboardData);

    render(<RequesterDashboard />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Database connection timed out");
    });

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByTestId("metric-open-tickets-count")).toHaveTextContent("4");
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
