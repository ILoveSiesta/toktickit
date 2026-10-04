# Lab 4 Test Plan and Traceability Matrix
**TokTickIT Actions Taken, Ticket Workflow, Dashboards, and Final Regression**

---

## 1. Test Strategy & Quality Assurance Framework

การทดสอบใน Sprint 4 ดำเนินการภายใต้ระเบียบวิธี **Test-Driven Development (TDD)** และ **Spec-Driven Development (Spec DD)** โดยวางแผนการทดสอบครอบคลุมทุกระดับชั้นของระบบ เพื่อให้เกิดความมั่นใจในคุณภาพ ความปลอดภัย และการไม่เกิดผลกระทบย้อนหลัง (Zero Regression):

1. **Backend Integration & REST API Testing (Vitest + Supertest):**
   - ทดสอบ CRUD ของ Actions Taken, การตรวจสอบสิทธิ์ตามบทบาท (Role Isolation), การตรวจสอบเงื่อนไขความถูกต้องของข้อมูล (Validation), และความสัมพันธ์ Parent-Child
   - ทดสอบ Ticket Workflow State Transitions ตาม Permitted Transition Matrix และการบังคับใช้ Resolution Gate Rule
   - ทดสอบการคำนวณ Dashboard Metrics ทั้งฝั่ง Requester และ IT Staff/Admin จากข้อมูลจริงในฐานข้อมูล
   - ทดสอบการป้องกัน Concurrency Conflict และ Stale Updates
2. **Frontend Component Testing (Vitest + React Testing Library):**
   - ทดสอบการเรนเดอร์ Actions Taken Table และ Modal Form ในหน้า Ticket Detail
   - ทดสอบพฤติกรรมฟอร์ม: การบังคับกรอก `followUpNote` เมื่อเลือก `followUpRequired`, การ Disable ปุ่มขณะบันทึก, และ Safe Failure
   - ทดสอบการแยกมุมมองตามบทบาท: Requester มองเห็นเฉพาะ Read-Only และซ่อนปุ่มสร้าง/แก้ไข
   - ทดสอบการเรนเดอร์การ์ดและรายการบนหน้า Requester Dashboard และ IT Staff Dashboard
   - ทดสอบตัวควบคุมสถานะตั๋ว (Ticket Workflow Controls) และการแสดง Advisory Banner
3. **End-to-End (E2E) Testing (Playwright):**
   - `actions-taken-flow.spec.ts`: ทดสอบเจ้าหน้าที่ไอทีสร้างและแก้ไขหลาย Actions Taken บนตั๋วเดียวกัน ตรวจสอบว่า Requester เข้ามาเห็นเฉพาะข้อมูลอ่านอย่างเดียว
   - `ticket-resolution.spec.ts`: ทดสอบ Full Lifecycle ตั้งแต่ Requester ระบุปัญหาเสร็จสิ้น (Advisory) $\to$ สถานะยังไม่เปลี่ยน $\to$ IT Staff เข้ามาตรวจสอบ Actions Taken และกดเปลี่ยนเป็น Resolved $\to$ Closed
   - `dashboards.spec.ts`: ทดสอบการล็อกอินเป็น Requester และ IT Staff ตรวจสอบความถูกต้องของตัวเลข และทดสอบการคลิก Drill-down ไปยังหน้ารายการตั๋วที่ฟิลเตอร์แล้ว
4. **Final Hardening & Complete Regression Suite:**
   - รัน Automated Tests เดิมทั้งหมดจาก Lab 1-3 (Authentication, Requester Create Ticket, Attachment Upload/Download/Delete, Public Comments, Internal Notes, Admin User Management)

---

