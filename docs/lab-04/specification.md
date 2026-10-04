# Lab 4 Sprint Engineering Specification
**TokTickIT Actions Taken, Dashboards, and Final Regression**

---

## 1. Sprint Goal

ส่งมอบระบบบันทึกการปฏิบัติงานของเจ้าหน้าที่ (**Actions Taken by IT Staff**) ภายใต้โครงสร้างงานแบบ Parent-Child เพื่อให้สามารถวางแผน บันทึก และติดตามการแก้ไขปัญหาของแต่ละตั๋วได้อย่างมีประสิทธิภาพ พร้อมทั้งบังคับใช้วงจรชีวิตของตั๋วฉบับสมบูรณ์ (**Complete Ticket Lifecycle**) และกฎการปิดงาน (**Resolution Gate**) ที่เข้มงวด พัฒนาระบบสรุปข้อมูลเชิงปฏิบัติการ (**Role-Appropriate Dashboards**) ที่สอดคล้องกับบทบาททั้งฝั่ง Requester และ IT Staff/Admin และทำการทดสอบความมั่นคงปลอดภัยและความเสถียรของระบบทั้งหมด (**Hardening & Complete Regression**) จาก Lab 1 ถึง Lab 3 ภายใต้มาตรฐานการออกแบบ Zen Green Design Language อย่างไร้รอยต่อ

---

## 2. Stakeholder Request Interpretation

ฝ่ายสนับสนุนเทคโนโลยีสารสนเทศ (IT Service Desk) และผู้มีส่วนได้เสียมีความต้องการเพิ่มเติมเพื่อยกระดับระบบ TokTickIT ให้สมบูรณ์แบบพร้อมใช้งานจริง:
1. **การวางแผนและติดตามการปฏิบัติงานจริง (Actions Taken Under Ticket):** แม้ระบบจะสามารถรับตั๋วและสื่อสารกับผู้แจ้งได้แล้ว แต่ฝ่ายไอทียังขาดกลไกในการบันทึกงานที่ลงมือทำจริงอย่างเป็นระบบ จึงต้องเพิ่มส่วน "Actions Taken" ภายใต้แต่ละตั๋ว โดยแต่ละรายการต้องบันทึก: วันที่และเวลาปฏิบัติงาน (Action Date/Time), รายละเอียดการดำเนินงาน (Action Description), ผลการปฏิบัติงาน (Result), ผู้ปฏิบัติงานจริง (Performed by - ดึงจากระบบอัตโนมัติ), ความจำเป็นในการติดตามผล (Follow-Up Required?), บันทึกการติดตามผล (Follow-up Note - บังคับกรอกเมื่อต้องติดตามผล), และข้อมูลไฟล์อ้างอิง (Attachment Notes)
2. **การประสานงานและการลงมือปฏิบัติการแบบทีม (Primary Owner vs. Action Performer):** เจ้าของตั๋วหลัก (Primary Ticket Owner) ยังคงทำหน้าที่ประสานงานและดูแลภาพรวมของตั๋ว แต่เจ้าหน้าที่ไอทีท่านอื่นสามารถเข้ามาช่วยปฏิบัติงานและบันทึกใน Actions Taken ได้
3. **เกตตรวจสอบการแก้ไขปัญหาอย่างเป็นทางการ (Formal Resolution Gate):** ผู้ร้องขอ (Requester) สามารถส่งสัญญาณระบุว่าปัญหาได้รับการแก้ไขแล้วได้ แต่ถือเป็นเพียง **"Advisory (คำแนะนำ)"** เท่านั้น โดยระบบต้อง**ไม่เปลี่ยนสถานะตั๋วเป็น Resolved อัตโนมัติ** แต่เจ้าหน้าที่ไอทีต้องตรวจสอบผลงานจริงและเป็นผู้กดเปลี่ยนสถานะตั๋วเป็น Resolved อย่างเป็นทางการ
4. **แดชบอร์ดสรุปภาพรวมเชิงปฏิบัติการตามบทบาท (Role-Appropriate Dashboards):**
   - **Requester Dashboard:** สรุปเฉพาะข้อมูลตั๋วที่ตนเองเป็นเจ้าของ (เช่น ตั๋วที่เปิดอยู่, ตั๋วที่กำลังดำเนินการ, ตั๋วที่รอดำเนินการ, ตั๋วที่แก้ไขแล้ว) ช่วยให้ติดตามงานได้รวดเร็วโดยไม่ต้องค้นหาในหน้ารวม
   - **IT Staff Dashboard:** สรุปภาพรวมงานปฏิบัติการ (ตั๋วที่ยังไม่มีผู้รับผิดชอบ, ตั๋วที่ตนเองเป็นเจ้าของ, ตั๋วตามสถานะหรือ Priority, ตั๋วที่อัปเดตล่าสุด)
   - **Drill-down Capability:** ทุกการ์ดตัวเลขบนแดชบอร์ดต้องสามารถคลิกเพื่อเชื่อมโยง (Drill-down) ไปยังหน้ารายการตั๋วที่กรองข้อมูลตรงกันได้ทันที
5. **ความสมบูรณ์ ความปลอดภัย และความต่อเนื่องของระบบ (Polished & Hardened System):** ขัดเกลาระบบให้สวยงามตามแบบแผน Zen Green รองรับ Responsive ทุกอุปกรณ์ รองรับ Accessibility (WCAG 2.1 AA) ป้องกันข้อผิดพลาดจากการกดซ้ำ (Double Submit) และรักษาความเข้ากันได้ย้อนหลัง (Zero Regression) ของฟีเจอร์เดิมทั้งหมดจาก Lab 1-3

---

## 3. Scope

