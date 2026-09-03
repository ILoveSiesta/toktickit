import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("API-08 & API-09: GET /api/tickets/:id (Ticket Details & Ownership Enforcement)", () => {
  let requester1TicketId: number;
  let requester2TicketId: number;

  beforeAll(async () => {
    // Create Ticket for Requester 1
    const res1 = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "Requester 1 Network Problem")
      .field("description", "Detailed description of network issue for requester 1.")
      .field("categoryId", "4")
      .field("relatedSystemId", "2")
      .field("requestedPriority", "HIGH");
    requester1TicketId = res1.body.data.id;

    // Create Ticket for Requester 2
    const res2 = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "2")
      .field("summary", "Requester 2 Hardware Incident")
      .field("description", "Detailed description of hardware issue for requester 2.")
      .field("categoryId", "2")
      .field("relatedSystemId", "7")
      .field("requestedPriority", "MEDIUM");
    requester2TicketId = res2.body.data.id;
  });

  it("API-08: returns ticket details when accessed by its owner (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${requester1TicketId}`)
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("id", requester1TicketId);
    expect(res.body.data).toHaveProperty("ticketNumber");
    expect(res.body.data).toHaveProperty("summary", "Requester 1 Network Problem");
    expect(res.body.data).toHaveProperty("category");
    expect(res.body.data).toHaveProperty("relatedSystem");
    expect(res.body.data).toHaveProperty("requester");
    expect(res.body.data).toHaveProperty("attachments");
  });

  it("API-09: blocks cross-requester access and returns 403 Forbidden", async () => {
    // Requester 1 attempts to access Requester 2's ticket
    const res = await request(app)
      .get(`/api/tickets/${requester2TicketId}`)
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("code", "FORBIDDEN");
  });
});
