# TokTickIT UI Specification (Zen Green Theme)
**Lab 3 Users, Roles, IT Staff Ticketing, and Admin Screens**

---

## 1. Design System & Zen Green Theme Continuity

ระบบส่วนต่อประสานผู้ใช้ใน Sprint 3 ต่อยอดจากระบบดีไซน์ **Zen Green Design Language** ที่วางรากฐานไว้ใน Lab 2 โดยเน้นความสะอาด สบายตา เรียบหรู ใช้งานง่าย และให้ความรู้สึกมั่นคง ปลอดภัย

### 1.1. Color Tokens Palette

| Token Name | CSS Variable | Hex Code | Purpose & Usage Description |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `--color-primary-green` | `#006B3C` | แถบ Header หลัก, Primary action buttons, Active navigation tab underline |
| **Secondary Green** | `--color-secondary-green` | `#0B7A46` | ปุ่ม Hover state, Checkmark สำเร็จ, ลิงก์ทั่วไป |
| **Pale Green** | `--color-pale-green` | `#EAF6EF` | แถบไฮไลต์แถวที่เลือก, พื้นหลัง Badge สถานะ, กรอบ Public Comment |
| **Page Background** | `--color-page-bg` | `#F5F7F6` | พื้นหลังของหน้าจอทั้งหมด (Quiet near-white canvas) |
| **Surface / Card** | `--color-surface` | `#FFFFFF` | การ์ดข้อมูล, กล่องฟอร์ม, พื้นหลังตารางข้อมูล มีขอบมน `border-radius: 8px` |
| **Text Primary** | `--color-text-primary` | `#1A2E26` | ตัวอักษรหลัก Dark charcoal-green เพื่อความสบายตา |
| **Text Muted** | `--color-text-muted` | `#5F756B` | ตัวอักษรรอง, Timestamp, คำอธิบายฟิลด์ |
| **Border Neutral** | `--color-border-neutral` | `#CBD5E1` | เส้นขอบ Input และเส้นแบ่งคอลัมน์ตาราง |
| **Field Editable** | `--color-field-editable` | `#FFFFFF` | สีพื้นหลังช่องกรอกข้อมูลที่แก้ไขได้ มีขอบเส้นบาง `#CBD5E1` |
| **Field Read-Only** | `--color-field-readonly` | `#F1F5F3` | สีพื้นหลังช่องข้อมูลอ่านอย่างเดียว เฉด Soft Gray-Green ป้องกันความสับสน |
| **Note Internal Tint**| `--color-note-internal` | `#FFFBEB` | สีพื้นหลังกล่อง Internal Notes เฉด Amber/Yellow เตือนว่าเป็นข้อมูลลับเฉพาะไอที |
| **Note Internal Border**|`--color-note-border` | `#FCD34D` | เส้นขอบของกล่อง Internal Notes |
| **Error / Destructive**| `--color-error` | `#DC2626` | ข้อความแจ้งเตือนสีแดง และปุ่ม Deactivate / Cancel |
| **Warning / Amber** | `--color-warning` | `#D97706` | ป้ายเตือน และ Badge สถานะ Waiting for Requester |
| **Success / Green** | `--color-success` | `#16A34A` | ข้อความสำเร็จ และ Badge สถานะ Resolved |

---

### 1.2. Role, Status, and Priority Badges

เพื่อความชัดเจนในการแยกแยะข้อมูลด้วยสายตา Badge ทั้งหมดจะใช้คู่สีมาตรฐานที่มี Contrast สูง:

