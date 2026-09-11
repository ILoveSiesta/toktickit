# TokTickIT REST API Specification
**Lab 3 Users, Roles, IT Staff Ticketing, and Admin Operations**

---

## 1. Overview & Architecture Standards

เอกสารฉบับนี้กำหนดสัญญาการเชื่อมต่อ (REST API Contract) สำหรับระบบ TokTickIT ใน Sprint 3 ซึ่งครอบคลุมระบบ Authentication, Role-Based Access Control (RBAC), IT Staff Ticket Queue & Operations, Public Comments & Internal Notes, และ Administrator User Management

* **Base URL:** `/api`
* **Protocol:** HTTP/1.1 or HTTP/2 over TLS
* **Default Data Format:** `application/json; charset=utf-8`
* **File Upload Format:** `multipart/form-data` (สำหรับฟังก์ชันการแนบไฟล์ที่สืบทอดมาจาก Lab 2)

---

## 2. Global Headers & Security Context

### 2.1. Authentication Header
ใน Lab 3 ระบบได้ยกเลิก Header จำลอง `X-Requester-Id` และเปลี่ยนมาใช้มาตรฐาน **Bearer Token (JWT)** ในการยืนยันตัวตน:

| Header Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| **`Authorization`** | String | **Yes** (สำหรับทุก Protected Endpoint) | ส่งในรูปแบบ `Bearer <jwt_token>` เพื่อระบุตัวตนและบทบาทของผู้ใช้ |
| **`Content-Type`** | String | Conditional | `application/json` สำหรับคำขอทั่วไป หรือ `multipart/form-data` เมื่อส่งไฟล์ |

### 2.2. Standard Token Payload Structure
Token ประกอบด้วย Claims ที่จำเป็นสำหรับการยืนยันตัวตนและการตรวจสอบสิทธิ์ขั้นต้น:
```json
{
  "sub": 1,
  "email": "jennifer.anderson@toktickit.com",
  "name": "Jennifer Anderson",
  "role": "REQUESTER",
  "mustChangePassword": false,
  "iat": 1789123456,
  "exp": 1789209856
}
```

---

## 3. Standard Response & Safe Error Formats

### 3.1. Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

