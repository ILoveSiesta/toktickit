import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 IT Staff Ticket Queue API Tests (API-10 & API-11)", () => {
  let staffToken: string;
  let staffId: number;
  let adminToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // 1. Authenticate IT Staff (Alex Thompson)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = staffLogin.body.data.token;
    staffId = staffLogin.body.data.user.id;

    // 2. Authenticate Administrator (John Smith)
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "TokTickIT2026!" });
    adminToken = adminLogin.body.data.token;

    // 3. Authenticate Requester (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = reqLogin.body.data.token;
  });

  describe("API-10: IT Staff Ticket Queue with search & filter", () => {
    it("allows IT Staff to retrieve the ticket queue with default pagination", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(typeof res.body.pagination.totalItems).toBe("number");
      expect(typeof res.body.pagination.totalPages).toBe("number");
      expect(typeof res.body.pagination.hasNext).toBe("boolean");
      expect(typeof res.body.pagination.hasPrev).toBe("boolean");

      if (res.body.data.length > 0) {
        const item = res.body.data[0];
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("ticketNumber");
        expect(item).toHaveProperty("ticketDate");
        expect(item).toHaveProperty("summary");
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("requestedPriority");
        expect(item).toHaveProperty("itPriority");
        expect(item).toHaveProperty("currentStatus");
        expect(item).toHaveProperty("requester");
        expect(item).toHaveProperty("updatedAt");
      }
    });

    it("allows Administrator to access the staff ticket queue", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("strictly blocks Requester with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/staff/tickets")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks unauthenticated access with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/staff/tickets");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("searches tickets by summary or ticketNumber (case-insensitive)", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?search=battery")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const match = res.body.data.some((t: any) =>
        t.summary.toLowerCase().includes("battery") || t.ticketNumber.toLowerCase().includes("battery")
      );
      expect(match).toBe(true);
    });

    it("filters tickets by status", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?status=IN_PROGRESS")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.currentStatus).toBe("IN_PROGRESS");
      }
    });

    it("filters tickets by category", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?category=1")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.category.id).toBe(1);
      }
    });

    it("filters tickets by itPriority", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?itPriority=HIGH")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.itPriority).toBe("HIGH");
      }
    });

    it("filters tickets by assignment: unassigned", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?assigned=unassigned")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.ticketOwner).toBeNull();
      }
    });

    it("filters tickets by assignment: mine", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?assigned=mine")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const t of res.body.data) {
        expect(t.ticketOwner?.id).toBe(staffId);
      }
    });

    it("sorts tickets deterministically by requested field and sortOrder", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?sortBy=ticketNumber&sortOrder=asc")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const ticketNumbers = res.body.data.map((t: any) => t.ticketNumber);
      const sorted = [...ticketNumbers].sort();
      expect(ticketNumbers).toEqual(sorted);
    });
  });

  describe("API-11: Ticket Queue pagination boundary", () => {
    it("handles page beyond totalPages safely without server error", async () => {
      const res = await request(app)
        .get("/api/staff/tickets?page=9999&limit=10")
        .set("Authorization", `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(9999);
      expect(res.body.pagination.hasNext).toBe(false);
      expect(res.body.pagination.hasPrev).toBe(true);
    });

    it("returns 400 Bad Request for invalid page (< 1 or non-integer)", async () => {
      const res1 = await request(app)
        .get("/api/staff/tickets?page=0")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("INVALID_QUERY_PARAMETER");

      const res2 = await request(app)
        .get("/api/staff/tickets?page=-5")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get("/api/staff/tickets?page=invalid")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res3.status).toBe(400);
    });

    it("returns 400 Bad Request for invalid limit (< 1, > 50, or non-integer)", async () => {
      const res1 = await request(app)
        .get("/api/staff/tickets?limit=0")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get("/api/staff/tickets?limit=51")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get("/api/staff/tickets?limit=foo")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res3.status).toBe(400);
    });

    it("returns 400 Bad Request for invalid sortBy or sortOrder", async () => {
      const res1 = await request(app)
        .get("/api/staff/tickets?sortBy=maliciousField")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get("/api/staff/tickets?sortOrder=sideways")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(res2.status).toBe(400);
    });
  });
});
