# Lab 2 Sprint Engineering Specification
**TokTickIT Requester Ticketing MVP with UI Foundation**

---

## 1. Sprint Goal
ส่งมอบระบบส่วนหน้าและส่วนหลังของ **TokTickIT Requester Ticketing MVP** สำหรับผู้ใช้งานทั่วไป (Requester) เพื่อให้สามารถเลือกตัวตนจำลอง (Development Requester) เพื่อทดสอบการทำงานของระบบได้อย่างถูกต้อง สามารถสร้างตั๋วแจ้งปัญหาไอทีพร้อมตรวจสอบข้อมูลและจำกัดไฟล์แนบตามเกณฑ์ (สูงสุด 5 ไฟล์ และไม่เกิน 5 MB ต่อไฟล์), ตรวจสอบประวัติตั๋วของตนเองในหน้า My Tickets ที่รองรับการค้นหา กรอง จัดเรียง และแบ่งหน้า, ตรวจสอบรายละเอียดตั๋วในหน้า Ticket Detail แบบอ่านอย่างเดียว (Read-only), และจัดการไฟล์แนบหลังการสร้างตั๋ว (ดาวน์โหลดและลบแบบ Soft Removal) ภายใต้การออกแบบตามข้อกำหนด **Zen Green Theme** และการปกป้องสิทธิ์ความเป็นเจ้าของข้อมูลของผู้ใช้งานแต่ละคนอย่างสมบูรณ์

---

## 2. Stakeholder Request Interpretation
ฝ่ายสนับสนุนเทคโนโลยีสารสนเทศ (IT Department) ต้องการระบบรับเรื่องแจ้งซ่อมและปัญหาไอทีที่ใช้งานง่าย มีประสิทธิภาพ และมีหน้าจอที่สวยงามเป็นมืออาชีพ เพื่อให้ผู้ร้องขอ (Requester) สามารถระบุรายละเอียดปัญหา เลือกหมวดหมู่ เลือกระบบที่เกี่ยวข้อง กำหนดระดับความสำคัญ และแนบหลักฐานประกอบได้อย่างถูกต้อง

เนื่องจากระบบพิสูจน์ตัวตนจริง (Authentication & Authorization) จะถูกนำมาใช้ใน Sprint ถัดไป (Lab 3) Stakeholder จึงต้องการให้จัดทำหน้าจอ **Development Requester Selection** เพื่อเป็นกลไกจำลองตัวตนสำหรับการทดสอบ (Testing Context) ช่วยให้สามารถสลับตัวตนผู้ใช้และตรวจสอบความปลอดภัยของการแบ่งแยกข้อมูลระหว่างผู้ใช้งาน (Multi-user Ownership Isolation) ได้อย่างชัดเจน พร้อมทั้งกำหนดแนวทางหน้าจอและคอมโพเนนต์ด้วย **Zen Green Theme** เพื่อเป็นรากฐานสำหรับหน้าจออื่น ๆ ในอนาคต

---

## 3. Scope

### 3.1. Included Scope (งานที่รวมอยู่ใน Lab 2)
1. **Development Requester Context:**
   - หน้าจอเลือกตัวตนผู้ใช้จำลอง (Requester Selector) ที่ดึงเฉพาะผู้ใช้สถานะ Active จากฐานข้อมูล PostgreSQL
   - การเก็บ Context ตัวตนผู้ใช้ที่เลือกเพื่อใช้งานทั่วทั้งแอปพลิเคชัน
   - เมนูและปุ่ม Change Requester ในส่วน Application Header เพื่อสลับผู้ใช้
   - กลไกป้องกันการเข้าใช้งานหน้าตั๋วหากยังไม่ได้เลือกตัวตนผู้ใช้
2. **Ticket Creation (Create Mode):**
   - ฟอร์มสร้างตั๋วที่แสดงข้อมูลระบบอัตโนมัติ (Ticket Date, Requester Name) แบบอ่านอย่างเดียว
   - การกรอกข้อมูล Summary, Category, Related System, Requested Priority, Description
   - การแนบไฟล์หลักฐานประกอบในขณะสร้างตั๋ว พร้อมตรวจสอบชนิดและขนาดไฟล์
   - การตรวจสอบความถูกต้องของข้อมูล (Validation) ทั้งฝั่ง Frontend และ Backend
   - การป้องกันการส่งข้อมูลซ้ำ (Duplicate Submission Prevention)
3. **Ticket History (My Tickets Screen):**
   - การแสดงรายการตั๋วเฉพาะที่ Requester คนปัจจุบันเป็นเจ้าของ
   - การค้นหา (Search) จาก Ticket Number หรือ Summary
   - การกรองข้อมูล (Filter) ตาม Category, Requested Priority, IT Priority, และ Current Status
   - การจัดเรียงข้อมูล (Sorting) ตามวันที่สร้าง หมายเลขตั๋ว หรือวันอัปเดตล่าสุด
   - การแบ่งหน้า (Pagination) พร้อมการแสดงสถานะ Loading, Empty State, และ No-Results State
4. **Requester Ticket Detail (View Mode):**
   - การแสดงรายละเอียดข้อมูลตั๋วทั้งหมดเป็นแบบอ่านอย่างเดียว (Read-only Header Fields)
   - การรักษาความปลอดภัยด้านสิทธิ์ข้อมูล (Data Ownership Protection) ปฏิเสธการเข้าถึงหากไม่ใช่ตั๋วของตนเอง
