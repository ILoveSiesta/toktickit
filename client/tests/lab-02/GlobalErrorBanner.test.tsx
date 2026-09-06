import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GlobalErrorBanner } from "../../src/components/GlobalErrorBanner.js";
import { GlobalErrorProvider } from "../../src/context/GlobalErrorContext.js";
import { RequesterSelector } from "../../src/components/RequesterSelector.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import * as api from "../../src/api.js";

describe("UI-12: Global Server Connection Error Warning Banner (BR-27)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("automatically displays global error banner when a network connection error (Failed to fetch) occurs", async () => {
    // Simulate real browser network disconnection / offline / backend down
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    render(
      <GlobalErrorProvider>
        <RequesterProvider>
          <GlobalErrorBanner />
          <RequesterSelector />
        </RequesterProvider>
      </GlobalErrorProvider>
    );

    // Global Error Banner should appear automatically on network error
    await waitFor(() => {
      const banner = screen.getByTestId("global-error-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Cannot connect to TokTickIT Server|Connection Error/i);
      expect(banner).toHaveAttribute("role", "alert");
    });

    // Dismiss banner
    const dismissBtn = screen.getByTestId("dismiss-global-error-btn");
    await userEvent.click(dismissBtn);

    expect(screen.queryByTestId("global-error-banner")).not.toBeInTheDocument();
  });

  it("automatically displays global error banner when server responds with HTTP 500+ error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "application/json" },
      })
    );

    render(
      <GlobalErrorProvider>
        <RequesterProvider>
          <GlobalErrorBanner />
          <RequesterSelector />
        </RequesterProvider>
      </GlobalErrorProvider>
    );

    await waitFor(() => {
      const banner = screen.getByTestId("global-error-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Server Error|Cannot connect/i);
    });
  });
});