สำหรับรายการที่มี Pagination:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 87,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3.2. Standard Error Response
ระบบใช้โครงสร้างข้อผิดพลาดที่เป็นมาตรฐานเดียวกันทั่วทั้งระบบ และไม่เปิดเผย Stack Trace หรือข้อมูลที่ละเอียดอ่อนออกสู่ภายนอก:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted input failed validation rules.",
    "details": [
      {
        "field": "email",
        "message": "Email address is already in use."
      }
    ]
  }
}
```

### 3.3. HTTP Status Codes & Safe Failure Policy
* **`200 OK`**: การดึงข้อมูล หรือการอัปเดตข้อมูลสำเร็จ
* **`201 Created`**: การสร้างทรัพยากรใหม่สำเร็จ (เช่น สร้างตั๋ว, สร้างผู้ใช้, โพสต์ความคิดเห็น)
* **`400 Bad Request`**: ข้อมูล Payload ผิดรูปแบบ, ค่าพารามิเตอร์ไม่ผ่าน Validation หรือการเปลี่ยนสถานะผิดกฎ Transition Matrix
* **`401 Unauthorized`**: ผู้ใช้ยังไม่ได้ล็อกอิน, Token หมดอายุ หรือข้อมูลรับรองตัวตนไม่ถูกต้อง
* **`403 Forbidden`**: ผู้ใช้ล็อกอินแล้วแต่ไม่มีบทบาทหรือสิทธิ์ในการเข้าถึงทรัพยากรนั้น (เช่น Requester พยายามดู Internal Notes หรือ Non-Admin พยายามเข้าหน้า User Management)
* **`404 Not Found`**: ไม่พบข้อมูลทรัพยากร หรือใช้เพื่อ **Safe Failure** ป้องกันการเดาการมีอยู่ของตั๋วของผู้อื่น
* **`409 Conflict`**: เกิดข้อขัดแย้งของข้อมูล เช่น การใช้อีเมลซ้ำในระบบ
* **`500 Internal Server Error`**: ข้อผิดพลาดภายในที่ไม่คาดคิด โดย Backend จะส่งข้อความทั่วไป `"An unexpected server error occurred."`

---

## 4. Authorization Matrix

| Endpoint Group | Endpoint | Requester | IT Staff | Administrator |
| :--- | :--- | :---: | :---: | :---: |
| **Auth** | `POST /api/auth/login` | Public | Public | Public |
| | `POST /api/auth/logout` | Allowed | Allowed | Allowed |
| | `GET /api/auth/me` | Allowed | Allowed | Allowed |
| | `POST /api/auth/change-password` | Allowed | Allowed | Allowed |
| **Requester Tickets** | `GET /api/tickets` | Owned only | Blocked (use Queue) | Blocked (use Queue) |
| | `POST /api/tickets` | Allowed | Allowed (as creator) | Allowed (as creator) |
| | `GET /api/tickets/:id` | Owned only | Allowed | Allowed |
| | `POST /api/tickets/:id/resolve-indication` | Owned only | Blocked | Blocked |
| **Attachments** | `GET /api/attachments/:id/download` | Owned only | Allowed | Allowed |
| | `PATCH /api/attachments/:id/remove` | Owned only | Blocked | Blocked |
| **IT Queue & Detail**| `GET /api/staff/tickets` | Blocked (403) | Allowed | Allowed |
| | `GET /api/staff/tickets/:id` | Blocked (403) | Allowed | Allowed |
| **Ticket Ops** | `PATCH /api/staff/tickets/:id/assignment` | Blocked (403) | Allowed | Allowed |
| | `PATCH /api/staff/tickets/:id/priority` | Blocked (403) | Allowed | Allowed |
| | `PATCH /api/staff/tickets/:id/status` | Blocked (403) | Allowed | Allowed |
| **Comments & Notes** | `GET /api/tickets/:id/comments` | Owned only | Allowed | Allowed |
| | `POST /api/tickets/:id/comments` | Owned only | Allowed | Allowed |
| | `GET /api/tickets/:id/notes` | **Blocked (403)** | Allowed | Allowed |
| | `POST /api/tickets/:id/notes` | **Blocked (403)** | Allowed | Allowed |
| **Admin Users** | `GET /api/admin/users` | Blocked (403) | Blocked (403) | **Allowed** |
| | `POST /api/admin/users` | Blocked (403) | Blocked (403) | **Allowed** |
| | `PATCH /api/admin/users/:id` | Blocked (403) | Blocked (403) | **Allowed** |
| | `POST /api/admin/users/:id/reset-password` | Blocked (403) | Blocked (403) | **Allowed** |

---

## 5. API Endpoints Specification

### 5.1. Authentication & Session APIs

#### `POST /api/auth/login`
* **Authorization:** Public
* **Purpose:** ยืนยันตัวตนผู้ใช้ และออก Token สำหรับเข้าสู่ระบบ
* **Request Body:**
```json
{
  "email": "michael.brown@toktickit.com",
  "password": "Password123!"
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "email": "michael.brown@toktickit.com",
      "name": "Michael Brown",
      "role": "IT_STAFF",
      "mustChangePassword": false
    }
  }
}
```
* **Error Responses:**
  * `400 Bad Request`: รูปแบบอีเมลไม่ถูกต้อง หรือไม่ได้ระบุรหัสผ่าน
  * `401 Unauthorized`: อีเมลหรือรหัสผ่านไม่ถูกต้อง (`"Invalid email or password."`)
  * `403 Forbidden`: บัญชีถูกระงับการใช้งาน (`"Account is inactive. Please contact administrator."`)

---

#### `POST /api/auth/logout`
* **Authorization:** Authenticated (Any Role)
* **Purpose:** ยกเลิกการใช้งาน Session/Token ของผู้ใช้ปัจจุบัน
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

---

#### `GET /api/auth/me`
* **Authorization:** Authenticated (Any Role)
* **Purpose:** ดึงข้อมูลระบุตัวตนของผู้ใช้ที่กำลังล็อกอินอยู่
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "michael.brown@toktickit.com",
    "name": "Michael Brown",
    "role": "IT_STAFF",
    "mustChangePassword": false
  }
}
```
* **Error Responses:**
  * `401 Unauthorized`: Token ไม่ถูกต้องหรือหมดอายุ

---

