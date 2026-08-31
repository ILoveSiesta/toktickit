import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterSelector } from "../../src/components/RequesterSelector.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

const mockRequesters = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer@toktick.it", department: "Marketing", isActive: true },
  { id: 2, name: "Michael Brown", email: "michael@toktick.it", department: "Finance", isActive: true },
];

describe("UI-01 & UI-10: RequesterSelector Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("UI-01: renders active development requesters and selects a requester on continue", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockRequesters);
    const handleSuccess = vi.fn();

    render(
      <RequesterProvider>
        <RequesterSelector onSuccess={handleSuccess} />
      </RequesterProvider>
    );

    // Wait for dropdown to populate
    await waitFor(() => {
      expect(screen.getByTestId("requester-dropdown")).toBeInTheDocument();
    });

    const selectElement = screen.getByTestId("requester-dropdown") as HTMLSelectElement;
    expect(selectElement.options.length).toBe(2);
    expect(selectElement.options[0].text).toContain("Jennifer Anderson");
    expect(selectElement.options[1].text).toContain("Michael Brown");

    // Select Michael Brown (id 2)
    await userEvent.selectOptions(selectElement, "2");
    expect(selectElement.value).toBe("2");

    // Click Continue
    const continueBtn = screen.getByTestId("continue-btn");
    await userEvent.click(continueBtn);

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("toktickit_selected_requester")).toContain("Michael Brown");
  });

  it("UI-10 (Error State): displays safe error message when API fails", async () => {
    vi.spyOn(api, "fetchRequesters").mockRejectedValue(new Error("Failed to load requesters (HTTP 500)"));

    render(
      <RequesterProvider>
        <RequesterSelector />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      expect(screen.getByTestId("error-alert")).toHaveTextContent("Failed to load requesters");
    });
  });

  it("UI-10 (Empty State): displays empty message when no active requesters found", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([]);

    render(
      <RequesterProvider>
        <RequesterSelector />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("empty-alert")).toBeInTheDocument();
      expect(screen.getByTestId("empty-alert")).toHaveTextContent("No active development requesters found");
    });
  });
});
