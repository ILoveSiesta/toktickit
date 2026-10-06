# TokTickIT REST API Specification
**Lab 4 Actions Taken, Ticket Workflow, Dashboards, and Regression**

---

## 1. Overview & Architecture Standards

เอกสารฉบับนี้กำหนดสัญญาการเชื่อมต่อ (REST API Contract) สำหรับระบบ TokTickIT ใน Sprint 4 ซึ่งครอบคลุมระบบบันทึกการปฏิบัติงานของเจ้าหน้าที่ (Actions Taken), การควบคุมวงจรชีวิตและเกตการเปลี่ยนสถานะตั๋ว (Ticket Workflow & Resolution Gate), และระบบสรุปข้อมูลภาพรวมเชิงปฏิบัติการตามบทบาท (Role-Appropriate Dashboards)

* **Base URL:** `/api`
* **Protocol:** HTTP/1.1 or HTTP/2 over TLS
* **Default Data Format:** `application/json; charset=utf-8`
* **File Upload Format:** `multipart/form-data` (สืบทอดมาจาก Lab 2)

---

## 2. Authentication & Security Context

ทุก Endpoint ที่มีความสำคัญต้องส่ง Header ยืนยันตัวตนด้วยมาตรฐาน **Bearer Token (JWT)**:

| Header Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| **`Authorization`** | String | **Yes** (Protected Endpoints) | ส่งในรูปแบบ `Bearer <jwt_token>` |
| **`Content-Type`** | String | Conditional | `application/json` สำหรับคำขอทั่วไป |

### 2.1. Standard Token Payload
```json
{
  "sub": 2,
  "email": "michael.chang@toktickit.com",
  "name": "Michael Chang",
  "role": "IT_STAFF",
  "mustChangePassword": false,
  "iat": 1789123456,
  "exp": 1789209856
}
```

### 2.2. Standard Response & Error Formats

**Success Response (200 OK / 201 Created):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Safe Error Response (400, 401, 403, 404, 409):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "followUpNote is required when followUpRequired is true",
    "details": null
  }
}
```

---

## 3. Actions Taken API Endpoints

### 3.1. Create Action Taken
* **Endpoint:** `POST /api/tickets/:id/actions-taken`
* **Description:** บันทึกการปฏิบัติงานใหม่ภายใต้ตั๋วที่ระบุ โดยระบบจะผูก `performedById` กับผู้ใช้ที่ล็อกอินอยู่โดยอัตโนมัติ
* **Authorized Roles:** `IT_STAFF`, `ADMINISTRATOR` (Requester ส่งคำขอจะได้รับ `403 Forbidden`)
* **Request URL Params:**
  - `id` (Integer): หมายเลข ID ของตั๋ว
* **Request Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
* **Request Body Schema:**
```json
{
  "actionDateTime": "2026-10-04T10:30:00.000Z",
  "actionDescription": "Inspected internal power supply unit and replaced faulty capacitor.",
  "result": "System powered on successfully; stress test passed.",
  "followUpRequired": true,
  "followUpNote": "Monitor operating temperature after 24 hours of continuous load.",
  "attachmentNotes": "IMG_20261004_1030_board.png attached in hardware log folder"
}
```
* **Validation Rules:**
  - `actionDescription`: String, non-empty, required
  - `result`: String, non-empty, required
  - `followUpRequired`: Boolean, default `false`
  - `followUpNote`: String required if `followUpRequired == true`; otherwise nullable
  - `attachmentNotes`: String, optional
  - `actionDateTime`: ISO-8601 DateTime, optional (default `now()`)
* **Response Status Codes:**
  - `201 Created`: สร้างสำเร็จ
  - `400 Bad Request`: ข้อมูลไม่ถูกต้อง หรือไม่ได้ระบุ `followUpNote` เมื่อ `followUpRequired=true`
  - `401 Unauthorized`: ไม่ได้ส่ง Token หรือ Token หมดอายุ
  - `403 Forbidden`: ผู้ใช้ไม่ใช่ IT Staff หรือ Admin
  - `404 Not Found`: ไม่พบ Ticket ID ที่ระบุ

**Sample Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "ticketId": 15,
    "actionDateTime": "2026-10-04T10:30:00.000Z",
    "actionDescription": "Inspected internal power supply unit and replaced faulty capacitor.",
    "result": "System powered on successfully; stress test passed.",
    "performedById": 2,
    "performedBy": {
      "id": 2,
      "name": "Michael Chang",
      "email": "michael.chang@toktickit.com",
      "role": "IT_STAFF"
    },
    "followUpRequired": true,
    "followUpNote": "Monitor operating temperature after 24 hours of continuous load.",
    "attachmentNotes": "IMG_20261004_1030_board.png attached in hardware log folder",
    "createdAt": "2026-10-04T10:30:15.000Z",
    "updatedAt": "2026-10-04T10:30:15.000Z"
  }
}
```

