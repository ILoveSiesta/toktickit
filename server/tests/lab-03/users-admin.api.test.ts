import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { Role } from "@prisma/client";

describe("Lab 3 Administrator User Management API Tests (API-20 to API-26)", () => {
  let adminToken: string;
  let adminUser: any;
  let staffToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // 1. Obtain Administrator credentials (John Smith)
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.com", password: "TokTickIT2026!" });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;
    adminUser = adminLogin.body.data.user;

    // 2. Obtain IT Staff credentials (Alex Thompson)
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff@toktickit.com", password: "TokTickIT2026!" });
    expect(staffLogin.status).toBe(200);
    staffToken = staffLogin.body.data.token;

    // 3. Obtain Requester credentials (Jennifer Anderson)
    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer@toktick.it", password: "TokTickIT2026!" });
    expect(reqLogin.status).toBe(200);
    requesterToken = reqLogin.body.data.token;
  });

  // API-20: Admin user listing with search & filter
  describe("API-20: GET /api/admin/users", () => {
    it("returns list of all users for administrator with correct payload structure", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const firstUser = res.body.data[0];
      expect(firstUser).toHaveProperty("id");
      expect(firstUser).toHaveProperty("name");
      expect(firstUser).toHaveProperty("email");
      expect(firstUser).toHaveProperty("role");
      expect(firstUser).toHaveProperty("isActive");
      expect(firstUser).toHaveProperty("mustChangePassword");
      expect(firstUser).not.toHaveProperty("passwordHash");
    });

    it("filters users by name search (case-insensitive)", async () => {
      const res = await request(app)
        .get("/api/admin/users?search=jennifer")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const u of res.body.data) {
        expect(
          u.name.toLowerCase().includes("jennifer") || u.email.toLowerCase().includes("jennifer")
        ).toBe(true);
      }
    });

    it("filters users by email search (case-insensitive)", async () => {
      const res = await request(app)
        .get("/api/admin/users?search=toktickit.com")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const u of res.body.data) {
        expect(
          u.name.toLowerCase().includes("toktickit.com") ||
            u.email.toLowerCase().includes("toktickit.com")
        ).toBe(true);
      }
    });

    it("filters users by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=IT_STAFF")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const u of res.body.data) {
        expect(u.role).toBe("IT_STAFF");
      }
    });

    it("combines search and role filters", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=REQUESTER&search=Jennifer")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const u of res.body.data) {
        expect(u.role).toBe("REQUESTER");
        expect(
          u.name.toLowerCase().includes("jennifer") || u.email.toLowerCase().includes("jennifer")
        ).toBe(true);
      }
    });
  });

  // API-21 & API-22: Admin creates new user & duplicate email rejection
  describe("API-21 & API-22: POST /api/admin/users", () => {
    const testTimestamp = Date.now();
    const newUserEmail = `newuser_${testTimestamp}@toktickit.com`;

    it("creates a new user with initial password and forces mustChangePassword = true (BR-24)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Engineer User",
          email: newUserEmail,
          role: "IT_STAFF",
          department: "Infrastructure Support",
          isActive: true,
          initialPassword: "InitialSecure2026!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe(newUserEmail.toLowerCase());
      expect(res.body.data.role).toBe("IT_STAFF");
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.mustChangePassword).toBe(true);
      expect(res.body.data).not.toHaveProperty("passwordHash");

      // Verify that created user can authenticate with initial password and has mustChangePassword = true
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: newUserEmail,
          password: "InitialSecure2026!",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.mustChangePassword).toBe(true);
    });

    it("API-22: rejects duplicate email with 409 Conflict (case-insensitive) (BR-23)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate Email Attempt",
          email: newUserEmail.toUpperCase(), // Same email in uppercase
          role: "REQUESTER",
          initialPassword: "InitialSecure2026!",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
      expect(res.body.error.message).toContain("already in use");
    });

    it("rejects user creation with missing or invalid fields (400 Bad Request)", async () => {
      // Name too short
      const res1 = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "A",
          email: `invalid_${Date.now()}@toktickit.com`,
          role: "IT_STAFF",
          initialPassword: "ValidPassword123!",
        });
      expect(res1.status).toBe(400);

      // Invalid email
      const res2 = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Valid Name",
          email: "not-an-email",
          role: "IT_STAFF",
          initialPassword: "ValidPassword123!",
        });
      expect(res2.status).toBe(400);

      // Invalid role
      const res3 = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Valid Name",
          email: `valid_${Date.now()}@toktickit.com`,
          role: "SUPER_ADMIN",
          initialPassword: "ValidPassword123!",
        });
      expect(res3.status).toBe(400);

      // Password too short (< 8 chars)
      const res4 = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Valid Name",
          email: `valid_${Date.now()}@toktickit.com`,
          role: "IT_STAFF",
          initialPassword: "short",
        });
      expect(res4.status).toBe(400);
    });
  });

  // API-23, API-24, API-25: Admin edits user info & safety guardrails
  describe("API-23, API-24, API-25: PATCH /api/admin/users/:id", () => {
    let createdUserId: number;
    const userEmail = `edit_test_${Date.now()}@toktickit.com`;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "User To Edit",
          email: userEmail,
          role: "REQUESTER",
          initialPassword: "InitialPass2026!",
        });
      createdUserId = res.body.data.id;
    });

    it("API-23: updates user name, department, role, and activation status", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "User Edited Successfully",
          role: "IT_STAFF",
          department: "Helpdesk",
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("User Edited Successfully");
      expect(res.body.data.role).toBe("IT_STAFF");
      expect(res.body.data.isActive).toBe(false);
    });

    it("returns 404 for non-existent user ID", async () => {
      const res = await request(app)
        .patch("/api/admin/users/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Does Not Exist" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 409 Conflict when updating email to an existing email (BR-23)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "admin@toktickit.com" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    // API-24: Self-Deactivation Prevention (BR-25)
    it("API-24: prevents administrator from deactivating their own account (BR-25)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("SELF_DEACTIVATION_PROHIBITED");
      expect(res.body.error.message).toContain("cannot deactivate your own");
    });

    // API-25: Last Active Administrator Protection (BR-26)
    it("API-25: prevents deactivating or demoting the last active administrator (BR-26)", async () => {
      // Query how many active admins exist
      const listRes = await request(app)
        .get("/api/admin/users?role=ADMINISTRATOR")
        .set("Authorization", `Bearer ${adminToken}`);
      const activeAdmins = listRes.body.data.filter((u: any) => u.isActive);

      if (activeAdmins.length === 1) {
        const onlyAdmin = activeAdmins[0];

        // Attempt to demote role
        const demoteRes = await request(app)
          .patch(`/api/admin/users/${onlyAdmin.id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ role: "IT_STAFF" });

        expect(demoteRes.status).toBe(400);
        expect(demoteRes.body.success).toBe(false);
        expect(demoteRes.body.error.code).toBe("LAST_ACTIVE_ADMIN_PROTECTION");
        expect(demoteRes.body.error.message).toContain("last active administrator");
      } else {
        // If multiple exist, deactivating one down to 1 should be tested
        expect(activeAdmins.length).toBeGreaterThan(0);
      }
    });

    it("allows deactivating or demoting an admin when multiple active admins exist", async () => {
      // Create a second administrator
      const secondAdminEmail = `admin2_${Date.now()}@toktickit.com`;
      const createRes = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Second Administrator",
          email: secondAdminEmail,
          role: "ADMINISTRATOR",
          isActive: true,
          initialPassword: "AdminSecure2026!",
        });
      expect(createRes.status).toBe(201);
      const secondAdminId = createRes.body.data.id;

      // Admin 1 deactivates Admin 2 (allowed since 2 active admins existed and not self-deactivation)
      const deactivateRes = await request(app)
        .patch(`/api/admin/users/${secondAdminId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.success).toBe(true);
      expect(deactivateRes.body.data.isActive).toBe(false);

      // Now that Admin 2 is inactive, attempting to demote or deactivate Admin 2 again is fine or already inactive,
      // but attempting to deactivate Admin 2's role demotion when inactive:
      // More importantly, Admin 1 is now the sole active admin. Attempting to demote Admin 1 must fail:
      const failDemoteRes = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "IT_STAFF" });

      expect(failDemoteRes.status).toBe(400);
      expect(failDemoteRes.body.error.code).toBe("LAST_ACTIVE_ADMIN_PROTECTION");
    });
  });

  // API-26: Reset initial password
  describe("API-26: POST /api/admin/users/:id/reset-password", () => {
    let targetUser: any;
    const userEmail = `reset_target_${Date.now()}@toktickit.com`;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Reset Target User",
          email: userEmail,
          role: "REQUESTER",
          initialPassword: "InitialPass2026!",
        });
      targetUser = res.body.data;
    });

    it("resets initial password and sets mustChangePassword = true (BR-24)", async () => {
      const newPassword = "NewResetPassword2026!";
      const res = await request(app)
        .post(`/api/admin/users/${targetUser.id}/reset-password`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ newInitialPassword: newPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mustChangePassword).toBe(true);

      // Verify that user can log in with new password and mustChangePassword is true
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: userEmail,
          password: newPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.mustChangePassword).toBe(true);
    });

    it("rejects password reset with password shorter than 8 characters", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetUser.id}/reset-password`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ newInitialPassword: "short" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when resetting password for non-existent user", async () => {
      const res = await request(app)
        .post("/api/admin/users/999999/reset-password")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ newInitialPassword: "ValidNewPass2026!" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Role Protection & Server-side Authorization (BR-22)
  describe("BR-22: Role Protection for Admin Endpoints", () => {
    it("blocks Requester from accessing GET /api/admin/users (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks IT Staff from accessing POST /api/admin/users (403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Hacker Attempt",
          email: "hacker@test.com",
          role: "ADMINISTRATOR",
          initialPassword: "InitialPass2026!",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks Requester from accessing PATCH /api/admin/users/:id (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.id}`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send({ name: "Unauthorized Change" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks IT Staff from accessing POST /api/admin/users/:id/reset-password (403 Forbidden)", async () => {
      const res = await request(app)
        .post(`/api/admin/users/${adminUser.id}/reset-password`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ newInitialPassword: "NewPassHacked123!" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks Unauthenticated access to admin endpoints (401 Unauthorized)", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });
  });
});
