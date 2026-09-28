import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import { StaffTicketDetailData, TicketComment, InternalNote } from "../../src/types/index.js";

// Mock Auth Context
vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: { id: 2, name: "Alex Thompson", email: "alex.staff@toktickit.com", role: "IT_STAFF" },
    isAuthenticated: true,
  }),
}));

const mockTicket: StaffTicketDetailData = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  ticketDate: "2026-09-12T09:14:00.000Z",
  summary: "Laptop battery drains quickly after Windows update",
  description: "Detailed description of the battery discharging in under 30 minutes.",
  requestedPriority: "HIGH",
  itPriority: "MEDIUM",
  currentStatus: "OPEN",
  resolvedIndicated: true,
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 2, name: "Windows Workstations" },
  requester: { id: 5, name: "Jennifer Anderson", email: "jennifer@toktick.it", department: "Engineering" },
  ticketOwner: { id: 2, name: "Alex Thompson", email: "alex.staff@toktickit.com" },
  attachments: [],
  attachmentsCount: 0,
  commentsCount: 1,
  notesCount: 1,
  createdAt: "2026-09-12T09:14:00.000Z",
  updatedAt: "2026-09-12T10:30:00.000Z",
};

const mockAssignees = [
  { id: 2, name: "Alex Thompson", email: "alex.staff@toktickit.com", role: "IT_STAFF" as const },
  { id: 3, name: "Lisa Wong", email: "lisa.staff@toktickit.com", role: "IT_STAFF" as const },
  { id: 1, name: "Administrator", email: "admin@toktickit.com", role: "ADMINISTRATOR" as const },
];

const mockComments: TicketComment[] = [
  {
    id: 1,
    ticketId: 101,
    content: "Please check battery health report from powercfg.",
    createdAt: "2026-09-12T09:20:00.000Z",
    author: { id: 2, name: "Alex Thompson", role: "IT_STAFF", email: "alex.staff@toktickit.com" },
  },
];

const mockNotes: InternalNote[] = [
  {
    id: 1,
    ticketId: 101,
    content: "Suspect BIOS firmware regression in v1.14 update.",
    createdAt: "2026-09-12T09:25:00.000Z",
    author: { id: 2, name: "Alex Thompson", role: "IT_STAFF", email: "alex.staff@toktickit.com" },
  },
];

