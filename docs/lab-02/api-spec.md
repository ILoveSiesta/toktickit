# TokTickIT REST API Specification
**Lab 2 Requester Ticketing MVP**

---

## 1. Overview & Architecture Standards

เอกสารฉบับนี้กำหนดสัญญาการเชื่อมต่อ (Contract) ของระบบ **RESTful API** สำหรับ TokTickIT Requester Ticketing MVP ระบบใช้รูปแบบข้อมูลแบบ JSON สำหรับการสื่อสารทั่วไป และใช้ Multipart/Form-Data สำหรับการส่งข้อมูลที่มีไฟล์แนบ

* **Base URL:** `/api`
* **Protocol:** HTTP/1.1 or HTTP/2
* **Character Encoding:** `UTF-8`
* **Default Content-Type:** `application/json`

---

## 2. Global Headers & Security Context

เนื่องจากใน Lab 2 เป็นการจำลองตัวตนผ่าน Development Requester Selector เพื่อทดสอบระบบ Multi-user Data Ownership Backend จะใช้ Header ในการตรวจสอบตัวตนผู้ส่งคำขอ:

| Header Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| **`X-Requester-Id`** | Integer String | **Yes** (สำหรับ Ticket & Attachment APIs) | รหัส ID ของ Development Requester ปัจจุบัน (เช่น `1`, `2`) ใช้ในการผูกและตรวจสอบสิทธิ์ความเป็นเจ้าของข้อมูล |
| **`Content-Type`** | String | Optional | `application/json` สำหรับ JSON payloads หรือ `multipart/form-data` สำหรับการอัปโหลดไฟล์ |

---

## 3. Standard Response & Error Formats

### 3.1. Success Response Structure
ข้อมูลที่ส่งกลับในกรณีสำเร็จจะอยู่ในรูปแบบ JSON Object หรือ Array พร้อม HTTP Status ที่สอดคล้อง (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "data": { ... }
}
```

### 3.2. Standard Error Response Structure
กรณีเกิดข้อผิดพลาด Backend จะส่งกลับโครงสร้างมาตรฐานพร้อม HTTP Status Code ที่เหมาะสม:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided.",
    "details": [
      {
        "field": "summary",
        "message": "Summary is required and must be between 5 and 200 characters."
      }
    ]
  }
}
```

### 3.3. HTTP Status Codes Mapping
| Status Code | Reason Phrase | Usage Scenario |
| :--- | :--- | :--- |
| **`200 OK`** | OK | การดึงข้อมูลสำเร็จ, การอัปเดตสถานะสำเร็จ, การลบแบบ Soft Removal สำเร็จ |
| **`201 Created`** | Created | การสร้างตั๋วใหม่ หรือการอัปโหลดไฟล์แนบเพิ่มสำเร็จ |
| **`400 Bad Request`** | Bad Request | ข้อมูลใน Payload ไม่ผ่านการ Validate, นามสกุลไฟล์ไม่ถูกต้อง, ขนาดไฟล์เกิน 5MB, หรือไฟล์ Active เกิน 5 ไฟล์ |
| **`403 Forbidden`** | Forbidden | ผู้ใช้พยายามเข้าถึง ดู หรือแก้ไขตั๋ว/ไฟล์แนบที่ตนเองไม่ได้เป็นเจ้าของ (`requesterId != ticket.requesterId`) |
| **`404 Not Found`** | Not Found | ไม่พบข้อมูลตั๋ว, ไม่พบหมวดหมู่, หรือไฟล์แนบถูก Soft-removed ไปแล้ว |
| **`500 Internal Server Error`**| Internal Server Error | เกิดข้อผิดพลาดที่ไม่คาดคิดในระบบหลังบ้าน (Safe error response) |

---

## 4. API Endpoints Specification

### 4.1. Development Requester Endpoints

#### `GET /api/requesters`
* **หน้าที่:** ดึงรายชื่อผู้ใช้งานจำลองที่มีสถานะ **Active** เท่านั้น เพื่อนำไปแสดงในหน้า Selector
* **Request Headers:** ไม่ต้องการ
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer@toktick.it",
      "department": "Marketing",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Michael Brown",
      "email": "michael@toktick.it",
      "department": "Finance",
      "isActive": true
    }
  ]
}
```

---

### 4.2. Reference Master Data Endpoints

#### `GET /api/categories`
* **หน้าที่:** ดึงรายชื่อหมวดหมู่ตั๋ว (Categories) ที่มีสถานะ Active
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
}
```