| Category | Value | Background Color | Text Color | Border Color |
| :--- | :--- | :--- | :--- | :--- |
| **User Role** | `REQUESTER` | `#E0F2FE` | `#0369A1` | `#BAE6FD` |
| | `IT_STAFF` | `#DCFCE7` | `#15803D` | `#86EFAC` |
| | `ADMINISTRATOR`| `#EDE9FE` | `#6D28D9` | `#DDD6FE` |
| **User Status** | `ACTIVE` | `#DCFCE7` | `#15803D` | `#86EFAC` |
| | `INACTIVE` | `#FEE2E2` | `#B91C1C` | `#FCA5A5` |
| **Ticket Priority** | `CRITICAL` | `#FEE2E2` | `#991B1B` | `#FCA5A5` |
| (Req & IT) | `HIGH` | `#FFEDD5` | `#C2410C` | `#FDBA74` |
| | `MEDIUM` | `#FEF3C7` | `#B45309` | `#FCD34D` |
| | `LOW` | `#DCFCE7` | `#15803D` | `#86EFAC` |
| **Ticket Status** | `NEW` | `#E0F2FE` | `#0369A1` | `#BAE6FD` |
| | `OPEN` | `#CCFBF1` | `#0F766E` | `#99F6E4` |
| | `IN_PROGRESS` | `#DBEAFE` | `#1D4ED8` | `#BFDBFE` |
| | `WAITING_FOR_REQUESTER` | `#FEF3C7` | `#B45309` | `#FDE68A` |
| | `RESOLVED` | `#DCFCE7` | `#15803D` | `#86EFAC` |
| | `CLOSED` | `#F1F5F9` | `#475569` | `#CBD5E1` |
| | `REOPENED` | `#FCE7F3` | `#9D174D` | `#FBCFE8` |
| | `CANCELLED` | `#F3F4F6` | `#374151` | `#E5E7EB` |

---

## 2. Application Shell & Navigation

แถบ Navigation Bar ด้านบนของแอปพลิเคชันจะแสดงผลตามบทบาทของผู้ใช้จริง:

```
[ TikTickIT Logo ]    [ Nav Links ตาม Role ]                    [ User Profile & Menu ]
                     - Requester: [My Tickets] [Create Ticket]   Michael Brown [IT Staff] ▼
                     - IT Staff:  [My Queue]   [Create Ticket]   - Change Password
                     - Admin:     [Admin Users]                  - Sign Out
```

* **Header Background:** `#006B3C` (Zen Primary Green)
* **Logo:** ข้อความและไอคอน TokTickIT สีขาวสะอาดตา (`#FFFFFF`)
* **Active Navigation Item:** มีพื้นหลังสีเขียวเข้มโปร่งแสง (`rgba(255, 255, 255, 0.15)`) พร้อมขอบมน
* **User Profile Widget:**
  * แสดงชื่อผู้ใช้จริง และ Badge บทบาทกำกับข้างชื่อ
  * เมื่อคลิก จะแสดง Dropdown Menu:
    * `Change Password` (เปิดหน้าต่างเปลี่ยนรหัสผ่าน)
    * `Sign Out` (ออกจากระบบและนำทางกลับไปยังหน้า Login)

---

## 3. Detailed Screen Specifications

### 3.1. Screen 1: Login & Mandatory Password Change

#### A. Login Card View
* **Layout:** วางกึ่งกลางหน้าจอ (Centered Card) บนพื้นหลังสี `#F5F7F6`
* **Card Surface:** สีขาว `#FFFFFF`, ความกว้างสูงสุด `420px`, ขอบมน `8px`, เงาละมุน `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08)`
* **Form Elements:**
  * **Header:** โลโก้ TokTickIT สีเขียว และหัวข้อ "Sign in to your account"
  * **Email Field:** ช่องกรอกอีเมล มีไอคอนซองจดหมายและ placeholder `name@toktickit.com`
  * **Password Field:** ช่องกรอกรหัสผ่าน พร้อมปุ่มเปิด/ปิดการมองเห็นรหัสผ่าน (Show/Hide Eye Toggle)
  * **Submit Button:** ปุ่ม "Sign In" สี Zen Green เต็มความกว้าง (`width: 100%`) แสดง Spinner เมื่อกำลังประมวลผล
  * **Error Callout:** กล่องสีแดงอ่อนพื้นหลัง `#FEE2E2` ขอบ `#FCA5A5` ไอคอนตกใจสีแดง แสดงข้อความ `"Invalid email or password. Please try again."` หรือข้อความ `"Account is inactive. Please contact administrator."`

