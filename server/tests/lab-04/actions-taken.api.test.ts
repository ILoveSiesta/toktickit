import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 4 Actions Taken API Tests (API-01, API-02, API-03, API-04, AUTH-01, AUTH-02, AUTH-03)", () => {
  let staffAlexToken: string;
  let staffAlexId: number;
  let staffLisaToken: string;
  let staffLisaId: number;
  let adminToken: string;
  let requesterJenniferToken: string;
  let requesterJenniferId: number;
  let otherRequesterMichaelToken: string;
  let otherRequesterMichaelId: number;
  let testTicketId: number;
  let emptyTicketId: number;

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
    staffLisaId = lisaLogin.body.data.user.id;

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

    // 6. Create Test Ticket owned by Jennifer with Staff Alex as ticketOwner
    const prisma = getPrisma();
    const ticket1 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-1`,
        summary: "Actions Taken integration test ticket",
        description: "Testing actions taken CRUD, validations, and role restrictions.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        requesterId: requesterJenniferId,
        ticketOwnerId: staffAlexId,
        categoryId: 1,
        relatedSystemId: 1,
      },
    });
    testTicketId = ticket1.id;

    // 7. Create an empty ticket with 0 actions taken
    const ticket2 = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-2`,
        summary: "Empty actions taken test ticket",
        description: "Testing empty zero-state actions taken response.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        currentStatus: "NEW",
        requesterId: requesterJenniferId,
        categoryId: 1,
        relatedSystemId: 1,
      },
    });
    emptyTicketId = ticket2.id;
  });

  describe("API-01: Create valid Action Taken by IT Staff & Admin", () => {
    it("allows IT Staff to create a valid action taken without follow-up note", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Cleaned internal fan and replaced thermal paste.",
          result: "CPU idle temperature dropped from 68C to 42C.",
          followUpRequired: false,
          attachmentNotes: "thermal_test_log.txt",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeTypeOf("number");
      expect(res.body.data.ticketId).toBe(testTicketId);
      expect(res.body.data.actionDescription).toBe("Cleaned internal fan and replaced thermal paste.");
      expect(res.body.data.result).toBe("CPU idle temperature dropped from 68C to 42C.");
      expect(res.body.data.performedById).toBe(staffAlexId);
      expect(res.body.data.performedBy.name).toBe("Alex Thompson");
      expect(res.body.data.followUpRequired).toBe(false);
      expect(res.body.data.followUpNote).toBeNull();
      expect(res.body.data.attachmentNotes).toBe("thermal_test_log.txt");
    });

    it("allows different IT Staff to record an action on the ticket (BR-02: Performer != Owner)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffLisaToken}`)
        .send({
          actionDescription: "Second-line diagnostic inspection performed by network engineer.",
          result: "Validated Wi-Fi controller driver compatibility.",
          followUpRequired: true,
          followUpNote: "Verify connection after reboot.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.performedById).toBe(staffLisaId);
      expect(res.body.data.performedBy.name).toBe("Lisa Martinez");
      expect(res.body.data.followUpRequired).toBe(true);
      expect(res.body.data.followUpNote).toBe("Verify connection after reboot.");
    });

    it("allows Administrator to create an action taken", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          actionDescription: "Supervisor managerial review of troubleshooting procedure.",
          result: "Approved hardware warranty replacement request.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.performedBy.role).toBe("ADMINISTRATOR");
    });
  });

  describe("API-02: Follow-up Note Validation & Error Handling", () => {
    it("rejects creation with 400 Bad Request when followUpRequired=true but followUpNote is missing", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Checked power delivery cables.",
          result: "Cables functional.",
          followUpRequired: true,
          // followUpNote omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toMatch(/followUpNote is required/i);
    });

    it("rejects creation with 400 Bad Request when followUpNote is an empty string", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Checked power delivery cables.",
          result: "Cables functional.",
          followUpRequired: true,
          followUpNote: "   ",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects creation when actionDescription is empty", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "",
          result: "Completed.",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects creation when result is empty", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Valid action description.",
          result: "   ",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 Not Found when creating an action under a non-existent ticket", async () => {
      const res = await request(app)
        .post("/api/tickets/999999/actions-taken")
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Testing non-existent ticket.",
          result: "Should fail.",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("AUTH-01, AUTH-02, AUTH-03: Authorization & Role Restrictions", () => {
    it("AUTH-01: strictly rejects Requester from creating an action taken with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`)
        .send({
          actionDescription: "Requester trying to perform staff action.",
          result: "Should be forbidden.",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .send({
          actionDescription: "Unauthenticated request.",
          result: "Should fail.",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("AUTH-02: allows Requester to view actions taken on their own ticket (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      // Performer details should be included
      expect(res.body.data[0].performedBy).toBeDefined();
      expect(res.body.data[0].performedBy.role).toBeDefined();
    });

    it("AUTH-03: strictly forbids Requester from viewing actions taken on another user's ticket (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${otherRequesterMichaelToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects inactive staff with 403 Forbidden (ACCOUNT_INACTIVE)", async () => {
      // Login inactive staff
      const inactiveLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "robert.inactive@toktickit.com", password: "TokTickIT2026!" });

      // Note: Inactive user might be blocked at login or authenticate middleware
      if (inactiveLogin.status === 200) {
        const inactiveToken = inactiveLogin.body.data.token;
        const res = await request(app)
          .post(`/api/tickets/${testTicketId}/actions-taken`)
          .set("Authorization", `Bearer ${inactiveToken}`)
          .send({
            actionDescription: "Action by inactive staff.",
            result: "Should be blocked.",
          });
        expect([401, 403]).toContain(res.status);
      } else {
        expect([401, 403]).toContain(inactiveLogin.status);
      }
    });
  });

  describe("API-03, API-04: Update Action Taken & Optimistic Concurrency", () => {
    let createdActionId: number;
    let initialUpdatedAt: string;

    beforeAll(async () => {
      const createRes = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Original action to be edited.",
          result: "Original result.",
          followUpRequired: false,
        });
      createdActionId = createRes.body.data.id;
      initialUpdatedAt = createRes.body.data.updatedAt;
    });

    it("API-03: allows authorized IT Staff to update an action taken (200 OK)", async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicketId}/actions-taken/${createdActionId}`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Updated action description after further inspection.",
          result: "Updated result: issue confirmed resolved.",
          followUpRequired: true,
          followUpNote: "Follow up with customer next Monday.",
          expectedUpdatedAt: initialUpdatedAt,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdActionId);
      expect(res.body.data.actionDescription).toBe("Updated action description after further inspection.");
      expect(res.body.data.result).toBe("Updated result: issue confirmed resolved.");
      expect(res.body.data.followUpRequired).toBe(true);
      expect(res.body.data.followUpNote).toBe("Follow up with customer next Monday.");
    });

    it("API-04: rejects update with 409 Conflict when expectedUpdatedAt is stale (Optimistic Concurrency)", async () => {
      // Sending stale timestamp from before the previous update
      const res = await request(app)
        .put(`/api/tickets/${testTicketId}/actions-taken/${createdActionId}`)
        .set("Authorization", `Bearer ${staffLisaToken}`)
        .send({
          actionDescription: "Concurrent edit attempt with stale timestamp.",
          result: "Should conflict.",
          expectedUpdatedAt: "2020-01-01T00:00:00.000Z", // guaranteed stale
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
    });

    it("strictly forbids Requester from updating an action taken with 403 Forbidden", async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicketId}/actions-taken/${createdActionId}`)
        .set("Authorization", `Bearer ${requesterJenniferToken}`)
        .send({
          actionDescription: "Requester trying to edit.",
          result: "Forbidden.",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 404 when updating non-existent actionId", async () => {
      const res = await request(app)
        .put(`/api/tickets/${testTicketId}/actions-taken/999999`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Does not exist.",
          result: "Does not exist.",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Zero-State and Ordering Guarantees", () => {
    it("returns an empty array (200 OK) for a ticket with 0 actions taken", async () => {
      const res = await request(app)
        .get(`/api/tickets/${emptyTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it("maintains stable descending chronological ordering (actionDateTime DESC, id DESC)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`);

      expect(res.status).toBe(200);
      const actions = res.body.data;
      expect(actions.length).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < actions.length - 1; i++) {
        const timeA = new Date(actions[i].actionDateTime).getTime();
        const timeB = new Date(actions[i + 1].actionDateTime).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
        if (timeA === timeB) {
          expect(actions[i].id).toBeGreaterThan(actions[i + 1].id);
        }
      }
    });

    it("allows IT Staff to delete an action taken record (200 OK)", async () => {
      // Create temporary action
      const createRes = await request(app)
        .post(`/api/tickets/${testTicketId}/actions-taken`)
        .set("Authorization", `Bearer ${staffAlexToken}`)
        .send({
          actionDescription: "Temporary action to be deleted.",
          result: "Done.",
        });
      const tempId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/tickets/${testTicketId}/actions-taken/${tempId}`)
        .set("Authorization", `Bearer ${staffAlexToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify deletion in database
      const prisma = getPrisma();
      const check = await prisma.actionTaken.findUnique({ where: { id: tempId } });
      expect(check).toBeNull();
    });
  });
});
