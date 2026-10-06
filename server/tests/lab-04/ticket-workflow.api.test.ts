import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { TicketStatus } from "@prisma/client";

describe("Lab 4 Ticket Workflow, Lifecycle & Resolution Gate API Tests (FLOW-01 to FLOW-04, API-04, BR-08 to BR-11)", () => {
  let staffAlexToken: string;
  let staffAlexId: number;
  let staffLisaToken: string;
  let adminToken: string;
  let requesterJenniferToken: string;
  let requesterJenniferId: number;
  let otherRequesterMichaelToken: string;
  let otherRequesterMichaelId: number;

  beforeAll(async () => {
    // 1. Login Staff Alex
    const alexLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffAlexToken = alexLogin.body.data.token;
    staffAlexId = alexLogin.body.data.user.id;

    // 2. Login Staff Lisa
    const lisaLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "lisa.staff@toktickit.com", password: "TokTickIT2026!" });
    staffLisaToken = lisaLogin.body.data.token;

    // 3. Login Admin
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "TokTickIT2026!" });
    adminToken = adminLogin.body.data.token;

    // 4. Login Requester Jennifer
    const jenniferLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterJenniferToken = jenniferLogin.body.data.token;
    requesterJenniferId = jenniferLogin.body.data.user.id;

    // 5. Login Other Requester Michael
    const michaelLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael@toktick.it", password: "TokTickIT2026!" });
    otherRequesterMichaelToken = michaelLogin.body.data.token;
    otherRequesterMichaelId = michaelLogin.body.data.user.id;
  });

  // Helper to create tickets on demand
  const createTicket = async (overrides: Partial<any> = {}) => {
    const prisma = getPrisma();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    return await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-FLOW-${unique}`,
        summary: `Workflow test ticket ${unique}`,
        description: "Testing status transitions, resolution gate, and concurrency guard.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: overrides.currentStatus || TicketStatus.NEW,
        requesterId: overrides.requesterId || requesterJenniferId,
        ticketOwnerId: overrides.ticketOwnerId !== undefined ? overrides.ticketOwnerId : null,
        resolvedIndicated: overrides.resolvedIndicated ?? false,
        categoryId: 1,
        relatedSystemId: 1,
      },
    });
  };

  describe("FLOW-01: Permitted Ticket Status Transitions (BR-08, AC-06)", () => {
    it("allows IT Staff to transition NEW -> IN_PROGRESS", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.NEW });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("IN_PROGRESS");
    });

    it("allows IT Staff to transition NEW -> OPEN", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.NEW });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "OPEN" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("OPEN");
    });

    it("allows IT Staff to transition IN_PROGRESS -> WAITING_FOR_REQUESTER and back to IN_PROGRESS", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.IN_PROGRESS });

      const res1 = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(res1.status).toBe(200);
      expect(res1.body.data.currentStatus).toBe("WAITING_FOR_REQUESTER");

      const res2 = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "IN_PROGRESS" });

      expect(res2.status).toBe(200);
      expect(res2.body.data.currentStatus).toBe("IN_PROGRESS");
    });

    it("allows Administrator to perform permitted status transitions", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.OPEN });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("IN_PROGRESS");
    });

    it("allows transitioning RESOLVED -> CLOSED and RESOLVED -> REOPENED", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.RESOLVED,
        ticketOwnerId: staffAlexId,
      });

      // RESOLVED -> REOPENED
      const reopenRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "REOPENED" });

      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body.data.currentStatus).toBe("REOPENED");

      // Set ticket back to RESOLVED for testing CLOSED
      const prisma = getPrisma();
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { currentStatus: TicketStatus.RESOLVED },
      });

      // RESOLVED -> CLOSED
      const closeRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "CLOSED" });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.currentStatus).toBe("CLOSED");
    });
  });

  describe("FLOW-02: Forbidden Status Transitions & Terminal States (BR-08, AC-07)", () => {
    it("rejects illegal skip from NEW to CLOSED with 400 Bad Request", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.NEW });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("rejects illegal jump from OPEN to REOPENED with 400 Bad Request", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.OPEN });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "REOPENED" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("rejects transition from terminal CLOSED status with 400 Bad Request", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.CLOSED });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "OPEN" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("rejects transition from terminal CANCELLED status with 400 Bad Request", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.CANCELLED });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "NEW" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  describe("FLOW-03: Requester Problem Resolved Indication Advisory Rule (BR-09, AC-08)", () => {
    it("updates resolvedIndicated = true WITHOUT changing ticket status to RESOLVED", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        requesterId: requesterJenniferId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`)
        .send({ problemAppearsResolved: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resolvedIndicated).toBe(true);
      expect(res.body.data.currentStatus).toBe(TicketStatus.IN_PROGRESS);

      // Verify in Database that currentStatus is STILL IN_PROGRESS
      const prisma = getPrisma();
      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      expect(dbTicket?.resolvedIndicated).toBe(true);
      expect(dbTicket?.currentStatus).toBe(TicketStatus.IN_PROGRESS);
    });

    it("rejects another Requester from indicating resolution on unowned ticket with 403 Forbidden", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        requesterId: requesterJenniferId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${otherRequesterMichaelToken}`)
        .send({ problemAppearsResolved: true });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("FLOW-04: Resolution Gate Prerequisites Enforcement (BR-10, AC-09, AC-14)", () => {
    it("AC-14: rejects transition to RESOLVED when ticket has no assigned owner", async () => {
      const prisma = getPrisma();
      // Ticket has NO owner, but HAS an action taken
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        ticketOwnerId: null,
      });

      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          performedById: staffAlexId,
          actionDescription: "Diagnostic step performed",
          result: "Hardware OK",
        },
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RESOLUTION_PREREQUISITE_FAILED");
    });

    it("AC-14: rejects transition to RESOLVED when ticket has owner but ZERO Actions Taken", async () => {
      // Ticket HAS owner, but NO actions taken
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        ticketOwnerId: staffAlexId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("RESOLUTION_PREREQUISITE_FAILED");
    });

    it("AC-09: allows transition to RESOLVED when ticket has BOTH assigned owner and Actions Taken", async () => {
      const prisma = getPrisma();
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        ticketOwnerId: staffAlexId,
      });

      // Add 1 action taken
      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          performedById: staffAlexId,
          actionDescription: "Replaced faulty fan and re-applied thermal paste",
          result: "Operating temperature normal",
        },
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          status: "RESOLVED",
          resolutionNote: "Thermal paste applied and fan replaced.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("RESOLVED");

      // Verify internal note was saved for audit trail (BR-03)
      const notes = await prisma.internalNote.findMany({ where: { ticketId: ticket.id } });
      expect(notes.length).toBeGreaterThanOrEqual(1);
      expect(notes.some((n) => n.content.includes("Thermal paste applied"))).toBe(true);
    });
  });

  describe("Requester Role Restrictions on Status Transitions (BR-08)", () => {
    it("allows Requester to cancel their own ticket when in NEW status", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.NEW,
        requesterId: requesterJenniferId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`)
        .send({ status: "CANCELLED" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("CANCELLED");
    });

    it("rejects Requester trying to cancel ticket in IN_PROGRESS status with 403 Forbidden", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        requesterId: requesterJenniferId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`)
        .send({ status: "CANCELLED" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects Requester trying to change status to RESOLVED with 403 Forbidden", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        requesterId: requesterJenniferId,
        ticketOwnerId: staffAlexId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects Requester trying to modify someone else's ticket with 403 Forbidden", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.NEW,
        requesterId: requesterJenniferId,
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${otherRequesterMichaelToken}`)
        .send({ status: "CANCELLED" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("API-04: Concurrency Conflict Guard / Stale Update Handling (BR-11, AC-12)", () => {
    it("rejects update with 409 Conflict when expectedUpdatedAt is older than current ticket updatedAt", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.NEW });

      // Stale timestamp (1 hour in the past)
      const staleTimestamp = new Date(Date.now() - 3600000).toISOString();

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
    });

    it("succeeds when expectedUpdatedAt is current or newer", async () => {
      const ticket = await createTicket({ currentStatus: TicketStatus.NEW });

      const currentTimestamp = ticket.updatedAt.toISOString();

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          status: "OPEN",
          expectedUpdatedAt: currentTimestamp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("OPEN");
    });
  });

  describe("GET /api/tickets/:id/workflow - Workflow Metadata", () => {
    it("returns permitted transitions and resolution prerequisites readiness", async () => {
      const ticket = await createTicket({
        currentStatus: TicketStatus.IN_PROGRESS,
        ticketOwnerId: staffAlexId,
      });

      const res = await request(app)
        .get(`/api/tickets/${ticket.id}/workflow`)
        .set("Authorization", `Bearer ${staffAlexToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.currentStatus).toBe("IN_PROGRESS");
      expect(data.permittedTransitions).toContain("RESOLVED");
      expect(data.permittedTransitions).toContain("WAITING_FOR_REQUESTER");
      expect(data.permittedTransitions).toContain("CANCELLED");
      expect(data.resolutionPrerequisites.hasOwner).toBe(true);
      expect(data.resolutionPrerequisites.hasActionsTaken).toBe(false);
      expect(data.resolutionPrerequisites.readyToResolve).toBe(false);
    });
  });
});