#### `POST /api/auth/change-password`
* **Authorization:** Authenticated (Any Role)
* **Purpose:** เปลี่ยนรหัสผ่านใหม่ (ใช้ทั้งในกรณี Mandatory First-Login และการเปลี่ยนรหัสผ่านทั่วไป)
* **Request Body:**
```json
{
  "currentPassword": "InitialPass123!",
  "newPassword": "SecurePassword2026!",
  "confirmPassword": "SecurePassword2026!"
}
```
* **Validation Rules:**
  * `currentPassword`: ต้องตรงกับรหัสผ่านเดิมในฐานข้อมูล
  * `newPassword`: ความยาว $\ge 8$ ตัวอักษร, ต้องมีพิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข, อักขระพิเศษ และต้องไม่ตรงกับ `currentPassword`
  * `confirmPassword`: ต้องตรงกับ `newPassword`
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "message": "Password updated successfully. You can now use the application."
  }
}
```
* **Error Responses:**
  * `400 Bad Request`: รหัสผ่านใหม่ไม่ผ่านเกณฑ์ความซับซ้อน หรือรหัสผ่านใหม่ตรงกับรหัสผ่านเดิม
  * `401 Unauthorized`: รหัสผ่านปัจจุบันไม่ถูกต้อง

---

### 5.2. Requester Ticket APIs (Lab 2 Continuation with Real Identity)

#### `GET /api/tickets`
* **Authorization:** Requester Only
* **Purpose:** ดึงรายการตั๋วที่เป็นของ Requester คนปัจจุบันเท่านั้น (ดึง ID จาก Token)
* **Query Parameters:** `search`, `category`, `status`, `priority`, `page`, `limit`, `sortBy`, `sortOrder`
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop battery drains quickly",
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "IN_PROGRESS",
      "resolvedIndicated": false,
      "ticketDate": "2026-09-10T08:30:00.000Z",
      "category": { "id": 1, "name": "Hardware" },
      "relatedSystem": { "id": 1, "name": "Corporate Laptop" }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "totalItems": 1, "totalPages": 1 }
}
```

---

#### `POST /api/tickets/:id/resolve-indication`
* **Authorization:** Requester Only (Must own the ticket)
* **Purpose:** ผู้ร้องขอส่งสัญญาณระบุว่าปัญหาได้รับการแก้ไขแล้ว
* **Path Parameter:** `id` (Ticket ID)
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "resolvedIndicated": true,
    "message": "Resolution indication recorded. IT Staff will review and formally resolve the ticket."
  }
}
```
* **Error Responses:**
  * `403 Forbidden`: ผู้ใช้ไม่ใช่เจ้าของตั๋วใบนี้
  * `404 Not Found`: ไม่พบตั๋วที่ระบุ

---

### 5.3. IT Staff Ticket Queue & Detail APIs

#### `GET /api/staff/tickets`
* **Authorization:** IT Staff, Administrator
* **Purpose:** ดึงรายการตั๋วในคิวงานของเจ้าหน้าที่ไอที พร้อมระบบค้นหา ตัวกรอง การเรียงลำดับ และการแบ่งหน้า
* **Query Parameters:**
  * `search`: คำค้นหา (ค้นหาใน `ticketNumber` และ `summary`)
  * `category`: กรองตาม Category ID
  * `status`: กรองตาม TicketStatus (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`)
  * `requestedPriority`: กรองตาม Requested Priority
  * `itPriority`: กรองตาม IT Priority
  * `assigned`: กรองตามการมอบหมาย (`all`, `unassigned`, `mine`, หรือระบุ User ID)
  * `sortBy`: ฟิลด์ที่ใช้จัดเรียง (`createdAt`, `updatedAt`, `ticketNumber`, `itPriority`, `currentStatus`) ค่าเริ่มต้น: `createdAt`
  * `sortOrder`: ทิศทางการเรียง (`asc`, `desc`) ค่าเริ่มต้น: `desc`
  * `page`: หน้าที่ต้องการ (Integer $\ge 1$, Default: `1`)
  * `limit`: จำนวนต่อหน้า (Integer ระหว่าง 1 ถึง 50, Default: `10`)
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1234,
      "ticketNumber": "TKT-2026-001234",
      "ticketDate": "2026-09-12T09:14:00.000Z",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 1, "name": "Hardware" },
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "IN_PROGRESS",
      "resolvedIndicated": false,
      "ticketOwner": {
        "id": 2,
        "name": "Michael Brown"
      },
      "requester": {
        "id": 5,
        "name": "Jennifer Anderson",
        "email": "jennifer.anderson@toktickit.com"
      },
      "updatedAt": "2026-09-12T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 87,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### `GET /api/staff/tickets/:id`
