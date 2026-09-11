# Lab 3 Sprint Engineering Specification
**TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens**

---

## 1. Sprint Goal

ส่งมอบระบบการพิสูจน์ตัวตนจริง (Real Authentication) และการควบคุมสิทธิ์ตามบทบาท (Role-Based Access Control - RBAC) เพื่อทดแทนตัวเลือกผู้ใช้จำลองเดิมใน Lab 2 โดยรองรับบทบาทผู้ใช้ 3 กลุ่ม ได้แก่ **Requester**, **IT Staff**, และ **Administrator** พร้อมทั้งพัฒนาระบบคิวงานและกระบวนการจัดการตั๋วสำหรับ IT Staff (Ticket Queue, Ticket Detail, Claim/Assign Ownership, Update IT Priority, Status Transitions, Public Comments และ Internal Notes) และระบบจัดการบัญชีผู้ใช้ขั้นพื้นฐานสำหรับ Administrator (User Management Screen) ภายใต้มาตรฐานความปลอดภัยที่บังคับใช้การตรวจสอบสิทธิ์ที่ฝั่งเซิร์ฟเวอร์ (Server-Side Authorization) ในทุก Endpoint และคงความสามารถเดิมของระบบ Requester จาก Lab 2 ไว้อย่างสมบูรณ์โดยไม่เกิด Regression

---

## 2. Stakeholder Request Interpretation

ฝ่ายสนับสนุนเทคโนโลยีสารสนเทศ (IT Department) และผู้มีส่วนได้เสียต้องการยกระดับระบบ TokTickIT จากระยะทดสอบ (Lab 2) เข้าสู่การใช้งานจริง:
1. **การรักษาความปลอดภัยและตัวตนจริง:** ยกเลิกตัวเลือก Requester จำลอง (Development Requester Selector) และแทนที่ด้วยระบบยืนยันตัวตนด้วยอีเมลและรหัสผ่านที่ปลอดภัย โดยกำหนดให้ผู้ใช้ที่ได้รับรหัสผ่านเริ่มต้น (Initial Password) ต้องเปลี่ยนรหัสผ่านใหม่ทันทีในการเข้าสู่ระบบครั้งแรก (Mandatory First-Login Password Change) ก่อนเข้าสู่ระบบหลัก
2. **การปกป้องข้อมูลและการแบ่งแยกบทบาท (RBAC & Data Ownership):** สิทธิ์การเข้าถึงข้อมูลและการดำเนินการทั้งหมดต้องถูกบังคับที่เซิร์ฟเวอร์ตามบทบาท (Role) และความเป็นเจ้าของ (Ownership) โดยไม่พึ่งพาการซ่อนปุ่มบนหน้าจอเพียงอย่างเดียว ผู้ใช้แต่ละบทบาทจะมองเห็นเฉพาะเมนูและข้อมูลที่ตนมีสิทธิ์เท่านั้น
3. **ระบบสนับสนุนงานของ IT Staff:** เจ้าหน้าที่ไอทีต้องการหน้าต่างคิวงาน (Ticket Queue) ที่มีประสิทธิภาพ รองรับการค้นหา กรอง จัดเรียง แบ่งหน้า และสามารถเปิดดูรายละเอียดตั๋ว (Ticket Detail) เพื่อรับเรื่อง (Claim), มอบหมายงาน (Reassign), ปรับระดับความสำคัญของงาน (IT Priority), ปรับปรุงสถานะตั๋วตามกระบวนการทำงานที่ได้รับอนุญาต, สื่อสารกับผู้แจ้งผ่านความคิดเห็นสาธารณะ (Public Comments) และบันทึกข้อมูลการทำงานส่วนตัวเฉพาะเจ้าหน้าที่ผ่านบันทึกภายใน (Internal Notes)
4. **ความต่อเนื่องของผู้ร้องขอ (Requester Continuity):** ผู้ร้องขอยังคงสามารถสร้าง ดู และจัดการตั๋วรวมถึงไฟล์แนบของตนเองได้ตามปกติ โดยตัวตนจะถูกผูกกับบัญชีที่ล็อกอินอยู่จริง สามารถแสดงความคิดเห็นสาธารณะโต้ตอบกับเจ้าหน้าที่ และสามารถส่งสัญญาณระบุว่าปัญหาได้รับการแก้ไขแล้ว ("Problem Appears Resolved") แต่ไม่มีสิทธิ์เปลี่ยนสถานะตั๋วเป็น Resolved หรือ Closed โดยตรง
5. **ระบบบริหารจัดการผู้ใช้สำหรับ Administrator:** ผู้ดูแลระบบต้องการหน้าจอจัดการบัญชีผู้ใช้อย่างง่าย (Minimalist User Management) เพื่อดูรายชื่อ ค้นหา กรองตามบทบาท สร้างผู้ใช้ใหม่พร้อมกำหนด 1 บทบาท กำหนดรหัสผ่านเริ่มต้น แก้ไขข้อมูลพื้นฐาน และเปิด/ปิดการใช้งานบัญชี (Activate/Deactivate) พร้อมทั้งมีกฎความปลอดภัยป้องกันระบบเสียหาย
6. **ความต่อเนื่องของดีไซน์ Zen Green:** การขยายหน้าจอใหม่ทั้งหมดต้องสอดคล้องกับระบบดีไซน์ Zen Green Design Language จาก Lab 2 ทั้งในด้านโทนสี ส่วนประกอบ UI และความสามารถในการแสดงผลบนหน้าจอทุกขนาด (Responsive)

---

## 3. Scope

### 3.1. Included Scope (ขอบเขตงานที่รวมอยู่ใน Lab 3)
1. **Authentication & Session Foundation:**
   - การเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน (Email & Password Authentication)
   - การออกจากระบบ (Logout) และการดึงข้อมูลผู้ใช้ปัจจุบัน (Current User Retrieval - `/api/auth/me`)
   - ระบบบังคับเปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งแรก (Mandatory First-Login Password Change)
   - การเก็บรหัสผ่านแบบแฮชที่ปลอดภัย (Password Hashing ด้วย bcrypt) และการรักษาความลับของระบบ
   - การจัดการ Session / Auth Token และการจัดการกับบัญชีที่ถูกระงับ (Inactive Account Handling)
2. **Role-Based Access Control (RBAC):**
   - รองรับบทบาทผู้ใช้ 3 กลุ่ม: `Requester`, `IT Staff`, `Administrator` (ผู้ใช้ 1 คนมีได้เพียง 1 บทบาท)
   - การปรับ Application Header และการนำทาง (Navigation) ให้สอดคล้องกับบทบาทที่ได้รับอนุญาต
   - การบังคับใช้การตรวจสอบสิทธิ์และป้องกันการเข้าถึงที่ฝั่งเซิร์ฟเวอร์ (Server-Side Authorization Enforcement) ทุก Endpoint
3. **Requester Continuity & Enhancements:**
   - ถอด Development Requester Selector และปุ่ม Change Requester ออกจากระบบ
   - บังคับใช้ตัวตนจริงจาก Authentication Token ในทุกฟังก์ชันของ Requester (สร้างตั๋ว, ดู My Tickets, จัดการไฟล์แนบ)
   - เพิ่มฟังก์ชันการแสดงความคิดเห็นสาธารณะ (Public Comments) ในหน้า Requester Ticket Detail
   - เพิ่มการส่งสัญญาณระบุว่าปัญหาได้รับการแก้ไขแล้ว ("Problem Appears Resolved") สำหรับเจ้าของตั๋ว