#### B. Mandatory Password Change View
* **Trigger:** ปรากฏขึ้นอัตโนมัติเมื่อเข้าสู่ระบบสำเร็จแต่บัญชีมีสถานะ `mustChangePassword = true`
* **Layout:** Centered Card หัวข้อ "Change Your Password" พร้อมข้อความอธิบาย *"You must change your password to continue."*
* **Form Elements:**
  * `Current (temporary) password`: ช่องกรอกรหัสผ่านชั่วคราว
  * `New password`: ช่องกรอกรหัสผ่านใหม่
  * `Confirm new password`: ช่องยืนยันรหัสผ่านใหม่
  * **Dynamic Password Policy Checklist:** กล่องแสดงเกณฑ์ความปลอดภัยพร้อมไอคอน Checkmark ที่เปลี่ยนเป็นสีเขียวทันทีเมื่อผู้ใช้พิมพ์ผ่านเกณฑ์:
    * [✓] Be at least 8 characters
    * [✓] Include upper and lower case letters
    * [✓] Include a number and a special character
  * **Continue Button:** ปุ่มสีเขียวเต็มความกว้าง ปิดการทำงาน (Disabled) จนกว่าทุกเกณฑ์จะผ่านครบถ้วน

---

### 3.2. Screen 2: Requester Regression & Public Comments

* **Header Continuity:** ตัด Requester Selector เก่าออก โดยแสดงตัวตนของผู้ใช้ที่ล็อกอินอยู่ในปัจจุบัน
* **Ticket Detail Modifications:**
  * เพิ่มปุ่มดำเนินการ **"Problem Appears Resolved"** (ปุ่มโทนสีเขียวอ่อนขอบเข้ม) บริเวณส่วนหัวของตั๋ว หากตั๋วอยู่ในสถานะ `IN_PROGRESS` หรือ `WAITING_FOR_REQUESTER` เพื่อให้ผู้ร้องขอกดแจ้งเตือนเจ้าหน้าที่
  * **Public Comments Section:** แถบแสดงประวัติการสื่อสารสาธารณะ:
    * แสดง Avatar วงกลมระบุอักษรย่อชื่อผู้โพสต์ (เช่น `JA` สำหรับ Jennifer Anderson)
    * ป้ายกำกับบทบาท (`Requester`, `IT Staff`) ข้างชื่อผู้เขียน
    * วันที่และเวลาการโพสต์ในรูปแบบ `May 13, 2026 11:45 AM`
    * กล่องข้อความแสดงความคิดเห็นพร้อมเส้นแบ่งสบายตา
    * ช่องพิมพ์ข้อความ `Add Public Comment` พร้อมปุ่ม "Post Comment" สีเขียว
  * **Absolute Exclusion:** ตรวจสอบให้มั่นใจว่าไม่มีการแสดงส่วนของ **Internal Notes** ในหน้านี้เด็ดขาด

---

### 3.3. Screen 3: IT Staff Ticket Queue

* **Header Sub-bar:** แสดงข้อความ "My Queue" พร้อมจำนวนตั๋วทั้งหมด (เช่น `Showing 1 to 10 of 87 tickets`)
* **Filters & Search Toolbar:**
  * **Search Input:** ช่องค้นหาพร้อมไอคอนแว่นขยาย Placeholder: `"Search by ticket number or summary..."`
  * **Filter Button:** ปุ่ม "Filters" เปิด Popover เมนูตัวกรองสำหรับเลือก Category, Status, IT Priority, และ Assignment
* **Data Table (Desktop Layout):**
  * **Columns:**
    1. `Ticket No.` (Hyperlink สีเขียว คลิกเพื่อเปิด Ticket Detail เช่น `TKT-2026-001234`)
    2. `Created Date` (เช่น `May 12, 09:14 AM`)
    3. `Summary` (ตัดข้อความยาวเกินด้วย Ellipsis `...`)
    4. `Category` (เช่น `Hardware`, `Software`, `Network`)
    5. `Req Priority` (Badge สีมาตรฐาน)
    6. `IT Priority` (Badge สีมาตรฐาน)
    7. `Status` (Badge แสดงสถานะตั๋ว)
    8. `Owner` (ชื่อเจ้าหน้าที่ หรือข้อความตัวเอียงสีเทา `Unassigned`)
  * **Hover Effect:** แถวของตารางจะเปลี่ยนเป็นสีเขียวอ่อนมาก (`#F0FDF4`) เมื่อวางเมาส์
* **Pagination Bar:**
  * ปุ่ม `< Previous` และ `Next >`
  * หมายเลขหน้า `1`, `2`, `3`, ..., `9` โดยหน้าที่เลือกจะแสดงเป็นปุ่มสีเขียวเข้มตัวอักษรขาว