* **Authorization:** IT Staff, Administrator
* **Purpose:** ดึงข้อมูลรายละเอียดตั๋วฉบับเต็มสำหรับการปฏิบัติงานของ IT Staff
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "ticketNumber": "TKT-2026-001234",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week's Windows update.",
    "requestedPriority": "MEDIUM",
    "itPriority": "MEDIUM",
    "currentStatus": "IN_PROGRESS",
    "resolvedIndicated": false,
    "ticketDate": "2026-09-12T09:14:00.000Z",
    "category": { "id": 1, "name": "Hardware" },
    "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
    "requester": {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@toktickit.com"
    },
    "ticketOwner": {
      "id": 2,
      "name": "Michael Brown",
      "email": "michael.brown@toktickit.com"
    },
    "attachmentsCount": 2,
    "commentsCount": 3,
    "notesCount": 2,
    "createdAt": "2026-09-12T09:14:00.000Z",
    "updatedAt": "2026-09-12T10:30:00.000Z"
  }
}
```

---

### 5.4. Ticket Operations APIs

#### `PATCH /api/staff/tickets/:id/assignment`
* **Authorization:** IT Staff, Administrator
* **Purpose:** รับตั๋วเป็นของตนเอง (Claim), มอบหมายให้เจ้าหน้าที่คนอื่น (Reassign) หรือยกเลิกการมอบหมาย (Unassign)
* **Request Body:**
```json
{
  "ticketOwnerId": 2
}
```
*(หากต้องการยกเลิกการมอบหมาย ให้ส่ง `"ticketOwnerId": null`)*
* **Validation Rules:**
  * `ticketOwnerId` ต้องเป็น ID ของผู้ใช้ที่มีบทบาท `IT_STAFF` หรือ `ADMINISTRATOR` และมีสถานะ `isActive = true`
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "ticketOwnerId": 2,
    "ticketOwner": {
      "id": 2,
      "name": "Michael Brown"
    }
  }
}
```
* **Error Responses:**
  * `400 Bad Request`: `ticketOwnerId` ที่ส่งมาไม่ใช่บัญชี IT Staff หรือผู้ใช้ถูก Inactive ไปแล้ว

---

#### `PATCH /api/staff/tickets/:id/priority`
* **Authorization:** IT Staff, Administrator
* **Purpose:** ปรับปรุงระดับความสำคัญของฝ่ายไอที (IT Priority)
* **Request Body:**
```json
{
  "itPriority": "HIGH"
}
```
* **Validation Rules:**
  * ค่าต้องเป็นหนึ่งใน `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "itPriority": "HIGH"
  }
}
```

---

#### `PATCH /api/staff/tickets/:id/status`
* **Authorization:** IT Staff, Administrator
* **Purpose:** เปลี่ยนสถานะของตั๋วตาม Permitted Status Transition Matrix
* **Request Body:**
```json
{
  "status": "RESOLVED"
}
```
* **Validation Rules:**
  * ค่าต้องสอดคล้องกับผัง Transition Matrix ที่กำหนดใน `BR-14`
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "currentStatus": "RESOLVED",
    "updatedAt": "2026-09-12T11:45:00.000Z"
  }
}
```
* **Error Responses:**
  * `400 Bad Request`: การเปลี่ยนสถานะไม่ถูกต้องตามแผนผัง เช่น พยายามเปลี่ยนจาก `NEW` ไปเป็น `CLOSED` โดยตรง

---

### 5.5. Comments & Notes APIs

#### `GET /api/tickets/:id/comments`
* **Authorization:** Requester (Owner), IT Staff, Administrator
* **Purpose:** ดึงรายการความคิดเห็นสาธารณะบนตั๋ว
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Thank you for the update. Please let me know if you need any additional information.",
      "createdAt": "2026-09-12T11:45:00.000Z",
      "author": {
        "id": 5,
        "name": "Jennifer Anderson",
        "role": "REQUESTER"
      }
    }
  ]
}
```

---

#### `POST /api/tickets/:id/comments`
* **Authorization:** Requester (Owner), IT Staff, Administrator
* **Purpose:** เพิ่มความคิดเห็นสาธารณะใหม่ (Append-Only)
* **Request Body:**
```json
{
  "content": "We are investigating the issue on your device. We will update you shortly."
}
```
* **Validation Rules:**
  * `content`: ตัดช่องว่างแล้วต้องมีความยาวระหว่าง 1 ถึง 2,000 ตัวอักษร
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "ticketId": 1234,
    "content": "We are investigating the issue on your device. We will update you shortly.",
    "createdAt": "2026-09-12T12:00:00.000Z",
    "author": {
      "id": 2,
      "name": "Michael Brown",
      "role": "IT_STAFF"
    }
  }
}
```

---

#### `GET /api/tickets/:id/notes`
* **Authorization:** IT Staff, Administrator Only (**Requester Blocked**)
* **Purpose:** ดึงรายการบันทึกภายในสำหรับเจ้าหน้าที่ไอที
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Suspected registry key corruption after OS update. Running background diagnostic script.",
      "createdAt": "2026-09-12T10:15:00.000Z",
      "author": {
        "id": 2,
        "name": "Michael Brown",
        "role": "IT_STAFF"
      }
    }
  ]
}
```
* **Error Responses:**
  * `403 Forbidden`: ผู้ใช้เป็น Requester ระบบจะปฏิเสธการเข้าถึงทันทีโดยไม่เปิดเผยเนื้อหาของบันทึก

