import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("PERF-01: Dashboard Aggregation API Latency Smoke Test (NFR-04)", () => {
  let requesterToken: string;
  let staffToken: string;

  beforeAll(async () => {
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    staffToken = staffLogin.body.data.token;

    const requesterLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    requesterToken = requesterLogin.body.data.token;
  });

  it("responds to GET /api/requester/dashboard in under 200ms", async () => {
    // Warm-up query
    await request(app)
      .get("/api/requester/dashboard")
      .set("Authorization", `Bearer ${requesterToken}`);

    const start = performance.now();
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Authorization", `Bearer ${requesterToken}`);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(duration).toBeLessThan(200);
  });

  it("responds to GET /api/staff/dashboard in under 200ms", async () => {
    // Warm-up query
    await request(app)
      .get("/api/staff/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    const start = performance.now();
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(duration).toBeLessThan(200);
  });
});