5. **Attachment Management Lifecycle:**
   - การดาวน์โหลดและแสดงตัวอย่างไฟล์แนบที่มีสถานะ Active
   - การเพิ่มไฟล์แนบเพิ่มเติมในหน้ารายละเอียดตั๋ว (ตราบใดที่ยังไม่เกิน 5 ไฟล์ Active)
   - การลบไฟล์แนบแบบ **Soft Removal** พร้อมระบุเหตุผล (Removal Reason) และการยืนยัน
   - การบล็อกการดาวน์โหลดไฟล์แนบที่ถูก Soft-removed
6. **UI Foundation & Responsive Design:**
   - การวางระบบสี สไตล์ และคอมโพเนนต์ตามข้อกำหนด **Zen Green Theme**
   - การรองรับการแสดงผลแบบ Responsive บนหน้าจอ Desktop ($\ge 992\text{px}$), Tablet ($768\text{px} - 991\text{px}$), และ Mobile ($< 768\text{px}$)

### 3.2. Excluded Scope (งานที่ไม่รวมอยู่ใน Lab 2)
1. **Authentication & Security ระบบจริง:** การ Login, Logout, บันทึก Password, Password Hashing, Session Token, JWT หรือการจัดการสิทธิ์ Role-based Authorization จริง (ยกยอดไป Lab 3)
2. **IT Staff Workflow:** หน้าจอ Dashboard ฝั่งเจ้าหน้าที่ไอที, การรับงาน (Claim Ticket), การมอบหมายงาน (Assign/Reassign), การเปลี่ยนระดับ IT Priority, และระบบคิวงานไอที
3. **Ticket Collaboration & Activity Tracking:** ระบบความคิดเห็นสาธารณะ (Public Comments), บันทึกภายใน (Internal Notes), และบันทึกประวัติการทำงาน (Actions Taken / Audit Logs)
4. **Ticket Lifecycle Transitions:** การเปลี่ยนสถานะของตั๋วหลังจากสร้างเสร็จ เช่น การเปลี่ยนสถานะเป็น In Progress, Resolved, Closed, Reopened หรือ Cancelled
5. **Administration Management:** ระบบจัดการข้อมูล Master Data (Users, Categories, Related Systems) ผ่าน UI

---

## 4. Functional Requirements (FR)

* **FR-01 (Development Requester Context):** ระบบต้องมีหน้าจอให้ผู้ใช้เลือกตัวตน Requester จำลองที่ดึงมาจากฐานข้อมูล (เฉพาะผู้ใช้ที่ Active) และบันทึก Context นี้ไว้ใช้ตลอดการทำงานใน Session
* **FR-02 (Reference Data Loading):** ระบบต้องดึงรายการ Categories และ Related Systems ที่มีสถานะ Active จากฐานข้อมูลเพื่อนำมาแสดงในตัวเลือก (Dropdown / Select) ของฟอร์มสร้างตั๋วและตัวกรอง
* **FR-03 (Ticket Creation):** ระบบต้องอนุญาตให้ Requester ที่เลือกตัวตนแล้ว สามารถส่งคำขอสร้างตั๋วไอทีใหม่ได้ โดยระบบต้องสร้างหมายเลขตั๋ว (Ticket Number) ที่ไม่ซ้ำกัน และกำหนดสถานะเริ่มต้นเป็น `New`
* **FR-04 (Attachment Upload on Creation):** ระบบต้องอนุญาตให้อัปโหลดไฟล์แนบระหว่างสร้างตั๋วได้สูงสุด 5 ไฟล์ โดยแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB และเป็นชนิดไฟล์ที่กำหนด (JPG, JPEG, PNG, WEBP, PDF)
* **FR-05 (My Tickets Retrieval & Querying):** ระบบต้องดึงรายการตั๋วเฉพาะที่ Requester ปัจจุบันเป็นเจ้าของ และรองรับการค้นหา (Search), การกรอง (Filter), การจัดเรียง (Sort), และการแบ่งหน้า (Pagination)
* **FR-06 (Read-only Ticket Detail Inspection):** ระบบต้องแสดงข้อมูลตั๋วที่ระบุในรูปแบบอ่านอย่างเดียว (Read-only) โดยจะเปิดให้เข้าดูได้เฉพาะเมื่อผู้ใช้ปัจจุบันเป็นเจ้าของตั๋วเท่านั้น
* **FR-07 (Attachment Download):** ระบบต้องให้บริการดาวน์โหลดไฟล์แนบสำหรับไฟล์ที่มีสถานะ Active แก่ผู้ใช้ที่เป็นเจ้าของตั๋ว
* **FR-08 (Attachment Soft Removal):** ระบบต้องอนุญาตให้เจ้าของตั๋วทำ Soft Removal ไฟล์แนบของตนเองได้ โดยต้องมีการกรอกเหตุผลและกดยืนยัน และระบบต้องบล็อกการดาวน์โหลดไฟล์ที่ถูกลบแล้วทันที
* **FR-09 (Requester Switching & State Reset):** ระบบต้องมีเมนูสำหรับเปลี่ยนตัวตน Requester ได้ตลอดเวลา และเมื่อเปลี่ยนตัวตน ข้อมูลตั๋วบนหน้าจอจะต้องถูกโหลดใหม่ให้ตรงกับตัวตนปัจจุบันทันที

---

## 5. Business Rules (BR)

