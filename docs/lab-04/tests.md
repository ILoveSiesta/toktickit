# Lab 4 Test Plan and Traceability Matrix
**TokTickIT Actions Taken, Ticket Workflow, Dashboards, and Final Regression**

---

## 1. Test Strategy & Quality Assurance Framework

การทดสอบใน Sprint 4 ดำเนินการภายใต้ระเบียบวิธี **Test-Driven Development (TDD)** และ **Spec-Driven Development (Spec DD)** โดยวางแผนการทดสอบครอบคลุมทุกระดับชั้นของระบบ เพื่อให้เกิดความมั่นใจในคุณภาพ ความปลอดภัย และการไม่เกิดผลกระทบย้อนหลัง (Zero Regression) ตามที่ระบุไว้ใน **Section 10 ของ SE Lab 4**:

1. **Unit Testing (Vitest):**
   - ทดสอบ Pure Functions ของ Ticket Workflow Transition FSM และ Resolution Gate Validators
   - ทดสอบการคำนวณช่วงเวลาทางธุรกิจ (Business Timezone `Asia/Bangkok (UTC+7)` และรอบวัน `00:00:00 - 23:59:59`) และการคำนวณสถิติของ Dashboard
2. **Backend API / Integration Testing (Vitest + Supertest):**
   - ทดสอบ CRUD ของ Actions Taken, การตรวจสอบสิทธิ์ตามบทบาท (Role Isolation), การตรวจสอบเงื่อนไขความถูกต้องของข้อมูล (Validation), และความสัมพันธ์ Parent-Child
   - ทดสอบ Ticket Workflow State Transitions ตาม Permitted Transition Matrix และการบังคับใช้ Resolution Gate Rule
   - ทดสอบการคำนวณ Dashboard Metrics ทั้งฝั่ง Requester และ IT Staff/Admin จากข้อมูลจริงในฐานข้อมูล
   - ทดสอบการป้องกัน Concurrency Conflict และ Stale Updates ด้วย `expectedUpdatedAt` (409 Conflict)
3. **Frontend Component & UI Style Testing (Vitest + React Testing Library):**
   - ทดสอบการเรนเดอร์ Actions Taken Table และ Modal Form ในหน้า Ticket Detail
   - ทดสอบพฤติกรรมฟอร์ม: การบังคับกรอก `followUpNote` เมื่อเลือก `followUpRequired`, การ Disable ปุ่มขณะบันทึก, และ Safe Failure
   - ทดสอบการแยกมุมมองตามบทบาท: Requester มองเห็นเฉพาะ Read-Only และซ่อนปุ่มสร้าง/แก้ไข
   - ทดสอบการเรนเดอร์การ์ดและรายการบนหน้า Requester Dashboard (5 การ์ด) และ IT Staff Dashboard (6 การ์ด)
   - ทดสอบตัวควบคุมสถานะตั๋ว (Ticket Workflow Controls) และการแสดง Advisory Banner
   - ทดสอบการปฏิบัติตามมาตรฐานการออกแบบ Zen Green Tokens และ Contrast Ratio ตาม WCAG 2.1 AA
4. **Responsive Layout Inspection:**
   - ตรวจสอบความถูกต้องของการจัดวางองค์ประกอบบนหน้าจอ Mobile (375px) และ Tablet (768px) ป้องกันปัญหา Horizontal Overflow (`overflow-x: hidden`)
5. **Authorization Testing:**
   - ทดสอบสิทธิ์การเข้าถึงข้อมูลตามบทบาท (Role-Based Access Control) และการป้องกันการเข้าถึงข้อมูลข้ามผู้ใช้ (Data Ownership Isolation)
6. **Workflow & State Machine Testing:**
   - ทดสอบวงจรชีวิตของตั๋ว (Ticket Lifecycle FSM) และกฎเกณฑ์ทางธุรกิจ เช่น Terminal States (`CLOSED`, `CANCELLED`) และ Resolution Gate
7. **Migration & Zero-Loss Regression Testing:**
   - ตรวจสอบว่า Prisma Additive Migration ไม่ลบข้อมูลตั๋ว ผู้ใช้ และไฟล์แนบเดิมจาก Labs 1-3 และตั๋วเดิมที่มี 0 Actions Taken สามารถเปิดอ่านและทำงานต่อได้ปกติ
   - รัน Automated Tests เดิมทั้งหมดจาก Labs 1-3 (Authentication, My Tickets, Ticket Detail, Attachments, Public Comments, Internal Notes, Admin User Management)
