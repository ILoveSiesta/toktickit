import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("API-06 & API-07: GET /api/tickets (My Tickets List, Filter, Search, Pagination)", () => {
  beforeAll(async () => {
    // Seed some tickets for Requester 1 and Requester 2
    await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "VPN disconnection issues in afternoon")
      .field("description", "Cannot connect to company VPN after 2pm consistently.")
      .field("categoryId", "4") // Network
      .field("relatedSystemId", "3") // VPN
      .field("requestedPriority", "HIGH");

    await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "Email storage quota full")
      .field("description", "Need mailbox quota increased from 5GB to 10GB.")
      .field("categoryId", "1") // Account and Access
      .field("relatedSystemId", "1") // Email
      .field("requestedPriority", "LOW");

    await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "2")
      .field("summary", "Requester 2 Laptop Screen flickering")
      .field("description", "Laptop screen flickers when on battery power.")
      .field("categoryId", "2") // Hardware
      .field("relatedSystemId", "7") // Corporate Laptop
      .field("requestedPriority", "MEDIUM");
  });

  it("API-06: returns 401 Unauthorized when X-Requester-Id header is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
  });

  it("API-06: returns only tickets belonging to the authenticated requester (Ownership Isolation)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    // Verify all returned tickets belong to Requester 1
    res.body.data.forEach((ticket: { requesterId: number }) => {
      expect(ticket.requesterId).toBe(1);
    });

    // Verify Requester 2's ticket is NOT included
    const requester2Ticket = res.body.data.find(
      (t: { summary: string }) => t.summary.includes("Requester 2")
    );
    expect(requester2Ticket).toBeUndefined();

    // Verify separate pagination envelope
    expect(res.body).toHaveProperty("pagination");
    expect(res.body.pagination).toHaveProperty("total");
    expect(res.body.pagination).toHaveProperty("page", 1);
    expect(res.body.pagination).toHaveProperty("limit", 8);
    expect(res.body.pagination).toHaveProperty("totalPages");
  });

  it("API-07: searches by summary and filters by category/priority with pagination", async () => {
    // Search for "VPN"
    const searchRes = await request(app)
      .get("/api/tickets?search=VPN")
      .set("X-Requester-Id", "1");

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      searchRes.body.data.every(
        (t: { summary: string; description: string; ticketNumber: string }) =>
          t.summary.toLowerCase().includes("vpn") ||
          t.description.toLowerCase().includes("vpn") ||
          t.ticketNumber.toLowerCase().includes("vpn")
      )
    ).toBe(true);

    // Filter by categoryId
    const filterRes = await request(app)
      .get("/api/tickets?categoryId=1")
      .set("X-Requester-Id", "1");

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.every((t: { categoryId: number }) => t.categoryId === 1)).toBe(true);

    // Pagination metadata verification
    expect(filterRes.body.pagination).toHaveProperty("page", 1);
    expect(filterRes.body.pagination).toHaveProperty("limit");
    expect(filterRes.body.pagination).toHaveProperty("total");
    expect(filterRes.body.pagination).toHaveProperty("totalPages");
  });
});