#### `GET /api/related-systems`
* **หน้าที่:** ดึงรายชื่อระบบและอุปกรณ์ที่เกี่ยวข้อง (Related Systems) ที่มีสถานะ Active
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Email" },
    { "id": 2, "name": "Campus Wi-Fi" },
    { "id": 3, "name": "VPN" },
    { "id": 4, "name": "LEB2 App" },
    { "id": 5, "name": "Grade Submission App" },
    { "id": 6, "name": "Printer" },
    { "id": 7, "name": "Corporate Laptop" }
  ]
}
```

---

### 4.3. Ticket Management Endpoints

#### `POST /api/tickets`
* **หน้าที่:** สร้างตั๋วแจ้งปัญหาไอทีใบใหม่ พร้อมรองรับการแนบไฟล์หลักฐานในคำขอเดียวกัน (Atomic Transaction)
* **Request Headers:**
  * `X-Requester-Id`: `1` (Required)
  * `Content-Type`: `multipart/form-data`
* **Request Form-Data Fields:**
  * `summary` (Text, Required): ความยาว 5–200 ตัวอักษร
  * `description` (Text, Required): ความยาว 10–2,000 ตัวอักษร
  * `categoryId` (Number, Required): ID ของ Category
  * `relatedSystemId` (Number, Required): ID ของ Related System
  * `requestedPriority` (Text, Required): ค่าใดค่าหนึ่งใน `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  * `files` (Binary Files, Optional): ไฟล์แนบสูงสุดไม่เกิน 5 ไฟล์ (JPG, JPEG, PNG, WEBP, PDF ขนาด $\le 5\text{MB}$ ต่อไฟล์)