4. **IT Staff Ticket Queue & Detail Operations:**
   - หน้าคิวงาน IT Staff Ticket Queue ที่รองรับการค้นหา (Ticket No, Summary), การกรอง (Status, Priority, Ownership), การจัดเรียง (Sorting) และการแบ่งหน้า (Pagination)
   - หน้า IT Staff Ticket Detail แสดงข้อมูลตั๋วและฟิลด์ที่อนุญาตให้แก้ไขเฉพาะด้านการดำเนินงาน
   - การรับตั๋วเป็นเจ้าของ (Claim Ownership), การมอบหมายหรือเปลี่ยนผู้รับผิดชอบ (Assign / Reassign Ownership)
   - การกำหนดระดับความสำคัญของงานไอที (IT Priority)
   - การเปลี่ยนสถานะตั๋วตามแผนผังการเปลี่ยนสถานะที่อนุญาต (Permitted Status Transitions)
   - ระบบความคิดเห็นสาธารณะ (Public Comments) ที่เห็นได้ทั้ง Requester, IT Staff และ Administrator
   - ระบบบันทึกภายใน (Internal Notes) ที่เข้าถึงและมองเห็นได้เฉพาะ IT Staff และ Administrator เท่านั้น พร้อมการออกแบบ UI ที่แยกความแตกต่างอย่างชัดเจน
5. **Administrator User Management (Minimalist):**
   - แสดงรายการผู้ใช้ (User List) พร้อม Name, Email, Role badge, Status badge, และปุ่มดำเนินการ
   - ค้นหาผู้ใช้ตามชื่อหรืออีเมล และตัวเลือกกรองตามบทบาท (Role Filter)
   - การสร้างผู้ใช้ใหม่ (Create User) กำหนดชื่อ อีเมล 1 บทบาท สถานะ Active และรหัสผ่านเริ่มต้น
   - การแก้ไขข้อมูลผู้ใช้ (Edit User) ชื่อ อีเมล บทบาท และสถานะการเปิด/ปิดใช้งาน (Activate / Deactivate)
   - การรีเซ็ตรหัสผ่านเริ่มต้นใหม่ (Set/Reset Initial Password) โดยระบบจะบังคับให้เปลี่ยนรหัสผ่านในการล็อกอินครั้งต่อไป
   - กฎความปลอดภัยป้องกัน Administrator ปิดการใช้งานตนเอง และป้องกันการปิดการใช้งาน Administrator คนสุดท้ายในระบบ
6. **Data Layer Evolution & Migration:**
   - ปรับปรุง Prisma Schema เพื่อรองรับ User จริง, Enum Roles, Password Hashes, Ticket Owner Relation, Comment Model, InternalNote Model
   - แผนการ Migration ข้อมูล Requester เดิมจาก Lab 2 ให้เข้าสู่ User Model ใหม่พร้อมกำหนดรหัสผ่านเริ่มต้น
   - ข้อมูล Seed Data แบบ Idempotent ตามเกณฑ์ที่กำหนด (4 Active Requester, 1 Inactive Requester, 3 Active IT Staff, 1 Inactive IT Staff, 1 Active Administrator, ตั๋วจำลอง, และความคิดเห็น/บันทึกตัวอย่าง)
7. **Zen Green UI Continuity:**
   - ขยายและปรับใช้ Zen Green Tokens, Components, Forms, Badges, และ Feedback States (Loading, Empty, No-results, Forbidden, Safe Failures)
   - รองรับ Responsive Web Design (Desktop, Tablet, Mobile) ครบทุกหน้าจอ

### 3.2. Explicitly Excluded from Lab 3 (ขอบเขตงานที่ห้ามทำเด็ดขาดตามข้อกำหนด 4.2)
* ❌ การส่งอีเมลเชิญผู้ใช้ (Email invitations), อีเมลรีเซ็ตรหัสผ่าน (Password-reset email), การส่งรหัสผ่านทางอีเมล (Email delivery of initial passwords or reset links)
* ❌ ระบบยืนยันตัวตนหลายปัจจัย (Multi-Factor Authentication - MFA), โซเชียลล็อกอิน (Social Login), และ Single Sign-On (SSO)
* ❌ การลงทะเบียนตนเองของผู้ใช้ (Self-registration) และการสร้างบัญชีโดย Requester
* ❌ ฟีเจอร์บันทึกการปฏิบัติงานของไอที (Actions Taken by IT Staff) - **ข้อกำหนดนี้ระบุชัดเจนว่าเลื่อนไปพัฒนาใน Lab 4**
* ❌ ระบบคำนวณข้อตกลงระดับการบริการ (Formal SLA calculation), กฎการส่งต่อปัญหาตามลำดับขั้น (Escalation rules) และระบบแจ้งเตือนภายนอก (Notification services)
* ❌ แดชบอร์ดสถิติขั้นสูงและการวิเคราะห์ KPI (Dashboards and KPI analytics beyond simple queue counts)
* ❌ ระบบการจัดการองค์กรแบบหลายผู้เช่า (Multi-tenant organizations), แผนก (Departments) และระบบบริหารลูกค้าภายนอก (Customer administration)
* ❌ การปรับเปลี่ยนสถาปัตยกรรมโครงสร้างพื้นฐานบนคลาวด์หรือ Production Deployment
* ❌ การกำหนดหลายบทบาทให้ผู้ใช้คนเดียว (Multiple roles assigned to one user) - กำหนดได้เพียง 1 บทบาทเท่านั้น
* ❌ การลบผู้ใช้ (User deletion), การดำเนินการกับผู้ใช้แบบกลุ่ม (Bulk user operations), การนำเข้า/ส่งออกข้อมูลผู้ใช้ (User import/export) และหน้าจอดูประวัติบัญชี (Account-history screens)
* ❌ การจัดการข้อมูลโปรไฟล์ผู้ใช้เพิ่มเติม เช่น แผนก องค์กร รูปภาพโปรไฟล์ (Profile-photo)
* ❌ เวิร์กโฟลว์การปลดล็อกบัญชี (Account unlocking) และกระบวนการอนุมัติของผู้ดูแลระบบขั้นสูง
* ❌ ฟีเจอร์ขั้นสูงสำหรับตารางผู้ใช้ เช่น บังคับการแบ่งหน้า (Mandatory pagination for users), การเรียงลำดับหลายคอลัมน์พร้อมกัน (Multi-column sorting) และตัวกรองหลายเงื่อนไขพร้อมกันหลายตัว

---

## 4. Functional Requirements (FR)

### หมวดที่ 1: Authentication & Session Management
* **FR-01 (User Authentication):** ระบบต้องให้บริการ API สำหรับการยืนยันตัวตนด้วย Email และ Password โดยส่งคืน Authentication Token/Cookie พร้อมข้อมูลโปรไฟล์และบทบาทของผู้ใช้
* **FR-02 (Mandatory Password Change):** ระบบต้องตรวจสอบสถานะ `mustChangePassword` หากผู้ใช้เข้าสู่ระบบด้วยรหัสผ่านเริ่มต้น ระบบต้องบล็อกไม่ให้เข้าสู่หน้าจอทำงานปกติจนกว่าจะบันทึกรหัสผ่านใหม่ที่ผ่านเกณฑ์ความปลอดภัยสำเร็จ
* **FR-03 (User Session & Me Retrieval):** ระบบต้องให้บริการ Endpoint `/api/auth/me` เพื่อดึงข้อมูลระบุตัวตน บทบาท และสถานะของผู้ใช้ที่กำลังเข้าสู่ระบบอยู่ในปัจจุบัน
* **FR-04 (User Logout):** ระบบต้องให้บริการ Endpoint สำหรับออกจากระบบ โดยยกเลิกความถูกต้องของ Session/Token และล้างข้อมูลยืนยันตัวตนในเบราว์เซอร์
* **FR-05 (Inactive Account Handling):** ระบบต้องปฏิเสธการยืนยันตัวตนของผู้ใช้ที่มีสถานะ `isActive = false` โดยส่งข้อความแจ้งเตือนที่ปลอดภัยและไม่เปิดเผยข้อมูลภายในของระบบ

