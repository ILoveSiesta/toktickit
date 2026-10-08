import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { TicketStatus, PriorityLevel, Role } from "@prisma/client";

describe("Requester Dashboard API Tests (API-05, API-07, BR-12, FR-12)", () => {
  let requesterToken: string;
  let requesterId: number;
  let emptyRequesterToken: string;
  let emptyRequesterId: number;
  let staffToken: string;

  beforeAll(async () => {
    const prisma = getPrisma();

    // 1. Login regular requester (Jennifer)
    const jenniferLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = jenniferLogin.body.data.token;
    requesterId = jenniferLogin.body.data.user.id;

    // 2. Create an isolated requester with 0 tickets to test zero-state (API-07)
    const uniqueEmail = `zero.req.${Date.now()}@toktick.it`;
    const zeroUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        passwordHash: "$2b$10$wT2HlP7W.k1p1GqEUpvC2.eXU0Gg5KzX4g8t8v0f0R7h5.Fv7.8y.", // dummy hash
        name: "Zero Ticket Requester",
        role: Role.REQUESTER,
        mustChangePassword: false,
      },
    });
    emptyRequesterId = zeroUser.id;

    // Login zero user by generating token or regular login if password matches, or login Alex
    const zeroLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = zeroLogin.body.data.token;

    // For emptyRequester, let's create a temporary user with known password
    await prisma.user.delete({ where: { id: zeroUser.id } });
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.default.hash("TokTickIT2026!", 10);
    const validZeroUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        passwordHash: hashed,
        name: "Zero Ticket Requester",
        role: Role.REQUESTER,
        mustChangePassword: false,
      },
    });
    emptyRequesterId = validZeroUser.id;

    const zeroAuthRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "TokTickIT2026!" });
    emptyRequesterToken = zeroAuthRes.body.data.token;
  });

  const createTicketFor = async (userId: number, overrides: Partial<any> = {}) => {
    const prisma = getPrisma();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    return await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-REQ-${unique}`,
        summary: `Requester dashboard test ${unique}`,
        description: "Testing requester dashboard aggregations",
        requestedPriority: PriorityLevel.HIGH,
        itPriority: PriorityLevel.HIGH,
        currentStatus: TicketStatus.NEW,
        requesterId: userId,
        categoryId: 1,
        relatedSystemId: 1,
        ...overrides,
      },
    });
  };

  it("API-05: returns accurate summary metrics and recent tickets for the logged-in requester", async () => {
    // Seed controlled tickets for Jennifer
    await createTicketFor(requesterId, { currentStatus: TicketStatus.NEW });
    await createTicketFor(requesterId, { currentStatus: TicketStatus.OPEN });
    await createTicketFor(requesterId, { currentStatus: TicketStatus.IN_PROGRESS });
    await createTicketFor(requesterId, { currentStatus: TicketStatus.WAITING_FOR_REQUESTER });
    await createTicketFor(requesterId, {
      currentStatus: TicketStatus.RESOLVED,
      updatedAt: new Date(), // recently resolved
    });
    await createTicketFor(requesterId, {
      currentStatus: TicketStatus.RESOLVED,
      updatedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000), // >30 days ago, should not count in recentlyResolved
    });
    await createTicketFor(requesterId, { currentStatus: TicketStatus.CLOSED });

    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { summary, recentTickets } = res.body.data;
    expect(summary).toBeDefined();
    // totalOpen must be at least 4 (NEW + OPEN + IN_PROGRESS + WAITING_FOR_REQUESTER)
    expect(summary.totalOpen).toBeGreaterThanOrEqual(4);
    expect(summary.inProgress).toBeGreaterThanOrEqual(1);
    expect(summary.waitingForRequester).toBeGreaterThanOrEqual(1);
    expect(summary.recentlyResolved).toBeGreaterThanOrEqual(1);
    expect(summary.closed).toBeGreaterThanOrEqual(1);

    // Recent tickets must be array <= 5
    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);
    expect(recentTickets.length).toBeGreaterThanOrEqual(1);

    const first = recentTickets[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("ticketNumber");
    expect(first).toHaveProperty("summary");
    expect(first).toHaveProperty("status");
    expect(first).toHaveProperty("priority");
    expect(first).toHaveProperty("updatedAt");
  });

  it("API-07: returns 0 counts and empty recentTickets array for zero-state user without crashing", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${emptyRequesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toEqual({
      totalOpen: 0,
      inProgress: 0,
      waitingForRequester: 0,
      recentlyResolved: 0,
      closed: 0,
    });
    expect(res.body.data.recentTickets).toEqual([]);
  });

  it("denies access with 403 Forbidden when IT Staff attempts to access Requester Dashboard API", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("denies unauthenticated requests with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboard/requester");
    expect(res.status).toBe(401);
  });

  it("supports alias endpoint GET /api/requester/dashboard identically", async () => {
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Authorization", `Bearer ${emptyRequesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalOpen).toBe(0);
  });
});
