import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("API-01: GET /api/requesters (Active Development Requesters)", () => {
  it("should return HTTP 200 and a list of active development requesters", async () => {
    const res = await request(app).get("/api/requesters");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    // Verify all returned requesters are active
    res.body.forEach((requester: { id: number; name: string; email: string; isActive: boolean }) => {
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
      expect(requester.isActive).toBe(true);
    });

    // Verify inactive requester is NOT returned
    const inactiveUser = res.body.find(
      (r: { email: string; name: string }) => r.email === "alex.inactive@toktick.it" || r.name === "Alex Inactive"
    );
    expect(inactiveUser).toBeUndefined();
  });
});