### หมวดที่ 1: การจำลองตัวตนผู้ใช้ (Development Requester Context)
* **BR-01 (Testing Context Only):** ระบบใช้ Development Requester Selector ในการเลือกผู้ใช้งานเพื่อการทดสอบเท่านั้น ไม่ใช่ระบบล็อกอินจริง และต้องไม่มีการเก็บรหัสผ่านหรือ Session Token ที่ปลอดภัย
* **BR-02 (Active Requesters Filter):** หน้าคัดเลือกผู้ใช้จำลอง (Selector Screen) จะต้องแสดงเฉพาะ Requester ที่มีสถานะ **Active** เท่านั้น Requester ที่เป็น Inactive จะต้องถูกกรองออกและไม่สามารถเลือกได้
* **BR-03 (Session Requester Context):** เมื่อผู้ใช้เลือก Requester แล้ว Context นั้นจะถูกนำไปใช้เป็นตัวตนหลักในการทำรายการทั้งหมด (สร้างตั๋ว, ดึงตั๋วของตนเอง, ดูรายละเอียด, จัดการไฟล์แนบ)
* **BR-04 (Requester Switching):** ระบบต้องมีปุ่มหรือเมนู "Change Requester" ใน Header เสมอ และเมื่อเปลี่ยนตัวตน ข้อมูลบนหน้าจอ (เช่น My Tickets) จะต้อง reload ข้อมูลของ Requester คนใหม่ทันที
* **BR-05 (Enforced Selection / Guard):** หากยังไม่มีการเลือก Development Requester และผู้ใช้พยายามเข้าหน้า Ticket (เช่น My Tickets, Create Ticket) ระบบจะต้องแสดงหน้า Selector หรือบังคับให้เลือกผู้ใช้ก่อนเสมอ
* **BR-06 (Selector Error & Empty States):** หากโหลดรายชื่อ Requester ล้มเหลว (API error) หรือไม่มี Requester ที่ Active อยู่ในฐานข้อมูล ระบบจะต้องแสดงข้อความ Error/Empty State ที่ชัดเจนและปลอดภัย

### หมวดที่ 2: ระบบสร้างตั๋วและค่าตั้งต้นของระบบ (Ticket Creation & Defaults)
* **BR-07 (System-Generated Ticket Number):** หมายเลขตั๋ว (Ticket Number) จะต้องถูกสร้างโดย Backend เท่านั้น มีรูปแบบมาตรฐานที่แน่นอน (เช่น `TKT-YYYY-XXXXXX`) และต้องไม่ซ้ำกัน (Unique)
* **BR-08 (Initial Ticket Status):** ตั๋วที่ถูกสร้างใหม่ทุกใบจะต้องเริ่มต้นด้วยสถานะ `New` เสมอ
* **BR-09 (System-Generated Timestamps & Requester):** วันที่สร้างตั๋ว (Ticket Date / Created At) จะต้องเป็น Timestamp ปัจจุบันจาก Server และฟิลด์ Requester จะต้องถูกผูกกับ `requesterId` ของตัวตนที่เลือกไว้อัตโนมัติ (เป็น Read-only ในฟอร์ม)
* **BR-10 (Initial Ownership & Assignment):** ตั๋วที่สร้างใหม่จะมีสถานะ IT Owner เป็น `Unassigned` (Null) และ IT Priority เริ่มต้นอาจเป็นค่า Default หรือรอ IT Staff กำหนดใน Lab ถัดไป
* **BR-11 (Required & Editable Fields Validation):**
  * **Ticket Summary:** เป็นฟิลด์บังคับ (Required) ต้องตัดช่องว่างหน้า-หลัง (Trimmed) ความยาว 5 – 200 ตัวอักษร
  * **Category:** เป็นฟิลด์บังคับ (Required) ต้องเลือกจากหมวดหมู่ที่ Active อยู่ในระบบ
  * **Related System:** เป็นฟิลด์บังคับ (Required) ต้องเลือกจากระบบที่เกี่ยวข้องที่มีอยู่ในระบบ
  * **Requested Priority:** เป็นฟิลด์บังคับ (Required) ต้องเลือกจากค่า: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  * **Description:** เป็นฟิลด์บังคับ (Required) ตัดช่องว่างหน้า-หลัง ความยาว 10 – 2,000 ตัวอักษร
* **BR-12 (Duplicate Submission Prevention):** ขณะที่ระบบกำลังส่งข้อมูลสร้างตั๋ว (Submitting) ปุ่ม Submit จะต้องแสดง Busy State และถูกปิดการใช้งาน (Disabled) เพื่อป้องกันการสร้างตั๋วซ้ำซ้อน
* **BR-13 (Form Data Retention on Error):** หากการสร้างตั๋วไม่สำเร็จ (เช่น เกิดข้อผิดพลาดจากเครือข่ายหรือ Validation ฝั่ง Backend) ฟอร์มจะต้องคงค่าที่ผู้ใช้กรอกไว้เดิม (Preserve form values) ไม่ล้างค่าทิ้ง

