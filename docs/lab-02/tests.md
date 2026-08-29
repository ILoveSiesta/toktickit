# Lab 2 Test Plan and Results
**TokTickIT Requester Ticketing MVP with UI Foundation**

---

## 1. Test Strategy

การทดสอบใน Sprint 2 ดำเนินการภายใต้หลักการ **Test-Driven Development (TDD)** และ **Spec-Driven Development (Spec DD)** โดยวางแผนและกำหนดการทดสอบทุกระดับก่อนเริ่มเขียนโค้ด เพื่อเป็นหลักฐานเชิงประจักษ์ (Traceable Evidence) ในการตรวจรับงานตามเกณฑ์การยอมรับ (Acceptance Criteria) ครอบคลุมการทดสอบ 5 ระดับ ดังนี้:

1. **Unit Testing (Vitest):**
   - ทดสอบ Logic และฟังก์ชันที่ไม่มี Side Effects เช่น ฟังก์ชันสร้างหมายเลขตั๋วอัตโนมัติ (`generateTicketNumber`), ฟังก์ชันตรวจสอบนามสกุลและขนาดไฟล์แนบ (`validateAttachmentFile`), และฟังก์ชันจัดรูปแบบวันที่
2. **API & Integration Testing (Vitest + Supertest):**
   - ทดสอบความถูกต้องของ REST API Endpoints ทุกเส้นทาง (Happy paths, Validation failures, Cross-requester ownership isolation 403 Forbidden, Attachment limits, และ Soft Removal lifecycle) บนฐานข้อมูลจำลองสำหรับการทดสอบ
3. **UI Component Testing (Vitest + React Testing Library):**
   - ทดสอบการทำงานของคอมโพเนนต์และฟอร์มฝั่ง Frontend เช่น การแสดงผลตัวเลือก Requester, การ Validate ฟิลด์ข้อมูลใน Create Ticket, การแสดงสถานะ Busy ระหว่าง Submit, และการทำงานของตาราง My Tickets
4. **UI Style & Responsive Testing (Playwright / Visual Inspection):**
   - ทดสอบการจัดวางหน้าจอและโทนสี Zen Green Theme ตลอดจนการปรับตัวของ UI บนความละเอียดหน้าจอ 3 ขนาด:
     - Desktop ($\ge 992\text{px}$)
     - Tablet ($768\text{px} - 991\text{px}$)
     - Mobile ($< 768\text{px}$)
5. **End-to-End Testing (Playwright):**
   - ทดสอบ User Journey ของ Requester ตั้งแต่การเลือกตัวตนผู้ใช้จำลอง -> สร้างตั๋วพร้อมไฟล์แนบ -> ตรวจสอบรายการใน My Tickets -> เปิดดูหน้ารายละเอียดแบบอ่านอย่างเดียว -> ดาวน์โหลดไฟล์ -> ลบไฟล์แบบ Soft-remove -> สลับตัวตนผู้ใช้เพื่อยืนยันการแบ่งแยกข้อมูล

---

