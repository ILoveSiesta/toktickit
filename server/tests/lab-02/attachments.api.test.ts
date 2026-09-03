import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("API-10, API-11, API-12, API-13: Attachment Operations (Download, Soft-Removal, Post-Creation Addition)", () => {
  let ticketId: number;
  let attachmentId: number;

  beforeAll(async () => {
    // Create Ticket with 1 attachment for Requester 1
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("summary", "Attachment lifecycle test ticket")
      .field("description", "Testing attachment operations.")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "LOW")
      .attach("files", Buffer.from("Sample file content test"), {
        filename: "test_doc.pdf",
        contentType: "application/pdf",
      });

    ticketId = res.body.data.id;
    attachmentId = res.body.data.attachments[0].id;
  });

  it("API-10: downloads an active attachment belonging to the owner (200 OK)", async () => {
    const res = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("test_doc.pdf");
  });

  it("API-13: uploads an additional attachment to the existing ticket (201 Created)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("X-Requester-Id", "1")
      .attach("files", Buffer.from("extra image content"), {
        filename: "extra_screenshot.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].originalFileName).toBe("extra_screenshot.png");
  });

  it("API-11: rejects soft-removal when reason is missing or less than 3 characters (400 Bad Request)", async () => {
    const resShort = await request(app)
      .patch(`/api/attachments/${attachmentId}/remove`)
      .set("X-Requester-Id", "1")
      .send({ removalReason: "no" });

    expect(resShort.status).toBe(400);
    expect(resShort.body).toHaveProperty("success", false);
  });

  it("API-11: soft-removes an attachment with a mandatory reason >= 3 chars and returns ticketId (200 OK)", async () => {
    const res = await request(app)
      .patch(`/api/attachments/${attachmentId}/remove`)
      .set("X-Requester-Id", "1")
      .send({ removalReason: "Uploaded wrong document by mistake" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("isRemoved", true);
    expect(res.body.data).toHaveProperty("ticketId", ticketId);
    expect(res.body.data).toHaveProperty("removalReason", "Uploaded wrong document by mistake");
  });

  it("API-12: blocks download of soft-removed attachment and returns 404 Not Found", async () => {
    const res = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
  });
});
