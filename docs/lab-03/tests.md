# Lab 3 Test Plan and Traceability Matrix
**TokTickIT Users, Roles, IT Staff Ticketing, and Admin Operations**

---

## 1. Test Strategy & Scope

การทดสอบใน Sprint 3 ดำเนินการภายใต้ระเบียบวิธี **Test-Driven Development (TDD)** และ **Spec-Driven Development (Spec DD)** โดยจัดทำแผนการทดสอบและข้อกำหนดล่วงหน้าเพื่อใช้เป็นเครื่องมือตรวจรับงาน (Traceable Verification) ครอบคลุมการทดสอบ 5 ระดับ:

1. **Unit Testing (Vitest):**
   - ทดสอบตรรกะความซับซ้อนของรหัสผ่าน (`validatePasswordPolicy`)
   - ทดสอบกฎการเปลี่ยนสถานะตั๋วตาม Transition Matrix (`validateStatusTransition`)
   - ทดสอบความปลอดภัยของการแปลงข้อความ (Text Sanitization) สำหรับ Comment และ Note
2. **Backend API & Security Integration Testing (Vitest + Supertest):**
   - ทดสอบระบบ Authentication (เข้าสู่ระบบ, ออกจากระบบ, ตรวจสอบ Token, ปฏิเสธบัญชี Inactive)
   - ทดสอบ Server-side Authorization และการป้องกันข้ามบทบาท (Cross-role isolation)
   - ทดสอบ IT Staff Queue (การค้นหา, ตัวกรอง, การจัดเรียง, Pagination)
   - ทดสอบการจัดการตั๋ว (Claim, Reassign, IT Priority, Status Transitions)
   - ทดสอบการแยกสิทธิ์ระหว่าง Public Comments กับ Internal Notes (ป้องกัน Requester มองเห็น Notes)
   - ทดสอบ Administrator User Management และกฎความปลอดภัย (ป้องกัน Email ซ้ำ, ป้องกัน Self-deactivation, ป้องกันปิด Last Active Admin)
3. **UI Component Testing (Vitest + React Testing Library):**
   - ทดสอบฟอร์ม Login และข้อความแจ้งเตือนเมื่อเกิดความผิดพลาด
   - ทดสอบหน้าจอ Mandatory Change Password และ Dynamic Checklist
   - ทดสอบตาราง IT Staff Ticket Queue และตัวกรอง
   - ทดสอบการสลับแท็บและความแตกต่างของสีระหว่าง Public Comments กับ Internal Notes ในหน้า Ticket Detail
   - ทดสอบหน้าต่างจัดการผู้ใช้ของ Administrator
4. **UI Style & Responsive Testing (Playwright Visual Inspection):**
   - ทดสอบความถูกต้องของ Zen Green Theme Tokens และคู่สีของ Badge
   - ทดสอบการแสดงผลบน Desktop ($\ge 992\text{px}$), Tablet ($768 - 991\text{px}$) และ Mobile ($< 768\text{px}$) ไม่ให้เกิด Horizontal Overflow
5. **End-to-End (E2E) Testing (Playwright):**
   - ทดสอบ Flow ผู้ใช้ใหม่: Login ด้วย Initial Password -> ถูกบังคับเปลี่ยนรหัสผ่าน -> นำทางเข้าสู่ระบบ
   - ทดสอบ IT Staff Flow: ค้นหาตั๋วใน Queue -> รับตั๋วเป็น Owner -> ปรับ IT Priority -> บันทึก Internal Note -> เปลี่ยนสถานะเป็น Resolved
   - ทดสอบ Admin Flow: สร้างผู้ใช้ใหม่ -> แก้ไขบทบาท -> ปิดการใช้งาน -> ตรวจสอบว่าบัญชีที่ปิดใช้งานไม่สามารถ Login ได้

---