---

#### `POST /api/tickets/:id/notes`
* **Authorization:** IT Staff, Administrator Only (**Requester Blocked**)
* **Purpose:** เพิ่มบันทึกภายในฉบับใหม่ (Append-Only)
* **Request Body:**
```json
{
  "content": "Battery health tested at 82%. If re-imaging does not solve drain, hardware replacement required."
}
```
* **Validation Rules:**
  * `content`: ความยาว 1 ถึง 2,000 ตัวอักษร
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "ticketId": 1234,
    "content": "Battery health tested at 82%. If re-imaging does not solve drain, hardware replacement required.",
    "createdAt": "2026-09-12T12:30:00.000Z",
    "author": {
      "id": 2,
      "name": "Michael Brown",
      "role": "IT_STAFF"
    }
  }
}
```

---

### 5.6. Administrator User Management APIs

#### `GET /api/admin/users`
* **Authorization:** Administrator Only
* **Purpose:** ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ พร้อมรองรับการค้นหาตามชื่อ/อีเมล และการกรองตามบทบาท
* **Query Parameters:**
  * `search`: คำค้นหาชื่อหรืออีเมล
  * `role`: กรองตามบทบาท (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "email": "john.smith@toktickit.com",
      "role": "ADMINISTRATOR",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T08:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Michael Brown",
      "email": "michael.brown@toktickit.com",
      "role": "IT_STAFF",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
```
* **Error Responses:**
  * `403 Forbidden`: ผู้ใช้ไม่ใช่ Administrator

---

#### `POST /api/admin/users`
* **Authorization:** Administrator Only
* **Purpose:** สร้างบัญชีผู้ใช้ใหม่ในระบบ
* **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "InitialPass2026!"
}
```
* **Validation Rules:**
  * `name`: ความยาว 2 ถึง 100 ตัวอักษร
  * `email`: รูปแบบอีเมลถูกต้อง และต้องไม่ซ้ำในระบบ (Case-insensitive)
  * `role`: ต้องระบุ 1 บทบาทจาก `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`
  * `initialPassword`: ความยาว $\ge 8$ ตัวอักษร
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": true,
    "createdAt": "2026-09-12T14:00:00.000Z"
  }
}
```
* **Error Responses:**
  * `400 Bad Request`: ข้อมูลฟิลด์ไม่ผ่าน Validation
  * `409 Conflict`: อีเมลนี้มีอยู่ในระบบแล้ว (`"Email address is already in use."`)

---

#### `PATCH /api/admin/users/:id`
* **Authorization:** Administrator Only
* **Purpose:** แก้ไขข้อมูลพื้นฐาน บทบาท หรือสถานะ Active ของผู้ใช้
* **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.t@toktickit.com",
  "role": "IT_STAFF",
  "isActive": false
}
```
* **Safety Rules & Validations:**
  * **BR-25:** Administrator ไม่สามารถตั้งค่า `isActive: false` ให้แก่บัญชีของตนเองได้ (`"You cannot deactivate your own administrator account."`)
  * **BR-26:** หากผู้ใช้เป็น Active Administrator คนสุดท้ายของระบบ ระบบจะไม่อนุญาตให้เปลี่ยนสถานะเป็น Inactive หรือเปลี่ยนบทบาทเป็นอื่น (`"Cannot deactivate or demote the last active administrator."`)
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Alex Thompson",
    "email": "alex.t@toktickit.com",
    "role": "IT_STAFF",
    "isActive": false,
    "updatedAt": "2026-09-12T14:30:00.000Z"
  }
}
```
* **Error Responses:**
  * `400 Bad Request`: ละเมิดกฎความปลอดภัย (Self-deactivation หรือ Last active admin)
  * `409 Conflict`: อีเมลใหม่ซ้ำกับผู้อื่นในระบบ

---

#### `POST /api/admin/users/:id/reset-password`
* **Authorization:** Administrator Only
* **Purpose:** กำหนดรหัสผ่านเริ่มต้นใหม่ให้ผู้ใช้ โดยบังคับเปลี่ยนรหัสผ่านในครั้งถัดไป
* **Request Body:**
```json
{
  "newInitialPassword": "ResetPass2026!"
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "message": "Initial password reset successfully. User must change it at next login.",
    "mustChangePassword": true
  }
}
```
