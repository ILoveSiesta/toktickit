import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionsTakenSection } from "../../src/components/ActionsTaken/ActionsTakenSection.js";
import { ActionTakenModal } from "../../src/components/ActionsTaken/ActionTakenModal.js";
import * as api from "../../src/api.js";
import { ActionTaken, AuthUser } from "../../src/types/index.js";

// Mock Data
const mockStaffUser: AuthUser = {
  id: 2,
  name: "Alex Thompson",
  email: "alex.staff@toktickit.com",
  role: "IT_STAFF",
  mustChangePassword: false,
};

const mockAdminUser: AuthUser = {
  id: 1,
  name: "System Admin",
  email: "admin@toktickit.com",
  role: "ADMINISTRATOR",
  mustChangePassword: false,
};

const mockRequesterUser: AuthUser = {
  id: 5,
  name: "Jennifer Anderson",
  email: "jennifer@toktick.it",
  role: "REQUESTER",
  mustChangePassword: false,
};

const mockActions: ActionTaken[] = [
  {
    id: 10,
    ticketId: 101,
    actionDateTime: "2026-10-04T10:30:00.000Z",
    actionDescription: "Replaced PSU capacitor and ran thermal stress tests.",
    result: "System booted normally; voltage rails within nominal 12V range.",
    performedById: 2,
    performedBy: {
      id: 2,
      name: "Alex Thompson",
      email: "alex.staff@toktickit.com",
      role: "IT_STAFF",
    },
    followUpRequired: true,
    followUpNote: "Check thermals after 24 hours under load.",
    attachmentNotes: "psu_diag_log.txt",
    createdAt: "2026-10-04T10:30:00.000Z",
    updatedAt: "2026-10-04T10:30:00.000Z",
  },
  {
    id: 9,
    ticketId: 101,
    actionDateTime: "2026-10-04T09:15:00.000Z",
    actionDescription: "Initial multimeter measurement of power rails.",
    result: "Detected irregular 12V rail drop to 10.4V during boot.",
    performedById: 3,
    performedBy: {
      id: 3,
      name: "David Miller",
      email: "david.staff@toktickit.com",
      role: "IT_STAFF",
    },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-10-04T09:15:00.000Z",
    updatedAt: "2026-10-04T09:15:00.000Z",
  },
];

