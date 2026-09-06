import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("API-02: Reference Data Endpoints", () => {
  it("GET /api/categories should return active categories with id and name", async () => {
    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    const categoryNames = res.body.map((c: { name: string }) => c.name);
    expect(categoryNames).toContain("Account and Access");
    expect(categoryNames).toContain("Hardware");
    expect(categoryNames).toContain("Software");
    expect(categoryNames).toContain("Network");
  });

  it("GET /api/related-systems should return active related systems with id and name", async () => {
    const res = await request(app).get("/api/related-systems");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);

    const systemNames = res.body.map((s: { name: string }) => s.name);
    expect(systemNames).toContain("Email");
    expect(systemNames).toContain("Campus Wi-Fi");
    expect(systemNames).toContain("VPN");
    expect(systemNames).toContain("LEB2 App");
  });
});
