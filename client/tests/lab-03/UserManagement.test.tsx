import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserManagement } from "../../src/components/UserManagement.js";
import { AppHeader } from "../../src/components/AppHeader.js";
import { AuthContext } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";
import { AdminUser } from "../../src/types/index.js";

const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: "John Smith",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR",
    department: "IT Leadership",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: 2,
    name: "Michael Brown",
    email: "michael.brown@toktickit.com",
    role: "IT_STAFF",
    department: "Network Support",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: 3,
    name: "Jennifer Anderson",
    email: "jennifer@toktick.it",
    role: "REQUESTER",
    department: "Marketing",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: 4,
    name: "Kevin Patel",
    email: "kevin.patel@toktickit.com",
    role: "IT_STAFF",
    department: "Hardware",
    isActive: false,
    mustChangePassword: false,
    createdAt: "2026-09-01T08:00:00.000Z",
  },
];

describe("UI-06 & UI-07: UserManagement Component Tests", () => {
  const currentAdmin = {
    id: 1,
    name: "John Smith",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR" as const,
    mustChangePassword: false,
  };

  const mockAuthValue: any = {
    user: currentAdmin,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue(mockUsers);
  });

  // UI-06: User list rendering, search, filters, modals
  it("UI-06: renders user list with Name, Email, Role, and Status badges", async () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    // Verify Title
    expect(screen.getByRole("heading", { name: /Users/i })).toBeInTheDocument();

    // Verify users are rendered
    await waitFor(() => {
      expect(screen.getByTestId("user-name-1")).toHaveTextContent("John Smith");
      expect(screen.getByTestId("user-role-1")).toHaveTextContent("Administrator");
      expect(screen.getByTestId("user-status-1")).toHaveTextContent("Active");

      expect(screen.getByTestId("user-name-2")).toHaveTextContent("Michael Brown");
      expect(screen.getByTestId("user-role-2")).toHaveTextContent("IT Staff");

      expect(screen.getByTestId("user-name-4")).toHaveTextContent("Kevin Patel");
      expect(screen.getByTestId("user-status-4")).toHaveTextContent("Inactive");
    });
  });

  it("UI-06: searches users and filters by role", async () => {
    const fetchSpy = vi.spyOn(api, "fetchAdminUsers");

    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name-1")).toBeInTheDocument();
    });

    // 1. Type in search input
    const searchInput = screen.getByTestId("user-search-input");
    await userEvent.type(searchInput, "Jennifer");

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Jennifer" })
      );
    });

    // 2. Select Role filter
    const roleSelect = screen.getByTestId("role-filter-select");
    await userEvent.selectOptions(roleSelect, "IT_STAFF");

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ role: "IT_STAFF" })
      );
    });
  });

  it("UI-06: opens Create User modal and submits new user", async () => {
    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue({
      id: 5,
      name: "New Recruit",
      email: "new.recruit@toktickit.com",
      role: "IT_STAFF",
      department: "Support",
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-09-17T12:00:00.000Z",
    });

    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    // Click + Create User
    const createBtn = screen.getByTestId("create-user-btn");
    await userEvent.click(createBtn);

    expect(screen.getByTestId("create-user-modal")).toBeInTheDocument();

    // Fill form
    await userEvent.type(screen.getByTestId("create-user-name"), "New Recruit");
    await userEvent.type(screen.getByTestId("create-user-email"), "new.recruit@toktickit.com");
    await userEvent.selectOptions(screen.getByTestId("create-user-role"), "IT_STAFF");
    await userEvent.type(screen.getByTestId("create-user-password"), "InitialSecurePass2026!");

    // Submit form
    await userEvent.click(screen.getByTestId("submit-create-user-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: "New Recruit",
        email: "new.recruit@toktickit.com",
        role: "IT_STAFF",
        department: null,
        isActive: true,
        initialPassword: "InitialSecurePass2026!",
      });
    });

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByTestId("create-user-modal")).not.toBeInTheDocument();
    });
  });

  it("UI-07: enables activation for INACTIVE users and supports activation confirmation modal", async () => {
    const updateSpy = vi.spyOn(api, "updateAdminUser").mockResolvedValue({
      ...mockUsers[3],
      isActive: true,
    });

    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name-4")).toBeInTheDocument();
    });

    // Click Edit on Kevin Patel (id: 4, Inactive user)
    const editInactiveBtn = screen.getByTestId("edit-user-btn-4");
    await userEvent.click(editInactiveBtn);

    // Modal is open
    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    // Verify Activate button is shown instead of Deactivate
    const activateBtn = screen.getByTestId("activate-user-btn");
    expect(activateBtn).toBeInTheDocument();
    expect(activateBtn).toHaveTextContent("Activate");
    expect(screen.queryByTestId("deactivate-user-btn")).not.toBeInTheDocument();

    // Click Activate
    await userEvent.click(activateBtn);

    // Confirmation Modal opens
    expect(screen.getByTestId("confirm-activate-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-activate-modal")).toHaveTextContent(/Activate User Account/i);
    expect(screen.getByTestId("confirm-activate-modal")).toHaveTextContent(
      /Are you sure you want to activate/i
    );

    // Confirm activation
    const confirmBtn = screen.getByTestId("confirm-activate-btn");
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(4, { isActive: true });
    });

    // Modals close
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-activate-modal")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-user-modal")).not.toBeInTheDocument();
    });
  });

  // UI-07: Self-deactivation button disabled for Admin (BR-25)
  it("UI-07: disables deactivation switch and button when admin edits their own account (BR-25)", async () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name-1")).toBeInTheDocument();
    });

    // Click Edit on John Smith (id: 1, current logged in admin)
    const editSelfBtn = screen.getByTestId("edit-user-btn-1");
    await userEvent.click(editSelfBtn);

    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    // Verify Active checkbox/switch is DISABLED
    const activeSwitch = screen.getByTestId("edit-user-active");
    expect(activeSwitch).toBeDisabled();

    // Verify warning text is displayed
    expect(screen.getByTestId("self-deactivation-warning")).toBeInTheDocument();
    expect(screen.getByTestId("self-deactivation-warning")).toHaveTextContent(
      /cannot deactivate your own administrator account/i
    );

    // Verify Deactivate User button is disabled
    const deactivateBtn = screen.getByTestId("deactivate-user-btn");
    expect(deactivateBtn).toBeDisabled();
  });

  it("UI-07: enables deactivation for OTHER users and supports deactivation confirmation modal", async () => {
    const updateSpy = vi.spyOn(api, "updateAdminUser").mockResolvedValue({
      ...mockUsers[1],
      isActive: false,
    });

    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name-2")).toBeInTheDocument();
    });

    // Click Edit on Michael Brown (id: 2, IT Staff)
    const editOtherBtn = screen.getByTestId("edit-user-btn-2");
    await userEvent.click(editOtherBtn);

    // Active checkbox is ENABLED
    const activeSwitch = screen.getByTestId("edit-user-active");
    expect(activeSwitch).not.toBeDisabled();
    expect(screen.queryByTestId("self-deactivation-warning")).not.toBeInTheDocument();

    // Click Deactivate button
    const deactivateBtn = screen.getByTestId("deactivate-user-btn");
    expect(deactivateBtn).not.toBeDisabled();
    await userEvent.click(deactivateBtn);

    // Confirmation Modal opens
    expect(screen.getByTestId("confirm-deactivate-modal")).toBeInTheDocument();

    // Confirm deactivation
    const confirmBtn = screen.getByTestId("confirm-deactivate-btn");
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(2, { isActive: false });
    });
  });

  it("UI-06: opens Reset Initial Password modal and resets password", async () => {
    const resetSpy = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue({
      message: "Reset successful",
      mustChangePassword: true,
    });

    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name-2")).toBeInTheDocument();
    });

    // Open Edit modal for Michael Brown
    await userEvent.click(screen.getByTestId("edit-user-btn-2"));

    // Click Reset Password
    await userEvent.click(screen.getByTestId("reset-password-btn"));

    // Reset password modal opens
    expect(screen.getByTestId("reset-password-modal")).toBeInTheDocument();

    // Type new password
    await userEvent.type(
      screen.getByTestId("new-initial-password-input"),
      "NewTemporaryPass2026!"
    );

    // Submit reset
    await userEvent.click(screen.getByTestId("confirm-reset-password-btn"));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(2, "NewTemporaryPass2026!");
    });
  });

  // Strict Exclusion: No Hard Delete
  it("strictly excludes Hard Delete buttons across the entire UI", async () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <UserManagement />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name-1")).toBeInTheDocument();
    });

    // Verify no "Delete" or "Delete User" button in the table
    expect(screen.queryByText(/Delete User/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Delete$/i)).not.toBeInTheDocument();

    // Open Edit modal
    await userEvent.click(screen.getByTestId("edit-user-btn-2"));

    // Verify still no "Delete User" button in modal (only Deactivate)
    expect(screen.queryByText(/Delete User/i)).not.toBeInTheDocument();
  });

  // Navigation Role Isolation: Admin Menu
  it("renders Admin navigation link ONLY when user is Administrator", () => {
    // 1. As Administrator
    const { unmount: unmountAdmin } = render(
      <AppHeader userRole="ADMINISTRATOR" userName="John Smith" />
    );
    expect(screen.getByTestId("admin-users-nav")).toBeInTheDocument();
    expect(screen.getByTestId("admin-users-nav")).toHaveTextContent(/Admin/i);
    unmountAdmin();

    // 2. As IT Staff
    const { unmount: unmountStaff } = render(
      <AppHeader userRole="IT_STAFF" userName="Alex Thompson" />
    );
    expect(screen.queryByTestId("admin-users-nav")).not.toBeInTheDocument();
    unmountStaff();

    // 3. As Requester
    render(
      <AppHeader userRole="REQUESTER" userName="Jennifer Anderson" />
    );
    expect(screen.queryByTestId("admin-users-nav")).not.toBeInTheDocument();
  });
});
