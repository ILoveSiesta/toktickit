import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockTicketDetail = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "VPN Connection Timeout Issue",
  description: "Cannot connect to VPN from home office.",
  requestedPriority: "HIGH",
  itPriority: "CRITICAL",
  currentStatus: "IN_PROGRESS",
  ticketOwner: "John IT",
  ticketDate: "2026-08-30T10:00:00.000Z",
  createdAt: "2026-08-30T10:00:00.000Z",
  requesterId: 1,
  categoryId: 4,
  relatedSystemId: 3,
  category: { id: 4, name: "Network" },
  relatedSystem: { id: 3, name: "VPN" },
  requester: { id: 1, name: "Jennifer Anderson", email: "jennifer@toktick.it" },
  attachments: [
    {
      id: 10,
      originalFileName: "network_error.png",
      storageFileName: "file_10.png",
      fileSize: 102400,
      fileType: "image/png",
      isRemoved: false,
      uploadedAt: "2026-08-30T10:00:00.000Z",
    },
  ],
};

describe("UI-06, UI-07, UI-09: RequesterTicketDetail Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Jennifer Anderson", email: "jennifer@toktick.it", isActive: true })
    );

    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketDetail);
  });

  it("UI-06: renders ticket details in Read-only view and displays IT Priority badge", async () => {
    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000001")).toBeInTheDocument();
      expect(screen.getByText("VPN Connection Timeout Issue")).toBeInTheDocument();
      expect(screen.getByText("Cannot connect to VPN from home office.")).toBeInTheDocument();
      expect(screen.getByTestId("readonly-summary")).toBeInTheDocument();
      expect(screen.getByTestId("readonly-description")).toBeInTheDocument();
      expect(screen.getByTestId("it-priority-badge")).toBeInTheDocument();
      expect(screen.getByTestId("it-priority-badge")).toHaveTextContent(/IT Priority: CRITICAL/i);
    });
  });

  it("UI-07: opens soft removal modal, requires reason >= 3 chars, and confirms removal", async () => {
    const removeSpy = vi.spyOn(api, "removeAttachment").mockResolvedValue({
      id: 10,
      ticketId: 1,
      isRemoved: true,
      removalReason: "Uploaded wrong file",
    });

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("network_error.png")).toBeInTheDocument();
    });

    // Click remove button on attachment
    const removeBtn = screen.getByTestId("remove-attachment-10-btn");
    await userEvent.click(removeBtn);

    // Modal appears
    expect(screen.getByTestId("removal-modal")).toBeInTheDocument();

    const confirmBtn = screen.getByTestId("confirm-removal-btn");
    // Initially confirm should be disabled until reason of >= 3 chars is entered
    expect(confirmBtn).toBeDisabled();

    // Type 2 chars (too short)
    const reasonInput = screen.getByTestId("removal-reason-input");
    await userEvent.type(reasonInput, "ab");
    expect(confirmBtn).toBeDisabled();

    // Type full reason
    await userEvent.type(reasonInput, "Uploaded wrong file");

    expect(confirmBtn).not.toBeDisabled();
    await userEvent.click(confirmBtn);

    expect(removeSpy).toHaveBeenCalledWith(10, "abUploaded wrong file", 1);
  });

  it("UI-09: allows uploading additional attachments when under limit", async () => {
    vi.spyOn(api, "uploadTicketAttachments").mockResolvedValue([
      {
        id: 11,
        ticketId: 1,
        originalFileName: "new_file.pdf",
        storageFileName: "file_11.pdf",
        fileSize: 204800,
        fileType: "application/pdf",
        isRemoved: false,
        uploadedAt: "2026-08-30T10:05:00.000Z",
      },
    ]);

    render(
      <RequesterProvider>
        <RequesterTicketDetail ticketId={1} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("add-attachment-input")).toBeInTheDocument();
    });
  });
});
