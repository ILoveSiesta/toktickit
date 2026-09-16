import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 IT Staff Ticket Detail & Operations Tests (API-12 to API-17)", () => {
  let staffToken: string;
  let staffId: number;
  let lisaToken: string;
  let lisaId: number;
  let requesterToken: string;
  let requesterId: number;
  let otherRequesterToken: string;
  let testTicketId: number;
  let terminalTicketId: number;

  beforeAll(async () => {
    // 1. Authenticate Staff Alex
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = staffLogin.body.data.token;
    staffId = staffLogin.body.data.user.id;

    // 2. Authenticate Staff Lisa
    const lisaLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "lisa.staff@toktickit.com", password: "TokTickIT2026!" });
    lisaToken = lisaLogin.body.data.token;
    lisaId = lisaLogin.body.data.user.id;

    // 3. Authenticate Requester Jennifer
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = reqLogin.body.data.token;
    requesterId = reqLogin.body.data.user.id;

    // 4. Authenticate Other Requester Michael
    const otherLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael@toktick.it", password: "TokTickIT2026!" });
    otherRequesterToken = otherLogin.body.data.token;

    // 5. Create a fresh test ticket for operational testing
    const prisma = getPrisma();
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-OPS-${uniqueSuffix}`,
        summary: "Detail operations test ticket",
        description: "Testing staff ticket detail and operational updates.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId,
        categoryId: 1,
        relatedSystemId: 1,
      },
    });
    testTicketId = ticket.id;

    // Create a closed ticket for terminal state testing
    const terminalTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-TERM-${uniqueSuffix}`,
        summary: "Terminal state test ticket",
        description: "Testing transitions from closed/cancelled status.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "CLOSED",
        requesterId,
        categoryId: 1,
        relatedSystemId: 1,
      },
    });
    terminalTicketId = terminalTicket.id;
  });

  describe("API-12: IT Staff Ticket Detail Inspection", () => {
    it("allows IT Staff to retrieve full ticket details with counts", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.id).toBe(testTicketId);
      expect(data).toHaveProperty("ticketNumber");
      expect(data).toHaveProperty("summary");
      expect(data).toHaveProperty("description");
      expect(data).toHaveProperty("requestedPriority");
      expect(data).toHaveProperty("itPriority");
      expect(data).toHaveProperty("currentStatus");
      expect(data).toHaveProperty("resolvedIndicated");
      expect(data).toHaveProperty("category");
      expect(data).toHaveProperty("relatedSystem");
      expect(data).toHaveProperty("requester");
      expect(data.requester.id).toBe(requesterId);
      expect(data).toHaveProperty("attachmentsCount");
      expect(data).toHaveProperty("commentsCount");
      expect(data).toHaveProperty("notesCount");
    });

    it("rejects Requester role from accessing staff ticket detail with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/${testTicketId}`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 for non-existent ticket ID", async () => {
      const res = await request(app)
        .get(`/api/staff/tickets/999999`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("API-13: Ticket Ownership Assignment & Claiming", () => {
    it("allows IT Staff to claim ticket ownership for themselves", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assignment`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ticketOwnerId: staffId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketOwnerId).toBe(staffId);
      expect(res.body.data.ticketOwner.id).toBe(staffId);
    });

    it("allows IT Staff to reassign ticket to another staff member (Lisa)", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/owner`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ticketOwnerId: lisaId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketOwnerId).toBe(lisaId);
      expect(res.body.data.ticketOwner.id).toBe(lisaId);
    });

    it("allows IT Staff to unassign ticket ownership by passing null", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assignment`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ticketOwnerId: null });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketOwnerId).toBeNull();
    });

    it("rejects assigning ticket to a Requester account with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/assignment`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ ticketOwnerId: requesterId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TICKET_OWNER");
    });
  });

  describe("API-14: IT Priority Modification", () => {
    it("allows IT Staff to update itPriority without affecting requestedPriority", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/priority`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ itPriority: "CRITICAL" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itPriority).toBe("CRITICAL");

      // Verify in DB that requestedPriority remains MEDIUM
      const prisma = getPrisma();
      const updated = await prisma.ticket.findUnique({
        where: { id: testTicketId },
        select: { requestedPriority: true, itPriority: true },
      });
      expect(updated?.requestedPriority).toBe("MEDIUM");
      expect(updated?.itPriority).toBe("CRITICAL");
    });

    it("rejects invalid priority value with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/it-priority`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ itPriority: "SUPER_URGENT" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_PRIORITY");
    });
  });

  describe("API-15 & API-16: Status Transition Matrix Enforcement", () => {
    it("API-16: rejects invalid jump from NEW to CLOSED with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("API-15: allows valid transition from NEW to IN_PROGRESS", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("IN_PROGRESS");
    });

    it("API-15: allows valid transition from IN_PROGRESS to WAITING_FOR_REQUESTER", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("WAITING_FOR_REQUESTER");
    });

    it("API-15: allows valid transition from WAITING_FOR_REQUESTER to RESOLVED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("RESOLVED");
    });

    it("API-15: allows valid transition from RESOLVED to CLOSED", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${testTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("CLOSED");
    });

    it("API-16: rejects transitioning from terminal CLOSED status with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/staff/tickets/${terminalTicketId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "OPEN" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  describe("API-17: Requester Resolution Indication", () => {
    it("allows ticket Requester to indicate problem appears resolved without changing status", async () => {
      // 1. Check current status
      const prisma = getPrisma();
      const before = await prisma.ticket.findUnique({
        where: { id: testTicketId },
        select: { currentStatus: true, resolvedIndicated: true },
      });

      // 2. Call resolve-indication
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/resolve-indication`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resolvedIndicated).toBe(true);

      // 3. Verify status remained unchanged in DB
      const after = await prisma.ticket.findUnique({
        where: { id: testTicketId },
        select: { currentStatus: true, resolvedIndicated: true },
      });
      expect(after?.resolvedIndicated).toBe(true);
      expect(after?.currentStatus).toBe(before?.currentStatus);
    });

    it("rejects another requester from indicating resolution on a ticket they do not own", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/resolve-indication`)
        .set("Authorization", `Bearer ${otherRequesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
