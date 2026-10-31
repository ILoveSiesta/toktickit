import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { TicketStatus, PriorityLevel, Role } from "@prisma/client";

describe("IT Staff Dashboard API Tests (API-06, AUTH-04, BR-13, BR-14, FR-13)", () => {
  let staffToken: string;
  let staffId: number;
  let adminToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // 1. Staff Alex
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = staffLogin.body.data.token;
    staffId = staffLogin.body.data.user.id;

    // 2. Admin
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "TokTickIT2026!" });
    adminToken = adminLogin.body.data.token;

    // 3. Requester Jennifer
    const requesterLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = requesterLogin.body.data.token;
  });

  const createTicket = async (overrides: Partial<any> = {}) => {
    const prisma = getPrisma();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    return await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STF-${unique}`,
        summary: `Staff dashboard test ticket ${unique}`,
        description: "Testing staff operational aggregations and metrics",
        requestedPriority: PriorityLevel.HIGH,
        itPriority: PriorityLevel.HIGH,
        currentStatus: TicketStatus.NEW,
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        ...overrides,
      },
    });
  };

  it("API-06: returns operational metrics (unassigned, new, open, inProgress, waitingForRequester, myAssigned, trends, byPriority)", async () => {
    // Seed tickets: 1 unassigned NEW, 1 unassigned OPEN, 1 assigned to Alex IN_PROGRESS
    await createTicket({
      currentStatus: TicketStatus.NEW,
      ticketOwnerId: null,
      itPriority: PriorityLevel.CRITICAL,
    });
    await createTicket({
      currentStatus: TicketStatus.OPEN,
      ticketOwnerId: null,
      itPriority: PriorityLevel.HIGH,
    });
    await createTicket({
      currentStatus: TicketStatus.IN_PROGRESS,
      ticketOwnerId: staffId,
      itPriority: PriorityLevel.MEDIUM,
    });
    await createTicket({
      currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
      ticketOwnerId: staffId,
      itPriority: PriorityLevel.LOW,
    });

    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { summary, trends, byPriority, recentTickets, adminSummary } = res.body.data;

    // 1. Summary metric checks
    expect(summary).toBeDefined();
    expect(summary.unassigned).toBeGreaterThanOrEqual(2);
    expect(summary.new).toBeGreaterThanOrEqual(1);
    expect(summary.open).toBeGreaterThanOrEqual(1);
    expect(summary.inProgress).toBeGreaterThanOrEqual(1);
    expect(summary.waitingForRequester).toBeGreaterThanOrEqual(1);
    expect(summary.myAssigned).toBeGreaterThanOrEqual(2);
    expect(summary.resolved).toBeGreaterThanOrEqual(0);
    expect(summary.closed).toBeGreaterThanOrEqual(0);

    // 2. Trends checks (+X, -X, or 0)
    expect(trends).toBeDefined();
    expect(typeof trends.unassigned).toBe("string");
    expect(typeof trends.new).toBe("string");
    expect(typeof trends.open).toBe("string");
    expect(typeof trends.inProgress).toBe("string");
    expect(typeof trends.waitingForRequester).toBe("string");
    expect(typeof trends.myAssigned).toBe("string");
    expect(trends.unassigned).toMatch(/^(\+|\-)?\d+$/);

    // 3. Priority distribution checks
    expect(byPriority).toBeDefined();
    expect(byPriority.CRITICAL).toBeGreaterThanOrEqual(1);
    expect(byPriority.HIGH).toBeGreaterThanOrEqual(1);
    expect(byPriority.MEDIUM).toBeGreaterThanOrEqual(1);
    expect(byPriority.LOW).toBeGreaterThanOrEqual(1);

    // 4. Recent tickets checks (up to 10)
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(10);
    expect(recentTickets.length).toBeGreaterThanOrEqual(1);
    const sample = recentTickets[0];
    expect(sample).toHaveProperty("id");
    expect(sample).toHaveProperty("ticketNumber");
    expect(sample).toHaveProperty("summary");
    expect(sample).toHaveProperty("status");
    expect(sample).toHaveProperty("itPriority");
    expect(sample).toHaveProperty("updatedAt");

    // 5. User summary checks
    expect(adminSummary).toBeDefined();
    expect(adminSummary.totalUsers).toBeGreaterThanOrEqual(1);
    expect(adminSummary.activeUsers).toBeGreaterThanOrEqual(1);
  });

  it("AUTH-04: rejects Requester attempting to access Staff Dashboard API with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("denies unauthenticated requests with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboard/staff");
    expect(res.status).toBe(401);
  });

  it("allows Administrator to access Staff Dashboard with full user summary", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.adminSummary.adminCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.adminSummary.staffCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.adminSummary.requestersCount).toBeGreaterThanOrEqual(1);
  });

  it("supports alias endpoint GET /api/staff/dashboard identically", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });
});