8. **Performance-Smoke Testing:**
   - ทดสอบความเร็วในการตอบสนอง (Response Latency) ของ Dashboard Aggregation Endpoints และ Actions Taken Query
9. **End-to-End (E2E) Testing (Playwright):**
   - `actions-taken-flow.spec.ts`: ทดสอบเจ้าหน้าที่ไอทีสร้างและแก้ไขหลาย Actions Taken บนตั๋วเดียวกัน ตรวจสอบว่า Requester เข้ามาเห็นเฉพาะข้อมูลอ่านอย่างเดียว
   - `ticket-resolution.spec.ts`: ทดสอบ Full Lifecycle ตั้งแต่ Requester ระบุปัญหาเสร็จสิ้น (Advisory) $\to$ สถานะยังไม่เปลี่ยน $\to$ IT Staff เข้ามาตรวจสอบ Actions Taken และกดเปลี่ยนเป็น Resolved $\to$ Closed
   - `dashboards.spec.ts`: ทดสอบการล็อกอินเป็น Requester และ IT Staff ตรวจสอบความถูกต้องของตัวเลข และทดสอบการคลิก Drill-down ไปยังหน้ารายการตั๋วที่ฟิลเตอร์แล้ว

---

## 2. Test Traceability Matrix (10 Required Categories)

ตารางด้านล่างแสดงการเชื่อมโยงอย่างสมบูรณ์ระหว่าง Acceptance Criteria (AC), Business Rules (BR), ประเภทการทดสอบทั้ง 10 ประเภทตาม Section 10, และไฟล์ Automated Test:

| Test ID | Type (10 Categories) | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **UNIT-01** | `unit` | FR-09, BR-08 | Ticket state machine transition validator | ฟังก์ชันตรวจสอบการเปลี่ยนสถานะ อนุญาตเฉพาะคู่สถานะที่ถูกต้องตาม Transition Matrix | `server/tests/lab-04/workflow-unit.test.ts` | **Planned** |
| **UNIT-02** | `unit` | FR-10, BR-10, AC-09 | Resolution gate prerequisite check | ฟังก์ชันตรวจสอบเงื่อนไขก่อน Resolve ตั๋ว คืนค่า true เฉพาะเมื่อ `ticketOwnerId != null` และ `actionsTaken.length >= 1` | `server/tests/lab-04/workflow-unit.test.ts` | **Planned** |
| **UNIT-03** | `unit` | FR-12, FR-13, BR-12 | Timezone & Date Boundary metric calculations | คำนวณช่วงเวลาวันตาม `Asia/Bangkok (UTC+7)` และช่วง 30 วันของ Recently Resolved ถูกต้องแม่นยำ | `server/tests/lab-04/dashboard-unit.test.ts` | **Planned** |
| **API-01** | `API or integration` | FR-01, BR-01, AC-01 | Create valid Action Taken by IT Staff | สร้างสำเร็จ (201 Created), บันทึกใต้ตั๋วที่ถูกต้อง, `performedById` ตรงกับผู้ล็อกอิน | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-02** | `API or integration` | FR-03, BR-04, AC-02 | Create Action Taken with missing Follow-up Note | ปฏิเสธด้วย 400 Bad Request เมื่อ `followUpRequired=true` แต่ `followUpNote` ว่าง | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-03** | `API or integration` | FR-05, BR-02 | Update Action Taken by authorized staff | แก้ไขรายละเอียดสำเร็จ (200 OK) ข้อมูลในฐานข้อมูลอัปเดต | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **API-04** | `API or integration` | FR-11, BR-11, AC-12 | Concurrency Conflict / Stale Update check | ปฏิเสธด้วย 409 Conflict หาก `expectedUpdatedAt` เก่ากว่าในฐานข้อมูล | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **API-05** | `API or integration` | FR-12, BR-12, AC-10 | Requester Dashboard metrics calculation | ส่งคืนตัวเลขสรุป (myOpenTickets, inProgress, waitingForRequester, recentlyResolved, closed) ถูกต้อง 100% | `server/tests/lab-04/requester-dashboard.api.test.ts` | **Planned** |
| **API-06** | `API or integration` | FR-13, BR-13, AC-11 | IT Staff Dashboard operational metrics | ส่งคืนตัวเลขสรุปงาน (unassigned, new, open, inProgress, waitingForRequester, myAssigned, trends) ถูกต้อง | `server/tests/lab-04/staff-dashboard.api.test.ts` | **Planned** |
| **API-07** | `API or integration` | FR-14, BR-12 | Dashboard zero-state behavior | ส่งคืนค่า `0` และ array ว่าง เมื่อไม่มีตั๋วที่ตรงเงื่อนไข โดยเซิร์ฟเวอร์ไม่แครช | `server/tests/lab-04/requester-dashboard.api.test.ts` | **Planned** |
| **COMP-01** | `UI component` | FR-01, FR-04 | Actions Taken table render on Ticket Detail | แสดงตาราง Actions Taken ครบทุกคอลัมน์ พร้อมป้าย Follow-up ถูกต้อง | `client/tests/lab-04/ActionsTaken.test.tsx` | **Planned** |
| **COMP-02** | `UI component` | FR-03, BR-04 | Actions Taken form validation & safe failure | บังคับกรอก `followUpNote` เมื่อติ๊ก Follow-up และไม่ลบข้อมูลเมื่อ API ล้มเหลว | `client/tests/lab-04/ActionsTaken.test.tsx` | **Planned** |
| **COMP-03** | `UI component` | FR-12, FR-15 | Requester Dashboard 5 metric cards & Drill-down links | แสดงตัวเลข Metric ครบ 5 กล่อง (รวม Waiting for You และ Recently Resolved) พร้อมปุ่ม View All เชื่อมโยง Query Params | `client/tests/lab-04/RequesterDashboard.test.tsx` | **Planned** |
| **COMP-04** | `UI component` | FR-13, FR-15 | Staff Dashboard 6 metric cards, Recent tickets & Actions | แสดงตัวเลขคิวงาน 6 กล่อง (รวม Unassigned Tickets) รายการตั๋วล่าสุด (แสดงผู้รับผิดชอบชิดขวาบนและจัดตำแหน่ง Badges/วันที่อย่างเป็นระเบียบ), และปุ่ม Quick Actions ครบถ้วน | `client/tests/lab-04/StaffDashboard.test.tsx` | **Planned** |
| **STYLE-01** | `UI style` | NFR-03, Rubric Part 9 | Zen Green Design Tokens and Contrast Compliance | องค์ประกอบ UI ใช้พาเลตต์สี Zen Green (Forest, Sage, Mint) และอัตราส่วน Contrast ผ่านเกณฑ์ WCAG 2.1 AA (>= 4.5:1) | `client/tests/lab-04/UIStyle.test.tsx` | **Planned** |
| **RESP-01** | `responsive` | NFR-02, Rubric Part 9 | Mobile Viewport (375px) Layout Inspection | ตรวจสอบ Dashboard (รวมถึง Recent Tickets Card ที่ไม่ซ้อนทับหรือล้นขอบ) และ Actions Taken Table บนความกว้างหน้าจอ 375px ต้องไม่เกิด Horizontal Overflow (`overflow-x: hidden`) และการ์ดจัดเรียงแบบ Responsive Stack สวยงาม | `client/tests/lab-04/ResponsiveLayout.test.tsx` | **Planned** |
| **AUTH-01** | `authorization` | FR-06, BR-06, AC-03 | Requester attempts to create Action Taken | ปฏิเสธด้วย 403 Forbidden โดยเด็ดขาด | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **AUTH-02** | `authorization` | FR-06, BR-07, AC-04 | Requester views Actions Taken on owned ticket | ส่งคืนรายการ Actions Taken ทั้งหมดของตั๋วตนเอง (200 OK) และฝั่ง UI ซ่อนปุ่ม Add/Edit | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **AUTH-03** | `authorization` | FR-07, BR-07, AC-05 | Requester views Actions Taken on another's ticket | ปฏิเสธด้วย 403 Forbidden หรือ 404 Not Found เพื่อความปลอดภัย | `server/tests/lab-04/actions-taken.api.test.ts` | **Planned** |
| **AUTH-04** | `authorization` | FR-13, BR-06 | Requester attempts to access Staff Dashboard API | ปฏิเสธด้วย 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | **Planned** |
| **FLOW-01** | `workflow` | FR-09, BR-08, AC-06 | Permitted status transition (NEW -> IN_PROGRESS) | อัปเดตสถานะสำเร็จ (200 OK) พร้อมบันทึกเวลา `updatedAt` ใหม่ | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **FLOW-02** | `workflow` | FR-09, BR-08, AC-07 | Forbidden status transition (NEW -> CLOSED) | ปฏิเสธด้วย 400 Bad Request และสถานะตั๋วไม่เปลี่ยนแปลง | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **FLOW-03** | `workflow` | FR-10, BR-09, AC-08 | Requester problem resolved indication (Advisory) | อัปเดต `resolvedIndicated = true` สำเร็จ แต่สถานะตั๋วคงเดิม (ไม่เปลี่ยนเป็น Resolved อัตโนมัติ) และแสดง Advisory Banner ให้ Staff | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **FLOW-04** | `workflow` | FR-10, BR-10, AC-09, AC-14 | Resolution Gate Enforcement (Owner + Actions Taken check) | ปฏิเสธด้วย 400 Bad Request หากตั๋วยังไม่มี Owner (`ticketOwnerId == null`) หรือไม่มี Actions Taken (`actionsTaken.length == 0`); อนุญาตให้เปลี่ยนเป็น RESOLVED เมื่อมีครบทั้งสองเงื่อนไข | `server/tests/lab-04/ticket-workflow.api.test.ts` | **Planned** |
| **MIGR-01** | `migration/regression` | NFR-06, BR-05 | Zero Data Loss Additive Migration & Legacy Ticket Handling | รัน Prisma Migration บนฐานข้อมูลเดิมที่มีตั๋วและผู้ใช้จาก Lab 1-3 ข้อมูลเดิมต้องไม่สูญหาย และตั๋วเดิมที่มี 0 Actions Taken และไม่มี Owner สามารถเปิดอ่านได้ปกติโดยไม่เกิด Runtime Error | `server/tests/lab-04/migration-regression.test.ts` | **Planned** |
| **MIGR-02** | `migration/regression` | FR-16, AC-13 | Full Lab 1 to Lab 3 Regression Suite Execution | รันชุดทดสอบ Automated Tests เดิมทั้งหมด (Authentication, My Tickets, Ticket Detail, Attachments, Public Comments, Internal Notes, Admin User Management) ต้องผ่าน 100% | All Test Suites (`npm run test:all`) | **Planned** |
| **PERF-01** | `performance-smoke` | NFR-04, Section 10 | Dashboard Aggregation API Latency Smoke Test | ส่งคำขอไปยัง `GET /api/staff/dashboard` และ `GET /api/requester/dashboard` เวลาตอบสนองต้องเร็วกว่า 200ms ในสภาวะโหลดปกติ (p95 < 300ms) | `server/tests/lab-04/performance-smoke.api.test.ts` | **Planned** |
| **E2E-01** | `end-to-end` | FR-01, FR-05, AC-01 | Actions Taken full lifecycle flow | เจ้าหน้าที่สร้างหลาย Actions Taken $\to$ แก้ไข $\to$ Requester ตรวจสอบเป็น Read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | **Planned** |
| **E2E-02** | `end-to-end` | FR-08, FR-10, AC-08, AC-14 | Ticket Resolution Gate flow | Requester กดงานเสร็จ (Advisory) $\to$ Staff ตรวจสอบ $\to$ กำหนด Owner & Action Taken $\to$ Resolve $\to$ Close | `e2e/lab-04/ticket-resolution.spec.ts` | **Planned** |
| **E2E-03** | `end-to-end` | FR-12, FR-13, FR-15 | Operational Dashboards & Drill-down flow | ตรวจสอบตัวเลข Dashboard $\to$ คลิก Drill-down $\to$ รายการตั๋วแสดงตรงตาม Filter | `e2e/lab-04/dashboards.spec.ts` | **Planned** |

---

## 3. Test Execution Commands

```bash
# 1. รัน Server API, Unit, Authorization, Workflow, Performance-Smoke Tests ของ Lab 4
npm run test -- server/tests/lab-04/

# 2. รัน Client Component, UI Style, Responsive Layout Tests ของ Lab 4
npm run test -- client/tests/lab-04/

# 3. รัน Playwright End-to-End Tests ของ Lab 4
npx playwright test e2e/lab-04/

# 4. รัน Full Regression Tests ทั้งหมดของระบบ (Labs 1-4)
npm run test:all
```