### 3.1. Included Scope (ขอบเขตงานที่รวมใน Lab 4)
1. **Parent-Child Actions Taken Management:**
   - โครงสร้างฐานข้อมูล `ActionTaken` เชื่อมโยงกับ `Ticket` แบบ 1-to-many
   - ฟิลด์ข้อมูล: `actionDateTime`, `actionDescription`, `result`, `performedById` (auto จาก JWT token), `followUpRequired`, `followUpNote` (บังคับกรอกเมื่อ `followUpRequired = true`), `attachmentNotes`
   - Role-based Access: IT Staff และ Administrator สามารถ Create และ Edit ได้; Requester มีสิทธิ์ Read-Only บนตั๋วของตนเองเท่านั้น (ห้ามสร้าง/แก้ไข และห้ามดูตั๋วคนอื่น)
   - ป้องกันการลบข้อมูล (Append-only / Audit trail principle)
2. **Complete Ticket Status Workflow & Resolution Gate:**
   - รองรับวงจรชีวิตตั๋วครบทั้ง 8 สถานะ: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`
   - บังคับใช้แผนผังการเปลี่ยนสถานะที่อนุญาต (Permitted Status Transition Matrix) ที่ Backend อย่างเข้มงวด
   - บังคับใช้กฎ Resolution Gate: Requester indication เป็น advisory ไม่ทำให้สถานะตั๋วเปลี่ยนเป็น Resolved; IT Staff/Admin ต้องเป็นผู้กดยืนยันเปลี่ยนสถานะ
   - ป้องกัน Stale Updates / Concurrency Conflict ผ่านการตรวจสอบ Timestamps / Optimistic concurrency
3. **Role-Appropriate Operational Dashboards:**
   - **Requester Dashboard:** การ์ดสถิติ (Total Open, In Progress, Resolved, Closed), รายการตั๋วที่อัปเดตล่าสุด, ลิงก์ด่วนสร้างตั๋ว และการ Drill-down ไปยัง My Tickets ตาม Filter
   - **IT Staff Dashboard:** การ์ดสถิติงาน (Unassigned Tickets, My Assigned Tickets, Tickets by Status/IT Priority, Recently Updated), รายการตั๋วด่วน/ล่าสุด, การ Drill-down ไปยัง Central Queue ตาม Filter
   - **Administrator Dashboard:** ใช้โครงสร้าง IT Staff Dashboard พร้อมส่วนสรุปจำนวนผู้ใช้งาน (User Account Counts)
   - คำนวณสรุปผลจากฐานข้อมูลโดยตรง (Authoritative DB Queries) และส่งคืนเป็นผลสรุปที่กระชับ (Concise Data Payload)
4. **Database Migration & Idempotent Seed:**
   - รัน Prisma Migration โดยรักษาข้อมูลเดิมทั้งหมดจาก Lab 1-3 (Zero Data Loss)
   - Seed ข้อมูลแบบ Idempotent ที่มีตั๋วทั้งแบบ 0, 1 และหลาย Actions Taken ครอบคลุมทุกสถานะและ Priority
5. **Zen Green UI Continuity & Hardening:**
   - ต่อยอดระบบ Zen Green Tokens, Cards, Badges, Table layouts, Loading, Empty, และ Error states
   - รองรับ Responsive บน Desktop (1280px), Tablet (820px) และ Mobile (375px) ปราศจาก Horizontal Overflow หรือ Element Overlap
   - ขจัด Console Errors, Dead Links, และ Unfinished controls
   - ป้องกัน Double Submission และมี Safe Failure (ไม่ล้างข้อมูลฟอร์มเมื่อบันทึกไม่สำเร็จ)

### 3.2. Explicitly Excluded from Lab 4 (ขอบเขตงานที่ห้ามทำเด็ดขาดตามข้อกำหนด 4.2)
* ❌ **No SLA Clocks / Escalation Engines:** ห้ามทำระบบนับเวลา SLA ถอยหลังอัตโนมัติ, On-call scheduling, หรือ Breach notifications
* ❌ **No External Notifications:** ห้ามทำระบบส่ง Email, SMS, LINE, หรือ Push notifications ใดๆ
* ❌ **No Billing / Inventory:** ห้ามทำระบบตัดสต็อกอะไหล่ (Spare-parts management), จัดซื้อ (Purchasing), หรือคิดค่าบริการ/ค่าแรง (Time-sheet billing/payroll)
* ❌ **No Multi-Level Approvals / E-Signatures:** ห้ามทำระบบอนุมัติหลายระดับ หรือลงลายมือชื่อดิจิทัล
* ❌ **No Advanced BI / Report Builders:** ห้ามทำเครื่องมือ Custom Report Builder หรือส่งออก Data Warehouse นอกเหนือจาก Dashboard ตัวเลขสรุปพื้นฐานที่กำหนด
* ❌ **No Multi-Tenant Organizations:** ห้ามทำระบบแยกระดับองค์กรหลายสังกัด หรือ Production-scale cloud operations
* ❌ **No Unapproved Product Features:** ห้ามเพิ่มฟีเจอร์ใหม่ที่ไม่อยู่ใน Engineering Contract

---

## 4. Functional Requirements (FR)

### หมวดที่ 1: Actions Taken Operations & Data Integrity
* **FR-01 (Actions Taken Creation):** IT Staff และ Administrator ต้องสามารถสร้างบันทึก Actions Taken ภายใต้ Ticket ที่ได้รับอนุญาตได้
* **FR-02 (Automatic Performer Attribution):** ระบบต้องดึงข้อมูลตัวตนของผู้ปฏิบัติงาน (`performedById`) จาก Authentication Token (JWT) ของผู้ใช้ที่ส่งคำขอโดยอัตโนมัติ และห้ามรับหรือแก้ไขผ่าน Client Body
* **FR-03 (Mandatory Follow-up Validation):** เมื่อเลือก `followUpRequired = true` ระบบต้องบังคับให้มีข้อมูล `followUpNote` หากเป็นค่าว่างต้องปฏิเสธด้วย `400 Bad Request`
* **FR-04 (Attachment Notes Tracking):** ระบบต้องรองรับการบันทึกข้อความอ้างอิงไฟล์ภาพหรือเอกสาร (`attachmentNotes`) ในแต่ละ Action Taken
* **FR-05 (Action Taken Update):** IT Staff และ Administrator ต้องสามารถแก้ไขข้อมูล Action Taken (เช่น ปรับคำอธิบาย ผลการดำเนินงาน หรือสถานะการติดตามผล) ได้
* **FR-06 (Requester Read-Only Access):** Requester เจ้าของตั๋วต้องสามารถดูรายการ Actions Taken ทั้งหมดบนตั๋วของตนเองได้แบบ Read-Only โดยไม่มีปุ่มหรือสิทธิ์ในการสร้าง/แก้ไข
* **FR-07 (Cross-Ticket & Cross-User Isolation):** Requester ต้องไม่สามารถเข้าถึงหรือดู Actions Taken บนตั๋วของผู้ใช้อื่นได้โดยเด็ดขาด

### หมวดที่ 2: Ticket Status Lifecycle & Resolution Gate
* **FR-08 (Complete Status Lifecycle):** ระบบต้องรองรับสถานะตั๋วทั้ง 8 สถานะ ได้แก่ `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`
* **FR-09 (Permitted Status Transition Enforcement):** การเปลี่ยนสถานะตั๋วต้องเป็นไปตาม Permitted Status Transition Matrix ที่กำหนดเท่านั้น หากฝ่าฝืน Backend ต้องปฏิเสธด้วย `400 Bad Request`
* **FR-10 (Resolution Gate Enforcement):** การที่ Requester ส่งสัญญาณระบุว่าปัญหาได้รับการแก้ไขแล้ว (`resolvedIndicated = true`) ต้องไม่เปลี่ยนสถานะตั๋วเป็น `RESOLVED` อัตโนมัติ โดยระบบต้องสงวนสิทธิ์ให้เฉพาะ IT Staff และ Administrator เท่านั้นในการเปลี่ยนสถานะเป็น `RESOLVED` อย่างเป็นทางการ
* **FR-11 (Stale Update & Concurrency Conflict Prevention):** ระบบต้องตรวจสอบเวลาอัปเดตล่าสุด (`updatedAt`) หรือ Concurrency Token ก่อนอนุญาตให้เปลี่ยนสถานะตั๋ว หากพบว่าข้อมูลบนหน้าจอเก่ากว่าข้อมูลจริงในฐานข้อมูล ต้องปฏิเสธด้วย `409 Conflict`

### หมวดที่ 3: Role-Appropriate Dashboards
* **FR-12 (Requester Dashboard Retrieval):** ระบบต้องมี API ให้บริการข้อมูลสรุปของ Requester ซึ่งประกอบด้วยจำนวนตั๋วที่เปิดอยู่, ตั๋วที่กำลังดำเนินการ, ตั๋วที่รอดำเนินการ, ตั๋วที่แก้ไขแล้ว, และรายการตั๋วที่อัปเดตล่าสุดเฉพาะของผู้ใช้นั้น
* **FR-13 (IT Staff / Admin Dashboard Retrieval):** ระบบต้องมี API ให้บริการข้อมูลสรุปเชิงปฏิบัติการสำหรับ IT Staff และ Administrator ซึ่งประกอบด้วยตั๋วที่ยังไม่มีผู้รับผิดชอบ, ตั๋วที่ตนเองเป็นเจ้าของ, ตั๋วแยกตามสถานะ, ตั๋วแยกตาม IT Priority, และตั๋วที่อัปเดตล่าสุด
* **FR-14 (Authoritative Metrics Calculation):** ตัวเลขสถิติบน Dashboard ทั้งหมดต้องคำนวณจากฐานข้อมูลโดยตรง (Server-side aggregation) และส่งคืนเฉพาะผลรวม (Concise data) ห้ามดึงตั๋วทั้งหมดมานับที่ Frontend
* **FR-15 (Interactive Metric Drill-down):** การคลิกที่การ์ดสถิติบน Dashboard ต้องนำทางผู้ใช้ไปยังหน้ารายการตั๋ว (My Tickets หรือ Ticket Queue) พร้อมกรองข้อมูล (Filter) ให้ตรงกับเกณฑ์ของการ์ดนั้นโดยอัตโนมัติ

### หมวดที่ 4: System Hardening & Non-Regression
* **FR-16 (Zero Regression on Previous Labs):** ฟังก์ชันทั้งหมดจาก Lab 1-3 (Authentication, Requester Ticket Creation, Attachment Management, Public Comments, Internal Notes, Admin User Management) ต้องทำงานได้สมบูรณ์ 100%
* **FR-17 (Safe Failure & Double-Click Prevention):** ฟอร์มในระบบต้องป้องกันการกดปุ่มบันทึกซ้ำ (Disable/Debounce) และหากเกิด Network/Server Error ต้องรักษาข้อมูลในฟอร์มไว้ ไม่ให้ผู้ใช้ต้องกรอกใหม่

---

## 5. Business Rules (BR)

### หมวด Actions Taken
* **BR-01 (Single Ticket Association):** รายการ Action Taken 1 รายการ ต้องผูกพันอยู่กับ Ticket เพียงใบเดียวเท่านั้น และไม่สามารถย้ายไปยังตั๋วใบอื่นได้
* **BR-02 (Independent Performer Attribution):** เจ้าของตั๋วหลัก (Ticket Owner) ทำหน้าที่ดูแลภาพรวมของตั๋ว แต่ Action Taken สามารถลงมือปฏิบัติและบันทึกโดย IT Staff คนอื่นได้
* **BR-03 (Immutability of Audit History):** รายการ Actions Taken ไม่อนุญาตให้มีการ Hard-delete ออกจากฐานข้อมูล เพื่อรักษาหลักฐานการทำงาน (Audit Trail)
* **BR-04 (Conditional Follow-Up Note):**
  - หาก `followUpRequired = true` ฟิลด์ `followUpNote` ต้องเป็นข้อความที่ไม่ว่างเปล่า (Non-empty String)
  - หาก `followUpRequired = false` ฟิลด์ `followUpNote` สามารถเป็นค่าว่างหรือ `null` ได้
* **BR-05 (Server-Enforced Performer):** ผู้ปฏิบัติงาน (`performedById`) ต้องถูกกำหนดจากตัวตนของผู้ใช้ที่ล็อกอินอยู่ (Authenticated Staff) โดยตรง และไม่สามารถปลอมแปลงเป็นผู้อื่นได้
* **BR-06 (Staff Role Restriction):** เฉพาะผู้ใช้ที่มีบทบาท `IT_STAFF` หรือ `ADMINISTRATOR` ที่มีสถานะ `isActive = true` เท่านั้นที่ได้รับอนุญาตให้สร้างหรือแก้ไข Actions Taken
* **BR-07 (Requester Read-Only & Ownership Isolation):** Requester สามารถเปิดดู Actions Taken ได้เฉพาะตั๋วที่ตนเองเป็นเจ้าของ (`requesterId = currentUser.id`) เท่านั้น การพยายามเข้าถึงตั๋วของผู้อื่นจะได้รับ `404 Not Found` หรือ `403 Forbidden`

### หมวด Ticket Lifecycle & Status Transitions
* **BR-08 (Permitted Status Transition Matrix):** แผนผังการเปลี่ยนสถานะของตั๋วต้องเป็นไปตามตารางนี้เท่านั้น:

| สถานะเริ่มต้น (From Status) | สถานะปลายทางที่อนุญาต (Permitted To Status) | บทบาทที่ได้รับอนุญาต (Authorized Roles) |
| :--- | :--- | :--- |
| `NEW` | `OPEN`, `IN_PROGRESS`, `CANCELLED` | IT Staff, Administrator |
| `NEW` | `CANCELLED` | Requester (เฉพาะตั๋วของตนเอง) |
| `OPEN` | `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | IT Staff, Administrator |
| `IN_PROGRESS` | `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | IT Staff, Administrator |
| `WAITING_FOR_REQUESTER` | `IN_PROGRESS`, `RESOLVED`, `CANCELLED` | IT Staff, Administrator |
| `RESOLVED` | `CLOSED`, `REOPENED` | IT Staff, Administrator |
| `REOPENED` | `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | IT Staff, Administrator |
| `CLOSED` | *(ไม่มี - สิ้นสุดกระบวนการ)* | *(Terminal State)* |
| `CANCELLED` | *(ไม่มี - ยกเลิกตั๋ว)* | *(Terminal State)* |