### หมวดที่ 2: Role-Based Navigation & Authorization
* **FR-06 (Role-Based Header & Navigation):** ระบบต้องแสดงแถบนำทางและเมนูตามบทบาทของผู้ใช้:
  * `Requester`: My Tickets, Create Ticket
  * `IT Staff`: My Queue, Create Ticket (หากต้องการเปิดตั๋วในนามตนเอง)
  * `Administrator`: Admin (User Management)
* **FR-07 (Server-Side Authorization Enforcement):** ทุก Endpoint ที่ได้รับการปกป้อง ต้องตรวจสอบบทบาทและความเป็นเจ้าของที่ Backend หากผู้ใช้ไม่มีสิทธิ์ ระบบต้องตอบกลับด้วย HTTP Status Code ที่เหมาะสม (`401 Unauthorized` หรือ `403 Forbidden`) ทันที โดยไม่พึ่งพาการซ่อนปุ่มบนหน้าบ้าน

### หมวดที่ 3: Requester Continuity & Enhancements
* **FR-08 (Authenticated Requester Operations):** ฟังก์ชันของ Requester ทั้งหมด (สร้างตั๋ว, ดู My Tickets, ดูรายละเอียดตั๋ว, อัปโหลด/ดาวน์โหลด/ลบไฟล์แนบ) ต้องใช้ข้อมูลตัวตนจาก Authentication Token ของผู้ใช้ปัจจุบัน โดยห้ามรับหรือเชื่อถือ `requesterId` จาก Request Body/Header ที่ส่งมาจาก Client
* **FR-09 (Requester Public Comments):** Requester เจ้าของตั๋วต้องสามารถดูและโพสต์ Public Comments บนตั๋วของตนเองได้
* **FR-10 (Problem Appears Resolved Indication):** Requester เจ้าของตั๋วต้องสามารถส่งสัญญาณแจ้งว่าปัญหาได้รับการแก้ไขแล้ว ("Problem Appears Resolved") เพื่อแจ้งเตือน IT Staff ผ่านระบบได้

### หมวดที่ 4: IT Staff Ticket Queue & Detail Operations
* **FR-11 (IT Staff Ticket Queue Retrieval):** IT Staff ต้องสามารถดึงรายการตั๋วทั้งหมดในระบบ พร้อมรองรับการค้นหา (ตามหมายเลขตั๋วหรือ Summary), การกรอง (ตาม Status, IT Priority, Assignment), การจัดเรียง (ตามวันที่สร้าง วันที่อัปเดต หรือความสำคัญ) และการแบ่งหน้า (Pagination)
* **FR-12 (IT Staff Ticket Detail Inspection):** IT Staff ต้องสามารถเปิดดูรายละเอียดตั๋วทุกใบในระบบได้ โดยแสดงข้อมูลทั่วไปแบบอ่านอย่างเดียว และแสดงส่วนควบคุมเฉพาะสำหรับการดำเนินงาน
* **FR-13 (Ticket Claim & Reassignment):** IT Staff ต้องสามารถกดรับตั๋วเป็นของตนเอง (Claim Ticket) หรือมอบหมายตั๋วให้ IT Staff คนอื่น หรือยกเลิกการมอบหมาย (Unassign) ได้
* **FR-14 (IT Priority Modification):** IT Staff ต้องสามารถปรับเปลี่ยนระดับ IT Priority ของตั๋วได้
* **FR-15 (Permitted Status Transitions):** IT Staff ต้องสามารถปรับเปลี่ยนสถานะของตั๋วตามแผนผังสถานะที่ได้รับอนุญาต (New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled)
* **FR-16 (Public Comments & Internal Notes Posting):**
  * IT Staff และ Administrator ต้องสามารถโพสต์และดูความคิดเห็นสาธารณะ (Public Comments)
  * IT Staff และ Administrator ต้องสามารถโพสต์และดูบันทึกภายใน (Internal Notes) ซึ่งถูกเก็บเป็นความลับจาก Requester

### หมวดที่ 5: Minimalist Administrator User Management
* **FR-17 (User Listing & Filtering):** Administrator ต้องสามารถดูรายชื่อผู้ใช้ทั้งหมดในระบบ พร้อมค้นหาด้วยชื่อหรืออีเมล และกรองตามบทบาทได้
* **FR-18 (User Creation):** Administrator ต้องสามารถสร้างผู้ใช้ใหม่ โดยกำหนดชื่อ อีเมล 1 บทบาท สถานะการใช้งาน และรหัสผ่านเริ่มต้นได้
* **FR-19 (User Information Update):** Administrator ต้องสามารถแก้ไขชื่อ อีเมล บทบาท และสถานะการเปิด/ปิดใช้งาน (Active/Inactive) ของผู้ใช้ได้
* **FR-20 (Initial Password Reset):** Administrator ต้องสามารถกำหนดรหัสผ่านเริ่มต้นใหม่ให้แก่ผู้ใช้ได้ โดยระบบจะตั้งค่าให้ผู้ใช้ต้องเปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งถัดไป
* **FR-21 (Administrator Safety Safeguards):** ระบบต้องปฏิเสธคำขอที่ทำให้ Administrator ทำการ Deactivate บัญชีตนเอง หรือทำให้ระบบไม่มี Administrator ที่มีสถานะ Active หลงเหลืออยู่

---

## 5. Business Rules (BR)

### หมวดที่ 1: การยืนยันตัวตน บัญชีผู้ใช้ และความปลอดภัย (Authentication & Security)
* **BR-01 (Active User Credential Check):** เฉพาะผู้ใช้ที่มีสถานะ `isActive = true` และระบุอีเมลพร้อมรหัสผ่านที่ถูกต้องเท่านั้น จึงจะสามารถเข้าสู่ระบบได้ หากบัญชีมีสถานะ `isActive = false` ระบบต้องปฏิเสธด้วยข้อความที่ปลอดภัยและเป็นกลาง เช่น `"Account is inactive. Please contact administrator."`
* **BR-02 (Mandatory Password Change Enforcement):** ผู้ใช้ที่มีสถานะ `mustChangePassword = true` จะถูกจำกัดสิทธิ์ให้อยู่เฉพาะในหน้าเปลี่ยนรหัสผ่าน (Change Password Screen) และจะไม่สามารถเรียกใช้งาน Endpoint ปกติของแอปพลิเคชันได้ จนกว่าจะเปลี่ยนรหัสผ่านใหม่ที่ผ่านเกณฑ์ความปลอดภัยสำเร็จ
* **BR-03 (Password Complexity Policy):** รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร, ประกอบด้วยตัวอักษรพิมพ์ใหญ่ (A-Z), ตัวอักษรพิมพ์เล็ก (a-z), ตัวเลข (0-9) อย่างน้อย 1 ตัว และอักขระพิเศษอย่างน้อย 1 ตัว และต้องไม่ตรงกับรหัสผ่านเดิม
* **BR-04 (Secure Password Storage):** รหัสผ่านทุกชุดในระบบต้องถูกแฮชด้วยอัลกอริทึมมาตรฐานที่ปลอดภัย (เช่น `bcrypt` พร้อม Salt Rounds $\ge 10$) ห้ามจัดเก็บหรือส่งผ่านรหัสผ่านในรูปแบบ Plaintext เด็ดขาด
* **BR-05 (Server-Side Session Invalidation):** เมื่อผู้ใช้ทำการออกจากระบบ (Logout) ระบบต้องยกเลิก Token หรือ Session ทันที และเบราว์เซอร์ต้องล้างข้อมูลรับรองตัวตนออกจากการจัดเก็บ