* **Response Status:** `201 Created`
* **Response Body:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "summary": "Cannot connect to Campus Wi-Fi in Building 3",
    "description": "Getting continuous authentication timeout error when attempting to connect.",
    "requestedPriority": "HIGH",
    "itPriority": "MEDIUM",
    "currentStatus": "NEW",
    "ticketOwner": null,
    "ticketDate": "2026-08-30T00:00:00.000Z",
    "requesterId": 1,
    "categoryId": 4,
    "relatedSystemId": 2,
    "createdAt": "2026-08-30T00:00:00.000Z",
    "attachments": [
      {
        "id": 1,
        "originalFileName": "wifi_error.png",
        "fileSize": 524288,
        "fileType": "image/png",
        "isRemoved": false,
        "uploadedAt": "2026-08-30T00:00:00.000Z"
      }
    ]
  }
}
```
* **Error Cases:**
  * `400 Bad Request` (เมื่อกรอกฟิลด์ไม่ครบ, รูปแบบไม่ผ่าน, ขนาดไฟล์เกิน 5MB, หรือประเภทไฟล์ไม่ใช่ JPG/PNG/WEBP/PDF)
  * `404 Not Found` (เมื่อ Category หรือ Related System ID ที่ระบุไม่มีอยู่ในระบบ)

---

#### `GET /api/tickets`
* **หน้าที่:** ดึงรายการตั๋วเฉพาะที่ Requester ปัจจุบันเป็นเจ้าของ พร้อมรองรับการค้นหา (Search), การกรอง (Filter), การจัดเรียง (Sort), และการแบ่งหน้า (Pagination)
* **Request Headers:**
  * `X-Requester-Id`: `1` (Required)
* **Query Parameters:**

| Parameter | Type | Default | Constraints & Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `search` | String | - | ค้นหาจาก `ticketNumber` หรือ `summary` (Case-insensitive) | `?search=wifi` |
| `categoryId` | Number | - | กรองตาม ID หมวดหมู่ (ต้องเป็นจำนวนเต็มบวก) | `?categoryId=4` |
| `requestedPriority` | String | - | กรองตามระดับความสำคัญ (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) | `?requestedPriority=HIGH` |
| `itPriority` | String | - | กรองตามระดับความสำคัญ IT (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) | `?itPriority=MEDIUM` |
| `status` | String | - | กรองตามสถานะ (`NEW`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) | `?status=NEW` |
| `sortBy` | String | `createdAt` | ฟิลด์สำหรับจัดเรียงหลัก (`createdAt`, `ticketNumber`, `updatedAt`) | `?sortBy=createdAt` |
| `sortOrder` | String | `desc` | ลำดับการจัดเรียง (`asc`, `desc`) | `?sortOrder=desc` |
| `page` | Number | `1` | หมายเลขหน้าที่ต้องการดึง (ขั้นต่ำ `1`) | `?page=1` |
| `limit` | Number | `8` | จำนวนรายการต่อหน้า (ขั้นต่ำ `1`, เพดานสูงสุดไม่เกิน `100`) | `?limit=8` |

* **Sorting & Secondary Sorting Strategy:**
  * **Primary Sort:** จัดเรียงตามฟิลด์ `sortBy` และทิศทาง `sortOrder` ที่ระบุ
  * **Secondary Sort:** หากข้อมูลมีค่าฟิลด์หลักซ้ำกัน ระบบจะใช้ Secondary Sort เป็น `id DESC` (หรือ `createdAt DESC`) เสมอโดยอัตโนมัติ เพื่อรับประกันว่าผลลัพธ์ของการแบ่งหน้าจะมีความแน่นอน คงเส้นคงวา และไม่เกิดข้อมูลซ้ำข้ามหน้า (Deterministic Pagination)
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Cannot connect to Campus Wi-Fi in Building 3",
      "categoryName": "Network",
      "relatedSystemName": "Campus Wi-Fi",
      "requestedPriority": "HIGH",
      "itPriority": "MEDIUM",
      "currentStatus": "NEW",
      "ticketOwner": null,
      "ticketDate": "2026-08-30T00:00:00.000Z",
      "updatedAt": "2026-08-30T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 8,
    "totalPages": 1
  }
}
```
* **Error Cases:**
  * `400 Bad Request` (เมื่อส่งพารามิเตอร์ผิดเงื่อนไข เช่น `page < 1`, `limit < 1` หรือ `limit > 100`, `sortBy` นอกเหนือจากฟิลด์ที่กำหนด, หรือ `sortOrder` ที่ไม่ใช่ `asc`/`desc`):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "Invalid query parameter provided.",
    "details": [
      {
        "parameter": "limit",
        "message": "Limit must be a positive integer between 1 and 100."
      }
    ]
  }
}
```
  * `401 Unauthorized` (เมื่อไม่ได้ส่ง `X-Requester-Id`)

---

#### `GET /api/tickets/:id`
* **หน้าที่:** ดึงรายละเอียดตั๋วรายใบแบบอ่านอย่างเดียว พร้อมรายการไฟล์แนบทั้งหมด
* **Request Headers:**
  * `X-Requester-Id`: `1` (Required)
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "summary": "Cannot connect to Campus Wi-Fi in Building 3",
    "description": "Getting continuous authentication timeout error when attempting to connect.",
    "category": { "id": 4, "name": "Network" },
    "relatedSystem": { "id": 2, "name": "Campus Wi-Fi" },
    "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer@toktick.it", "department": "Marketing" },
    "requestedPriority": "HIGH",
    "itPriority": "MEDIUM",
    "currentStatus": "NEW",
    "ticketOwner": null,
    "ticketDate": "2026-08-30T00:00:00.000Z",
    "createdAt": "2026-08-30T00:00:00.000Z",
    "updatedAt": "2026-08-30T00:00:00.000Z",
    "attachments": [
      {
        "id": 1,
        "originalFileName": "wifi_error.png",
        "fileSize": 524288,
        "fileType": "image/png",
        "isRemoved": false,
        "removedAt": null,
        "removalReason": null,
        "uploadedAt": "2026-08-30T00:00:00.000Z"
      }
    ]
  }
}
```
* **Error Cases:**
  * `403 Forbidden` (เมื่อ `X-Requester-Id` ไม่ตรงกับ `requesterId` ของตั๋ว)
  * `404 Not Found` (เมื่อไม่พบ ID ตั๋วในฐานข้อมูล)

---

### 4.4. Attachment Lifecycle Endpoints

