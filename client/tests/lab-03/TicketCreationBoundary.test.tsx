import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppHeader } from "../../src/components/AppHeader.js";
import { CreateTicket } from "../../src/components/CreateTicket.js";
import { AuthContext } from "../../src/context/AuthContext.js";

describe("Ticket Creation Strict Boundary Tests (Frontend)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // 1. AppHeader Navigation Tests
  describe("AppHeader Navigation Role Isolation", () => {
    it("renders '+ Create Ticket' and 'My Tickets' ONLY for REQUESTER", () => {
      render(
        <AppHeader
          userRole="REQUESTER"
          userName="Jennifer Anderson"
          currentTab="my-tickets"
        />
      );

      expect(screen.getByText("+ Create Ticket")).toBeInTheDocument();
      expect(screen.getByText("My Tickets")).toBeInTheDocument();
      expect(screen.queryByText("📋 My Queue")).not.toBeInTheDocument();
      expect(screen.queryByText("⚙️ User Management")).not.toBeInTheDocument();
    });

    it("STRICTLY HIDES '+ Create Ticket' for IT_STAFF", () => {
      render(
        <AppHeader
          userRole="IT_STAFF"
          userName="Alex Thompson"
          currentTab="queue"
        />
      );

      expect(screen.queryByText("+ Create Ticket")).not.toBeInTheDocument();
      expect(screen.queryByText("My Tickets")).not.toBeInTheDocument();
      expect(screen.getByText("📋 My Queue")).toBeInTheDocument();
      expect(screen.queryByText("⚙️ User Management")).not.toBeInTheDocument();
    });

    it("STRICTLY HIDES '+ Create Ticket' for ADMINISTRATOR", () => {
      render(
        <AppHeader
          userRole="ADMINISTRATOR"
          userName="John Smith"
          currentTab="queue"
        />
      );

      expect(screen.queryByText("+ Create Ticket")).not.toBeInTheDocument();
      expect(screen.queryByText("My Tickets")).not.toBeInTheDocument();
      expect(screen.getByText("📋 My Queue")).toBeInTheDocument();
      expect(screen.getByText("⚙️ User Management")).toBeInTheDocument();
    });
  });

  // 2. CreateTicket Component Role Guard Tests
  describe("CreateTicket Component Direct Access Guard", () => {
    it("renders forbidden error message when IT_STAFF attempts direct access", () => {
      const mockAuthValue: any = {
        user: { id: 2, name: "Alex Staff", email: "alex@staff.com", role: "IT_STAFF" },
        isAuthenticated: true,
        isLoading: false,
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <CreateTicket />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId("forbidden-alert")).toBeInTheDocument();
      expect(screen.getByText("Only Requesters are permitted to create support tickets.")).toBeInTheDocument();
      expect(screen.queryByTestId("submit-ticket-btn")).not.toBeInTheDocument();
    });

    it("renders forbidden error message when ADMINISTRATOR attempts direct access", () => {
      const mockAuthValue: any = {
        user: { id: 3, name: "John Admin", email: "admin@toktick.com", role: "ADMINISTRATOR" },
        isAuthenticated: true,
        isLoading: false,
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <CreateTicket />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId("forbidden-alert")).toBeInTheDocument();
      expect(screen.getByText("Only Requesters are permitted to create support tickets.")).toBeInTheDocument();
      expect(screen.queryByTestId("submit-ticket-btn")).not.toBeInTheDocument();
    });
  });
});