* **BR-09 (Resolution Gate Rule):** เมื่อ Requester ระบุว่า "Problem Appears Resolved" ระบบจะอัปเดตฟิลด์ `resolvedIndicated = true` เท่านั้น โดยสถานะตั๋วจะยังคงเป็นสถานะเดิม (เช่น `IN_PROGRESS` หรือ `WAITING_FOR_REQUESTER`) จนกว่า IT Staff หรือ Admin จะเข้ามาเปลี่ยนสถานะตั๋วเป็น `RESOLVED` อย่างเป็นทางการ
* **BR-10 (Resolution Prerequisites):** ก่อนที่สถานะตั๋วจะสามารถเปลี่ยนเป็น `RESOLVED` ได้อย่างเป็นทางการ ตั๋วใบนั้นต้องผ่านเกณฑ์เงื่อนไขบังคับครบถ้วนดังนี้:
  1. ต้องมีผู้รับผิดชอบตั๋วที่ได้รับการมอบหมายแล้ว (`ownerId != null`)
  2. ต้องมีบันทึกการปฏิบัติงาน (Actions Taken) อย่างน้อย 1 รายการภายใต้ตั๋วใบนั้น (`actionsTaken.length >= 1`)
  3. ผู้ดำเนินการเปลี่ยนสถานะต้องมีบทบาทเป็น `IT_STAFF` หรือ `ADMINISTRATOR` เท่านั้น
  หากไม่ผ่านเงื่อนไขข้อใดข้อหนึ่ง Backend ต้องปฏิเสธคำขอด้วย `400 Bad Request` พร้อมข้อความแจ้งข้อผิดพลาดอย่างชัดเจน เพื่อป้องกันการปิดงานโดยไร้ผู้รับผิดชอบหรือไร้หลักฐานการทำงานจริง