### หมวดที่ 3: ข้อจำกัดและการจัดการไฟล์แนบ (Attachment Constraints & Lifecycle)
* **BR-14 (Allowed File Types):** รองรับไฟล์แนบเฉพาะนามสกุล `.jpg`, `.jpeg`, `.png`, `.webp`, และ `.pdf` เท่านั้น (MIME Types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`)
* **BR-15 (File Size Limit):** ไฟล์แนบแต่ละไฟล์ต้องมีขนาดไม่เกิน **5 MB** (5,242,880 bytes)
* **BR-16 (Active Attachments Limit):** 1 ตั๋วสามารถมีไฟล์แนบที่มีสถานะ Active ได้สูงสุดไม่เกิน **5 ไฟล์**
* **BR-17 (Soft Removal Only):** การลบไฟล์แนบต้องเป็นการทำ **Soft Removal** เสมอ (บันทึก `isRemoved = true`, บันทึกเวลา `removedAt`, และระบุเหตุผล `removalReason`) ข้อมูล Metadata ยังคงอยู่ในฐานข้อมูล
* **BR-18 (Security of Removed Attachments):** ไฟล์แนบที่ถูก Soft-removed แล้ว จะต้อง**ไม่สามารถดาวน์โหลดหรือดูตัวอย่าง (Preview) ได้อีกต่อไป** และระบบจะไม่นำไฟล์ที่ถูกลบไปนับรวมในโควตา 5 ไฟล์ Active
* **BR-19 (Attachment Deletion Confirmation & Reason):** การขอลบไฟล์แนบ ผู้ใช้จะต้องกรอกเหตุผลในการลบ (Removal Reason) และกดยืนยันผ่าน Dialog ยืนยันก่อนเสมอ
* **BR-20 (Post-Creation Attachment Addition):** ผู้ใช้สามารถเพิ่มไฟล์แนบเพิ่มเติมในหน้า Ticket Detail ภายหลังได้ ตราบใดที่จำนวนไฟล์ Active ยังไม่เกิน 5 ไฟล์
* **BR-21 (Attachment Safe Storage & Naming):** ชื่อไฟล์ที่จัดเก็บบน Server ต้องถูก Sanitize / ตั้งชื่อใหม่ (เช่น ใช้ UUID พร้อมนามสกุลเดิม) เพื่อป้องกันปัญหาระบบไฟล์และ Path Traversal แต่ยังคงแสดง Original Filename ให้ผู้ใช้เห็น

### หมวดที่ 4: ประวัติตั๋วและหน้ารายละเอียดตั๋วแบบอ่านอย่างเดียว (My Tickets & Read-only Detail)
* **BR-22 (Strict Data Ownership Isolation):** ผู้ใช้ (Requester) จะมีสิทธิ์มองเห็น ค้นหา เข้าถึงหน้ารายละเอียด และจัดการไฟล์แนบได้**เฉพาะตั๋วที่ตนเองเป็นเจ้าของ (`requesterId == currentRequester.id`) เท่านั้น** หากพยายามเข้าถึงตั๋วของ Requester คนอื่น Backend ต้องปฏิเสธการเข้าถึงทันที (คืนสถานะ `403 Forbidden` หรือ `404 Not Found`)
* **BR-23 (Search, Filter, and Sort in My Tickets):**
  * ค้นหา (Search) จาก Ticket Number หรือ Summary แบบ Case-insensitive
  * กรอง (Filter) ตาม Category, Requested Priority, IT Priority, และ Current Status
  * จัดเรียง (Sort) ตาม Created Date (Default: วันที่ล่าสุดขึ้นก่อน Descending), Ticket Number, หรือ Last Updated
* **BR-24 (Pagination Controls):** รายการตั๋วต้องแสดงแบบแบ่งหน้า (Pagination) แสดงข้อมูลตามขนาดหน้า (Page size: 8 รายการต่อหน้า) มีปุ่ม Previous, Next, ตัวเลขหน้า และสรุปจำนวนตั๋วทั้งหมด
* **BR-25 (Distinction between Empty State and No-Results State):**
  * **Empty State:** กรณีผู้ใช้ยังไม่เคยสร้างตั๋วเลย ระบบต้องแสดงข้อความแนะนำพร้อมปุ่มทางลัด "Create Ticket"
  * **No-Results State:** กรณีค้นหา/กรองแล้วไม่พบตั๋วที่ตรงเงื่อนไข ระบบต้องแสดงข้อความแจ้งไม่พบผลลัพธ์ พร้อมปุ่ม "Clear Filters"
* **BR-26 (Read-only Ticket Detail):** ข้อมูลส่วนหัวและเนื้อหาของตั๋วในหน้า Ticket Detail (หมายเลขตั๋ว, หมวดหมู่, วันที่, สถานะ, Summary, Description ฯลฯ) จะต้องเป็นแบบ **อ่านอย่างเดียว (Read-only)** ไม่สามารถแก้ไขได้

---

## 6. UI Specification Summary (Zen Green Theme)

### 6.1. Color Tokens Palette
| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` | แถบ App Header, ปุ่มหลัก (Primary Buttons), การเน้นข้อความสำคัญ |
| **Secondary Green** | `#0B7A46` | Active navigation tabs, Focus ring accents, Links, Hover states |
| **Pale Green** | `#EAF6EF` | Selected row highlight, Success alert background, Subtle section emphasis |
| **Page Background** | `#F5F7F6` | พื้นหลังของหน้าจอทั้งหมด (Quiet near-white canvas) |
| **Surface / Cards** | `#FFFFFF` | การ์ดข้อมูล, กล่องฟอร์ม, ตาราง พร้อมขอบบาง `#E2E8F0` และเงาบางเบา |
| **Text Primary** | `#1A2E26` | ตัวหนังสือหลัก (Dark charcoal-green) อ่านสบายตา ไม่ใช่ดำสนิท |
| **Text Muted** | `#5F756B` | ข้อความอธิบายประกอบ, Placeholder, Timestamp |
| **Editable Field** | `#FFFFFF` | ช่องกรอกข้อมูล พื้นหลังสีขาว ขอบ Neutral `#CBD5E1` |
| **Read-only Field** | `#F1F5F3` | ช่องแสดงผลแบบอ่านอย่างเดียว สีพื้นหลัง Soft Gray-Green ชัดเจน |
| **Error / Invalid** | `#DC2626` | ข้อความแจ้งเตือน Error และกรอบสีแดง แสดงใต้ช่องกรอกทันที |
| **Warning** | `#D97706` | ป้ายเตือน (Amber badge) และกล่องข้อความเตือน |
| **Success** | `#16A34A` | ป้ายสถานะสำเร็จและการแจ้งเตือน Green confirmation |

### 6.2. Responsive Breakpoints
* **Desktop ($\ge 992\text{px}$):** แสดงผลแบบ Multi-column, หน้า Create Ticket แบ่งเป็น 2 คอลัมน์ (ข้อมูลหลัก & แนบไฟล์), หน้ารายการ My Tickets แสดงเป็น Table เต็มรูปแบบ ความกว้างสูงสุด Container อยู่ที่ $1200\text{px}$ จัดกึ่งกลาง
* **Tablet ($768\text{px} - 991\text{px}$):** แสดงผลแบบ 2 คอลัมน์ที่กระชับขึ้น Summary และ Description ได้รับความกว้างเต็มที่ ตารางปรับระยะห่างให้อ่านง่าย
* **Mobile ($< 768\text{px}$):** วางคอมโพเนนต์เรียงแถวเดี่ยวในแนวตั้ง (Single-column vertical stack), เมนูนำทางแบบ Mobile Navbar, ปุ่มมีขนาดกดง่าย ($\ge 44\text{px}$ touch target), ตาราง My Tickets แสดงผลเป็นการ์ดสรุปรายการ (Ticket Cards) เพื่อไม่ให้เกิด Horizontal Page Scrolling

---

## 7. Database Changes (Prisma Schema Model)

### 7.1. Prisma Schema Definition
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
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
  RESOLVED
  CLOSED
}

