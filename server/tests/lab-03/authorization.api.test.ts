import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Lab 3 Authorization & RBAC API Tests (API-07 & API-09)", () => {
  let requesterToken: string;
  let staffToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // 1. Obtain Requester token (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = reqLogin.body.data.token;

    // 2. Obtain IT Staff token (Alex Thompson)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = staffLogin.body.data.token;

    // 3. Obtain Administrator token (John Smith)
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "TokTickIT2026!" });
    adminToken = adminLogin.body.data.token;
  });

  // API-07: Direct Requester ID spoofing prevention
  it("API-07: ignores client-supplied requesterId and strictly applies token identity", async () => {
    // Requester 1 (Jennifer) sends request with spoofed header and body pretending to be Requester 2 (Michael)
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .set("X-Requester-Id", "2") // Spoofed header
      .field("summary", "Anti-spoofing verification ticket")
      .field("description", "Testing that token identity strictly overrides client-supplied requesterId.")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM")
      .field("requesterId", "2"); // Spoofed field

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // The created ticket's requesterId must match Jennifer (token owner), NOT 2
    expect(res.body.data.requesterId).toBe(1);
    expect(res.body.data.requesterId).not.toBe(2);
  });

  // API-09: Non-Admin requests Admin APIs
  it("API-09: blocks Requester and IT Staff from accessing Admin APIs with 403 Forbidden", async () => {
    // Requester attempt
    const reqRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(reqRes.status).toBe(403);
    expect(reqRes.body.success).toBe(false);
    expect(reqRes.body.error.code).toBe("FORBIDDEN");

    // IT Staff attempt
    const staffRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(staffRes.status).toBe(403);
    expect(staffRes.body.success).toBe(false);
    expect(staffRes.body.error.code).toBe("FORBIDDEN");

    // Unauthenticated attempt
    const unauthRes = await request(app).get("/api/admin/users");
    expect(unauthRes.status).toBe(401);

    // Administrator attempt (permitted)
    const adminRes = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(Array.isArray(adminRes.body.data)).toBe(true);
  });
});
