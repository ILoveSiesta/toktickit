import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("API-03, API-04, API-05: POST /api/tickets (Ticket Creation)", () => {
  it("API-03: creates a valid ticket with X-Requester-Id header and returns 201", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "Cannot connect to campus WiFi")
      .field("description", "Authentication timeout error occurring in Building 3 second floor.")
      .field("categoryId", "4")
      .field("relatedSystemId", "2")
      .field("requestedPriority", "HIGH")
      .attach("files", Buffer.from("fake image data"), {
        filename: "wifi_error.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("ticketNumber");
    expect(res.body.data.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.data.currentStatus).toBe("NEW");
    expect(res.body.data.requesterId).toBe(1);
    expect(res.body.data.attachments).toHaveLength(1);
    expect(res.body.data.attachments[0].originalFileName).toBe("wifi_error.png");
  });

  it("API-04: returns 400 Bad Request when required fields are missing or invalid", async () => {
    // Missing summary and short description
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .send({
        summary: "",
        description: "short",
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "HIGH",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.error).toHaveProperty("message");
  });

  it("API-05: returns 400 Bad Request when an unpermitted file type is attached", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "Valid ticket summary here")
      .field("description", "Valid ticket description with more than 10 characters.")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM")
      .attach("files", Buffer.from("executable"), {
        filename: "malware.exe",
        contentType: "application/x-msdownload",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });

  it("API-05: returns 400 Bad Request when more than 5 files are attached", async () => {
    const req = request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "Valid ticket summary here")
      .field("description", "Valid ticket description with more than 10 characters.")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM");

    // Attach 6 files
    for (let i = 1; i <= 6; i++) {
      req.attach("files", Buffer.from(`file content ${i}`), {
        filename: `image_${i}.png`,
        contentType: "image/png",
      });
    }

    const res = await req;
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("success", false);
  });
});