model RequesterUser {
  id         Int      @id @default(autoincrement())
  name       String
  email      String   @unique
  department String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tickets Ticket[]

  @@map("requester_users")
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  tickets Ticket[]

  @@map("categories")
}

model RelatedSystem {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  tickets Ticket[]

  @@map("related_systems")
}

model Ticket {
  id                Int           @id @default(autoincrement())
  ticketNumber      String        @unique
  summary           String
  description       String
  requestedPriority PriorityLevel
  itPriority        PriorityLevel? @default(MEDIUM)
  currentStatus     TicketStatus  @default(NEW)
  ticketOwner       String?
  ticketDate        DateTime      @default(now())
  
  requesterId       Int
  requester         RequesterUser @relation(fields: [requesterId], references: [id])

  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])

  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])

  attachments       Attachment[]

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([requesterId, createdAt(sort: Desc)])
  @@index([currentStatus])
  @@map("tickets")
}

model Attachment {
  id               Int       @id @default(autoincrement())
  ticketId         Int
  ticket           Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  originalFileName String
  storageFileName  String
  fileSize         Int
  fileType         String
  storagePath      String
  isRemoved        Boolean   @default(false)
  removedAt        DateTime?
  removalReason    String?
  uploadedAt       DateTime  @default(now())

  @@index([ticketId, isRemoved])
  @@map("attachments")
}
```

### 7.2. Seed Data Requirements
การ Seed ข้อมูลต้องเขียนให้เป็น Idempotent (รันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ):
1. **Ticket Categories (4 หมวดหมู่):** `Account and Access`, `Hardware`, `Software`, `Network`
2. **Related Systems (อย่างน้อย 6 ระบบ):** `Email`, `Campus Wi-Fi`, `VPN`, `LEB2 App`, `Grade Submission App`, `Printer`, `Corporate Laptop`
3. **Development Requesters:**
   - Active อย่างน้อย 4 คน (เช่น `Jennifer Anderson`, `Michael Brown`, `Sarah Johnson`, `David Lee`)
   - Inactive อย่างน้อย 1 คน (เช่น `Alex Inactive`) โดย Inactive จะไม่ปรากฏในหน้าคัดเลือก

---

## 8. REST API Contract

### 8.1. Header Contract
* `X-Requester-Id`: Header ที่ส่ง `requesterId` ของ Development Requester ที่เลือกไว้ ใช้ในการตรวจสอบสิทธิ์ความเป็นเจ้าของในทุก Request ที่เกี่ยวข้องกับตั๋ว

### 8.2. Endpoint Specifications

#### 1. `GET /api/requesters`
* **คำอธิบาย:** ดึงรายชื่อผู้ใช้จำลองที่ Active สำหรับหน้า Selector
* **Response Status:** `200 OK`
* **Response Body:**
```json
[
  { "id": 1, "name": "Jennifer Anderson", "email": "jennifer@toktick.it", "department": "Marketing" },
  { "id": 2, "name": "Michael Brown", "email": "michael@toktick.it", "department": "Finance" }
]
```

#### 2. `GET /api/categories` และ `GET /api/related-systems`
* **คำอธิบาย:** ดึงหมวดหมู่และระบบที่เกี่ยวข้องที่ Active
* **Response Status:** `200 OK`
* **Response Body (Categories):**
```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Software" },
  { "id": 4, "name": "Network" }
]
```

#### 3. `POST /api/tickets`
* **คำอธิบาย:** สร้างตั๋วใหม่ (รองรับ Multipart Form Data เพื่อแนบไฟล์พร้อมกัน)
* **Headers:** `X-Requester-Id: 1`
* **Request Payload (Multipart):**
  * `summary`: String (5-200 chars)
  * `description`: String (10-2000 chars)
  * `categoryId`: Number
  * `relatedSystemId`: Number
  * `requestedPriority`: Enum (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`)
  * `files`: Binary[] (สูงสุด 5 ไฟล์, ไม่เกิน 5MB ต่อไฟล์, JPG/PNG/WEBP/PDF)