* **BR-11 (Concurrency Conflict Guard):** การอัปเดตสถานะตั๋วหรือบันทึก Actions Taken ต้องส่ง `expectedUpdatedAt` ล่าสุดมาตรวจสอบ หากข้อมูลในฐานข้อมูลเปลี่ยนไปแล้ว ระบบต้องปฏิเสธด้วย `409 Conflict`

### หมวด Dashboard Calculations & Time Boundaries
* **BR-12 (Requester Dashboard Metrics & Boundaries):**
  - **Business Time Zone:** ใช้เขตเวลา `Asia/Bangkok (UTC+7)` และใช้ช่วงเวลาตัดรอบวัน `00:00:00 - 23:59:59`
  - `totalOpen`: นับตั๋วของ Requester ที่มีสถานะอยู่ในกลุ่ม `[NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER]`
  - `inProgress`: นับตั๋วของ Requester ที่มีสถานะเป็น `IN_PROGRESS`
  - `waitingForRequester`: นับตั๋วของ Requester ที่มีสถานะเป็น `WAITING_FOR_REQUESTER` (ตั๋วที่ต้องการการตอบกลับจากผู้แจ้ง)
  - `recentlyResolved`: นับตั๋วของ Requester ที่มีสถานะเป็น `RESOLVED` ภายในช่วง 30 วันย้อนหลัง
  - `closed`: นับตั๋วของ Requester ที่มีสถานะเป็น `CLOSED`
  - `recentTickets`: รายการตั๋ว 5 ใบของ Requester ที่มี `updatedAt` ล่าสุด เรียงจากใหม่ไปเก่า
