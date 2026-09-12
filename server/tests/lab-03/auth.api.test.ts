import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 3 Auth API Tests (API-01 to API-06)", () => {
  const validUserEmail = "jennifer@toktick.it";
  const validPassword = "TokTickIT2026!";
  const inactiveEmail = "alex.inactive@toktick.it";

  beforeEach(async () => {
    const prisma = getPrisma();
    await prisma.user.updateMany({
      where: { email: "kevin.staff@toktickit.com" },
      data: {
        mustChangePassword: true,
        passwordHash: "$2b$10$TYOxRqRTTQWjtHd9/n0SFeW/a0BHPBcXxE6yF35stYJUbsKDBghIK",
      },
    });
  });

  afterAll(async () => {
    const prisma = getPrisma();
    await prisma.user.updateMany({
      where: { email: "kevin.staff@toktickit.com" },
      data: {
        mustChangePassword: true,
        passwordHash: "$2b$10$TYOxRqRTTQWjtHd9/n0SFeW/a0BHPBcXxE6yF35stYJUbsKDBghIK",
      },
    });
  });

  // API-01: Valid user authentication
  it("API-01: logs in with valid credentials, returns 200 OK and JWT token with user info", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUserEmail, password: validPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("token");
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user).toHaveProperty("email", validUserEmail);
    expect(res.body.data.user).toHaveProperty("role", "REQUESTER");
    expect(res.body.data.user).toHaveProperty("name", "Jennifer Anderson");
  });

  // API-02: Invalid email or password
  it("API-02: returns 401 Unauthorized with safe error message when credentials are invalid", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUserEmail, password: "WrongPassword123!" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("code", "INVALID_CREDENTIALS");
    expect(res.body.error.message).toMatch(/invalid email or password/i);
  });

  // API-03: Inactive user login attempt
  it("API-03: returns 403 Forbidden with safe message when user account is inactive", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: inactiveEmail, password: validPassword });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("code", "ACCOUNT_INACTIVE");
    expect(res.body.error.message).toMatch(/inactive/i);
  });

  // API-04: Current user session retrieval (/api/auth/me)
  it("API-04: returns current user profile when valid Bearer token is provided", async () => {
    // First login to obtain token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validUserEmail, password: validPassword });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty("success", true);
    expect(meRes.body.data).toHaveProperty("email", validUserEmail);
    expect(meRes.body.data).toHaveProperty("role", "REQUESTER");
    expect(meRes.body.data).toHaveProperty("name", "Jennifer Anderson");
  });

  it("API-04 (Negative): returns 401 Unauthorized for /api/auth/me when token is missing or invalid", async () => {
    const res1 = await request(app).get("/api/auth/me");
    expect(res1.status).toBe(401);

    const res2 = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.value");
    expect(res2.status).toBe(401);
  });

  // API-05: User logout action
  it("API-05: returns 200 OK on user logout", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("message");
  });

  // API-06: First-login password change
  it("API-06: changes password with complexity check and clears mustChangePassword flag", async () => {
    // Kevin Patel has mustChangePassword = true from seed
    const kevinEmail = "kevin.staff@toktickit.com";
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: kevinEmail, password: validPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);
    const token = loginRes.body.data.token;

    // Fail if new password is too simple
    const weakChangeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: validPassword,
        newPassword: "short",
        confirmPassword: "short",
      });

    expect(weakChangeRes.status).toBe(400);
    expect(weakChangeRes.body.error.code).toBe("INVALID_PASSWORD_COMPLEXITY");

    // Fail if new password equals current password
    const sameChangeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: validPassword,
        newPassword: validPassword,
        confirmPassword: validPassword,
      });

    expect(sameChangeRes.status).toBe(400);
    expect(sameChangeRes.body.error.code).toBe("SAME_PASSWORD");

    // Successful change with complex password
    const newComplexPassword = "BrandNewSecret2026!";
    const successChangeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: validPassword,
        newPassword: newComplexPassword,
        confirmPassword: newComplexPassword,
      });

    expect(successChangeRes.status).toBe(200);
    expect(successChangeRes.body).toHaveProperty("success", true);
    expect(successChangeRes.body.data).toHaveProperty("token");

    // Verify Kevin can now login with new password and mustChangePassword is false
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: kevinEmail, password: newComplexPassword });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.user.mustChangePassword).toBe(false);

    // Reset password back for idempotent testing
    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${newLoginRes.body.data.token}`)
      .send({
        currentPassword: newComplexPassword,
        newPassword: validPassword,
        confirmPassword: validPassword,
      });
  });
});