## 2. Planned Tests Table

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-07, AC-03 | Ticket number generator format | ได้รหัสในรูปแบบ `TKT-YYYY-XXXXXX` และไม่ซ้ำกัน | `server/tests/lab-02/ticket-generator.test.ts` | Planned |
| **UNIT-02** | Unit | BR-14, BR-15, AC-05 | Attachment validation utility | ยอมรับ JPG/PNG/WEBP/PDF $\le 5\text{MB}$ และปฏิเสธประเภท/ขนาดอื่น | `server/tests/lab-02/attachment-validator.test.ts` | Planned |
| **API-01** | API | FR-01, BR-02, AC-01 | `GET /api/requesters` | ส่งคืนเฉพาะ Active Requesters (200 OK) | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| **API-02** | API | FR-02 | `GET /api/categories` & `/related-systems` | ส่งคืนรายการ Category และ Related System ที่ Active | `server/tests/lab-02/reference-data.api.test.ts` | Planned |
| **API-03** | API | FR-03, BR-08, BR-09, AC-03 | `POST /api/tickets` (Valid input) | สร้างตั๋วสำเร็จ, สถานะ `NEW`, บันทึก requesterId ถูกต้อง (201 Created) | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-04** | API | BR-11, AC-04 | `POST /api/tickets` (Missing summary/desc) | ปฏิเสธการสร้างตั๋ว คืนข้อความแจ้งฟิลด์ที่ผิดพลาด (400 Bad Request) | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-05** | API | BR-14, BR-15, AC-05 | `POST /api/tickets` (Invalid file / Oversized) | ปฏิเสธการสร้างตั๋วเมื่อไฟล์แนบผิดกฎ (400 Bad Request) | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-06** | API | FR-05, BR-22, AC-07 | `GET /api/tickets` (Requester A) | ส่งคืนเฉพาะตั๋วที่เป็นของ Requester A เท่านั้น (200 OK) | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-07** | API | FR-05, BR-23, BR-24, AC-08 | `GET /api/tickets` with search & filter | กรองตั๋วตาม Category, Status, และ Search keyword ถูกต้อง | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-08** | API | FR-06, BR-22, AC-10 | `GET /api/tickets/:id` (Owned ticket) | ส่งคืนข้อมูลตั๋วและไฟล์แนบของตนเอง (200 OK) | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| **API-09** | API | BR-22, AC-11 | `GET /api/tickets/:id` (Cross-requester) | ปฏิเสธเมื่อ Requester A พยายามเข้าถึงตั๋วของ Requester B (403 Forbidden) | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| **API-10** | API | FR-07, AC-12 | `GET /api/attachments/:id/download` | ดาวน์โหลดไฟล์แนบที่มีสถานะ Active สำเร็จ (200 OK) | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-11** | API | FR-08, BR-17, BR-19, AC-13 | `PATCH /api/attachments/:id/remove` | ทำ Soft Removal พร้อมบันทึกเหตุผลสำเร็จ (200 OK) | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-12** | API | BR-18, AC-14 | `GET /api/attachments/:id/download` (Removed) | ปฏิเสธการดาวน์โหลดไฟล์ที่ถูก Soft-removed (404 Not Found) | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **UI-01** | UI | FR-01, AC-01, AC-02 | RequesterSelector component | แสดงรายชื่อผู้ใช้, เลือกแล้วตั้งค่า Context และนำทางถูกต้อง | `client/src/tests/lab-02/RequesterSelector.test.tsx` | Planned |
| **UI-02** | UI | FR-03, BR-12, AC-03 | CreateTicket form submission | แสดงปุ่ม Submit ติดสถานะ Busy/Disabled เมื่อกดส่งฟอร์ม | `client/src/tests/lab-02/CreateTicket.test.tsx` | Planned |
| **UI-03** | UI | BR-11, BR-13, AC-04 | CreateTicket validation errors | แสดง Error สีแดงใต้ช่องที่ผิด และคงค่าฟิลด์อื่นที่กรอกไว้ | `client/src/tests/lab-02/CreateTicket.test.tsx` | Planned |
| **UI-04** | UI | BR-16, AC-06 | Attachment upload limit | ปิดปุ่มแนบไฟล์เมื่อมีไฟล์แนบครบ 5 ไฟล์ | `client/src/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| **UI-05** | UI | FR-05, BR-25, AC-09 | MyTickets Empty vs No-Results | แสดง Empty State เมื่อไม่มีตั๋ว และ No-Results เมื่อกรองไม่พบ | `client/src/tests/lab-02/MyTickets.test.tsx` | Planned |
| **UI-06** | UI | FR-06, BR-26, AC-10 | RequesterTicketDetail read-only | แสดงกล่องข้อมูลแบบ Read-only และไม่ให้ผู้ใช้แก้ไข | `client/src/tests/lab-02/RequesterTicketDetail.test.tsx` | Planned |
| **UI-07** | UI | FR-08, BR-19, AC-13 | Attachment soft removal modal | แสดงกล่องยืนยัน บังคับกรอกเหตุผลก่อนลบไฟล์ | `client/src/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| **UI-08** | UI | FR-09, BR-04, AC-15 | Change Requester action | กดเปลี่ยนตัวตนแล้วโหลดข้อมูลใหม่ตามตัวตนที่เลือก | `client/src/tests/lab-02/AppHeader.test.tsx` | Planned |
| **RESP-01** | Visual | AC-16 | Desktop Viewport ($\ge 992\text{px}$) | Layout 2 คอลัมน์ ตาราง My Tickets เต็มรูปแบบ | `e2e/lab-02/responsive-visual.spec.ts` | Planned |
| **RESP-02** | Visual | AC-16 | Tablet Viewport ($768 - 991\text{px}$) | ปรับสเกล 2 คอลัมน์กระชับ ไม่เกิดแนวนอนเลื่อน | `e2e/lab-02/responsive-visual.spec.ts` | Planned |
| **RESP-03** | Visual | AC-16 | Mobile Viewport ($< 768\text{px}$) | Layout แถวเดี่ยว ตารางเปลี่ยนเป็นการ์ด ปุ่ม $\ge 44\text{px}$ | `e2e/lab-02/responsive-visual.spec.ts` | Planned |
| **E2E-01** | E2E | AC-01, AC-03, AC-07, AC-10 | Complete Ticket Creation Journey | เลือกผู้ใช้ -> สร้างตั๋ว -> เช็คใน My Tickets -> เปิดดูรายละเอียด | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-12, AC-13, AC-14, AC-15 | Attachment & Multi-user Isolation Flow | ดาวน์โหลดไฟล์ -> ลบไฟล์แบบ Soft-remove -> สลับผู้ใช้เพื่อเช็คสิทธิ์ | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