* **Response Status:** `201 Created`
* **Response Body:**
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "summary": "Cannot connect to VPN",
  "description": "Getting authentication timeout error since morning.",
  "requestedPriority": "HIGH",
  "itPriority": "MEDIUM",
  "currentStatus": "NEW",
  "ticketDate": "2026-08-30T00:00:00.000Z",
  "requesterId": 1,
  "categoryId": 4,
  "relatedSystemId": 3,
  "attachments": [
    { "id": 1, "originalFileName": "vpn_error.png", "fileSize": 1048576, "fileType": "image/png" }
  ]
}
```
* **Error Statuses:** `400 Bad Request` (Validation error), `404 Not Found` (Category/System invalid)

#### 4. `GET /api/tickets`
* **คำอธิบาย:** ดึงรายการตั๋วของ Requester ปัจจุบัน พร้อมรองรับ Search, Filter, Sort, Pagination
* **Headers:** `X-Requester-Id: 1`
* **Query Parameters:**
  * `search`: String (ค้นหา Ticket Number หรือ Summary)
  * `categoryId`: Number
  * `requestedPriority`: String
  * `itPriority`: String
  * `status`: String
  * `sortBy`: String (`createdAt` | `ticketNumber` | `updatedAt`) (Default: `createdAt`)
  * `sortOrder`: String (`asc` | `desc`) (Default: `desc`)
  * `page`: Number (Default: 1)
  * `limit`: Number (Default: 8)
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Cannot connect to VPN",
      "categoryName": "Network",
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

#### 5. `GET /api/tickets/:id`
* **คำอธิบาย:** ดึงรายละเอียดตั๋วแบบอ่านอย่างเดียว พร้อมรายการไฟล์แนบ
* **Headers:** `X-Requester-Id: 1`
* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "summary": "Cannot connect to VPN",
  "description": "Getting authentication timeout error since morning.",
  "category": { "id": 4, "name": "Network" },
  "relatedSystem": { "id": 3, "name": "VPN" },
  "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer@toktick.it" },
  "requestedPriority": "HIGH",
  "itPriority": "MEDIUM",
  "currentStatus": "NEW",
  "ticketOwner": null,
  "ticketDate": "2026-08-30T00:00:00.000Z",
  "attachments": [
    {
      "id": 1,
      "originalFileName": "vpn_error.png",
      "fileSize": 1048576,
      "fileType": "image/png",
      "isRemoved": false,
      "uploadedAt": "2026-08-30T00:00:00.000Z"
    }
  ]
}
```
* **Error Statuses:** `403 Forbidden` (Requester ไม่ใช่เจ้าของตั๋ว), `404 Not Found` (ไม่พบตั๋ว)

#### 6. `POST /api/tickets/:id/attachments`
* **คำอธิบาย:** อัปโหลดไฟล์แนบเพิ่มเข้าไปในตั๋วเดิม
* **Headers:** `X-Requester-Id: 1`
* **Request:** Multipart files (สูงสุดไม่เกินโควตา 5 Active files)
* **Response Status:** `201 Created`
* **Error Statuses:** `400 Bad Request` (เกิน 5 Active files หรือขนาด/ประเภทผิด), `403 Forbidden`

#### 7. `GET /api/attachments/:id/download`
* **คำอธิบาย:** ดาวน์โหลดไฟล์แนบ
* **Headers:** `X-Requester-Id: 1`
* **Response Status:** `200 OK` (Stream binary file with `Content-Disposition`)
* **Error Statuses:** `403 Forbidden` (ไม่ใช่เจ้าของ), `404 Not Found` (ไม่พบไฟล์ หรือไฟล์ถูก Soft-removed แล้ว)

#### 8. `PATCH /api/attachments/:id/remove`
* **คำอธิบาย:** ทำ Soft Removal ไฟล์แนบพร้อมบันทึกเหตุผล
* **Headers:** `X-Requester-Id: 1`
* **Request Body:** `{ "removalReason": "Uploaded wrong document by mistake" }`
* **Response Status:** `200 OK`
* **Response Body:** `{ "message": "Attachment removed successfully", "id": 1, "isRemoved": true }`
* **Error Statuses:** `400 Bad Request` (ไม่มี removalReason), `403 Forbidden` (ไม่ใช่เจ้าของ), `404 Not Found`

---

## 9. Acceptance Criteria (AC)

* **AC-01 (Requester Selection on Entry):**
  * **Given** ผู้ใช้งานยังไม่ได้เลือก Development Requester
  * **When** ผู้ใช้งานเปิดเข้าสู่แอปพลิเคชันหรือพยายามเข้า URL `/tickets` หรือ `/tickets/create`
  * **Then** ระบบต้องแสดงหน้าจอ Development Requester Selection และมีเฉพาะรายชื่อผู้ใช้ที่ `isActive = true` ให้เลือก
* **AC-02 (Requester Context Persistence & Header Display):**
  * **Given** ผู้ใช้เลือก Requester "Jennifer Anderson" และกด "Continue"
  * **When** ระบบนำทางเข้าสู่หน้าจอหลัก
  * **Then** ที่ Header ต้องแสดงชื่อ "Jennifer Anderson" พร้อมปุ่ม "Change Requester" และ Context นี้จะถูกส่งไปกับทุก API request
