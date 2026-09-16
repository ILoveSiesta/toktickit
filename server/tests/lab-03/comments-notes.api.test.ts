import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Comments & Internal Notes Isolation Tests (API-08, API-18, API-19)", () => {
  let staffToken: string;
  let staffId: number;
  let adminToken: string;
  let requesterToken: string;
  let requesterId: number;
  let otherRequesterToken: string;
  let otherRequesterId: number;
  let testTicketId: number;

  beforeAll(async () => {
    // 1. Staff Alex
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = staffLogin.body.data.token;
    staffId = staffLogin.body.data.user.id;

    // 2. Administrator
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "TokTickIT2026!" });
    adminToken = adminLogin.body.data.token;

    // 3. Requester Jennifer
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = reqLogin.body.data.token;
    requesterId = reqLogin.body.data.user.id;

    // 4. Other Requester Michael
    const otherLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael@toktick.it", password: "TokTickIT2026!" });
    otherRequesterToken = otherLogin.body.data.token;
    otherRequesterId = otherLogin.body.data.user.id;

    // 5. Create a test ticket for Jennifer
    const prisma = getPrisma();
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-COMM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        summary: "Communication and notes isolation test ticket",
        description: "Testing public comments and internal notes access rules.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId,
        categoryId: 1,
        relatedSystemId: 1,
      },
    });
    testTicketId = ticket.id;
  });

  describe("API-08: Security & Privacy - Internal Notes Isolation", () => {
    it("rejects unauthenticated requests to internal notes with 401 Unauthorized", async () => {
      const getRes = await request(app).get(`/api/tickets/${testTicketId}/notes`);
      expect(getRes.status).toBe(401);

      const postRes = await request(app)
        .post(`/api/tickets/${testTicketId}/notes`)
        .send({ body: "Confidential note" });
      expect(postRes.status).toBe(401);
    });

    it("strictly rejects Requester from viewing internal notes with 403 Forbidden without leaking data", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/notes`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      // Ensure zero note content or internal notes array is leaked
      expect(res.body.data).toBeUndefined();
    });

    it("strictly rejects Requester from posting internal notes with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/notes`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ body: "Attempting to create internal note as requester" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("API-18: Public Comments Posting & Retrieval", () => {
    it("allows Requester to post a public comment", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ body: "Hello, I am having issues accessing the system since this morning." });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.content).toBe("Hello, I am having issues accessing the system since this morning.");
      expect(res.body.data.author.name).toBe("Jennifer Anderson");
      expect(res.body.data.author.role).toBe("REQUESTER");
    });

    it("allows IT Staff to post a public comment in response", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ body: "Hello Jennifer, we are investigating the issue right now." });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe("Hello Jennifer, we are investigating the issue right now.");
      expect(res.body.data.author.role).toBe("IT_STAFF");
    });

    it("allows both Requester and IT Staff to view comments in chronological ascending order", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/comments`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].content).toContain("Hello, I am having issues");
      expect(res.body.data[1].content).toContain("Hello Jennifer, we are investigating");
    });

    it("rejects another requester from viewing comments on a ticket they do not own", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/comments`)
        .set("Authorization", `Bearer ${otherRequesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("rejects another requester from posting comments on a ticket they do not own", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Authorization", `Bearer ${otherRequesterToken}`)
        .send({ body: "Sneaking into Jennifer's ticket" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("validates comment length and rejects empty comment with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/comments`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ body: "    " });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_COMMENT");
    });
  });

  describe("API-19: Internal Notes Management (IT Staff & Administrator)", () => {
    it("allows IT Staff to post an internal note", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/notes`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ body: "Root cause found: gateway DNS timeout. Rebuilding cache." });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.content).toBe("Root cause found: gateway DNS timeout. Rebuilding cache.");
      expect(res.body.data.author.role).toBe("IT_STAFF");
    });

    it("allows Administrator to post an internal note", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/notes`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ body: "Admin note: approved firewall rule update." });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.author.role).toBe("ADMINISTRATOR");
    });

    it("allows IT Staff to retrieve internal notes in chronological ascending order", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicketId}/notes`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].content).toContain("Root cause found");
      expect(res.body.data[1].content).toContain("Admin note: approved");
    });

    it("validates internal note length and rejects empty note with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/notes`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ body: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_NOTE");
    });
  });
});
