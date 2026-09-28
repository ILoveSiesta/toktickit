import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTicket } from "../../src/components/CreateTicket.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockCategories = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockRelatedSystems = [
  { id: 1, name: "Email" },
  { id: 2, name: "Campus Wi-Fi" },
];

describe("UI-02 & UI-03: CreateTicket Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Jennifer Anderson", email: "jennifer@toktick.it", isActive: true })
    );

    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockRelatedSystems);
  });

  it("UI-03: validates required fields, displays inline red error messages, and preserves valid inputs", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId("submit-ticket-btn");

    // Click submit without entering Summary or Description
    await userEvent.click(submitBtn);

    // Verify inline validation errors appear below fields
    expect(screen.getByTestId("summary-error")).toBeInTheDocument();
    expect(screen.getByTestId("summary-error")).toHaveTextContent(/required/i);
    expect(screen.getByTestId("description-error")).toBeInTheDocument();

    // Type a valid summary, but invalid short description
    const summaryInput = screen.getByTestId("summary-input");
    await userEvent.type(summaryInput, "Valid summary of the issue");

    await userEvent.click(submitBtn);

    // Summary should retain value, and summary error is cleared
    expect(summaryInput).toHaveValue("Valid summary of the issue");
    expect(screen.queryByTestId("summary-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("description-error")).toBeInTheDocument();
  });

  it("UI-02: shows busy/disabled state on Submit button during form submission", async () => {
    let resolveSubmit: (val: any) => void;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    vi.spyOn(api, "createTicket").mockImplementation(() => submitPromise as any);

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Fill valid form
    await userEvent.type(screen.getByTestId("summary-input"), "VPN connection timeout in morning");
    await userEvent.type(
      screen.getByTestId("description-textarea"),
      "Unable to connect to VPN from home network with error 800."
    );

    const submitBtn = screen.getByTestId("submit-ticket-btn");
    await userEvent.click(submitBtn);

    // Verify busy state
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/Submitting|Processing/i);

    // Resolve API call
    resolveSubmit!({ success: true, data: { id: 101, ticketNumber: "TKT-2026-000101" } });

    await waitFor(() => {
      expect(screen.getByText(/Ticket Submitted Successfully/i)).toBeInTheDocument();
    });
  });
});
