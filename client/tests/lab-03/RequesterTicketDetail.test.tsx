import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import * as api from "../../src/api.js";

// Mock Auth Context with Requester Jennifer
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: { id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it", role: "REQUESTER" },
    isAuthenticated: true,
  }),
}));

// Mock Requester Context
vi.mock("../../src/context/RequesterContext.js", () => ({
  useRequester: () => ({
    currentRequester: { id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it", isActive: true },
  }),
}));

const mockTicketData = {
  id: 201,
  ticketNumber: "TKT-2026-REQ001",
  ticketDate: "2026-09-12T09:14:00.000Z",
  summary: "VPN access disconnected intermittently",
  description: "Cannot stay connected to the corporate VPN for more than 5 minutes.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  resolvedIndicated: false,
  category: { id: 3, name: "Network" },
  relatedSystem: { id: 4, name: "Corporate VPN" },
  requesterId: 5,
  attachments: [],
};

const mockComments = [
  {
    id: 1,
    ticketId: 201,
    content: "We pushed an update to the VPN concentrator. Please reconnect.",
    createdAt: "2026-09-12T10:00:00.000Z",
    author: { id: 2, name: "Alex Thompson", role: "IT_STAFF" as const, email: "alex.staff@toktickit.com" },
  },
  {
    id: 2,
    ticketId: 201,
    content: "Firewall rule has been verified by Administrator.",
    createdAt: "2026-09-12T10:15:00.000Z",
    author: { id: 1, name: "John Smith", role: "ADMINISTRATOR" as const, email: "admin@toktick.it" },
  },
];

describe("UI-08: Requester Ticket Detail Enhancements & Isolation", () => {
  const onBackMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketData);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue(mockComments);
    vi.spyOn(api, "indicateProblemResolved").mockResolvedValue({ id: 201, resolvedIndicated: true });
    vi.spyOn(api, "postPublicComment").mockResolvedValue({
      id: 3,
      ticketId: 201,
      content: "VPN is now working solidly. Thank you!",
      createdAt: new Date().toISOString(),
      author: { id: 5, name: "Jennifer Anderson", role: "REQUESTER", email: "jennifer@toktick.it" },
    });
  });

  it("renders public comments with correct author role badges (Admin, IT Staff, Requester) and allows posting", async () => {
    render(<RequesterTicketDetail ticketId={201} onBack={onBackMock} />);

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-REQ001")).toBeInTheDocument();
    });

    // Public Comments section is visible
    expect(screen.getByTestId("public-comments-section")).toBeInTheDocument();
    expect(screen.getByText(/Public Comments/i)).toBeInTheDocument();
    expect(screen.getByText("We pushed an update to the VPN concentrator. Please reconnect.")).toBeInTheDocument();

    // Verify correct role badges for IT Staff and Administrator
    expect(screen.getByText("Alex Thompson")).toBeInTheDocument();
    expect(screen.getByText("IT Staff")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();

    // Post new comment
    const input = screen.getByTestId("requester-comment-input");
    await userEvent.type(input, "VPN is now working solidly. Thank you!");
    await userEvent.click(screen.getByTestId("requester-comment-submit"));

    expect(api.postPublicComment).toHaveBeenCalledWith(201, "VPN is now working solidly. Thank you!");
    await waitFor(() => {
      expect(screen.getByText("VPN is now working solidly. Thank you!")).toBeInTheDocument();
      expect(screen.getByText("Requester")).toBeInTheDocument();
    });
  });

  it("renders 'Problem Appears Resolved' button and updates UI when clicked", async () => {
    render(<RequesterTicketDetail ticketId={201} onBack={onBackMock} />);

    await waitFor(() => {
      expect(screen.getByTestId("resolve-indicated-btn")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByTestId("resolve-indicated-btn");
    expect(resolveBtn).toHaveTextContent("Problem Appears Resolved");

    // Click resolve button
    await userEvent.click(resolveBtn);

    expect(api.indicateProblemResolved).toHaveBeenCalledWith(201);
    await waitFor(() => {
      expect(screen.getByTestId("resolved-indicated-badge")).toBeInTheDocument();
      expect(screen.getByText(/Problem Appears Resolved \(Pending Review\)/i)).toBeInTheDocument();
    });
  });

  it("strictly enforces zero leakage of Internal Notes on Requester View", async () => {
    render(<RequesterTicketDetail ticketId={201} onBack={onBackMock} />);

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-REQ001")).toBeInTheDocument();
    });

    // Verify there are no internal notes or private labels in the DOM
    expect(screen.queryByText(/Internal Notes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Private - Visible only to IT Staff/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("internal-note-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("internal-notes-tab")).not.toBeInTheDocument();
  });
});
