import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Lab 3 Issue 2 Bug Fixes - Auth Flow Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.pushState({}, "Home", "/");
    vi.spyOn(api, "fetchCategories").mockResolvedValue([{ id: 1, name: "Hardware" }]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([{ id: 1, name: "Laptop" }]);
  });

  it("Bug 1 & 2: logs in successfully, immediately renders tickets (no hang), and confirms NO Change Requester button exists", async () => {
    vi.spyOn(api, "loginApi").mockResolvedValue({
      token: "valid-jwt-token",
      user: {
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer@toktick.it",
        role: "REQUESTER",
        mustChangePassword: false,
      },
    });

    const fetchTicketsSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
      items: [
        {
          id: 101,
          ticketNumber: "TKT-2026-000101",
          summary: "Broken Monitor Screen",
          requestedPriority: "MEDIUM",
          itPriority: "MEDIUM",
          currentStatus: "NEW",
          createdAt: "2026-09-12T10:00:00.000Z",
          attachments: [],
        },
      ],
      totalCount: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    });

    render(<App />);

    // 1. Initially on /login
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.queryByTestId("change-requester-btn")).not.toBeInTheDocument();

    // 2. Submit credentials
    await userEvent.type(screen.getByTestId("login-email-input"), "jennifer@toktick.it");
    await userEvent.type(screen.getByTestId("login-password-input"), "TokTickIT2026!");
    await userEvent.click(screen.getByTestId("login-submit-btn"));

    // 3. Automatically navigates to /tickets and renders ticket list immediately
    await waitFor(() => {
      expect(fetchTicketsSpy).toHaveBeenCalled();
      expect(screen.getAllByText("Broken Monitor Screen").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("TKT-2026-000101").length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });

    // 4. Header contains user name and role badge
    expect(screen.getByTestId("requester-name-display")).toHaveTextContent("Jennifer Anderson");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("REQUESTER");

    // 5. CRITICAL: NO "Change Requester" button or selector exists anywhere
    expect(screen.queryByTestId("change-requester-btn")).not.toBeInTheDocument();
  });

  it("Bug 2 & 3: clicking Sign Out immediately redirects to /login with NO leftover Change Requester button", async () => {
    // Preload authenticated requester session in localStorage
    localStorage.setItem("toktickit_auth_token", "existing-jwt-token");
    vi.spyOn(api, "getMeApi").mockResolvedValue({
      id: 1,
      name: "Jennifer Anderson",
      email: "jennifer@toktick.it",
      role: "REQUESTER",
      mustChangePassword: false,
    });

    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      limit: 8,
      totalPages: 0,
    });

    vi.spyOn(api, "logoutApi").mockResolvedValue();

    render(<App />);

    // Wait until authenticated shell renders
    await waitFor(() => {
      expect(screen.getByTestId("logout-btn")).toBeInTheDocument();
    });

    // Click Sign Out
    await userEvent.click(screen.getByTestId("logout-btn"));

    // Immediately redirects to /login without manual page refresh
    await waitFor(() => {
      expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });

    // Confirms NO "Change Requester" button appears on logout
    expect(screen.queryByTestId("change-requester-btn")).not.toBeInTheDocument();
  });

  it("Bug 4: logging in with mustChangePassword = true immediately redirects to /change-password", async () => {
    vi.spyOn(api, "loginApi").mockResolvedValue({
      token: "temp-jwt-token",
      user: {
        id: 2,
        name: "Kevin Staff",
        email: "kevin.staff@toktickit.com",
        role: "IT_STAFF",
        mustChangePassword: true,
      },
    });

    render(<App />);

    await userEvent.type(screen.getByTestId("login-email-input"), "kevin.staff@toktickit.com");
    await userEvent.type(screen.getByTestId("login-password-input"), "TokTickIT2026!");
    await userEvent.click(screen.getByTestId("login-submit-btn"));

    // Automatically redirects to /change-password route
    await waitFor(() => {
      expect(screen.getByText("Change Your Password")).toBeInTheDocument();
      expect(screen.getByText("You must change your password to continue.")).toBeInTheDocument();
      expect(screen.getByTestId("current-password-input")).toBeInTheDocument();
      expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
      expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
    });
  });
});