* **BR-13 (IT Staff Dashboard Metrics & Boundaries):**
  - **Business Time Zone:** ใช้เขตเวลา `Asia/Bangkok (UTC+7)` และช่วงเวลาตัดรอบวัน `00:00:00 - 23:59:59`
  - `unassigned`: นับตั๋วทั้งหมดในระบบที่ยังไม่มีเจ้าของ (`ownerId = null`) และสถานะยังไม่สิ้นสุด (`status NOT IN [RESOLVED, CLOSED, CANCELLED]`) ถือเป็นตัวชี้วัดสำคัญลำดับแรกของคิวงาน
  - `myAssigned`: นับตั๋วที่ตนเองเป็นเจ้าของ (`ownerId = currentUser.id`) และสถานะยังไม่สิ้นสุด
  - `new`: นับตั๋วที่มีสถานะเป็น `NEW`
  - `open`: นับตั๋วที่มีสถานะเป็น `OPEN`
  - `inProgress`: นับตั๋วที่มีสถานะเป็น `IN_PROGRESS`
  - `waitingForRequester`: นับตั๋วที่มีสถานะเป็น `WAITING_FOR_REQUESTER`
  - `byStatus`: จำนวนตั๋วแยกตามแต่ละสถานะทั้ง 8 สถานะ
  - `byPriority`: จำนวนตั๋วแยกตามระดับ IT Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
  - `trends`: ข้อมูลเปรียบเทียบสถิติเทียบกับวันก่อนหน้า (Yesterday vs Today) เช่น `+2`, `-1`, `0`
  - `recentTickets`: รายการตั๋ว 5-10 ใบล่าสุดในระบบที่มีการอัปเดต
* **BR-14 (Administrator Dashboard Metrics):**
  - นำเสนอข้อมูลเหมือน IT Staff Dashboard และเพิ่มสถิติผู้ใช้งาน: จำนวนผู้ใช้ทั้งหมด, จำนวนผู้ใช้ที่ Active, จำนวนผู้ใช้แยกตามบทบาท

---

## 6. UI Specification Summary

ส่วนต่อประสานผู้ใช้ได้รับการขยายตามแบบแผน **Zen Green Design System**:

1. **IT Staff Dashboard (Screen 1):**
   - **Header & Action Bar:** ข้อความต้อนรับตามชื่อเจ้าหน้าที่, ปุ่ม Refresh ข้อมูล, และปุ่ม Quick Actions (Create Ticket, My Queue, Search)
   - **Metric Cards Row:** การ์ดแสดงผลตัวเลข 6 ใบ (Unassigned Tickets, New, Open, In Progress, Waiting for Requester, My Assigned) พร้อม Trend Indicators และลิงก์ Drill-down ไปยัง Central Queue ที่ฟิลเตอร์ตรงกัน
   - **Main Content Grid:** ฝั่งซ้ายแสดงตารางตั๋วล่าสุด (Recent Tickets) พร้อม Status Badge, วันที่, และลิงก์เปิดดูรายละเอียด; ฝั่งขวาแสดง Quick Actions และสถิติย่อตาม Priority
2. **Requester Dashboard (Screen 2):**
   - **Welcome Banner:** ทักทายผู้ใช้พร้อมสรุปสถานะตั๋วของตนเอง
   - **Metric Cards Row:** สรุป 5 กล่องสถิติ (My Open Tickets, In Progress, Waiting for Requester, Recently Resolved, Closed) พร้อมปุ่ม "View All" เพื่อ Drill-down ไปยังหน้า My Tickets ตาม Filter
   - **My Recent Tickets:** รายการตั๋วล่าสุด 5 รายการ พร้อมสถานะและวันที่
   - **Quick Actions:** ปุ่ม "Create Ticket" และปุ่ม "View My Tickets"
3. **Actions Taken Section บน Ticket Detail:**
   - อยู่ถัดจากส่วนข้อมูลรายละเอียดตั๋วหลัก
   - ตารางแสดงรายการ Action Taken: ลำดับ, วันที่/เวลา, ผู้ปฏิบัติงาน (Name + Role badge), คำอธิบาย, ผลลัพธ์, Follow-up Badge (ถ้าต้องการติดตามผลจะแสดงป้ายเตือน Amber), ข้อมูลไฟล์แนบอ้างอิง, และปุ่ม Edit (เฉพาะเจ้าหน้าที่)
   - ปุ่ม "+ Add Action Taken": เปิดฟอร์ม Modal สำหรับเพิ่มรายการใหม่
   - มุมมอง Requester: แสดงตารางข้อมูลครบถ้วนแต่ไม่มีปุ่ม Add หรือ Edit ใดๆ
