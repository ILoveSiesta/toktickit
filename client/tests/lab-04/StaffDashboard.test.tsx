import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffDashboard } from "../../src/components/Dashboards/StaffDashboard.js";
import * as api from "../../src/api.js";
import { StaffDashboardData } from "../../src/types/index.js";

let mockUserRole = "IT_STAFF";
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: {
      id: 2,
      name: "Alex Thompson",
      email: "alex.staff@toktickit.com",
      role: mockUserRole,
    },
    isAuthenticated: true,
  }),
}));

const mockStaffDashboardData: StaffDashboardData = {
  summary: {
    unassigned: 12,
    new: 14,
    open: 23,
    inProgress: 18,
    waitingForRequester: 7,
    myAssigned: 16,
    resolved: 35,
    closed: 50,
  },
  trends: {
    unassigned: "+3",
    new: "+2",
    open: "-1",
    inProgress: "+4",
    waitingForRequester: "0",
    myAssigned: "+1",
  },
  byPriority: {
    CRITICAL: 3,
    HIGH: 8,
    MEDIUM: 25,
    LOW: 19,
  },
  recentTickets: [
    {
      id: 25,
      ticketNumber: "TKT-2026-001234",
      summary: "Laptop battery drains quickly",
      status: "IN_PROGRESS",
      itPriority: "HIGH",
      ownerId: 2,
      ownerName: "Michael Chang",
      updatedAt: "2026-10-06T09:14:00.000Z",
    },
    {
      id: 24,
      ticketNumber: "TKT-2026-001230",
      summary: "Printer offline on 4th floor",
      status: "OPEN",
      itPriority: "MEDIUM",
      ownerId: null,
      ownerName: null,
      updatedAt: "2026-10-06T08:12:00.000Z",
    },
  ],
  adminSummary: {
    totalUsers: 9,
    activeUsers: 7,
    requestersCount: 5,
    staffCount: 3,
    adminCount: 1,
  },
};

describe("COMP-04: Staff Dashboard Component Tests (FR-13, FR-15, Strict Role Isolation)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUserRole = "IT_STAFF";
  });

  it("renders 6 operational metric cards with counts and trends", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("staff-welcome")).toHaveTextContent("Alex Thompson");
    });

    // 1. Unassigned
    expect(screen.getByTestId("metric-unassigned-count")).toHaveTextContent("12");
    expect(screen.getByTestId("metric-unassigned-trend")).toHaveTextContent("+3 yest");

    // 2. New
    expect(screen.getByTestId("metric-new-count")).toHaveTextContent("14");
    expect(screen.getByTestId("metric-new-trend")).toHaveTextContent("+2 yest");

    // 3. Open
    expect(screen.getByTestId("metric-open-count")).toHaveTextContent("23");
    expect(screen.getByTestId("metric-open-trend")).toHaveTextContent("-1 yest");

    // 4. In Progress
    expect(screen.getByTestId("metric-in-progress-count")).toHaveTextContent("18");
    expect(screen.getByTestId("metric-in-progress-trend")).toHaveTextContent("+4 yest");

    // 5. Waiting Req
    expect(screen.getByTestId("metric-waiting-requester-count")).toHaveTextContent("7");
    expect(screen.getByTestId("metric-waiting-requester-trend")).toHaveTextContent("0 yest");

    // 6. My Assigned
    expect(screen.getByTestId("metric-my-assigned-count")).toHaveTextContent("16");
    expect(screen.getByTestId("metric-my-assigned-trend")).toHaveTextContent("+1 yest");
  });

  it("navigates with correct drill-down filter parameters when clicking metric cards or view buttons", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);
    const mockNavigateQueue = vi.fn();

    render(<StaffDashboard onNavigateQueue={mockNavigateQueue} />);

    await waitFor(() => {
      expect(screen.getByTestId("metric-unassigned-count")).toBeInTheDocument();
    });

    // Drilldown Unassigned
    await userEvent.click(screen.getByTestId("drilldown-unassigned"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/tickets?assigned=unassigned");

    // Drilldown New
    await userEvent.click(screen.getByTestId("drilldown-new"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/tickets?status=NEW");

    // Drilldown Open
    await userEvent.click(screen.getByTestId("drilldown-open"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/tickets?status=OPEN");

    // Drilldown In Progress
    await userEvent.click(screen.getByTestId("drilldown-in-progress"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/tickets?status=IN_PROGRESS");

    // Drilldown Waiting Req
    await userEvent.click(screen.getByTestId("drilldown-waiting-requester"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/tickets?status=WAITING_FOR_REQUESTER");

    // Drilldown My Assigned
    await userEvent.click(screen.getByTestId("drilldown-my-assigned"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/tickets?assigned=me");
  });

  it("CRITICAL ROLE ISOLATION: strictly contains NO 'Create Ticket' button anywhere on Staff Dashboard", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("staff-welcome")).toBeInTheDocument();
    });

    expect(screen.queryByText(/create ticket/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("quick-create-ticket-btn")).not.toBeInTheDocument();
  });

  it("renders Quick Actions: Search Tickets, My Queue, and View Unassigned", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);
    const mockNavigateQueue = vi.fn();

    render(<StaffDashboard onNavigateQueue={mockNavigateQueue} />);

    await waitFor(() => {
      expect(screen.getByTestId("quick-search-tickets-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("quick-search-tickets-btn"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/queue?focus=search");

    await userEvent.click(screen.getByTestId("quick-my-queue-btn"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/queue?assigned=me");

    await userEvent.click(screen.getByTestId("quick-view-unassigned-btn"));
    expect(mockNavigateQueue).toHaveBeenCalledWith("/queue?assigned=unassigned");
  });

  it("renders Priority Distribution statistics correctly", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("priority-distribution-box")).toBeInTheDocument();
    });

    expect(screen.getByTestId("priority-critical-count")).toHaveTextContent("3");
    expect(screen.getByTestId("priority-high-count")).toHaveTextContent("8");
    expect(screen.getByTestId("priority-medium-count")).toHaveTextContent("25");
    expect(screen.getByTestId("priority-low-count")).toHaveTextContent("19");
  });

  it("renders Recent Tickets and allows selecting a ticket row", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);
    const mockSelectTicket = vi.fn();

    render(<StaffDashboard onSelectTicket={mockSelectTicket} />);

    await waitFor(() => {
      expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    });

    expect(screen.getByText("TKT-2026-001234")).toBeInTheDocument();
    expect(screen.getByText("Printer offline on 4th floor")).toBeInTheDocument();
    expect(screen.getByText("• Michael Chang")).toBeInTheDocument();
    expect(screen.getByText("• Unassigned")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("staff-recent-ticket-row-25"));
    expect(mockSelectTicket).toHaveBeenCalledWith(25);
  });

  it("renders Administrator User Accounts Overview when logged in as ADMINISTRATOR", async () => {
    mockUserRole = "ADMINISTRATOR";
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-summary-box")).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-total-users")).toHaveTextContent("9");
    expect(screen.getByTestId("admin-active-users")).toHaveTextContent("7");
  });

  it("refreshes data when clicking the Refresh Data button", async () => {
    const fetchSpy = vi
      .spyOn(api, "fetchStaffDashboard")
      .mockResolvedValue(mockStaffDashboardData);

    render(<StaffDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("refresh-dashboard-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("refresh-dashboard-btn"));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
