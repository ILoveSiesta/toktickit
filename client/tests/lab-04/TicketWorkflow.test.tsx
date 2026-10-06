import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import * as api from "../../src/api.js";
import { StaffTicketDetailData } from "../../src/types/index.js";

// Mock Auth Context for IT Staff
let mockAuthRole = "IT_STAFF";
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: {
      id: 2,
      name: "Alex Thompson",
      email: "alex.staff@toktickit.com",
      role: mockAuthRole,
    },
    isAuthenticated: true,
  }),
}));

// Mock Requester Context
vi.mock("../../src/context/RequesterContext.js", () => ({
  useRequester: () => ({
    currentRequester: { id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it" },
    requesters: [{ id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it" }],
  }),
}));

const baseMockTicket: StaffTicketDetailData = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  ticketDate: "2026-09-12T09:14:00.000Z",
  summary: "VPN connectivity fails after system restart",
  description: "Detailed description of VPN adapter failure.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  resolvedIndicated: true,
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 2, name: "Corporate VPN" },
  requester: { id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it", department: "Engineering" },
  ticketOwner: { id: 2, name: "Alex Thompson", email: "alex.staff@toktickit.com" },
  attachments: [],
  attachmentsCount: 0,
  commentsCount: 1,
  notesCount: 0,
  createdAt: "2026-09-12T09:14:00.000Z",
  updatedAt: "2026-09-12T10:30:00.000Z",
};

describe("Lab 4 Ticket Workflow & Resolution Gate Component Tests (FLOW-01 to FLOW-04, AC-06 to AC-09, AC-14)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuthRole = "IT_STAFF";
    vi.spyOn(api, "fetchStaffAssignees").mockResolvedValue([
      { id: 2, name: "Alex Thompson", email: "alex.staff@toktickit.com", role: "IT_STAFF" },
    ]);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);
  });

  describe("StaffTicketDetail Workflow Controls & Transition Matrix", () => {
    it("renders permitted transition options for IN_PROGRESS status (WAITING_FOR_REQUESTER, RESOLVED, CANCELLED)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "IN_PROGRESS",
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      const statusSelect = screen.getByTestId("ticket-status-select") as HTMLSelectElement;
      const options = Array.from(statusSelect.options).map((o) => o.value);

      expect(options).toContain("IN_PROGRESS");
      expect(options).toContain("WAITING_FOR_REQUESTER");
      expect(options).toContain("RESOLVED");
      expect(options).toContain("CANCELLED");

      // Forbidden jumps from IN_PROGRESS
      expect(options).not.toContain("NEW");
      expect(options).not.toContain("OPEN");
      expect(options).not.toContain("CLOSED");
      expect(options).not.toContain("REOPENED");
    });

    it("renders permitted transition options for RESOLVED status (CLOSED, REOPENED)", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "RESOLVED",
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      const statusSelect = screen.getByTestId("ticket-status-select") as HTMLSelectElement;
      const options = Array.from(statusSelect.options).map((o) => o.value);

      expect(options).toContain("RESOLVED");
      expect(options).toContain("CLOSED");
      expect(options).toContain("REOPENED");

      // Forbidden jumps from RESOLVED
      expect(options).not.toContain("OPEN");
      expect(options).not.toContain("IN_PROGRESS");
      expect(options).not.toContain("CANCELLED");
    });

    it("disables select and displays terminal status notice for CLOSED ticket", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "CLOSED",
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      const statusSelect = screen.getByTestId("ticket-status-select");
      expect(statusSelect).toBeDisabled();
      expect(screen.getByText(/Terminal status — no further status transitions permitted/i)).toBeInTheDocument();
    });
  });

  describe("Resolution Advisory Banner (BR-09, FLOW-03, AC-08)", () => {
    it("displays advisory banner when requester indicated problem appears resolved", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        resolvedIndicated: true,
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("resolution-advisory-banner")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/The requester indicated that this problem appears resolved/i)
      ).toBeInTheDocument();
    });

    it("does not render advisory banner when resolvedIndicated is false", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        resolvedIndicated: false,
      });

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("resolution-advisory-banner")).not.toBeInTheDocument();
    });
  });

  describe("Resolution Gate Enforcement & Concurrency Conflict in UI (FLOW-04, API-04, AC-14)", () => {
    it("displays error alert when backend rejects transition due to Resolution Prerequisites failure", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "IN_PROGRESS",
      });

      // Mock backend rejection with 400 Bad Request
      const prerequisiteError: any = new Error(
        "Cannot transition to RESOLVED: ticket must have an assigned ticket owner and at least one recorded action taken."
      );
      prerequisiteError.code = "RESOLUTION_PREREQUISITE_FAILED";
      prerequisiteError.status = 400;
      vi.spyOn(api, "updateTicketStatus").mockRejectedValue(prerequisiteError);

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      const statusSelect = screen.getByTestId("ticket-status-select");
      await userEvent.selectOptions(statusSelect, "RESOLVED");

      await waitFor(() => {
        const errorAlert = screen.getByTestId("staff-detail-error-alert");
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/at least one recorded action taken/i);
      });
    });

    it("displays error alert when backend returns 409 Conflict for Stale Update", async () => {
      vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "IN_PROGRESS",
      });

      const conflictError: any = new Error(
        "The ticket has been modified by another user. Please refresh and try again."
      );
      conflictError.code = "STALE_UPDATE_CONFLICT";
      conflictError.status = 409;
      vi.spyOn(api, "updateTicketStatus").mockRejectedValue(conflictError);

      render(<StaffTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      const statusSelect = screen.getByTestId("ticket-status-select");
      await userEvent.selectOptions(statusSelect, "WAITING_FOR_REQUESTER");

      await waitFor(() => {
        const errorAlert = screen.getByTestId("staff-detail-error-alert");
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/modified by another user/i);
      });
    });
  });

  describe("Requester Ticket Detail Workflow & Cancellation (BR-08)", () => {
    it("renders Cancel Ticket button when requester ticket is in NEW status and handles cancellation", async () => {
      vi.spyOn(api, "fetchTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "NEW",
        resolvedIndicated: false,
      });

      const updateSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
        id: 101,
        currentStatus: "CANCELLED",
      });

      // Mock window.confirm
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<RequesterTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("requester-cancel-ticket-btn")).toBeInTheDocument();
      });

      const cancelBtn = screen.getByTestId("requester-cancel-ticket-btn");
      await userEvent.click(cancelBtn);

      expect(updateSpy).toHaveBeenCalledWith(101, "CANCELLED", baseMockTicket.updatedAt);
    });

    it("hides Cancel Ticket button and shows Problem Appears Resolved button when status is IN_PROGRESS", async () => {
      vi.spyOn(api, "fetchTicketDetail").mockResolvedValue({
        ...baseMockTicket,
        currentStatus: "IN_PROGRESS",
        resolvedIndicated: false,
      });

      render(<RequesterTicketDetail ticketId={101} onBack={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("resolve-indicated-btn")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("requester-cancel-ticket-btn")).not.toBeInTheDocument();
    });
  });
});