4. **Ticket Status Controls & Advisory Notice:**
   - แสดง Dropdown / ปุ่มเปลี่ยนสถานะเฉพาะตัวเลือกที่สอดคล้องกับ BR-08
   - หาก Requester ระบุว่างานเสร็จสิ้นแล้ว จะมี Banner แจ้งเตือนสีฟ้าอ่อน: *"Requester indicated this issue appears resolved. Please verify actions taken and formally transition status to Resolved."*
5. **Screen States & UX Safety:**
   - **Loading State:** แสดง Skeleton Placeholder และ Spinner เขียว Zen Green
   - **Empty State:** เมื่อสถิติเป็น 0 หรือไม่มีข้อมูลตั๋ว จะแสดงภาพประกอบข้อความ *"No tickets found matching this criteria"* อย่างเป็นมิตร
   - **Responsive Breakpoints:** รองรับ Desktop (1280px+), Tablet (768px - 1024px), และ Mobile (375px - 767px) โดยปรับการ์ด Metric จาก 5 คอลัมน์เป็น 2 คอลัมน์บน Tablet และ 1 คอลัมน์บน Mobile

---

## 7. Data Changes & Migration Strategy

### 7.1. Prisma Data Model Increment

เพิ่ม Model `ActionTaken` ใน `server/prisma/schema.prisma`:

```prisma
model ActionTaken {
  id                Int      @id @default(autoincrement())
  ticketId          Int      @map("ticket_id")
  actionDateTime    DateTime @default(now()) @map("action_date_time")
  actionDescription String   @map("action_description") @db.Text
  result            String   @db.Text
  performedById     Int      @map("performed_by_id")
  followUpRequired  Boolean  @default(false) @map("follow_up_required")
  followUpNote      String?  @map("follow_up_note") @db.Text
  attachmentNotes   String?  @map("attachment_notes") @db.Text
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  ticket            Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy       User     @relation("StaffActionsTaken", fields: [performedById], references: [id])

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
  @@map("actions_taken")
}
```

และเพิ่มความสัมพันธ์ใน `Ticket` และ `User`:
- `Ticket`: เพิ่ม `actionsTaken ActionTaken[]`
- `User`: เพิ่ม `actionsTaken ActionTaken[] @relation("StaffActionsTaken")`

### 7.2. Two Database Design Decisions Justified (ตามข้อกำหนด 5.1)

1. **Decision 1: Parent-Child Structure with Explicit Foreign Keys and Composite Indices:**
   - *คำอธิบาย:* ออกแบบให้ `ActionTaken` เป็นตารางลูกที่ผูกด้วย Foreign Key กับ `Ticket` (`ticket_id`) และ `User` (`performed_by_id`) พร้อมสร้าง Index บน `ticket_id` และ `action_date_time`
   - *เหตุผล:* โครงสร้างนี้รับประกัน Referential Integrity ป้องกันข้อมูลกำพร้า (Orphan records) และเมื่อผู้ใช้เปิดดูหน้า Ticket Detail การ Query รายการ Actions Taken เรียงตามลำดับเวลาจะใช้ Index Scan ทำให้ดึงข้อมูลได้อย่างรวดเร็วในระดับ $O(\log N)$ แม้ระบบจะมีตั๋วและบันทึกจำนวนมาก
2. **Decision 2: Authoritative SQL Aggregation for Dashboard Endpoints:**
   - *คำอธิบาย:* ออกแบบการคำนวณ Metrics บน Dashboard ด้วยคำสั่ง SQL Aggregation (`COUNT`, `GROUP BY`) บนฐานข้อมูลโดยตรง แทนการดึง Record ตั๋วทั้งหมดมานับใน Node.js Server หรือฝั่ง Client
   - *เหตุผล:* ช่วยประหยัดแบนด์วิดท์เครือข่ายอย่างมหาศาล และลดการใช้หน่วยความจำ (Memory Footprint) ของ Server โดยฐานข้อมูลสามารถใช้ B-Tree Index บนฟิลด์ `status`, `owner_id`, และ `it_priority` ในการประมวลผลตัวเลขสรุปได้อย่างรวดเร็วและแม่นยำสูง

### 7.3. Migration & Backfill Strategy (ตามข้อกำหนด 5.2)
- รัน Prisma Migration ด้วยคำสั่ง `prisma migrate deploy`
- เนื่องจากเป็นการเพิ่มตารางใหม่ `actions_taken` จึงไม่ส่งผลกระทบต่อข้อมูลเดิมในตาราง `tickets`, `users`, `attachments`, `comments`, `internal_notes`
- Legacy Tickets ที่สร้างขึ้นใน Lab 1-3 จะมีค่า `actionsTaken` เป็น Array ว่าง `[]` ซึ่ง API และ UI ออกแบบให้รองรับ Empty state ไว้อย่างสมบูรณ์
- แผน Rollback: สามารถ Drop Table `actions_taken` ได้โดยไม่ทำลายโครงสร้างตารางหลักอื่น

### 7.4. Idempotent Seed Data (ตามข้อกำหนด 5.3)
- ปรับปรุง `server/prisma/seed.ts` ให้รันซ้ำได้ปลอดภัย (Upsert / Find-or-Create)
- จำลองข้อมูล Actions Taken ในตั๋วรูปแบบต่างๆ:
  - ตั๋วที่มี 0 Actions Taken (ทดสอบ Empty state)
  - ตั๋วที่มี 1 Action Taken (งานทั่วไป)
  - ตั๋วที่มีหลาย Actions Taken โดยมีทั้งงานที่ผู้ทำเป็น Owner และผู้ทำเป็นเจ้าหน้าที่คนอื่น (ทดสอบ BR-02)
  - รายการที่มี `followUpRequired = true` พร้อม `followUpNote`
  - ตั๋วครอบคลุมสถานะและ Priority ต่างๆ เพื่อให้ Dashboard แสดงตัวเลขทั้งแบบ Zero และ Non-zero