#### `POST /api/tickets/:id/attachments`
* **หน้าที่:** อัปโหลดไฟล์แนบเพิ่มเติมเข้าไปในตั๋วเดิมหลังสร้างเสร็จ
* **Request Headers:**
  * `X-Requester-Id`: `1` (Required)
  * `Content-Type`: `multipart/form-data`
* **Request Form-Data:**
  * `files` (Binary Files, Required): ไฟล์แนบที่ต้องการเพิ่ม
* **Business Rules Enforced:**
  * ต้องเป็นเจ้าของตั๋วเท่านั้น (`403 Forbidden` หากไม่ใช่)
  * จำนวนไฟล์ Active เดิม + ไฟล์ใหม่ต้องไม่เกิน 5 ไฟล์ (`400 Bad Request` หากเกิน)
  * นามสกุลต้องเป็น JPG, JPEG, PNG, WEBP, PDF และขนาดไม่เกิน 5MB ต่อไฟล์
* **Response Status:** `201 Created`
* **Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "originalFileName": "error_log.pdf",
      "fileSize": 1048576,
      "fileType": "application/pdf",
      "isRemoved": false,
      "uploadedAt": "2026-08-30T00:10:00.000Z"
    }
  ]
}
```

---

#### `GET /api/attachments/:id/download`
* **หน้าที่:** ให้บริการดาวน์โหลดไฟล์แนบสำหรับไฟล์ที่มีสถานะ Active
* **Request Headers:**
  * `X-Requester-Id`: `1` (Required)
* **Response Status:** `200 OK`
* **Response Headers:**
  * `Content-Type`: `image/png` หรือตาม MIME type ของไฟล์
  * `Content-Disposition`: `attachment; filename="wifi_error.png"`
* **Response Body:** Binary Stream
* **Error Cases:**
  * `403 Forbidden` (หาก Requester ไม่ได้เป็นเจ้าของตั๋วของไฟล์นี้)
  * `404 Not Found` (หากไม่พบไฟล์ หรือไฟล์ถูก **Soft-removed** ไปแล้วตามกฎ BR-18)

---

#### `PATCH /api/attachments/:id/remove`
* **หน้าที่:** ดำเนินการ **Soft Removal** ไฟล์แนบ พร้อมบันทึกเหตุผลประกอบ
* **Request Headers:**
  * `X-Requester-Id`: `1` (Required)
  * `Content-Type`: `application/json`
* **Request JSON Body:**
```json
{
  "removalReason": "Uploaded document containing sensitive personal data by mistake."
}
```
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketId": 101,
    "originalFileName": "wifi_error.png",
    "isRemoved": true,
    "removedAt": "2026-08-30T00:15:00.000Z",
    "removalReason": "Uploaded document containing sensitive personal data by mistake."
  }
}
```
* **Error Cases:**
  * `400 Bad Request` (เมื่อไม่มี `removalReason` หรือมีความยาวไม่ถึง 3 ตัวอักษร)
  * `403 Forbidden` (เมื่อไม่ใช่เจ้าของตั๋ว)
  * `404 Not Found` (เมื่อไม่พบไฟล์แนบ ID นั้น)

---

## 5. Validation Rules Matrix

| Field Name | Type | Rules & Constraints | Error Code / Message |
| :--- | :--- | :--- | :--- |
| `summary` | String | Required, Trimmed, Min 5, Max 200 chars | `"Summary is required and must be between 5 and 200 characters."` |
| `description` | String | Required, Trimmed, Min 10, Max 2000 chars | `"Description is required and must be between 10 and 2000 characters."` |
| `categoryId` | Integer | Required, Must exist in `Category` table and be Active | `"Invalid or inactive category selected."` |
| `relatedSystemId` | Integer | Required, Must exist in `RelatedSystem` table and be Active | `"Invalid or inactive related system selected."` |
| `requestedPriority` | Enum | Required, One of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `"Requested priority must be LOW, MEDIUM, HIGH, or CRITICAL."` |
| `files` | Files[] | Max 5 active per ticket, Max 5MB per file, Ext: `.jpg,.jpeg,.png,.webp,.pdf` | `"File exceeds 5MB or contains unsupported file format."` |
| `removalReason` | String | Required on removal, Min 3, Max 500 chars | `"Removal reason is required."` |