describe("COMP-01, COMP-02, AUTH-01, AUTH-02: ActionsTakenSection & Modal Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    vi.spyOn(api, "createActionTaken").mockResolvedValue({
      id: 11,
      ticketId: 101,
      actionDateTime: "2026-10-05T08:00:00.000Z",
      actionDescription: "Installed new firmware v1.15.",
      result: "Update applied cleanly.",
      performedById: 2,
      performedBy: {
        id: 2,
        name: "Alex Thompson",
        email: "alex.staff@toktickit.com",
        role: "IT_STAFF",
      },
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: "2026-10-05T08:00:00.000Z",
      updatedAt: "2026-10-05T08:00:00.000Z",
    });
    vi.spyOn(api, "updateActionTaken").mockResolvedValue({
      ...mockActions[0],
      actionDescription: "Updated PSU capacitor description.",
    });
  });

  // 1. Render test for IT Staff
  it("renders actions taken table with stable ordering, columns, performer role badge, and edit buttons for IT Staff", async () => {
    render(<ActionsTakenSection ticketId={101} currentUser={mockStaffUser} isReadOnly={false} />);

    // Wait for actions to load
    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-table")).toBeInTheDocument();
    });

    // Check count badge
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2 Records");

    // Check Add Action button is visible to staff
    expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();

    // Check action rows render in descending order (ID 10 first, then ID 9)
    const row10 = screen.getByTestId("action-row-10");
    const row9 = screen.getByTestId("action-row-9");
    expect(row10).toBeInTheDocument();
    expect(row9).toBeInTheDocument();
    expect(row10).toHaveTextContent("Replaced PSU capacitor and ran thermal stress tests.");
    expect(row10).toHaveTextContent("Alex Thompson");
    expect(row10).toHaveTextContent("IT Staff");
    expect(row10).toHaveTextContent("Follow-up Required");
    expect(row10).toHaveTextContent("Note: Check thermals after 24 hours under load.");
    expect(row10).toHaveTextContent("psu_diag_log.txt");

    // Check Edit button is visible for staff
    expect(screen.getByTestId("edit-action-btn-10")).toBeInTheDocument();
    expect(screen.getByTestId("edit-action-btn-9")).toBeInTheDocument();
  });

  // 2. Role Isolation test for Requester (Read-Only)
  it("renders read-only view for Requester: hides '+ Add Action Taken' and 'Edit' buttons", async () => {
    render(<ActionsTakenSection ticketId={101} currentUser={mockRequesterUser} isReadOnly={true} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-table")).toBeInTheDocument();
    });

    // Add button must NOT be in document
    expect(screen.queryByTestId("add-action-btn")).not.toBeInTheDocument();

    // Edit buttons must NOT be in document
    expect(screen.queryByTestId("edit-action-btn-10")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-btn-9")).not.toBeInTheDocument();

    // Data should still be visible in read-only mode in table
    const table = screen.getByTestId("actions-taken-table");
    expect(within(table).getByText("Replaced PSU capacitor and ran thermal stress tests.")).toBeInTheDocument();
    expect(within(table).getByText("Initial multimeter measurement of power rails.")).toBeInTheDocument();
  });

  // 3. Empty State test for Staff vs Requester
  it("renders appropriate empty state for IT Staff and Requester when no actions are recorded", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue([]);

    // Test for Staff
    const { rerender } = render(
      <ActionsTakenSection ticketId={101} currentUser={mockStaffUser} isReadOnly={false} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-empty-staff")).toBeInTheDocument();
    });
    expect(screen.getByTestId("actions-empty-staff")).toHaveTextContent(
      "Click '+ Add Action Taken' to log technical steps"
    );

    // Test for Requester
    rerender(<ActionsTakenSection ticketId={101} currentUser={mockRequesterUser} isReadOnly={true} />);
    await waitFor(() => {
      expect(screen.getByTestId("actions-empty-requester")).toBeInTheDocument();
    });
    expect(screen.getByTestId("actions-empty-requester")).toHaveTextContent(
      "Technical steps and troubleshooting notes recorded by IT Staff will appear here"
    );
  });

  // 4. Form Validation & Mandatory Follow-up Note
  it("validates required fields and enforces followUpNote when followUpRequired is checked", async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ActionTakenModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        currentUser={mockStaffUser}
      />
    );

    expect(screen.getByText("Record Action Taken")).toBeInTheDocument();
    // Auto-assigned performer displayed as disabled
    const performerInput = screen.getByTestId("action-performer-input");
    expect(performerInput).toBeDisabled();
    expect(performerInput).toHaveValue("Alex Thompson (IT Staff)");

    // Attempt to submit empty form
    const saveBtn = screen.getByTestId("save-action-btn");
    await user.click(saveBtn);

    // Verify inline errors appear and onSubmit is not called
    expect(screen.getByTestId("action-description-error")).toHaveTextContent("Action description is required.");
    expect(screen.getByTestId("action-result-error")).toHaveTextContent("Result of action is required.");
    expect(onSubmitMock).not.toHaveBeenCalled();

    // Fill description and result
    const descInput = screen.getByTestId("action-description-input");
    const resultInput = screen.getByTestId("action-result-input");
    await user.type(descInput, "Cleaned heatsink dust filters.");
    await user.type(resultInput, "Airflow restored to normal.");

    // Toggle followUpRequired = true
    const followUpCheckbox = screen.getByTestId("follow-up-checkbox");
    await user.click(followUpCheckbox);
    expect(followUpCheckbox).toBeChecked();

    // Check that followUpNote input appears
    expect(screen.getByTestId("follow-up-note-input")).toBeInTheDocument();

    // Submit with empty followUpNote
    await user.click(saveBtn);
    expect(screen.getByTestId("follow-up-note-error")).toHaveTextContent(
      "Follow-up note is required when follow-up is requested."
    );
    expect(onSubmitMock).not.toHaveBeenCalled();

    // Provide followUpNote
    const followUpNoteInput = screen.getByTestId("follow-up-note-input");
    await user.type(followUpNoteInput, "Re-check thermal profile after 48h.");

    // Submit valid form
    await user.click(saveBtn);
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          actionDescription: "Cleaned heatsink dust filters.",
          result: "Airflow restored to normal.",
          followUpRequired: true,
          followUpNote: "Re-check thermal profile after 48h.",
        })
      );
    });
    expect(onCloseMock).toHaveBeenCalled();
  });

  // 5. Safe Failure: preserves form input when API call fails
  it("preserves form inputs (Safe Failure) when API returns an error during submission", async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn().mockRejectedValue(new Error("Database connection lost. Please retry."));
    const onCloseMock = vi.fn();

    render(
      <ActionTakenModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        currentUser={mockStaffUser}
      />
    );

    const descInput = screen.getByTestId("action-description-input");
    const resultInput = screen.getByTestId("action-result-input");
    await user.type(descInput, "Diagnosed faulty capacitor.");
    await user.type(resultInput, "Resistance reads 0 ohms.");

    const saveBtn = screen.getByTestId("save-action-btn");
    await user.click(saveBtn);

    // Expect server error alert to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("action-form-error")).toHaveTextContent(
        "Database connection lost. Please retry."
      );
    });

    // Ensure form fields are NOT cleared (Safe Failure)
    expect(descInput).toHaveValue("Diagnosed faulty capacitor.");
    expect(resultInput).toHaveValue("Resistance reads 0 ohms.");
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  // 6. Edit Mode test
  it("pre-fills existing data in Edit mode and submits with expectedUpdatedAt for optimistic concurrency", async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ActionTakenModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        initialData={mockActions[0]}
        currentUser={mockStaffUser}
      />
    );

    expect(screen.getByText("Edit Action Taken")).toBeInTheDocument();
    const descInput = screen.getByTestId("action-description-input");
    expect(descInput).toHaveValue("Replaced PSU capacitor and ran thermal stress tests.");

    // Modify description
    await user.clear(descInput);
    await user.type(descInput, "Updated: Replaced secondary electrolytic capacitors.");

    const saveBtn = screen.getByTestId("save-action-btn");
    await user.click(saveBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          actionDescription: "Updated: Replaced secondary electrolytic capacitors.",
          expectedUpdatedAt: mockActions[0].updatedAt,
        })
      );
    });
  });

  // 7. Full Integration: Add and Edit triggers modal from Section component
  it("opens create modal on clicking '+ Add Action Taken', saves, and displays success notification", async () => {
    const user = userEvent.setup();
    render(<ActionsTakenSection ticketId={101} currentUser={mockStaffUser} isReadOnly={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    // Click Add Action Taken
    await user.click(screen.getByTestId("add-action-btn"));
    expect(screen.getByText("Record Action Taken")).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByTestId("action-description-input"), "Tested network throughput.");
    await user.type(screen.getByTestId("action-result-input"), "950 Mbps sustained.");
    await user.click(screen.getByTestId("save-action-btn"));

    await waitFor(() => {
      expect(api.createActionTaken).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          actionDescription: "Tested network throughput.",
          result: "950 Mbps sustained.",
        })
      );
    });

    // Success banner is shown
    await waitFor(() => {
      expect(screen.getByTestId("action-success-alert")).toHaveTextContent(
        "Action taken recorded successfully."
      );
    });
  });
});