ตารางแสดงความเชื่อมโยง 100% ระหว่าง **Acceptance Criteria (AC)** จาก `specification.md` กับ **Planned Tests**:

| Acceptance Criterion | Description Summary | Covering Test IDs | Level of Coverage |
| :--- | :--- | :--- | :--- |
| **AC-01** | Requester Selection on Entry | `API-01`, `UI-01`, `E2E-01` | API, UI Component, E2E |
| **AC-02** | Requester Context Persistence & Header | `UI-01`, `UI-08`, `E2E-01` | UI Component, E2E |
| **AC-03** | Successful Ticket Creation | `UNIT-01`, `API-03`, `UI-02`, `E2E-01` | Unit, API, UI, E2E |
| **AC-04** | Ticket Creation Validation Failure | `API-04`, `UI-03` | API, UI Component |
| **AC-05** | Attachment Type & Size Validation | `UNIT-02`, `API-05`, `UI-03` | Unit, API, UI Component |
| **AC-06** | Maximum 5 Active Attachments Limit | `UNIT-02`, `UI-04` | Unit, UI Component |
| **AC-07** | My Tickets Ownership Filter | `API-06`, `E2E-01` | API, E2E |
| **AC-08** | My Tickets Search & Filter | `API-07`, `UI-05`, `E2E-01` | API, UI Component, E2E |
| **AC-09** | Empty State vs No-Results State | `UI-05` | UI Component |
| **AC-10** | Read-only Ticket Detail | `API-08`, `UI-06`, `E2E-01` | API, UI Component, E2E |
| **AC-11** | Cross-Requester Ticket Access Blocked | `API-09`, `E2E-02` | API, E2E |
| **AC-12** | Attachment Download for Owner | `API-10`, `E2E-02` | API, E2E |
| **AC-13** | Attachment Soft Removal with Reason | `API-11`, `UI-07`, `E2E-02` | API, UI Component, E2E |
| **AC-14** | Blocked Download of Removed Attachment| `API-12`, `E2E-02` | API, E2E |
| **AC-15** | Requester Switching Data Isolation | `UI-08`, `E2E-02` | UI Component, E2E |
| **AC-16** | Responsive UI Adaptability | `RESP-01`, `RESP-02`, `RESP-03` | Visual / Responsive |