* **AC-03 (Successful Ticket Creation):**
  * **Given** ผู้ใช้กรอก Summary ความยาว 20 ตัวอักษร, เลือก Category, Related System, Priority และ Description ถูกต้อง พร้อมแนบไฟล์ PDF ขนาด 2 MB จำนวน 1 ไฟล์
  * **When** ผู้ใช้กดปุ่ม "Submit Ticket"
  * **Then** ปุ่ม Submit แสดง Busy State และถูก Disable จากนั้นบันทึกตั๋วสำเร็จ ระบบสร้าง Ticket Number รูปแบบ `TKT-YYYY-XXXXXX`, บันทึก `requesterId` ตรงกับตัวตนปัจจุบัน, สถานะเริ่มต้นเป็น `NEW`, และแสดงหน้าจอยืนยันความสำเร็จพร้อมหมายเลขตั๋ว
* **AC-04 (Ticket Creation Validation Failure):**
  * **Given** ผู้ใช้ไม่กรอก Summary หรือกรอก Description น้อยกว่า 10 ตัวอักษร
  * **When** ผู้ใช้กดปุ่ม "Submit Ticket"
  * **Then** ระบบไม่ส่ง API request และแสดงข้อความแจ้งเตือนข้อผิดพลาดสีแดงใต้ช่องกรอกที่ผิดพลาดทันที โดยไม่ลบข้อมูลอื่นที่กรอกไว้แล้ว
* **AC-05 (Attachment Type & Size Validation):**
  * **Given** ผู้ใช้พยายามแนบไฟล์ `.exe` หรือไฟล์ `.jpg` ขนาด 6 MB
  * **When** ผู้ใช้เลือกไฟล์ในฟอร์ม
  * **Then** ระบบแสดงข้อความปฏิเสธไฟล์ทันที และไม่อนุญาตให้เพิ่มไฟล์นั้นเข้ารายการแนบ
* **AC-06 (Maximum 5 Active Attachments Limit):**
  * **Given** ตั๋วมีไฟล์แนบ Active อยู่แล้ว 5 ไฟล์
  * **When** ผู้ใช้พยายามแนบไฟล์ที่ 6
  * **Then** ระบบต้องปิดการทำงานของปุ่มแนบไฟล์ และแสดงข้อความแจ้งเตือนว่าครบโควตาสูงสุด 5 ไฟล์แล้ว
* **AC-07 (My Tickets Ownership Filter):**
  * **Given** Requester A มีตั๋วในระบบ 3 ใบ และ Requester B มีตั๋วในระบบ 2 ใบ
  * **When** Requester A เข้าสู่หน้า My Tickets
  * **Then** ระบบต้องแสดงเฉพาะตั๋ว 3 ใบของ Requester A เท่านั้น ไม่ปรากฏตั๋วของ Requester B เลย
* **AC-08 (My Tickets Search & Filter):**
  * **Given** Requester มีตั๋ว 5 ใบในหมวดหมู่ต่างกัน
  * **When** ผู้ใช้เลือก Filter หมวดหมู่เป็น "Hardware" และพิมพ์คำค้นหา "Laptop"
  * **Then** ตารางแสดงเฉพาะตั๋วที่อยู่ในหมวดหมู่ Hardware และมีคำว่า Laptop ใน Summary หรือ Ticket Number
* **AC-09 (My Tickets Empty State vs No-Results State):**
  * **Given** ผู้ใช้ Requester ใหม่ที่ยังไม่เคยสร้างตั๋วเลย
  * **When** เข้าสู่หน้า My Tickets
  * **Then** ระบบแสดง Empty State พร้อมปุ่ม "Create Ticket" แต่หากเป็นกรณีค้นหาไม่พบข้อมูล ระบบจะแสดง No-Results State พร้อมปุ่ม "Clear Filters"
* **AC-10 (Read-only Ticket Detail):**
  * **Given** ผู้ใช้เปิดดูตั๋วของตนเองที่บันทึกไว้
  * **When** หน้า Ticket Detail แสดงผล
  * **Then** ฟิลด์ข้อมูลทั้งหมด (Ticket No, Date, Status, Requester, Category, System, Summary, Description) แสดงผลแบบ Read-only ในกล่องสี Soft Gray-Green และไม่สามารถพิมพ์แก้ไขได้
* **AC-11 (Cross-Requester Ticket Access Blocked):**
  * **Given** Requester A พยายามเปิด URL รายละเอียดตั๋วของ Requester B หรือส่ง API request ด้วย `X-Requester-Id: A` สำหรับตั๋วของ B
  * **When** Backend ประมวลผลคำขอ
  * **Then** ระบบต้องตอบกลับด้วยสถานะ `403 Forbidden` หรือ `404 Not Found` และไม่เปิดเผยข้อมูลตั๋วของ B
* **AC-12 (Attachment Download for Owner):**
  * **Given** ตั๋วมีไฟล์แนบ Active 1 ไฟล์
  * **When** เจ้าของตั๋วกดปุ่ม Download
  * **Then** เบราว์เซอร์เริ่มการดาวน์โหลดไฟล์โดยมีชื่อไฟล์เดิมถูกต้อง