---

### 3.2. List Actions Taken for Ticket
* **Endpoint:** `GET /api/tickets/:id/actions-taken`
* **Description:** ดึงรายการ Actions Taken ทั้งหมดภายใต้ตั๋วใบนั้น เรียงตามลำดับเวลา (`actionDateTime DESC` หรือ `ASC`)
* **Authorized Roles:** `IT_STAFF`, `ADMINISTRATOR`, `REQUESTER` (Requester ดูได้เฉพาะตั๋วของตนเองเท่านั้น)
* **Response Status Codes:**
  - `200 OK`: สำเร็จ
  - `401 Unauthorized`: ไม่ได้ส่ง Token
  - `403 Forbidden`: Requester พยายามเข้าถึงตั๋วที่ไม่ใช่ของตนเอง
  - `404 Not Found`: ไม่พบ Ticket ID

**Sample Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "ticketId": 15,
      "actionDateTime": "2026-10-04T10:30:00.000Z",
      "actionDescription": "Inspected internal power supply unit and replaced faulty capacitor.",
      "result": "System powered on successfully; stress test passed.",
      "performedById": 2,
      "performedBy": {
        "id": 2,
        "name": "Michael Chang",
        "email": "michael.chang@toktickit.com",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Monitor operating temperature after 24 hours of continuous load.",
      "attachmentNotes": "IMG_20261004_1030_board.png",
      "createdAt": "2026-10-04T10:30:15.000Z",
      "updatedAt": "2026-10-04T10:30:15.000Z"
    }
  ]
}
```

---

### 3.3. Update Action Taken
* **Endpoint:** `PUT /api/tickets/:id/actions-taken/:actionId` (or `PATCH`)
* **Description:** แก้ไขข้อมูลบันทึก Action Taken ที่มีอยู่
* **Authorized Roles:** `IT_STAFF`, `ADMINISTRATOR`
* **Request Body:**
```json
{
  "actionDateTime": "2026-10-04T10:30:00.000Z",
  "actionDescription": "Inspected internal power supply unit and replaced faulty capacitor.",
  "result": "System powered on successfully; 24-hr burn-in test passed.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "IMG_20261004_1030_board.png",
  "expectedUpdatedAt": "2026-10-04T10:30:15.000Z"
}
```
* **Validation & Concurrency Rules:**
  - `expectedUpdatedAt`: ISO-8601 String สำหรับ Optimistic Concurrency Control หากในฐานข้อมูลมีค่า `updatedAt` ใหม่กว่า จะตอบกลับด้วย `409 Conflict`
* **Response Status Codes:**
  - `200 OK`: แก้ไขสำเร็จ
  - `400 Bad Request`: ข้อมูลไม่ถูกต้อง หรือ validation ล้มเหลว
  - `403 Forbidden`: สิทธิ์ไม่เพียงพอ
  - `404 Not Found`: ไม่พบ Action Taken หรือ Ticket
  - `409 Conflict`: ตรวจพบข้อมูลขัดแย้งจากการอัปเดตพร้อมกัน

---

## 4. Ticket Lifecycle & Resolution Gate Endpoints

### 4.1. Update Ticket Status & Resolution
* **Endpoint:** `PATCH /api/tickets/:id/status` (หรือ `PATCH /api/tickets/:id`)
* **Description:** ปรับปรุงสถานะตั๋วตามแผนผัง Permitted Status Transitions หรือบันทึกสัญญาณ Advisory Resolution ของ Requester
* **Authorized Roles:** `IT_STAFF`, `ADMINISTRATOR`, `REQUESTER` (เงื่อนไขสิทธิ์ต่างกันตาม Transition Matrix)
* **Request Body (กรณี IT Staff / Admin เปลี่ยนสถานะ):**
```json
{
  "status": "RESOLVED",
  "resolutionNote": "Replaced PSU capacitor and validated system stability.",
  "expectedUpdatedAt": "2026-10-04T09:15:00.000Z"
}
```
* **Request Body (กรณี Requester ส่งสัญญาณ Advisory):**
```json
{
  "problemAppearsResolved": true
}
```
* **Business & Security Rules:**
  - **Resolution Gate Rule (Requester):** หาก Requester ส่ง `problemAppearsResolved: true` ระบบจะบันทึก `resolvedIndicated = true` โดยสถานะตั๋วจะ**คงเดิม** (ไม่เปลี่ยนเป็น `RESOLVED`)
  - **Resolution Prerequisites Enforcement (Staff/Admin):** ก่อนที่สถานะตั๋วจะเปลี่ยนเป็น `RESOLVED` ได้ ตั๋วใบนั้น**ต้องมี Ticket Owner ที่ได้รับการมอบหมายแล้ว (`ownerId != null`)** และ**ต้องมีบันทึก Actions Taken อย่างน้อย 1 รายการ (`actionsTaken.length >= 1`)** หากไม่ผ่านเกณฑ์จะปฏิเสธด้วย `400 Bad Request` (`RESOLUTION_PREREQUISITE_FAILED`)
  - **Transition Matrix Guard:** หากส่งคำขอเปลี่ยนสถานะผิดกฎ Transition Matrix (เช่น `NEW` -> `CLOSED`) ระบบตอบกลับ `400 Bad Request` (`INVALID_STATUS_TRANSITION`)
  - **Concurrency Conflict Guard:** หาก `expectedUpdatedAt` เก่ากว่า `ticket.updatedAt` ในฐานข้อมูล ระบบตอบกลับ `409 Conflict` (`STALE_UPDATE_CONFLICT`) ป้องกันการบันทึกทับซ้อน
* **Response Status Codes:**
  - `200 OK`: อัปเดตสถานะสำเร็จ
  - `400 Bad Request`: Transition ผิดกฎ หรือไม่ผ่าน Resolution Prerequisites
  - `403 Forbidden`: ไม่มีสิทธิ์เปลี่ยนเป็นสถานะนั้น
  - `409 Conflict`: Stale update conflict

---

## 5. Operational Dashboards Endpoints

### 5.1. Dashboard Global Calculation & Time Rules (Section 6.2)
* **Business Time Zone:** `Asia/Bangkok (UTC+7)`
* **Daily Date Boundaries:** ตัดรอบวันตั้งแต่เวลา `00:00:00` ถึง `23:59:59` ตามเวลาประเทศไทย
* **Date Calculations:**
  - `recentlyResolved`: นับตั๋วที่อยู่ในสถานะ `RESOLVED` ภายในช่วง 30 วันปฏิทินย้อนหลัง
  - `trends`: คำนวณความแตกต่างของจำนวนตั๋วสะสมระหว่างวันนี้ (Current Day ณ เวลาปัจจุบัน) เทียบกับวันก่อนหน้า (Yesterday ณ สิ้นสุดวัน 23:59:59)
* **Empty Behavior:** เมื่อไม่มีข้อมูลตั๋วที่ตรงตามเงื่อนไข ตัวเลขสถิติต้องส่งคืนค่า `0` (ห้ามส่งคืน `null`) และรายการตั๋วส่งคืนเป็น Array ว่าง `[]`

---

### 5.2. Requester Dashboard Data
* **Endpoint:** `GET /api/dashboard/requester`
* **Description:** ส่งคืนตัวเลขสถิติสรุปและตั๋วล่าสุดเฉพาะของผู้ใช้ Requester ที่ล็อกอินอยู่
* **Authorized Roles:** `REQUESTER` (หาก IT Staff หรือ Admin เรียก จะปฏิเสธด้วย `403 Forbidden` หรือ redirect ไปยัง staff dashboard)
* **Request Headers:**
  - `Authorization: Bearer <token>`
* **Response Status Codes:**
  - `200 OK`: สำเร็จ
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ

**Sample Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOpen": 3,
      "inProgress": 2,
      "waitingForRequester": 1,
      "recentlyResolved": 5,
      "closed": 12
    },
    "recentTickets": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-001234",
        "summary": "Laptop battery drains quickly under regular load",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "updatedAt": "2026-10-04T09:14:00.000Z"
      },
      {
        "id": 11,
        "ticketNumber": "TKT-2026-001222",
        "summary": "Request software access for Figma Enterprise",
        "status": "RESOLVED",
        "priority": "MEDIUM",
        "updatedAt": "2026-10-03T14:30:00.000Z"
      }
    ]
  }
}
```