## 2. Test Traceability Matrix

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **API-01** | API | FR-01, BR-01, AC-01 | Valid user authentication | ได้รับ Token (200 OK) พร้อมข้อมูล User Profile และ Role ที่ถูกต้อง | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-02** | API | FR-01, BR-01 | Invalid email or password | ปฏิเสธการเข้าสู่ระบบ (401 Unauthorized) พร้อมข้อความปลอดภัย | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-03** | API | FR-05, BR-01, AC-05 | Inactive user login attempt | ปฏิเสธการเข้าสู่ระบบ (403 Forbidden) พร้อมข้อความแจ้งบัญชี Inactive | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-04** | API | FR-03, BR-05 | Current user session retrieval (`/api/auth/me`) | คืนค่าข้อมูลระบุตัวตนของผู้ใช้ที่ล็อกอินอยู่ปัจจุบัน | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-05** | API | FR-04, BR-05 | User logout action | บันทึกการออกจากระบบสำเร็จ Token หมดสภาพการใช้งาน | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-06** | API | FR-02, BR-02, BR-03, AC-02 | First-login password change | อัปเดตรหัสผ่านใหม่สำเร็จ และปลดสถานะ `mustChangePassword = false` | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **API-07** | API | FR-07, BR-07, AC-03 | Direct Requester ID spoofing prevention | Backend ใช้ ID จาก Token เสมอ เพิกเฉยต่อ requesterId ปลอมที่ส่งมา | `server/tests/lab-03/authorization.api.test.ts` | **Pass** |
| **API-08** | API | FR-16, BR-18, AC-04 | Requester requests Internal Notes | ปฏิเสธคำขอ (403 Forbidden) โดยไม่เปิดเผยข้อความหรือข้อมูล Note | `server/tests/lab-03/comments-notes.api.test.ts` | **Pass** |
| **API-09** | API | FR-07, BR-22, AC-14 | Non-Admin requests Admin APIs | ผู้ใช้บทบาทอื่นเรียก `/api/admin/*` ได้รับการปฏิเสธ (403 Forbidden) | `server/tests/lab-03/authorization.api.test.ts` | **Pass** |
| **API-10** | API | FR-11, AC-06 | IT Staff Ticket Queue with search & filter | ดึงตั๋วในคิวตรงตามเงื่อนไขค้นหาและตัวกรอง พร้อม Metadata Pagination | `server/tests/lab-03/staff-queue.api.test.ts` | **Pass** |
| **API-11** | API | FR-11 | Ticket Queue pagination boundary | จัดการเลขหน้าที่เกินขอบเขตอย่างถูกต้อง ไม่ทำให้เซิร์ฟเวอร์ขัดข้อง | `server/tests/lab-03/staff-queue.api.test.ts` | **Pass** |
| **API-12** | API | FR-12 | IT Staff Ticket Detail inspection | ส่งคืนข้อมูลรายละเอียดตั๋วที่ครบถ้วนสำหรับเจ้าหน้าที่ไอที | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Pass** |
| **API-13** | API | FR-13, BR-11, AC-07 | Ticket ownership claim & reassignment | เปลี่ยน Ticket Owner เป็น IT Staff สำเร็จ (200 OK) | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Pass** |
| **API-14** | API | FR-14, BR-12 | IT Priority modification | อัปเดตค่า IT Priority สำเร็จโดยไม่กระทบ Requested Priority เดิม | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Pass** |
| **API-15** | API | FR-15, BR-14, AC-08 | Permitted status transition (Valid) | เปลี่ยนสถานะตาม Transition Matrix (เช่น NEW -> IN_PROGRESS) สำเร็จ | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Pass** |
| **API-16** | API | FR-15, BR-14, AC-08 | Forbidden status transition (Invalid) | ปฏิเสธการข้ามขั้นสถานะผิดกฎ (เช่น NEW -> CLOSED) ด้วย 400 Bad Request | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Pass** |
| **API-17** | API | FR-10, BR-15, AC-09 | Requester resolution indication | Requester ตั้งค่า `resolvedIndicated = true` สำเร็จโดยไม่เปลี่ยนสถานะตั๋ว | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Pass** |
| **API-18** | API | FR-09, FR-16, BR-17, AC-10 | Public Comments append-only posting | บันทึกความคิดเห็นสาธารณะสำเร็จ พร้อมผู้เขียนและเวลาสร้าง | `server/tests/lab-03/comments-notes.api.test.ts` | **Pass** |
| **API-19** | API | FR-16, BR-18 | Internal Notes posting by IT Staff | บันทึกบันทึกภายในสำเร็จ เฉพาะ IT Staff และ Admin | `server/tests/lab-03/comments-notes.api.test.ts` | **Pass** |
| **API-20** | API | FR-17, BR-22 | Admin user listing with filter | Administrator ดึงรายชื่อผู้ใช้ ค้นหา และกรองตาม Role สำเร็จ | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-21** | API | FR-18, BR-24 | Admin creates new user with initial password | สร้างผู้ใช้ใหม่สำเร็จ บัญชีถูกตั้งค่า `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-22** | API | FR-18, BR-23, AC-11 | Admin duplicate email rejection | ปฏิเสธการสร้างหรือแก้ไขอีเมลที่ซ้ำด้วย 409 Conflict | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-23** | API | FR-19 | Admin edits user basic information | แก้ไขชื่อ อีเมล และบทบาทของผู้ใช้สำเร็จ | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-24** | API | FR-19, BR-25, AC-12 | Admin self-deactivation prevention | ปฏิเสธคำขอที่ Admin พยายาม Deactivate บัญชีตนเอง (400 Bad Request) | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-25** | API | FR-19, BR-26, AC-13 | Last active administrator protection | ปฏิเสธการ Deactivate หรือเปลี่ยนบทบาทของ Admin คนสุดท้ายในระบบ | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-26** | API | FR-20, BR-24 | Admin resets initial password | กำหนดรหัสผ่านเริ่มต้นใหม่สำเร็จ และตั้งค่าให้ผู้ใช้ต้องเปลี่ยนรหัส | `server/tests/lab-03/users-admin.api.test.ts` | **Pass** |
| **API-27** | API | FR-08 (Lab 2 Regression) | Requester ticket & attachment operations | ฟังก์ชัน Lab 2 (สร้างตั๋ว, แนบไฟล์, ดาวน์โหลด, Soft-delete) ยังทำงานผ่าน 100% | `server/tests/lab-03/auth.api.test.ts` | **Pass** |
| **UI-01** | UI | FR-01, BR-01 | Login screen validation & busy state | แสดง Error ใต้ช่องกรอก และแสดงปุ่ม Disabled/Spinner เมื่อกดส่งฟอร์ม | `client/tests/lab-03/Login.test.tsx` | **Pass** |
| **UI-02** | UI | FR-02, BR-02, BR-03 | ChangePassword policy checklist | เครื่องหมายถูกใน Checklist เปลี่ยนเป็นสีเขียวเมื่อรหัสผ่านผ่านเกณฑ์ | `client/tests/lab-03/ChangePassword.test.tsx` | **Pass** |
| **UI-03** | UI | FR-11, AC-06 | StaffTicketQueue table & filters | แสดงตารางคิวงาน ป้ายสถานะ/ความสำคัญ และการโต้ตอบกับปุ่ม Filter | `client/tests/lab-03/StaffTicketQueue.test.tsx` | **Pass** |
| **UI-04** | UI | FR-13, FR-14, FR-15 | StaffTicketDetail operational controls | Dropdown เจ้าหน้าที่, IT Priority และสถานะแสดงผลและเปลี่ยนค่าได้ถูกต้อง | `client/tests/lab-03/StaffTicketDetail.test.tsx` | **Pass** |
| **UI-05** | UI | FR-16, BR-17, BR-18 | Public Comments vs Internal Notes UI | แสดงแท็บแยกชัดเจน โทนสีเขียวสำหรับ Public และสีส้มสำหรับ Private Note | `client/tests/lab-03/StaffTicketDetail.test.tsx` | **Pass** |
| **UI-06** | UI | FR-17, FR-18, FR-19 | UserManagement list and modals | แสดงตารางผู้ใช้ Modal สร้าง/แก้ไข และสวิตช์เปิดปิดสถานะ Active | `client/tests/lab-03/UserManagement.test.tsx` | **Pass** |
| **UI-07** | UI | BR-25, AC-12 | Self-deactivation button disabled for Admin | ปุ่ม Deactivate ถูก Disable เมื่อเปิดดูบัญชีตนเอง | `client/tests/lab-03/UserManagement.test.tsx` | **Pass** |
| **UI-08** | UI | FR-09, FR-10 | Requester Ticket Detail enhancements | แสดงเฉพาะ Public Comments และปุ่ม Problem Appears Resolved (ไม่มี Note) | `client/tests/lab-03/RequesterTicketDetail.test.tsx`| **Pass** |
| **E2E-01** | E2E | FR-01, FR-04, FR-06 | Full login, role nav, and logout flow | เข้าสู่ระบบตาม Role ตรวจสอบ Navbar เฉพาะบทบาท และออกจากระบบสำเร็จ | `e2e/lab-03/authentication.spec.ts` | **Pass** |
| **E2E-02** | E2E | FR-02, BR-02, AC-02 | Mandatory initial password change journey | บัญชีรหัสเริ่มต้นถูกบังคับเปลี่ยนรหัสผ่าน จึงจะสามารถเข้าสู่ระบบหลักได้ | `e2e/lab-03/authentication.spec.ts` | **Pass** |
| **E2E-03** | E2E | FR-11 - FR-16 | IT Staff end-to-end ticket triage flow | เจ้าหน้าที่ค้นหาตั๋วในคิว -> รับตั๋ว -> เพิ่ม Note -> ปิดงานตั๋วสำเร็จ | `e2e/lab-03/staff-ticket-flow.spec.ts` | **Pass** |
| **E2E-04** | E2E | FR-17 - FR-21 | Administrator user management workflow | แอดมินสร้างผู้ใช้ใหม่ -> ลองทดสอบล็อกอิน -> ทำการระงับบัญชี (Deactivate) | `e2e/lab-03/user-administration.spec.ts` | **Pass** |
| **RESP-01**| Visual | AC-15 | Desktop Viewport ($\ge 992\text{px}$) | Layout 2 คอลัมน์ ตารางเต็มรูปแบบ สไตล์ Zen Green สวยงาม | `e2e/lab-03/responsive-visual.spec.ts` | **Pass** |
| **RESP-02**| Visual | AC-15 | Mobile Viewport ($< 768\text{px}$) | การ์ดข้อมูลแนวตั้ง ไม่มี Horizontal Overflow ปุ่มสัมผัส $\ge 44\text{px}$ | `e2e/lab-03/responsive-visual.spec.ts` | **Pass** |

---

## 3. Automated Test Directory & File Mapping

ตารางความสอดคล้องของไฟล์ทดสอบอัตโนมัติตามโครงสร้างที่กำหนดใน Section 12 และ 16 ของเอกสาร Lab:

```
server/tests/lab-03/
├── auth.api.test.ts               # ครอบคลุม API-01, API-02, API-03, API-04, API-05, API-06, API-27
├── authorization.api.test.ts      # ครอบคลุม API-07, API-09 (RBAC & Server-Side Security)
├── staff-queue.api.test.ts        # ครอบคลุม API-10, API-11 (Queue Queries, Pagination, Filters)
├── staff-ticket-detail.api.test.ts# ครอบคลุม API-12, API-13, API-14, API-15, API-16, API-17
├── comments-notes.api.test.ts     # ครอบคลุม API-08, API-18, API-19 (Comments & Notes Isolation)
└── users-admin.api.test.ts        # ครอบคลุม API-20, API-21, API-22, API-23, API-24, API-25, API-26

client/tests/lab-03/
├── Login.test.tsx                 # ครอบคลุม UI-01
├── ChangePassword.test.tsx        # ครอบคลุม UI-02
├── StaffTicketQueue.test.tsx      # ครอบคลุม UI-03
├── StaffTicketDetail.test.tsx     # ครอบคลุม UI-04, UI-05
├── UserManagement.test.tsx        # ครอบคลุม UI-06, UI-07
└── RequesterTicketDetail.test.tsx # ครอบคลุม UI-08

e2e/lab-03/
├── authentication.spec.ts         # ครอบคลุม E2E-01, E2E-02
├── staff-ticket-flow.spec.ts      # ครอบคลุม E2E-03
├── user-administration.spec.ts    # ครอบคลุม E2E-04
└── responsive-visual.spec.ts      # ครอบคลุม RESP-01, RESP-02
```