describe("UI-04 & UI-05: StaffTicketDetail Component Tests", () => {
  const onBackMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "fetchStaffAssignees").mockResolvedValue(mockAssignees);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue(mockComments);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue(mockNotes);
    vi.spyOn(api, "updateTicketAssignment").mockResolvedValue({
      id: 101,
      ticketOwnerId: 3,
      ticketOwner: { id: 3, name: "Lisa Wong" },
    });
    vi.spyOn(api, "updateTicketPriority").mockResolvedValue({ id: 101, itPriority: "CRITICAL" });
    vi.spyOn(api, "updateTicketStatus").mockResolvedValue({ id: 101, currentStatus: "IN_PROGRESS" });
    vi.spyOn(api, "postPublicComment").mockResolvedValue({
      id: 2,
      ticketId: 101,
      content: "We have shipped a replacement battery to your office.",
      createdAt: new Date().toISOString(),
      author: { id: 2, name: "Alex Thompson", role: "IT_STAFF", email: "alex.staff@toktickit.com" },
    });
    vi.spyOn(api, "postInternalNote").mockResolvedValue({
      id: 2,
      ticketId: 101,
      content: "RMA ticket RMA-9874 opened with vendor.",
      createdAt: new Date().toISOString(),
      author: { id: 2, name: "Alex Thompson", role: "IT_STAFF", email: "alex.staff@toktickit.com" },
    });
  });

  describe("UI-04: Operational Controls & Status Transition Matrix", () => {
    it("renders ticket header, metadata, and requester resolution indication alert", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      // Verify read-only fields
      expect(screen.getByText("Laptop battery drains quickly after Windows update")).toBeInTheDocument();
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Windows Workstations")).toBeInTheDocument();

      // Verify requester resolution indication banner
      expect(screen.getByText(/Requester Indication:/i)).toBeInTheDocument();
      expect(screen.getByText(/problem appears resolved/i)).toBeInTheDocument();
    });

    it("allows reassigning ticket owner via Owner dropdown", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-owner-select")).toBeInTheDocument();
      });

      const ownerSelect = screen.getByTestId("ticket-owner-select") as HTMLSelectElement;
      expect(ownerSelect.value).toBe("2");

      // Change owner to Lisa Wong (id: 3)
      await userEvent.selectOptions(ownerSelect, "3");

      expect(api.updateTicketAssignment).toHaveBeenCalledWith(101, 3);
      await waitFor(() => {
        expect(screen.getByText("Ticket owner updated successfully.")).toBeInTheDocument();
      });
    });

    it("allows updating IT Priority via dropdown", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

      await waitFor(() => {
        expect(screen.getByTestId("it-priority-select")).toBeInTheDocument();
      });

      const prioritySelect = screen.getByTestId("it-priority-select") as HTMLSelectElement;
      expect(prioritySelect.value).toBe("MEDIUM");

      // Change priority to CRITICAL
      await userEvent.selectOptions(prioritySelect, "CRITICAL");

      expect(api.updateTicketPriority).toHaveBeenCalledWith(101, "CRITICAL");
      await waitFor(() => {
        expect(screen.getByText("IT Priority updated to CRITICAL.")).toBeInTheDocument();
      });
    });

    it("restricts status dropdown options according to Permitted Transition Matrix", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-status-select")).toBeInTheDocument();
      });

      const statusSelect = screen.getByTestId("ticket-status-select") as HTMLSelectElement;

      // Current status is OPEN. Permitted from OPEN: IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
      const optionValues = Array.from(statusSelect.options).map((opt) => opt.value);
      expect(optionValues).toContain("OPEN");
      expect(optionValues).toContain("IN_PROGRESS");
      expect(optionValues).toContain("WAITING_FOR_REQUESTER");
      expect(optionValues).toContain("RESOLVED");
      expect(optionValues).toContain("CANCELLED");

      // Forbidden jumps: CLOSED, REOPENED, NEW
      expect(optionValues).not.toContain("CLOSED");
      expect(optionValues).not.toContain("REOPENED");
      expect(optionValues).not.toContain("NEW");

      // Transition to IN_PROGRESS
      await userEvent.selectOptions(statusSelect, "IN_PROGRESS");
      expect(api.updateTicketStatus).toHaveBeenCalledWith(101, "IN_PROGRESS");
      await waitFor(() => {
        expect(screen.getByText("Ticket status transitioned to IN_PROGRESS.")).toBeInTheDocument();
      });
    });
  });

  describe("UI-05: Public Comments vs Internal Notes Isolation", () => {
    it("renders Public Comments tab by default with comments list and post form", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

      await waitFor(() => {
        expect(screen.getByTestId("public-comments-tab")).toBeInTheDocument();
      });

      // Public comment from Alex is rendered
      expect(screen.getByText("Please check battery health report from powercfg.")).toBeInTheDocument();

      // Post new comment
      const input = screen.getByTestId("public-comment-input");
      await userEvent.type(input, "We have shipped a replacement battery to your office.");
      await userEvent.click(screen.getByTestId("post-comment-btn"));

      expect(api.postPublicComment).toHaveBeenCalledWith(
        101,
        "We have shipped a replacement battery to your office."
      );

      await waitFor(() => {
        expect(screen.getByText("We have shipped a replacement battery to your office.")).toBeInTheDocument();
      });
    });

    it("switches to Internal Notes tab with Amber theme and private warning banner", async () => {
      render(<StaffTicketDetail ticketId={101} onBack={onBackMock} />);

      await waitFor(() => {
        expect(screen.getByTestId("internal-notes-tab")).toBeInTheDocument();
      });

      // Switch to Notes tab
      await userEvent.click(screen.getByTestId("internal-notes-tab"));

      // Verify Amber Warning Banner
      expect(
        screen.getByText(/Private - Visible only to IT Staff and Administrators/i)
      ).toBeInTheDocument();

      // Existing internal note is rendered
      expect(screen.getByText("Suspect BIOS firmware regression in v1.14 update.")).toBeInTheDocument();

      // Post internal note
      const input = screen.getByTestId("internal-note-input");
      await userEvent.type(input, "RMA ticket RMA-9874 opened with vendor.");
      await userEvent.click(screen.getByTestId("post-note-btn"));

      expect(api.postInternalNote).toHaveBeenCalledWith(
        101,
        "RMA ticket RMA-9874 opened with vendor."
      );

      await waitFor(() => {
        expect(screen.getByText("RMA ticket RMA-9874 opened with vendor.")).toBeInTheDocument();
      });
    });
  });
});