---

### 5.3. IT Staff / Admin Dashboard Data
* **Endpoint:** `GET /api/dashboard/staff`
* **Description:** ส่งคืนตัวเลขสถิติสรุปงานปฏิบัติการสำหรับเจ้าหน้าที่ไอทีและผู้ดูแลระบบ คำนวณจากฐานข้อมูลโดยตรง
* **Authorized Roles:** `IT_STAFF`, `ADMINISTRATOR` (Requester เรียกจะได้รับ `403 Forbidden`)
* **Request Headers:**
  - `Authorization: Bearer <token>`
* **Response Status Codes:**
  - `200 OK`: สำเร็จ
  - `401 Unauthorized`: ไม่ได้เข้าสู่ระบบ
  - `403 Forbidden`: สิทธิ์ไม่เพียงพอ

**Sample Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "unassigned": 12,
      "new": 14,
      "open": 23,
      "inProgress": 18,
      "waitingForRequester": 7,
      "myAssigned": 16,
      "resolved": 35,
      "closed": 50
    },
    "trends": {
      "unassigned": "+3",
      "new": "+2",
      "open": "-1",
      "inProgress": "+4",
      "waitingForRequester": "0",
      "myAssigned": "+1"
    },
    "byPriority": {
      "CRITICAL": 3,
      "HIGH": 8,
      "MEDIUM": 25,
      "LOW": 19
    },
    "recentTickets": [
      {
        "id": 25,
        "ticketNumber": "TKT-2026-001234",
        "summary": "Laptop battery drains quickly",
        "status": "IN_PROGRESS",
        "itPriority": "HIGH",
        "ownerId": 2,
        "ownerName": "Michael Chang",
        "updatedAt": "2026-10-04T09:14:00.000Z"
      },
      {
        "id": 24,
        "ticketNumber": "TKT-2026-001230",
        "summary": "Printer keep showing offline in 4th floor",
        "status": "OPEN",
        "itPriority": "MEDIUM",
        "ownerId": null,
        "ownerName": null,
        "updatedAt": "2026-10-04T08:12:00.000Z"
      }
    ],
    "adminSummary": {
      "totalUsers": 9,
      "activeUsers": 7,
      "requestersCount": 5,
      "staffCount": 3,
      "adminCount": 1
    }
  }
}
```

---

## 6. Regression & Continued APIs Reference

ระบบใน Lab 4 ต้องคงความเข้ากันได้ 100% กับ Endpoint เดิมทั้งหมด:
* `GET /api/health` (Health check endpoint)
* `GET /api/categories` (Category list with related systems)
* `GET /api/related-systems` (Related systems reference data)
* `POST /api/auth/login` (Login with JWT)
* `POST /api/auth/logout` (Logout)
* `GET /api/auth/me` (Current user info)
* `POST /api/auth/change-password` (Change password)
* `GET /api/tickets` หรือ `GET /api/staff/queue` (Central ticket queue with search, filter, pagination; รองรับตัวกรอง `assigned=all|unassigned|mine|me|<userId>`)
* `POST /api/tickets` (Create ticket - Requester only)
* `GET /api/tickets/:id` (Ticket detail)
* `PATCH /api/tickets/:id` (Update ticket metadata, priority, assignment)
* `POST /api/tickets/:id/attachments` (Upload attachments)
* `GET /api/attachments/:id/download` (Download attachment)
* `DELETE /api/attachments/:id` (Soft delete attachment)
* `GET /api/tickets/:id/comments` (Get public comments)
* `POST /api/tickets/:id/comments` (Post public comment)
* `GET /api/tickets/:id/internal-notes` (Get internal notes - Staff/Admin only)
* `POST /api/tickets/:id/internal-notes` (Post internal note - Staff/Admin only)
* `GET /api/admin/users` (Admin user list)
* `POST /api/admin/users` (Admin create user)
* `PATCH /api/admin/users/:id` (Admin update user / deactivate)
* `POST /api/admin/users/:id/reset-password` (Admin reset initial password)