### หมวดที่ 2: สิทธิ์และขอบเขตความเป็นเจ้าของข้อมูล (RBAC & Data Ownership)
* **BR-06 (Single Role Constraint):** ผู้ใช้ 1 คนสามารถมีบทบาทได้เพียง 1 บทบาทเท่านั้นจาก 3 บทบาทที่อนุญาต: `REQUESTER`, `IT_STAFF`, หรือ `ADMINISTRATOR`
* **BR-07 (Server-Derived Requester Identity):** การกระทำใดๆ ของ Requester (เช่น การสร้างตั๋ว, การดึงตั๋วของตนเอง, การแนบไฟล์) ต้องใช้ User ID ที่ถอดรหัสได้จาก Server Authentication Token เท่านั้น ห้ามอนุญาตให้ Client ส่ง `requesterId` มาแอบอ้างโดยเด็ดขาด
* **BR-08 (Requester Data Isolation):** Requester สามารถเข้าถึงและมองเห็นได้เฉพาะตั๋วและไฟล์แนบที่ตนเองเป็นเจ้าของ (`ticket.requesterId == currentUser.id`) เท่านั้น การพยายามเข้าถึงตั๋วของผู้อื่นต้องส่งคืน `403 Forbidden` หรือ `404 Not Found` โดยไม่เปิดเผยข้อมูลใดๆ
* **BR-09 (IT Staff Queue Access):** ผู้ใช้ที่มีบทบาท `IT_STAFF` และ `ADMINISTRATOR` สามารถเข้าถึงคิวงานส่วนกลางและดูตั๋วทั้งหมดในระบบได้
* **BR-10 (Administrator Scope Boundary):** บทบาท Administrator มุ่งเน้นการจัดการบัญชีผู้ใช้ (User Management) Administrator สามารถดูตั๋วและบันทึกข้อมูลได้ แต่ไม่ควรเข้ามาแย่งสิทธิ์หรือสับสนกับหน้าที่หลักในการปฏิบัติงานของ IT Staff เว้นแต่ได้รับอนุญาตในตารางสิทธิ์

### หมวดที่ 3: กระบวนการทำงานของตั๋ว ความเป็นเจ้าของ และสถานะ (Ticket Operations & Workflow)
* **BR-11 (Ticket Ownership Rules):** ตั๋วแต่ละใบสามารถมีผู้รับผิดชอบหลัก (Ticket Owner) ได้สูงสุด 1 คน โดยผู้รับผิดชอบต้องเป็นผู้ใช้ที่มีบทบาท `IT_STAFF` (หรือ `ADMINISTRATOR`) ที่มีสถานะ `isActive = true` หรืออาจไม่มีผู้รับผิดชอบ (Unassigned / Null) ได้
* **BR-12 (IT Priority Copy & Rules):** เมื่อตั๋วถูกสร้างขึ้น ค่า `itPriority` เริ่มต้นจะถูกคัดลอกมาจากค่า `requestedPriority` ที่ Requester ระบุ หลังจากนั้นเฉพาะผู้ใช้ที่มีบทบาท `IT_STAFF` หรือ `ADMINISTRATOR` เท่านั้นที่มีสิทธิ์ปรับเปลี่ยนค่า `itPriority`
* **BR-13 (Required Ticket Statuses):** สถานะของตั๋วในระบบต้องจำกัดอยู่เฉพาะ 8 สถานะต่อไปนี้:
  1. `NEW` (สร้างใหม่ ยังไม่มีการเริ่มดำเนินการ)
  2. `OPEN` (เปิดรับเรื่องแล้ว มีการตรวจสอบหรือมอบหมายงาน)
  3. `IN_PROGRESS` (กำลังอยู่ระหว่างการแก้ไขหรือดำเนินการ)
  4. `WAITING_FOR_REQUESTER` (รอข้อมูลเพิ่มเติมหรือรอการยืนยันจากผู้ร้องขอ)
  5. `RESOLVED` (ปัญหาได้รับการแก้ไขแล้วโดย IT Staff)
  6. `CLOSED` (ปิดตั๋วโดยสมบูรณ์)
  7. `REOPENED` (เปิดตั๋วขึ้นมาใหม่เนื่องจากปัญหายังไม่คลี่คลาย)
  8. `CANCELLED` (ยกเลิกตั๋ว)