## 2. Test Traceability Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | FR-01, BR-01, AC-01 | Create valid Action Taken by IT Staff | สร้างสำเร็จ (201 Created), บันทึกใต้ตั๋วที่ถูกต้อง, `performedById` ตรงกับผู้ล็อกอิน | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-02** | API | FR-03, BR-04, AC-02 | Create Action Taken with missing Follow-up Note | ปฏิเสธด้วย 400 Bad Request เมื่อ `followUpRequired=true` แต่ `followUpNote` ว่าง | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-03** | API | FR-06, BR-06, AC-03 | Requester attempts to create Action Taken | ปฏิเสธด้วย 403 Forbidden โดยเด็ดขาด | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-04** | API | FR-06, BR-07, AC-04 | Requester views Actions Taken on owned ticket | ส่งคืนรายการ Actions Taken ทั้งหมดของตั๋วตนเอง (200 OK) | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-05** | API | FR-07, BR-07, AC-05 | Requester views Actions Taken on another's ticket | ปฏิเสธด้วย 403 Forbidden หรือ 404 Not Found เพื่อความปลอดภัย | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-06** | API | FR-05, BR-02 | Update Action Taken by authorized staff | แก้ไขรายละเอียดสำเร็จ (200 OK) ข้อมูลในฐานข้อมูลอัปเดต | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-07** | API | FR-09, BR-08, AC-06 | Permitted status transition (NEW -> IN_PROGRESS) | อัปเดตสถานะสำเร็จ (200 OK) พร้อมบันทึกเวลา `updatedAt` ใหม่ | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **API-08** | API | FR-09, BR-08, AC-07 | Forbidden status transition (NEW -> CLOSED) | ปฏิเสธด้วย 400 Bad Request และสถานะตั๋วไม่เปลี่ยนแปลง | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **API-09** | API | FR-10, BR-09, AC-08 | Requester problem resolved indication (Advisory) | อัปเดต `resolvedIndicated = true` สำเร็จ แต่สถานะตั๋วคงเดิม (ไม่เป็น Resolved) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **API-10** | API | FR-10, BR-10, AC-09 | IT Staff transitions ticket to RESOLVED | อัปเดตสถานะเป็น `RESOLVED` อย่างเป็นทางการสำเร็จ (200 OK) | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **API-11** | API | FR-11, BR-11, AC-12 | Concurrency Conflict / Stale Update check | ปฏิเสธด้วย 409 Conflict หาก `expectedUpdatedAt` เก่ากว่าในฐานข้อมูล | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **API-12** | API | FR-12, BR-12, AC-10 | Requester Dashboard metrics calculation | ส่งคืนตัวเลขสรุป (Open, In Progress, Resolved, Closed) ถูกต้อง 100% | `server/tests/lab-04/requester-dashboard.api.test.ts` | **Planned** |
| **API-13** | API | FR-13, BR-13, AC-11 | IT Staff Dashboard operational metrics | ส่งคืนตัวเลขสรุปงาน (Unassigned, My Assigned, by Status/Priority) ถูกต้อง | `server/tests/lab-04/staff-dashboard.api.test.ts` | **Planned** |
| **API-14** | API | FR-14, BR-12 | Dashboard zero-state behavior | ส่งคืนค่า `0` และ array ว่าง เมื่อไม่มีตั๋วที่ตรงเงื่อนไข โดยเซิร์ฟเวอร์ไม่แครช | `server/tests/lab-04/requester-dashboard.api.test.ts` | **Planned** |
| **COMP-01** | UI | FR-01, FR-04 | Actions Taken table render on Ticket Detail | แสดงตาราง Actions Taken ครบทุกคอลัมน์ พร้อมป้าย Follow-up ถูกต้อง | `client/tests/lab-04/ActionsTaken.test.tsx` | **Planned** |
| **COMP-02** | UI | FR-03, BR-04 | Actions Taken form validation & safe failure | บังคับกรอก `followUpNote` เมื่อติ๊ก Follow-up และไม่ลบข้อมูลเมื่อ API ล้มเหลว | `client/tests/lab-04/ActionsTaken.test.tsx` | **Planned** |
| **COMP-03** | UI | FR-06, BR-07 | Actions Taken Requester Read-Only View | ซ่อนปุ่ม "+ Add Action Taken" และปุ่ม Edit สำหรับ Requester | `client/tests/lab-04/ActionsTaken.test.tsx` | **Planned** |
| **COMP-04** | UI | FR-09, FR-10 | Ticket status controls & Advisory alert | แสดงตัวเลือกสถานะเฉพาะที่อนุญาต และแสดง Alert เมื่อ Requester ระบุงานเสร็จ | `client/tests/lab-04/TicketWorkflow.test.tsx` | **Planned** |
| **COMP-05** | UI | FR-12, FR-15 | Requester Dashboard cards & Drill-down links | แสดงตัวเลข Metric ครบ 4 กล่อง และมีปุ่ม View All เชื่อมโยงพร้อม Filter | `client/tests/lab-04/RequesterDashboard.test.tsx` | **Planned** |
| **COMP-06** | UI | FR-13, FR-15 | Staff Dashboard cards, Recent tickets & Actions | แสดงตัวเลขคิวงานและรายการตั๋วล่าสุด พร้อมปุ่ม Quick Actions ครบถ้วน | `client/tests/lab-04/StaffDashboard.test.tsx` | **Planned** |
| **E2E-01** | E2E | FR-01, FR-05, AC-01 | Actions Taken full lifecycle flow | เจ้าหน้าที่สร้างหลาย Actions Taken $\to$ แก้ไข $\to$ Requester ตรวจสอบเป็น Read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | **Planned** |
| **E2E-02** | E2E | FR-08, FR-10, AC-08 | Ticket Resolution Gate flow | Requester กดงานเสร็จ (Advisory) $\to$ Staff ตรวจสอบ $\to$ Resolve $\to$ Close | `e2e/lab-04/ticket-resolution.spec.ts` | **Planned** |
| **E2E-03** | E2E | FR-12, FR-13, FR-15 | Operational Dashboards & Drill-down flow | ตรวจสอบตัวเลข Dashboard $\to$ คลิก Drill-down $\to$ รายการตั๋วแสดงตรงตาม Filter | `e2e/lab-04/dashboards.spec.ts` | **Planned** |
| **REG-01** | Test | FR-16, AC-13 | Full Lab 1 to Lab 3 Regression Suite | รันชุดทดสอบเดิมทั้งหมด 171+ ข้อของโปรเจกต์ ต้องผ่าน 100% ปราศจากข้อผิดพลาด | All Test Suites | **Planned** |

---

## 3. Test Execution Commands

```bash
# 1. รัน Server API Tests ของ Lab 4
npm run test -- server/tests/lab-04/

# 2. รัน Client Component Tests ของ Lab 4
npm run test -- client/tests/lab-04/

# 3. รัน Playwright End-to-End Tests ของ Lab 4
npx playwright test e2e/lab-04/

# 4. รัน Full Regression Tests ทั้งหมดของระบบ (Labs 1-4)
npm run test:all
```