---

## 4. Responsive and Visual Checklist

| Category / Area | Item Description | Desktop ($\ge 992\text{px}$) | Tablet ($768-991\text{px}$) | Mobile ($< 768\text{px}$) | Conformance |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Theme & Color** | Header uses Primary Green `#006B3C` | [ ] | [ ] | [ ] | Pending |
| **Theme & Color** | Links/Focus use Secondary Green `#0B7A46` | [ ] | [ ] | [ ] | Pending |
| **Theme & Color** | Page background is `#F5F7F6` | [ ] | [ ] | [ ] | Pending |
| **Theme & Color** | Cards and Form surface are Pure White `#FFFFFF` | [ ] | [ ] | [ ] | Pending |
| **Fields & Labels** | Labels positioned above input controls | [ ] | [ ] | [ ] | Pending |
| **Fields & Labels** | Required fields marked with red asterisk `*` | [ ] | [ ] | [ ] | Pending |
| **Fields & Labels** | Read-only fields shaded in Soft Gray-Green | [ ] | [ ] | [ ] | Pending |
| **Fields & Labels** | Validation errors appear directly below fields | [ ] | [ ] | [ ] | Pending |
| **Layout & Spacing**| No text or element clipping | [ ] | [ ] | [ ] | Pending |
| **Layout & Spacing**| No accidental horizontal page scrolling | [ ] | [ ] | [ ] | Pending |
| **Touch & Interaction**| Touch targets for buttons are $\ge 44\text{px}$ | N/A | [ ] | [ ] | Pending |
| **List Representation**| Responsive table adapts to readable Cards on Mobile | N/A | [ ] | [ ] | Pending |

---

## 5. Test Commands

### 5.1. Backend / Server Tests (Unit & API)
```bash
# รัน Unit Tests และ API Integration Tests ทั้งหมดของ Server
npm run test --prefix server

# รันเฉพาะ Test Suites ของ Lab 2
npm run test --prefix server -- server/tests/lab-02/
```

### 5.2. Frontend / Client Tests (Component & UI)
```bash
# รัน Unit Tests และ Component Tests ทั้งหมดของ Client
npm run test --prefix client

# รันเฉพาะ Test Suites ของ Lab 2
npm run test --prefix client -- src/tests/lab-02/
```

### 5.3. End-to-End Tests & Responsive Inspection (Playwright)
```bash
# รัน E2E Tests ทั้งหมด
npx playwright test e2e/lab-02/

# รัน E2E Tests พร้อมเปิดโหมด UI และบันทึก Screenshot
npx playwright test e2e/lab-02/ --ui
```

---

## 6. Final Results

| Level | Total Tests Planned | Passed | Failed | Skipped | Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Unit Tests** | 2 | - | - | - | Pending Execution |
| **API Integration Tests** | 10 | - | - | - | Pending Execution |
| **UI Component Tests** | 8 | - | - | - | Pending Execution |
| **Responsive / Visual Tests** | 3 | - | - | - | Pending Execution |
| **End-to-End Tests** | 2 | - | - | - | Pending Execution |
| **Total** | **25** | - | - | - | **Pending Implementation** |

---

## 7. Known Limitations or Deferred Tests

1. **Real Authentication & Password Security:** การทดสอบความปลอดภัยของรหัสผ่านและการจัดการ Token/Session จะถูกเลื่อนไปทดสอบใน Lab 3 ตามขอบเขตของรายวิชา
2. **IT Staff Operations:** การทดสอบฟังก์ชันฝั่ง IT Staff (เช่น การเปลี่ยนสถานะตั๋ว, การ Reassign, การเขียน Internal Notes) อยู่นอกเหนือขอบเขตของ Lab 2 และจะได้รับการทดสอบใน Lab ถัดไป