* **AC-13 (Attachment Soft Removal with Reason):**
  * **Given** เจ้าของตั๋วกดปุ่มลบไฟล์แนบ
  * **When** ผู้ใช้กรอกเหตุผล "Uploaded wrong file" และกดยืนยันใน Confirmation Modal
  * **Then** ไฟล์แนบถูกตั้งค่า `isRemoved = true`, ข้อมูล Metadata ยังคงแสดงอยู่ แต่ปุ่ม Download/Preview ถูกปิดกั้น และโควตาไฟล์ Active ถูกคืนกลับมา 1 ช่อง
* **AC-14 (Blocked Download of Removed Attachment):**
  * **Given** ไฟล์แนบถูก Soft-removed ไปแล้ว
  * **When** มีการส่งคำขอ `GET /api/attachments/:id/download`
  * **Then** Backend ต้องตอบกลับด้วยสถานะ `404 Not Found`
* **AC-15 (Requester Switching Data Isolation):**
  * **Given** ผู้ใช้เลือก Requester A และดูรายการตั๋วใน My Tickets
  * **When** ผู้ใช้กด Change Requester แล้วสลับไปเป็น Requester B
  * **Then** หน้า My Tickets จะต้องโหลดข้อมูลใหม่ทันที โดยแสดงเฉพาะตั๋วของ Requester B
* **AC-16 (Responsive UI Adaptability):**
  * **Given** หน้าจอเปิดบนขนาด Mobile ($< 768\text{px}$)
  * **When** ตรวจสอบหน้า Create Ticket และ My Tickets
  * **Then** Layout เรียงต่อกันในแนวตั้ง ไม่มี Horizontal Scrollbar หลุด และขนาดปุ่มสัมผัสได้ง่าย ($\ge 44\text{px}$)

---

## 10. Product Definition of Done (DoD Checklist)

- [ ] **Data Layer:** Prisma Schema สมบูรณ์ รองรับทุก Model, Enums, Foreign Keys, Indexes และรัน Idempotent Seed Data ผ่านเรียบร้อย (มีทั้ง Active และ Inactive Requester)
- [ ] **Backend APIs:** พัฒนาครบทั้ง 8 Endpoints ตาม API Contract พร้อม Validation, Data Ownership Enforcement, Error Handling และทดสอบผ่านทุก API Test
- [ ] **Frontend Components:** พัฒนาหน้าจอ Selector, Create Ticket, My Tickets, Ticket Detail และ Attachment Management ตามหลัก Zen Green Theme อย่างสมบูรณ์
- [ ] **Responsive Design:** ผ่านการตรวจสอบทั้ง 3 Viewports (Desktop $\ge 992\text{px}$, Tablet $768-991\text{px}$, Mobile $< 768\text{px}$) ไม่มีการตกขอบ ตัวหนังสือทับซ้อน หรือปุ่มหลุดจอ
- [ ] **Soft Delete Integrity:** ทดสอบกลไก Soft Removal ของไฟล์แนบ สามารถเก็บ Metadata และบล็อกการดาวน์โหลดไฟล์ที่ถูกลบได้ 100%
- [ ] **Ownership Security:** ตรวจสอบและมี Automated Tests ยืนยันว่า Requester ไม่สามารถเข้าถึงตั๋วหรือดาวน์โหลดไฟล์ของผู้อื่นได้
- [ ] **Automated Tests:** ทุก Acceptance Criteria (AC-01 ถึง AC-16) ถูกเชื่อมโยงและผ่านการทดสอบครบถ้วนทุกระดับ (Unit, API, UI, E2E) โดยไม่มี Test ใดถูก Skip หรือ Comment ทิ้ง
- [ ] **Documentation:** จัดทำเอกสาร `specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md`, `reviewer.md`, และ `ai-use.md` ครบถ้วน

---

## 11. Assumptions and Decisions

1. **Ticket Number Format Decision:** กำหนดรูปแบบเป็น `TKT-YYYY-XXXXXX` (เช่น `TKT-2026-000101`) โดยใช้ Sequence จาก Database หรือนับต่อจาก Auto-increment ID เพื่อให้เป็นระเบียบ Unique และคาดเดาได้ยาก
2. **Atomic vs Two-Step Ticket Creation:** เลือกใช้ Multipart Form Data ใน Endpoint `POST /api/tickets` เพื่อให้การสร้างตั๋วและบันทึกไฟล์แนบเกิดขึ้นพร้อมกันในระดับ Transaction ช่วยป้องกันปัญหาตั๋วค้างโดยไม่มีไฟล์แนบหากเกิดข้อผิดพลาดระหว่างทาง
3. **Soft Delete Representation:** ตาราง Attachment ใช้ฟิลด์ `isRemoved (Boolean)`, `removedAt (DateTime?)`, และ `removalReason (String?)` เพื่อคงประวัติการอัปโหลดไฟล์ไว้สำหรับการตรวจสอบ (Audit) ในอนาคต
4. **Testing Context Storage:** ฝั่ง Frontend จัดเก็บ ID ของ Development Requester ใน `localStorage` และ React State เพื่อความสะดวกในการทดสอบรีเฟรชหน้าจอ และส่งผ่าน HTTP Header `X-Requester-Id` ในทุก Request
5. **No IT Staff Actions in Lab 2:** ยึดตาม Scope ของ Lab 2 อย่างเคร่งครัด โดยส่วนของ IT Priority ให้ใส่ค่าเริ่มต้นเป็น `MEDIUM` และ Ticket Owner เป็น `null` สำหรับรอการพัฒนาฟีเจอร์ฝั่ง IT Staff ใน Lab ถัดไป