---

## 8. REST API Contract Summary

รายละเอียดแบบเต็มระบุใน [api-spec.md](file:///d:/เรียน/CPE334-SoftEng/Me-TickTokIt/toktickit/docs/lab-04/api-spec.md) โดยมีสรุปดังนี้:

| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets/:id/actions-taken` | IT_STAFF, ADMINISTRATOR | สร้าง Action Taken ใหม่ (performedBy กำหนดจาก JWT อัตโนมัติ) |
| `GET` | `/api/tickets/:id/actions-taken` | ALL (Authenticated) | ดึงรายการ Actions Taken (Requester ดูได้เฉพาะตั๋วตนเอง) |
| `PUT` | `/api/tickets/:id/actions-taken/:actionId` | IT_STAFF, ADMINISTRATOR | แก้ไขบันทึก Action Taken |
| `PATCH`| `/api/tickets/:id/status` | IT_STAFF, ADMINISTRATOR, REQUESTER | อัปเดตสถานะตั๋วตาม Matrix (Requester ทำได้เฉพาะ Advisory หรือ Cancel) |
| `GET` | `/api/dashboard/requester` | REQUESTER | สรุปข้อมูลตัวเลขสถิติและตั๋วล่าสุดสำหรับ Requester |
| `GET` | `/api/dashboard/staff` | IT_STAFF, ADMINISTRATOR | สรุปข้อมูลตัวเลขสถิติเชิงปฏิบัติการสำหรับ IT Staff และ Admin |

---

## 9. Acceptance Criteria (AC)

* **AC-01 (Create Valid Action Taken):** Given ผู้ใช้ล็อกอินด้วยบทบาท IT Staff หรือ Administrator และข้อมูลถูกต้องครบถ้วน When ส่งคำขอสร้าง Action Taken Then บันทึกจะถูกสร้างขึ้นภายใต้ตั๋วใบนั้น โดยมี `performedById` ตรงกับผู้ใช้ที่ล็อกอิน และส่งคืนรหัส `201 Created`
* **AC-02 (Follow-Up Note Validation):** Given มีการส่งคำขอสร้างหรือแก้ไข Action Taken โดยระบุ `followUpRequired = true` แต่ไม่ได้ระบุ `followUpNote` When ส่งคำขอไปยังเซิร์ฟเวอร์ Then ระบบต้องปฏิเสธคำขอด้วย `400 Bad Request` พร้อมข้อความแจ้งเตือนที่ชัดเจน
* **AC-03 (Requester Action Creation Forbidden):** Given ผู้ใช้ล็อกอินด้วยบทบาท Requester When พยายามส่งคำขอ `POST /api/tickets/:id/actions-taken` Then เซิร์ฟเวอร์ต้องปฏิเสธด้วย `403 Forbidden`
* **AC-04 (Requester View Owned Actions Taken):** Given ผู้ใช้ล็อกอินด้วยบทบาท Requester When เปิดดูตั๋วที่ตนเองเป็นเจ้าของ Then สามารถมองเห็นรายการ Actions Taken ทั้งหมดในรูปแบบ Read-Only
* **AC-05 (Requester Cross-Ticket Isolation):** Given ผู้ใช้ล็อกอินด้วยบทบาท Requester When พยายามเรียกดู Actions Taken ของตั๋วที่ผู้อื่นเป็นเจ้าของ Then เซิร์ฟเวอร์ต้องตอบกลับด้วย `404 Not Found` หรือ `403 Forbidden`
* **AC-06 (Permitted Ticket Status Transition):** Given ตั๋วอยู่ในสถานะ `NEW` และผู้ใช้คือ IT Staff When ส่งคำขอเปลี่ยนสถานะเป็น `IN_PROGRESS` Then สถานะตั๋วจะเปลี่ยนเป็น `IN_PROGRESS` สำเร็จ พร้อมอัปเดตเวลา `updatedAt`
* **AC-07 (Forbidden Ticket Status Transition):** Given ตั๋วอยู่ในสถานะ `NEW` และผู้ใช้คือ IT Staff When ส่งคำขอข้ามขั้นเปลี่ยนเป็น `CLOSED` Then เซิร์ฟเวอร์ต้องปฏิเสธด้วย `400 Bad Request`
* **AC-08 (Resolution Gate Enforcement):** Given Requester กดระบุว่า "Problem Appears Resolved" When ตรวจสอบสถานะตั๋วในฐานข้อมูล Then ฟิลด์ `resolvedIndicated` ต้องเป็น `true` แต่ `status` ของตั๋วต้อง**ไม่เปลี่ยนเป็น `RESOLVED`**
* **AC-09 (Official Resolution by Staff with Prerequisites):** Given ตั๋วที่มี `resolvedIndicated = true` อยู่ในสถานะ `IN_PROGRESS` มีการมอบหมาย Ticket Owner แล้ว (`ownerId != null`) และมีบันทึก Actions Taken อย่างน้อย 1 รายการ (`actionsTaken.length >= 1`) When IT Staff ตรวจสอบความถูกต้องและส่งคำขอเปลี่ยนสถานะเป็น `RESOLVED` Then ตั๋วจะเปลี่ยนสถานะเป็น `RESOLVED` อย่างเป็นทางการ
* **AC-10 (Requester Dashboard Data Accuracy):** Given ผู้ใช้ล็อกอินด้วยบทบาท Requester When เรียกใช้งาน `GET /api/dashboard/requester` Then ผลลัพธ์ตัวเลขสถิติ (รวมถึง `waitingForRequester`) และรายการตั๋วล่าสุดต้องตรงกับตั๋วที่ผู้ใช้นั้นเป็นเจ้าของในฐานข้อมูล 100%
* **AC-11 (IT Staff Dashboard Operational Metrics):** Given ผู้ใช้ล็อกอินด้วยบทบาท IT Staff When เรียกใช้งาน `GET /api/dashboard/staff` Then ผลลัพธ์ตัวเลขสถิติ (ตั๋วไม่มีเจ้าของ `unassigned`, ตั๋วตนเอง `myAssigned`, ตั๋วตาม Priority/Status, และแนวโน้ม `trends`) ต้องตรงกับข้อมูลจริงในฐานข้อมูล
* **AC-12 (Concurrency Conflict Handling):** Given สองผู้ใช้เปิดหน้าตั๋วเดียวกันพร้อมกัน When ผู้ใช้แรกบันทึกข้อมูลสำเร็จ และผู้ใช้ที่สองพยายามบันทึกข้อมูลทับด้วย Timestamp เดิม Then ผู้ใช้ที่สองต้องได้รับการแจ้งเตือน `409 Conflict` และข้อมูลไม่ถูกเขียนทับ
* **AC-13 (Zero Regression Verification):** Given การทดสอบระบบเต็มรูปแบบ When รันชุดทดสอบทั้งหมดของโปรเจกต์ (Lab 1 ถึง Lab 4) Then ทุกชุดทดสอบต้องผ่านเขียว 100% ปราศจากความล้มเหลว
* **AC-14 (Resolution Prerequisites Rejection):** Given ตั๋วที่ยังไม่มีผู้รับผิดชอบ (`ownerId = null`) หรือยังไม่มีบันทึก Actions Taken ใดๆ (`actionsTaken.length == 0`) When มีการส่งคำขอเปลี่ยนสถานะตั๋วเป็น `RESOLVED` Then เซิร์ฟเวอร์ต้องปฏิเสธด้วย `400 Bad Request` พร้อมแจ้งว่าต้องมี Ticket Owner และ Actions Taken ก่อนเสมอ

---

## 10. Product Definition of Done (DoD)

ชุดงาน Sprint 4 จะถือว่าเสร็จสมบูรณ์พร้อมส่งมอบต่อเมื่อ:
1. **Specification & Test DD:** เอกสาร `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md` ได้รับการจัดทำครบถ้วนและสอดคล้องกัน 100%
2. **Schema & Migration:** Prisma Migration รันผ่านสำเร็จ ข้อมูลเดิมจาก Lab 1-3 คงอยู่ครบถ้วน ปลอดภัยต่อ Legacy Records
3. **Idempotent Seed:** รันคำสั่ง Seed ซ้ำได้โดยไม่มี Error และมีชุดข้อมูลทดสอบครอบคลุมทุกกรณี
4. **Backend Implementation:** ทุก REST API Endpoint มีการบังคับใช้ Server-side Authorization, Input Validation และ Concurrency Control
5. **Frontend Implementation:** ส่วนต่อประสานผู้ใช้สอดคล้องกับ Zen Green Design System, ปฏิบัติตาม Responsive Rules (Desktop, Tablet, Mobile) และผ่านเกณฑ์ Accessibility Checklist
6. **Automated Testing:** Unit Tests, API Tests, Component Tests, และ Playwright E2E Tests ผ่าน 100% (Green)
7. **Quality & Cleanliness:** ไร้ Console Errors/Warnings, ไร้ Broken Links, ไร้ Dead Code, และลบ Placeholder ทั้งหมด
8. **Git Workflow & Evidence:** พัฒนาแยกกิ่งตาม Feature Branches รวมเข้าสู่ `lab4-staging` ผ่าน Pull Requests ที่มีการรีวิว และรวมเข้าสู่ `main` อย่างสมบูรณ์ พร้อมภาพ Screenshot ครบทั้ง 9 ส่วน
9. **Documentation:** อัปเดต `README.md`, `reviewer.md`, และ `ai-use.md` เรียบร้อย

---

## 11. Assumptions and Architectural Decisions

1. **Date Boundaries for "Recent" Data:** กำหนดให้คำว่า "Recently Updated" บน Dashboard หมายถึงตั๋วที่มีการเปลี่ยนแปลงภายใน 7 วันย้อนหลัง และ "Recently Resolved" หมายถึงตั๋วที่ถูกแก้ไขปัญหาเสร็จสิ้นภายใน 30 วันย้อนหลัง
2. **Recent Tickets Limit:** หน้า Dashboard ทั้งสองฝั่งจะแสดงรายการตั๋วล่าสุดไม่เกิน 5 รายการ เพื่อคงความกระชับและไม่ซ้ำซ้อนกับหน้ารายการตั๋วหลัก
3. **Optimistic Concurrency Strategy:** การป้องกัน Stale Update จะใช้ฟิลด์ `updatedAt` ส่งมาตรวจสอบเปรียบเทียบใน Header หรือ Request Payload หาก `updatedAt` ในฐานข้อมูลใหม่กว่าคำขอ ระบบจะส่งกลับ `409 Conflict` ทันที
4. **Advisory Indication Visual Cue:** เมื่อ Requester ระบุว่างานเสร็จสิ้นแล้ว ระบบจะแสดงข้อความแจ้งเตือนสีฟ้า-เขียวบนหน้า Ticket Detail ของ IT Staff เพื่อกระตุ้นให้เข้ามาตรวจรับงานอย่างเป็นทางการ