* **BR-14 (Permitted Status Transition Matrix):**
  * จาก `NEW` $\rightarrow$ เปลี่ยนเป็น `OPEN`, `IN_PROGRESS`, หรือ `CANCELLED`
  * จาก `OPEN` $\rightarrow$ เปลี่ยนเป็น `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, หรือ `CANCELLED`
  * จาก `IN_PROGRESS` $\rightarrow$ เปลี่ยนเป็น `WAITING_FOR_REQUESTER`, `RESOLVED`, หรือ `CANCELLED`
  * จาก `WAITING_FOR_REQUESTER` $\rightarrow$ เปลี่ยนเป็น `IN_PROGRESS`, `RESOLVED`, หรือ `CANCELLED`
  * จาก `RESOLVED` $\rightarrow$ เปลี่ยนเป็น `CLOSED` หรือ `REOPENED`
  * จาก `REOPENED` $\rightarrow$ เปลี่ยนเป็น `IN_PROGRESS`, `RESOLVED`, หรือ `CANCELLED`
  * จาก `CLOSED` และ `CANCELLED` $\rightarrow$ ถือเป็น Terminal States ไม่สามารถเปลี่ยนสถานะต่อไปได้อีก
* **BR-15 (Requester Resolution Limitation):** Requester สามารถส่งสัญญาณ "Problem Appears Resolved" ได้ แต่ไม่มีสิทธิ์เปลี่ยนสถานะของตั๋วเป็น `RESOLVED` หรือ `CLOSED` ด้วยตนเองโดยตรง สิทธิ์ในการเปลี่ยนสถานะเป็น Resolved และ Closed เป็นหน้าที่และความรับผิดชอบของ `IT_STAFF` เท่านั้น
* **BR-16 (Deferred Actions Taken Constraint):** ใน Lab 3 ระบบยังไม่รวมฟีเจอร์ "Actions Taken" กฎทางธุรกิจที่บังคับให้บันทึก Actions Taken ให้ครบถ้วนก่อนปิดตั๋วจะถูกระงับไว้และยกไปพัฒนาใน Lab 4

### หมวดที่ 4: ความคิดเห็นสาธารณะและบันทึกภายใน (Comments & Notes)
* **BR-17 (Public Comments Visibility):** ความคิดเห็นสาธารณะ (Public Comments) เป็นช่องทางสื่อสารบนตั๋วที่สามารถมองเห็นและอ่านได้โดย Requester (เจ้าของตั๋ว), IT Staff, และ Administrator
* **BR-18 (Internal Notes Confidentiality):** บันทึกภายใน (Internal Notes) เป็นข้อมูลการดำเนินงานที่เป็นความลับเฉพาะทางเทคนิค สามารถมองเห็น เข้าถึง และสร้างได้เฉพาะผู้ใช้บทบาท `IT_STAFF` และ `ADMINISTRATOR` เท่านั้น หาก Requester พยายามเข้าถึง Endpoint นี้ ระบบต้องส่งกลับ `403 Forbidden` โดยไม่เปิดเผยข้อความใดๆ
* **BR-19 (Append-Only Integrity):** ทั้ง Public Comments และ Internal Notes มีลักษณะเป็นแบบต่อท้ายอย่างเดียว (Append-Only) ไม่สามารถแก้ไข (Edit) หรือลบทิ้ง (Delete) ได้หลังจากบันทึกแล้ว เพื่อคงความถูกต้องของประวัติการสื่อสาร
* **BR-20 (Comment/Note Author & Timestamp):** ทุกความคิดเห็นและบันทึกภายในต้องบันทึก User ID ของผู้สร้างและเวลาสร้างจากระบบหลังบ้าน (Server-Generated Timestamp) โดยอัตโนมัติ
* **BR-21 (Content Length & Non-Empty Validation):** เนื้อหาของ Comment และ Note ต้องไม่เป็นค่าว่างหรือช่องว่างล้วน (Trimmed) มีความยาวระหว่าง 1 ถึง 2,000 ตัวอักษร และต้องทำการ Sanitize เพื่อป้องกันปัญหา XSS

### หมวดที่ 5: การบริหารจัดการผู้ใช้และความปลอดภัยของระบบ (Admin Management & Safeguards)
* **BR-22 (Admin Exclusive Access):** เฉพาะผู้ใช้ที่มีบทบาท `ADMINISTRATOR` เท่านั้นที่สามารถเข้าถึง Endpoint จัดการผู้ใช้ (`/api/admin/*`) ได้ หากบทบาทอื่นเรียกใช้งานระบบต้องตอบกลับด้วย `403 Forbidden`
* **BR-23 (Email Uniqueness):** อีเมลของผู้ใช้ทุกคนในระบบต้องไม่ซ้ำกัน (Case-Insensitive Unique Email) ระบบต้องปฏิเสธการสร้างหรือแก้ไขอีเมลที่ซ้ำกับผู้ใช้อื่นในระบบด้วย `409 Conflict`
* **BR-24 (Initial Password Lifecycle):** เมื่อ Administrator สร้างบัญชีใหม่หรือกด Reset Initial Password ให้ผู้ใช้ ระบบต้องตั้งค่า `mustChangePassword = true` เสมอ เพื่อบังคับให้ผู้ใช้เปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งถัดไป
* **BR-25 (Self-Deactivation Prevention):** Administrator ไม่สามารถปิดการใช้งาน (Deactivate) บัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้ ระบบต้องปฏิเสธคำขอนี้เพื่อป้องกันการล็อกเอาต์ตนเองออกจากสิทธิ์แอดมิน
* **BR-26 (Last Active Administrator Safeguard):** ระบบต้องป้องกันไม่ให้มีการ Deactivate หรือเปลี่ยนบทบาทของ Administrator ที่มีสถานะ Active คนสุดท้ายของระบบ ระบบต้องมี Active Administrator เหลืออยู่อย่างน้อย 1 คนเสมอ
* **BR-27 (Deactivation over Deletion):** ระบบต้องไม่เปิดให้มีการลบบัญชีผู้ใช้ออกจากฐานข้อมูล (No Hard Delete) การยกเลิกสิทธิ์ผู้ใช้ต้องกระทำผ่านการเปลี่ยนสถานะ `isActive = false` (Soft Deactivation) เท่านั้น เพื่อรักษาความสมบูรณ์ของประวัติความเป็นเจ้าของตั๋วและความคิดเห็น

---

## 6. UI Specification Summary

ระบบส่วนติดต่อผู้ใช้ใน Lab 3 พัฒนาต่อเนื่องจากระบบดีไซน์ **Zen Green Theme** ใน Lab 2 โดยมีข้อกำหนดหลักดังนี้ (ดูรายละเอียดฉบับสมบูรณ์ใน `docs/lab-03/ui-spec.md`):

1. **Application Shell & Role-Based Navigation:**
   * นำส่วนจำลองตัวตน (Development Requester Selector) ออกจาก Header
   * แสดงชื่อผู้ใช้ปัจจุบันพร้อม Role Badge ที่มุมขวาบน พร้อมเมนูแบบดรอปดาวน์สำหรับ "Change Password" และ "Sign Out"
   * แสดงแท็บเมนูตามบทบาท:
     * `Requester`: My Tickets, Create Ticket
     * `IT Staff`: My Queue, Create Ticket
     * `Administrator`: Admin (User Management)
2. **Login & Mandatory Password Change Screens:**
   * หน้า Login แบบการ์ดตรงกลางที่สะอาดตา พร้อมระบบตรวจสอบฟิลด์แบบ Real-time, แสดงสถานะปุ่มกดกำลังประมวลผล (Busy/Loading State) และข้อความแจ้งเตือนข้อผิดพลาดที่ปลอดภัย
   * หน้าจอและโฟลว์บังคับเปลี่ยนรหัสผ่าน (Mandatory First-Login Password Change) พร้อม Checklist แสดงความสมบูรณ์ของกฎรหัสผ่านแบบไดนามิก
3. **IT Staff Ticket Queue Screen:**
   * ตารางแสดงคิวงานที่สวยงาม สบายตา ประกอบด้วยหมายเลขตั๋ว, วันที่แจ้ง, หัวข้อปัญหา, หมวดหมู่, Requested Priority Badge, IT Priority Badge, Status Badge และชื่อเจ้าหน้าที่ผู้รับผิดชอบ
   * แถบเครื่องมือค้นหาและกรองข้อมูล (Search & Filters Toolbar) พร้อมตัวแบ่งหน้า (Pagination Controls)
   * แสดง Feedback ชัดเจน: Loading Skeleton, Empty State (เมื่อไม่มีตั๋วในคิว), No-Results State (เมื่อค้นหา/กรองไม่พบ)
4. **IT Staff Ticket Detail Screen:**
   * โครงสร้างข้อมูลแบบแบ่งกลุ่มชัดเจน: กล่องข้อมูลอ่านอย่างเดียว (ข้อมูลผู้แจ้ง, รายละเอียดปัญหา, ไฟล์แนบ) และกล่องฟิลด์สำหรับเจ้าหน้าที่ปฏิบัติงาน (Dropdown เลือกผู้รับผิดชอบ, Dropdown IT Priority, Dropdown สถานะ)
   * แท็บความคิดเห็นที่แยกความแตกต่างเชิงสายตาอย่างชัดเจน:
     * **Public Comments:** โทนสีเขียว Zen Green แสดงความโปร่งใส สื่อสารระหว่าง Requester และ Staff
     * **Internal Notes:** โทนสีส้มอ่อน/แถบเตือนสีเหลืองอำพัน พร้อมป้ายกำกับ "Private / Internal Only" เพื่อป้องกันเจ้าหน้าที่โพสต์ข้อมูลผิดพลาด
5. **Administrator User Management Screen:**
   * หน้าจอแสดงรายชื่อผู้ใช้แบบ Minimalist แสดง Name, Email, Role badge, Status badge (Active/Inactive) และปุ่ม Edit
   * กล่องค้นหาและตัวกรองบทบาท
   * หน้าต่างหรือแถบด้านข้าง (Modal / Slide-over) สำหรับสร้างผู้ใช้ใหม่ และแก้ไขข้อมูลผู้ใช้
   * ปุ่ม Deactivate Account และ Reset Initial Password พร้อมกล่องยืนยัน (Confirmation Dialog)
6. **Responsive Adaptability:**
   * ทุกหน้าจอต้องปรับการจัดวางได้อย่างสมบูรณ์บน Desktop ($\ge 992\text{px}$), Tablet ($768\text{px} - 991\text{px}$), และ Mobile ($< 768\text{px}$) โดยบนหน้าจอมือถือ ตารางจะปรับรูปแบบเป็นการ์ดข้อมูลที่อ่านง่าย ไม่มีปัญหา Horizontal Overflow

---

## 7. Data Changes

### 7.1. Prisma Schema Evolution
จากเดิมใน Lab 2 ที่ใช้โมเดล `RequesterUser` จำลอง ใน Lab 3 จะถูกปรับปรุงให้เป็นโมเดลผู้ใช้ระบบจริง (`User`) และเพิ่มความสัมพันธ์ต่างๆ:

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

enum PriorityLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  WAITING_FOR_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

model User {
  id                 Int      @id @default(autoincrement())
  email              String   @unique
  passwordHash       String
  name               String
  role               Role     @default(REQUESTER)
  isActive           Boolean  @default(true)
  mustChangePassword Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  submittedTickets Ticket[]       @relation("TicketRequester")
  assignedTickets  Ticket[]       @relation("TicketOwner")
  comments         Comment[]
  internalNotes    InternalNote[]

  @@map("users")
}

model Ticket {
  id                Int            @id @default(autoincrement())
  ticketNumber      String         @unique
  summary           String
  description       String
  requestedPriority PriorityLevel
  itPriority        PriorityLevel
  currentStatus     TicketStatus   @default(NEW)
  ticketDate        DateTime       @default(now())
  resolvedIndicated Boolean        @default(false)

  requesterId Int
  requester   User @relation("TicketRequester", fields: [requesterId], references: [id])

  ticketOwnerId Int?
  ticketOwner   User? @relation("TicketOwner", fields: [ticketOwnerId], references: [id])

  categoryId Int
  category   Category @relation(fields: [categoryId], references: [id])

  relatedSystemId Int
  relatedSystem   RelatedSystem @relation(fields: [relatedSystemId], references: [id])

  attachments   Attachment[]
  comments      Comment[]
  internalNotes InternalNote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([requesterId, createdAt(sort: Desc)])
  @@index([currentStatus])
  @@index([itPriority])
  @@index([ticketOwnerId])
  @@map("tickets")
}

model Comment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt(sort: Asc)])
  @@map("comments")
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt(sort: Asc)])
  @@map("internal_notes")
}
```

### 7.2. Database Migration Strategy from Lab 2
1. **Preserve Existing Data:** ห้ามทำลายข้อมูลตั๋วเดิม (`Ticket`) ข้อมูลไฟล์แนบ (`Attachment`) หมวดหมู่ (`Category`) และระบบที่เกี่ยวข้อง (`RelatedSystem`) ที่บันทึกไว้ใน Lab 2
2. **Evolve Requester Records into User Model:** ย้ายหรือแปลงข้อมูลจากตาราง `requester_users` เดิมเข้าสู่ตาราง `users` ใหม่ โดยกำหนด:
   * `role = 'REQUESTER'`
   * `isActive = true` (ตามสถานะเดิม)
   * `mustChangePassword = true`
   * `passwordHash = <แฮชของรหัสผ่านเริ่มต้นที่กำหนด>` (เช่น `Pass1234!`)
3. **ForeignKey Alignment:** ปรับปรุง Foreign Key ของ `tickets.requesterId` ให้เชื่อมโยงกับตาราง `users` ใหม่
4. **Remove Temporary Selector State:** ลบหรือระงับการใช้งาน Endpoint เก่า `/api/requesters` เพื่อเปลี่ยนผ่านเข้าสู่ระบบ Authentication แบบเต็มตัว

### 7.3. Required Seed Data (ตามข้อกำหนด 5.3)
การรันสคริปต์ Seed ต้องมีพฤติกรรมแบบ **Idempotent** (สามารถรันซ้ำกี่ครั้งก็ได้โดยไม่เกิดข้อมูลซ้ำซ้อนหรือ Error) และมีข้อมูลขั้นต่ำดังนี้:
* **Requester Accounts:** อย่างน้อย 4 บัญชีสถานะ Active และอย่างน้อย 1 บัญชีสถานะ Inactive
* **IT Staff Accounts:** อย่างน้อย 3 บัญชีสถานะ Active และอย่างน้อย 1 บัญชีสถานะ Inactive
* **Administrator Accounts:** อย่างน้อย 1 บัญชีสถานะ Active (สำหรับทดสอบ User Management)
* **Tickets Data:** รายการตั๋วที่มีการกระจายตัวของ Requester, ระดับความสำคัญ (Requested & IT Priority), สถานะการดำเนินงานต่างๆ และการมอบหมายงาน (ทั้งที่มี Owner และ Unassigned)
* **Comments & Notes:** ตัวอย่างความคิดเห็นสาธารณะและบันทึกภายในที่ไม่เปิดเผยข้อมูลลับ

---

## 8. API Contract Summary

การสื่อสารระหว่าง Frontend และ Backend ดำเนินการผ่าน RESTful API โดยมีข้อกำหนดหลักดังนี้ (ดูรายละเอียดฉบับสมบูรณ์ใน `docs/lab-03/api-spec.md`):

| Method | Endpoint Path | Authorization / Access | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | ยืนยันตัวตนด้วย Email & Password |
| `POST` | `/api/auth/logout` | Authenticated Users | ออกจากระบบและยกเลิก Token |
| `GET` | `/api/auth/me` | Authenticated Users | ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบันและบทบาท |
| `POST` | `/api/auth/change-password` | Authenticated Users | เปลี่ยนรหัสผ่าน (รองรับทั้ง First-login และทั่วไป) |
| `GET` | `/api/tickets` | Requester Only | ดึงตั๋วเฉพาะที่ Requester ปัจจุบันเป็นเจ้าของ |
| `POST` | `/api/tickets` | Requester Only | สร้างตั๋วใหม่ (ผูก requesterId จาก Server Identity) |
| `GET` | `/api/tickets/:id` | Requester (Owner), IT Staff, Admin | ดูรายละเอียดตั๋ว (Requester ดูได้เฉพาะของตน) |
| `POST` | `/api/tickets/:id/resolve-indication`| Requester (Owner) | ส่งสัญญาณว่าปัญหาได้รับการแก้ไขแล้ว |
| `GET` | `/api/attachments/:id/download` | Requester (Owner), IT Staff, Admin | ดาวน์โหลดไฟล์แนบของตั๋ว |
| `PATCH`| `/api/attachments/:id/remove` | Requester (Owner) | ทำ Soft Removal ไฟล์แนบของตั๋วตนเอง |
| `GET` | `/api/staff/tickets` | IT Staff, Admin | ดึงรายการตั๋วในคิวงาน (Search, Filter, Sort, Page) |
| `GET` | `/api/staff/tickets/:id` | IT Staff, Admin | ดึงรายละเอียดตั๋วสำหรับงานไอที |
| `PATCH`| `/api/staff/tickets/:id/assignment` | IT Staff, Admin | รับตั๋ว (Claim), มอบหมาย หรือยกเลิกมอบหมาย |
| `PATCH`| `/api/staff/tickets/:id/priority` | IT Staff, Admin | ปรับปรุงระดับความสำคัญ IT Priority |
| `PATCH`| `/api/staff/tickets/:id/status` | IT Staff, Admin | เปลี่ยนสถานะตั๋วตาม Transition Matrix |
| `GET` | `/api/tickets/:id/comments` | Requester (Owner), IT Staff, Admin | ดึงรายการความคิดเห็นสาธารณะบนตั๋ว |
| `POST` | `/api/tickets/:id/comments` | Requester (Owner), IT Staff, Admin | เพิ่มความคิดเห็นสาธารณะใหม่บนตั๋ว |
| `GET` | `/api/tickets/:id/notes` | IT Staff, Admin Only | ดึงรายการบันทึกภายใน (**Requester Forbidden**) |
| `POST` | `/api/tickets/:id/notes` | IT Staff, Admin Only | เพิ่มบันทึกภายในใหม่ (**Requester Forbidden**) |
| `GET` | `/api/admin/users` | Admin Only | ดึงรายชื่อผู้ใช้ทั้งหมด ค้นหา และกรองตามบทบาท |
| `POST` | `/api/admin/users` | Admin Only | สร้างผู้ใช้ใหม่พร้อม 1 บทบาทและรหัสผ่านเริ่มต้น |
| `PATCH`| `/api/admin/users/:id` | Admin Only | แก้ไขข้อมูลผู้ใช้ บทบาท และสถานะ Active |
| `POST` | `/api/admin/users/:id/reset-password` | Admin Only | รีเซ็ตรหัสผ่านเริ่มต้นใหม่ให้ผู้ใช้ |

---

## 9. Acceptance Criteria (AC)

* **AC-01 (Valid Authentication):**
  * **Given** ผู้ใช้มีบัญชีสถานะ Active ในระบบและระบุ Email และ Password ถูกต้อง
  * **When** ส่งคำขอเข้าสู่ระบบผ่าน `/api/auth/login`
  * **Then** Backend ยืนยันตัวตนสำเร็จ ส่งคืน Auth Token/Cookie และข้อมูล User Profile พร้อม Role ที่ถูกต้อง
* **AC-02 (Mandatory First-Login Password Change):**
  * **Given** ผู้ใช้ที่มีสถานะ `mustChangePassword = true` เข้าสู่ระบบสำเร็จ
  * **When** ระบบนำทางเข้าสู่แอปพลิเคชัน
  * **Then** หน้าจอปกติจะถูกบล็อก และผู้ใช้จะเห็นหน้าจอ Change Password เท่านั้น จนกว่าจะบันทึกรหัสผ่านใหม่ที่ผ่านเกณฑ์ความปลอดภัยสำเร็จ
* **AC-03 (Server-Side Requester Identity Protection):**
  * **Given** ผู้ใช้ล็อกอินในบทบาท Requester A
  * **When** ส่งคำขอสร้างตั๋วหรือดึงตั๋ว โดยใส่ `requesterId` ของ Requester B มาใน Request
  * **Then** Backend ต้องเพิกเฉยต่อข้อมูลที่ส่งมา และใช้ตัวตนของ Requester A ที่ถอดรหัสได้จาก Token เท่านั้น ทำให้ข้อมูลของ Requester B ไม่รั่วไหล
* **AC-04 (Internal Notes Requester Isolation):**
  * **Given** ผู้ใช้ล็อกอินในบทบาท Requester
  * **When** พยายามเรียกดูหรือสร้าง Internal Note ผ่าน `/api/tickets/:id/notes`
  * **Then** Backend ตอบกลับด้วย `403 Forbidden` และไม่เปิดเผยข้อความหรือข้อมูลใดๆ ของบันทึกภายใน
* **AC-05 (Inactive Account Block):**
  * **Given** บัญชีผู้ใช้มีสถานะ `isActive = false`
  * **When** พยายามเข้าสู่ระบบด้วยรหัสผ่านที่ถูกต้อง
  * **Then** Backend ปฏิเสธการเข้าสู่ระบบ ส่งคืนข้อความเตือนที่ปลอดภัย และไม่ออก Token ให้
* **AC-06 (IT Staff Queue Filtering & Sorting):**
  * **Given** เจ้าหน้าที่ไอทีเปิดหน้า IT Staff Ticket Queue
  * **When** เลือกตัวกรอง IT Priority เป็น "HIGH" และค้นหาคำว่า "Network"
  * **Then** ตารางแสดงเฉพาะตั๋วที่มีคำว่า Network และมี IT Priority เป็น High พร้อมข้อมูลการแบ่งหน้าถูกต้อง
* **AC-07 (Ticket Ownership Claim & Reassignment):**
  * **Given** เจ้าหน้าที่ไอทีเปิดดูตั๋วที่ยังไม่มีผู้รับผิดชอบ (Unassigned)
  * **When** กดปุ่ม "Claim Ticket"
  * **Then** ตั๋วถูกอัปเดตผู้รับผิดชอบเป็นเจ้าหน้าที่คนดังกล่าว และหน้าจอแสดงชื่อเจ้าหน้าที่ในช่อง Ticket Owner ทันที
* **AC-08 (IT Staff Status Transition Validation):**
  * **Given** ตั๋วอยู่ในสถานะ `NEW`
  * **When** เจ้าหน้าที่ไอทีเลือกเปลี่ยนสถานะเป็น `IN_PROGRESS`
  * **Then** สถานะถูกอัปเดตสำเร็จ แต่หากพยายามข้ามขั้นไปเป็น `CLOSED` โดยตรง ระบบจะปฏิเสธด้วย Validation Error
* **AC-09 (Requester Resolution Indication):**
  * **Given** Requester เจ้าของตั๋วเปิดดูตั๋วที่มีสถานะ `IN_PROGRESS`
  * **When** กดปุ่ม "Problem Appears Resolved"
  * **Then** ระบบบันทึกสัญญาณว่าปัญหาคลี่คลายแล้ว (`resolvedIndicated = true`) โดยสถานะตั๋วยังคงเป็น `IN_PROGRESS` จนกว่า IT Staff จะเป็นผู้เปลี่ยนสถานะเป็น `RESOLVED`
* **AC-10 (Public Comments Append-Only Posting):**
  * **Given** Requester เจ้าของตั๋วพิมพ์ความคิดเห็น "Thank you for the update" และกดส่ง
  * **When** ระบบบันทึกข้อมูล
  * **Then** ความคิดเห็นปรากฏในแท็บ Public Comments พร้อมชื่อผู้เขียนและเวลาปัจจุบัน โดยไม่มีปุ่มแก้ไขหรือลบ
* **AC-11 (Admin Duplicate Email Prevention):**
  * **Given** Administrator พยายามสร้างผู้ใช้ใหม่ด้วยอีเมลที่มีอยู่ในระบบแล้ว
  * **When** กดบันทึกข้อมูล
  * **Then** Backend ปฏิเสธคำขอด้วย `409 Conflict` และหน้าจอแสดงข้อความเตือนสีแดงว่าอีเมลนี้ถูกใช้งานแล้ว
* **AC-12 (Admin Self-Deactivation Block):**
  * **Given** Administrator กำลังเปิดดูข้อมูลบัญชีของตนเองในหน้า User Management
  * **When** พยายามกดปุ่ม Deactivate หรือส่งคำขอปิดการใช้งานบัญชีตนเอง
  * **Then** ระบบบล็อกการทำงาน ปิดการใช้งานปุ่ม และปฏิเสธคำขอด้วยข้อความแจ้งเตือนข้อผิดพลาด
* **AC-13 (Last Active Admin Protection):**
  * **Given** ในระบบมี Administrator ที่ Active อยู่เพียง 1 คน
  * **When** มีความพยายามเปลี่ยนบทบาทหรือ Deactivate บัญชีดังกล่าว
  * **Then** Backend ปฏิเสธคำขอด้วย Error ป้องกันไม่ให้ระบบขาด Administrator
* **AC-14 (Forbidden Access by Non-Admin):**
  * **Given** ผู้ใช้ที่มีบทบาท Requester หรือ IT Staff
  * **When** พยายามส่งคำขอไปยัง `/api/admin/users`
  * **Then** Backend ตอบกลับด้วย `403 Forbidden` ทันที
* **AC-15 (Responsive Zen Green Layout):**
  * **Given** เปิดใช้งานระบบบนอุปกรณ์ Mobile ($< 768\text{px}$)
  * **When** นำทางไปยังหน้า Login, Ticket Queue, Ticket Detail, และ User Management
  * **Then** หน้าจอแสดงผลได้สวยงาม เป็นระเบียบ ไม่เกิด Horizontal Scrolling และปุ่มกดสัมผัสได้สะดวก ($\ge 44\text{px}$)

---

## 10. Product Definition of Done (DoD Checklist)

- [ ] **Data Model & Migrations:** Prisma Schema ได้รับการอัปเกรดเป็นโมเดล User จริงพร้อม Role, Password Hash, และความสัมพันธ์กับ Ticket, Comment, InternalNote ครบถ้วน พร้อม Migration ข้อมูลเดิมจาก Lab 2 สำเร็จ
- [ ] **Idempotent Seed Data:** มีสคริปต์ Seed ข้อมูลที่ปลอดภัยต่อการรันซ้ำ ประกอบด้วย Requester (4 Active, 1 Inactive), IT Staff (3 Active, 1 Inactive), Administrator (1 Active), ตั๋วทดสอบ และข้อความตัวอย่างครบถ้วน
- [ ] **Authentication & Security:** พัฒนาระบบ Login, Logout, Current User, Mandatory First-login Password Change สำเร็จ โดยรหัสผ่านถูกแฮชด้วย bcrypt และปิดกั้นการเข้าถึงของบัญชี Inactive
- [ ] **Role-Based Authorization:** ทุก Endpoint ได้รับการป้องกันสิทธิ์ที่ฝั่ง Server 100% ตาม Authorization Matrix โดยไม่มีการรั่วไหลของข้อมูลข้ามบทบาท (Cross-role data leak)
- [ ] **IT Staff Workflows:** หน้า Ticket Queue (Search, Filter, Sort, Pagination) และ Ticket Detail (Claim/Assign, IT Priority, Status Transitions) ใช้งานได้สมบูรณ์ถูกต้องตาม Business Rules
- [ ] **Communication Integrity:** Public Comments ใช้งานได้ทั้ง Requester และ Staff ในขณะที่ Internal Notes ถูกจำกัดสิทธิ์เฉพาะ IT Staff และ Administrator โดยทั้งคู่เป็นแบบ Append-Only
- [ ] **Admin User Management:** หน้าจอจัดการผู้ใช้รองรับการค้นหา, กรอง, สร้างผู้ใช้, แก้ไขผู้ใช้, รีเซ็ตรหัสผ่านเริ่มต้น พร้อมทั้งมีกลไกป้องกัน Self-deactivation และป้องกันการปิด Active Admin คนสุดท้าย
- [ ] **Lab 2 Regression Prevention:** ฟังก์ชันเดิมของ Requester ใน Lab 2 ทั้งหมด (สร้างตั๋ว, แนบไฟล์, ดาวน์โหลดไฟล์, ลบไฟล์แบบ Soft-remove) ยังคงทำงานได้อย่างถูกต้องภายใต้ตัวตนจริง
- [ ] **Zen Green UI Standards:** หน้าจอทั้งหมดปฏิบัติตาม Zen Green Theme มีสถานะ Feedback ครบถ้วน (Loading, Empty, No-results, Forbidden, Safe failures) และผ่านเกณฑ์ Responsive ทั้ง Desktop, Tablet และ Mobile
- [ ] **Automated Test Coverage:** แผนการทดสอบใน `tests.md` ครอบคลุมทุก Acceptance Criteria และชุดการทดสอบ (Unit, API, UI, E2E) รันผ่านทั้งหมดบน Main branch

---

## 11. Assumptions and Decisions

1. **Password Hashing Standard:** เลือกใช้ไลบรารี `bcrypt` (หรือ `bcryptjs`) ด้วยค่า Salt Rounds เท่ากับ 10 เพื่อความสมดุลระหว่างความปลอดภัยระดับสูงและประสิทธิภาพของเซิร์ฟเวอร์
2. **Session / Authentication Token Approach:** เลือกใช้ JSON Web Token (JWT) ที่บรรจุ `userId`, `email`, `role`, และ `mustChangePassword` ส่งผ่าน Authorization Bearer Header (หรือ HttpOnly Cookie) เพื่อความสะดวกในการตรวจสอบสิทธิ์ที่รวดเร็วและเป็น Stateless
3. **Queue Pagination Decision:** กำหนดค่าการแบ่งหน้าเริ่มต้นของ IT Staff Queue เป็น 10 รายการต่อหน้า (Page Size = 10) เพื่อให้สอดคล้องกับภาพ Mockup ใน Handout (หน้า 9) โดยอนุญาตให้ Client ส่งพารามิเตอร์ `limit` ได้สูงสุดไม่เกิน 50 รายการ
4. **Append-Only Comments & Notes Sanitize:** ตัดสินใจจัดเก็บข้อความความคิดเห็นเป็น Plain Text ที่ผ่านการ Trim และ Sanitize เพื่อตัดแท็ก HTML ที่เป็นอันตราย ป้องกันความเสี่ยงด้าน Cross-Site Scripting (XSS)
5. **Initial Password Uniformity for Seed:** ในขั้นตอนการทำ Migration และ Seed ข้อมูล กำหนดรหัสผ่านเริ่มต้นสำหรับบัญชีทดสอบในเครื่อง Local เป็น `TokTickIT2026!` ซึ่งตรงตามกฎความซับซ้อนของรหัสผ่าน และตั้งค่า `mustChangePassword = true` สำหรับบัญชีที่ต้องการทดสอบโฟลว์เปลี่ยนรหัสผ่าน
6. **Actions Taken Deferral:** ยึดตามข้อกำหนดของ Lab 3 อย่างเคร่งครัด โดยจะไม่สร้างหรือเตรียมฟิลด์สำหรับ Actions Taken ใน Sprint นี้ และจะนำมาพัฒนาใน Lab 4 ตามที่ระบุไว้ใน Section 4.5