* **Mobile Layout (< 768px):** ตารางจะปรับเปลี่ยนเป็นการ์ดข้อมูลแนวตั้ง (Stacked Cards) แสดงหมายเลขตั๋วและ Status Badge ด้านบน ตามด้วย Summary และรายละเอียดสำคัญในรูปแบบ Badge เพื่อให้อ่านง่ายบนจอมือถือ

---

### 3.4. Screen 4: IT Staff Ticket Detail

โครงสร้างหน้าจอถูกแบ่งออกเป็น 2 โซนหลัก เพื่อแยกข้อมูลที่อ่านได้อย่างเดียวออกจากฟิลด์ที่เจ้าหน้าที่ต้องปรับเปลี่ยน:

#### โซนที่ 1: Ticket Header & Operational Controls (ตารางควบคุมด้านบน)
* **Ticket No & Metadata:** แสดง Ticket Number, Created Date, Category, Related System และ Requester Info ในกล่องพื้นหลังสีเทาอ่อนแบบอ่านอย่างเดียว (`--color-field-readonly`)
* **Editable Operational Fields:**
  * **Ticket Owner Dropdown:** เลือกมอบหมายตั๋วให้ตนเอง (Claim), เลือกชื่อ IT Staff คนอื่น หรือเลือก `Unassigned`
  * **IT Priority Dropdown:** เลือกปรับระดับความสำคัญ (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  * **Current Status Dropdown:** เลือกเปลี่ยนสถานะตาม Transition Matrix (ฟิลด์นี้จะแสดงเฉพาะตัวเลือกสถานะที่อนุญาตให้เปลี่ยนได้จากสถานะปัจจุบันเท่านั้น)
* **Summary & Description:** กล่องข้อความระบุปัญหาจากผู้แจ้งแบบอ่านอย่างเดียว

#### โซนที่ 2: Communication & Collaboration Tabs (แท็บด้านล่าง)
มีแท็บสลับการทำงาน 2 แท็บหลัก:
1. **Public Comments Tab (สีเขียว Zen Green):**
   * สำหรับการสื่อสารที่โปร่งใสระหว่างผู้แจ้งและทีมไอที
   * กล่องพิมพ์ข้อความ `Add Public Comment` และปุ่ม "Post Comment" สีเขียว
   * รายการความคิดเห็นเรียงตามลำดับเวลา (Ascending) พร้อมป้ายชื่อผู้เขียน
2. **Internal Notes Tab (สีส้มอำพัน Amber / Warning Tone):**
   * มีป้ายเตือนชัดเจน: `🔒 Private - Visible only to IT Staff and Administrators`
   * พื้นหลังของกล่องบันทึกใช้สีส้มอ่อน `#FFFBEB` ขอบสีเหลืองอำพัน `#FCD34D` เพื่อเตือนสติเจ้าหน้าที่ไม่ให้สับสนกับข้อคิดเห็นสาธารณะ
   * กล่องพิมพ์บันทึก `Add Internal Note` และปุ่ม "Save Internal Note" สีเหลืองเข้มปนน้ำตาล

---

### 3.5. Screen 5: Administrator User Management

หน้าจอจัดการบัญชีผู้ใช้อย่างง่ายสำหรับ Administrator ยึดหลัก Minimalist Design:

#### ส่วนแสดงรายการผู้ใช้ (User List View)
* **Toolbar:**
  * กล่องค้นหาผู้ใช้: `"Search users by name or email..."`
  * เมนูกรองบทบาท (Filter by Role): All Roles, Requester, IT Staff, Administrator
  * ปุ่มหลัก **"+ Create User"** สี Zen Green เด่นชัดทางด้านขวา
* **User Table:**
  * คอลัมน์: `Name`, `Email`, `Role` (Badge สีเฉพาะบทบาท), `Status` (Active สีเขียว / Inactive สีแดง), และปุ่ม `Edit`
  * ปุ่ม `Edit` (หรือคลิกที่แถว) จะเปิดหน้าต่างแก้ไขผู้ใช้

#### Slide-over / Modal: Create & Edit User
* **Create User Form:**
  * `Full Name *`: กล่องกรอกชื่อ-นามสกุล
  * `Email Address *`: กล่องกรอกอีเมล
  * `Role *`: Dropdown เลือกบทบาท (จำกัดเพียง 1 บทบาท)
  * `Active Switch`: สวิตช์สลับเปิด/ปิดสถานะบัญชี (เริ่มต้นเปิดใช้งาน)
  * `Initial Password`: รหัสผ่านเริ่มต้นที่ตั้งให้ผู้ใช้ พร้อมคำอธิบาย *"User will be prompted to change password on first login"*
  * ปุ่ม "Save User" และปุ่ม "Cancel"
* **Edit User Form:**
  * แก้ไขชื่อ อีเมล บทบาท และสถานะ Active
  * **Safety Guardrail UI:** หากเป็นบัญชีของแอดมินที่กำลังล็อกอินอยู่ สวิตช์ Active จะถูก Disable พร้อมคำอธิบายใต้สวิตช์ *"You cannot deactivate your own account"*
  * **Destructive Action:** ปุ่ม "Deactivate User" สีแดงกรอบขาว (เมื่อกดจะแสดง Confirmation Modal ยืนยัน)
  * **Reset Password Action:** ปุ่ม "Reset Initial Password" เพื่อตั้งรหัสผ่านชั่วคราวใหม่ให้ผู้ใช้

---

## 4. UI States & Feedback Standards

1. **Loading & Busy States:**
   * ขณะกำลังโหลดข้อมูลตารางหรือหน้ารายละเอียด: แสดง **Skeleton Loader** โทนสีเทาอ่อนกระพริบเบาๆ แทนการใช้หน้าขาวว่างเปล่า
   * ขณะกดส่งฟอร์ม (Submit Button): ปุ่มจะถูก Disable และแสดง Spinner หมุนวนพร้อมข้อความ เช่น `"Signing in..."`, `"Saving..."`
2. **Empty States & No-Results:**
   * **Empty State:** เมื่อไม่มีข้อมูลในระบบ (เช่น ตั๋วในคิวหมดแล้ว) แสดงภาพไอคอนกล่องว่างสีเขียวอ่อน พร้อมข้อความ `"No tickets in queue"`
   * **No-Results State:** เมื่อค้นหาหรือกรองแล้วไม่พบข้อมูล แสดงไอคอนแว่นขยาย พร้อมข้อความ `"No matching tickets found"` และปุ่ม `"Clear Filters"`
3. **Validation Error Placement:**
   * แสดงเส้นขอบสีแดง `#DC2626` รอบช่อง Input ที่ข้อมูลไม่ถูกต้อง
   * แสดงข้อความอธิบายสีแดงขนาด `12px` ใต้ช่องกรอกทันที
4. **Action Confirmations:**
   * การกระทำที่มีผลกระทบรุนแรง (เช่น การ Deactivate บัญชี หรือการ Cancel ตั๋ว) ต้องมี Modal Pop-up ยืนยันก่อนทำรายการเสมอ
5. **Access Denied / 403 Screen:**
   * หากผู้ใช้พยายามเข้าถึง URL ที่ไม่มีสิทธิ์ (เช่น Requester พยายามเข้า `/admin/users`) ระบบจะแสดงหน้าจอ Access Denied ที่เป็นมิตร พร้อมปุ่ม "Return to Dashboard"

---

## 5. Responsive & Accessibility Rules

* **Breakpoints:**
  * Desktop: ความกว้าง $\ge 992\text{px}$ (แสดง Layout ตารางเต็มรูปแบบ และหน้าจอ 2 คอลัมน์)
  * Tablet: ความกว้างระหว่าง $768\text{px}$ ถึง $991\text{px}$ (ตารางแบบย่อส่วน กระชับระยะ Padding)
  * Mobile: ความกว้าง $< 768\text{px}$ (Single Column Layout, ตารางปรับเป็นการ์ดข้อมูล, Modal ขยายเต็มจอ Full Screen)
* **Touch Targets:** ปุ่มกด ตัวเลือก และไอคอนเมนูทั้งหมดต้องมีขนาดพื้นที่กดไม่น้อยกว่า `44px x 44px` บนหน้าจอมือถือ
* **Color Contrast:** อัตราส่วน Contrast ของตัวอักษรและสีพื้นหลังต้องไม่ต่ำกว่า `4.5:1` ตามมาตรฐาน WCAG 2.1 AA
* **No Horizontal Scrolling:** ทุกหน้าจอต้องไม่มีปัญหาเนื้อหาล้นออกนอกขอบจอแนวนอนในทุกขนาดหน้าจอ
