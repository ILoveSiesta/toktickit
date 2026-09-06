# TokTickIT UI Specification (Zen Green Theme)
**Lab 2 Requester Ticketing MVP**

---

## 1. Design System & Zen Green Theme

ระบบดีไซน์ของ TokTickIT พัฒนาขึ้นโดยยึดหลัก **Zen Green Design Language** เพื่อสร้างความรู้สึกสงบ สะอาด เป็นมืออาชีพ สบายตา และใช้งานง่ายสำหรับผู้ใช้งานทั่วไป (Requester)

### 1.1. Color Tokens Palette

| Token Name | CSS Variable | Hex Code | Purpose & Usage Description |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `--color-primary-green` | `#006B3C` | แถบ Header หลักของแอปพลิเคชัน, ปุ่มดำเนินการหลัก (Primary Action), การเน้นหัวข้อสำคัญ |
| **Secondary Green** | `--color-secondary-green` | `#0B7A46` | แท็บเมนูที่ Active, สีเส้นขอบเมื่อ Focus, ลิงก์ทั่วไป, Hover state ของปุ่มหลัก |
| **Pale Green** | `--color-pale-green` | `#EAF6EF` | แถบไฮไลต์แถวที่ถูกเลือก, พื้นหลังการแจ้งเตือนสำเร็จ, พื้นหลังของ Badge สถานะ/หมวดหมู่ |
| **Page Background** | `--color-page-bg` | `#F5F7F6` | พื้นหลังของทั้งหน้าจอ (Quiet near-white canvas) ช่วยลดความล้าของสายตา |
| **Surface / Card** | `--color-surface` | `#FFFFFF` | พื้นผิวของการ์ดข้อมูล, กล่องฟอร์ม, พื้นหลังตาราง มีขอบบาง `#E2E8F0` และเงาบางเบา |
| **Text Primary** | `--color-text-primary` | `#1A2E26` | ตัวหนังสือหลักสำหรับเนื้อหา (Dark charcoal-green) อ่านง่าย สบายตากว่าสีดำสนิท |
| **Text Muted** | `--color-text-muted` | `#5F756B` | ข้อความรอง, Timestamp, คำอธิบายประกอบใต้ช่องกรอกข้อมูล, Icon สีรอง |
| **Border Neutral** | `--color-border-neutral` | `#CBD5E1` | เส้นขอบของช่องกรอกข้อมูล (Inputs) และเส้นแบ่งส่วนข้อมูลทั่วไป |
| **Editable Field** | `--color-field-editable` | `#FFFFFF` | สีพื้นหลังของช่องกรอกข้อมูลที่สามารถพิมพ์หรือแก้ไขได้ |
| **Read-only Field** | `--color-field-readonly` | `#F1F5F3` | สีพื้นหลังของช่องข้อมูลแบบอ่านอย่างเดียว มีเฉด Soft Gray-Green แยกชัดเจน |
| **Error / Invalid** | `--color-error` | `#DC2626` | สีเส้นขอบและตัวอักษรเมื่อเกิด Validation Error และปุ่มลบ (Destructive) |
| **Warning / Amber** | `--color-warning` | `#D97706` | ป้ายเตือน (Amber badge) และกล่องข้อความเตือน |
| **Success / Green** | `--color-success` | `#16A34A` | ป้ายสถานะสำเร็จและการแจ้งเตือน Green Confirmation |

---

### 1.2. Priority & Status Badge Tokens

การแสดงผล Badge ระดับความสำคัญ (Priority) และสถานะ (Status) ต้องใช้คู่สีพื้นหลังและสีตัวอักษรที่มี Contrast สูงและอ่านง่ายเสมอ:

| Category | Value | Background Color | Text Color | Border Color |
| :--- | :--- | :--- | :--- | :--- |
| **Requested / IT Priority** | `CRITICAL` | `#FEE2E2` | `#991B1B` | `#FCA5A5` |
| **Requested / IT Priority** | `HIGH` | `#FFEDD5` | `#C2410C` | `#FDBA74` |
| **Requested / IT Priority** | `MEDIUM` | `#FEF3C7` | `#B45309` | `#FCD34D` |
| **Requested / IT Priority** | `LOW` | `#DCFCE7` | `#15803D` | `#86EFAC` |
| **Ticket Status** | `NEW` | `#E0F2FE` | `#0369A1` | `#7DD3FC` |
| **Ticket Status** | `OPEN` / `IN_PROGRESS` | `#CCFBF1` | `#0F766E` | `#5EEAD4` |
| **Ticket Status** | `RESOLVED` / `CLOSED` | `#F1F5F9` | `#475569` | `#CBD5E1` |

---

## 2. Typography & Spacing System

### 2.1. Typography Stack
* **Font Family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Hierarchy:**
  * **Page Title (H1):** `24px` (`1.5rem`), Weight: `700` (Bold), Line-height: `1.3`, Color: `#1A2E26`
  * **Section Title (H2):** `18px` (`1.125rem`), Weight: `600` (Semi-bold), Line-height: `1.4`, Color: `#1A2E26`
  * **Card Title / Subtitle (H3):** `16px` (`1.0rem`), Weight: `600` (Semi-bold), Line-height: `1.4`, Color: `#1A2E26`
  * **Body Text (Regular):** `14px` (`0.875rem`), Weight: `400` (Regular), Line-height: `1.5`, Color: `#1A2E26`
  * **Field Labels & Table Headers:** `13px` (`0.8125rem`), Weight: `600` (Semi-bold), Text-transform: normal
  * **Helper Text & Captions:** `12px` (`0.75rem`), Weight: `400` (Regular), Color: `#5F756B`

### 2.2. Spacing Scale
* Base unit: `4px`
* Spacing values: `4px` (`xs`), `8px` (`sm`), `12px` (`md`), `16px` (`base`), `24px` (`lg`), `32px` (`xl`), `48px` (`2xl`)
* Form Field Gap: `16px` แนวตั้งระหว่างฟิลด์
* Container Max Width: `1200px` กึ่งกลางหน้าจอ พร้อม Padding ข้าง `16px` (Mobile) / `24px` (Desktop)

---

## 3. Component States & Styling Rules

### 3.1. Form Control States
1. **Labels:** แสดงอยู่เหนือช่อง Input เสมอ (Top-aligned) ฟอนต์หนา `600` ขนาด `13px` ฟิลด์ที่บังคับต้องมีเครื่องหมายดอกจันสีแดง `*` (`#DC2626`)
2. **Editable Field (Default):** พื้นหลังสีขาว (`#FFFFFF`), ขอบสี `#CBD5E1`, มุมมน `6px`, ความสูงมาตรฐาน `40px` (ยกเว้น Textarea สูงอย่างน้อย `100px`)
3. **Focused Field:** ขอบเปลี่ยนเป็น Secondary Green (`#0B7A46`) พร้อมเงา Focus Ring ขนาด `2px` สี `#0B7A46/20`
4. **Read-only Field:** พื้นหลังสี Soft Gray-Green (`#F1F5F3`), ขอบสี `#E2E8F0`, ตัวอักษรสี `#1A2E26`, `cursor: default`, ปิดกั้นการแก้ไข
5. **Invalid / Error Field:** ขอบเปลี่ยนเป็นสีแดงเข้ม (`#DC2626`), ข้อความ Error สีแดง (`#DC2626`, ขนาด `12px`) แสดงผลอยู่ใต้ช่องกรอกข้อมูลทันที ไม่แสดงเป็นกล่องรวมที่หัวหน้าจอ
6. **Disabled Control:** พื้นหลังสี `#F1F5F9`, ตัวอักษรสี `#94A3B8`, `cursor: not-allowed`

---

### 3.2. Button Hierarchy & States

```
+-----------------------------------------------------------------------------------------------------+
|  [ Primary Action ]    [ Secondary Action ]    [ Tertiary Ghost ]    [ Destructive ]    [ Disabled ] |
+-----------------------------------------------------------------------------------------------------+
```

1. **Primary Button (เช่น Submit Ticket, Continue):**
   - Background: Primary Green (`#006B3C`)
   - Text: White (`#FFFFFF`), Weight `600`
   - Hover: Background Secondary Green (`#0B7A46`)
   - Active / Focus: Outline Ring `#00502D`
2. **Secondary / Outline Button (เช่น Cancel, Close Modal):**
   - Background: White (`#FFFFFF`)
   - Border: `1px solid #CBD5E1`
   - Text: `#1A2E26`
   - Hover: Background Pale Green (`#EAF6EF`), Border `#0B7A46`
3. **Tertiary / Ghost Button (เช่น Clear Filters, Back to My Tickets, Text Actions):**
   - Background: Transparent (`transparent`)
   - Border: None
   - Text: Secondary Green (`#0B7A46`) หรือ Dark Charcoal-Green (`#1A2E26`), Weight `500`
   - Hover: Background Pale Green (`#EAF6EF`), Text Primary Green (`#006B3C`), Border-radius `6px`
   - Active / Focus: Outline Ring `#0B7A46/20`
4. **Destructive Button (เช่น Confirm Removal, Delete):**
   - Background: White (`#FFFFFF`) หรือ `#FEE2E2`
   - Border: `1px solid #FCA5A5`
   - Text: Dark Red (`#DC2626`)
   - Hover: Background `#DC2626`, Text White (`#FFFFFF`)
5. **Busy / Submitting Button State:**
   - Background: `#006B3C` (Opacity 0.7)
   - Status: `disabled`
   - Content: แสดงไอคอน Loading Spinner หมุนวนพร้อมข้อความ "Submitting..." หรือ "Processing..." เพื่อป้องกัน Double Click

---

### 3.3. Global Server Connection Error Warning Banner
แถบแจ้งเตือนระดับแอปพลิเคชัน (App-level Global Error Banner) ที่จะปรากฏขึ้นโดยอัตโนมัติตรงด้านบนสุดของทุกหน้าจอ (ใต้ App Header หรือเหนือเนื้อหาหลัก) เมื่อ Client ไม่สามารถเชื่อมต่อกับ Server ได้ หรือ API ตอบกลับด้วย `500+ Internal Server Error`:

```
+----------------------------------------------------------------------------------------------------+
| ⚠️  Cannot connect to server. Please ensure the backend is running at http://localhost:3000.  [✕] |
+----------------------------------------------------------------------------------------------------+
```

* **Position:** ติดด้านบนสุดใต้ Header (Full-width หรือ Container width)
* **Background:** Soft Red / Error Tint (`#FEE2E2` หรือ `#DC2626`)
* **Border:** `1px solid #FCA5A5`
* **Text Color:** Dark Red (`#991B1B` หรือ `#FFFFFF`), Weight `600`, Font Size `13px`
* **Icon:** ไอคอนเตือน (`⚠️` หรือ Connection Lost Icon) นำหน้าข้อความ
* **Dismiss Button:** ปุ่มกากบาท `[✕]` เพื่อให้ผู้ใช้สามารถกดปิดการแจ้งเตือนชั่วคราวได้
* **Role / Accessibility:** `role="alert"` พร้อม `aria-live="assertive"`

---

## 4. Screen Layouts & Structural Blueprint

### 4.1. Application Shell & Header
* แถบ Header ด้านบนสุดใช้พื้นหลังสี Primary Green (`#006B3C`) สูง `56px`
* ฝั่งซ้าย: โลโก้ TokTickIT สีขาว พร้อมลิงก์นำทาง:
  * `My Tickets` (แท็บแสดงรายการตั๋ว)
  * `+ Create Ticket` (ปุ่มลัดสร้างตั๋ว)
* ฝั่งขวา: แสดงชื่อ Development Requester ที่เลือกอยู่ในปัจจุบัน พร้อมปุ่ม "Change Requester" สำหรับสลับตัวตน

---

### 4.2. Development Requester Selector Screen (`/`)
* การ์ดสีขาวจัดกึ่งกลางหน้าจอ (Max width `480px`)
* มีไอคอน User Context พร้อมหัวข้อ "Select Development Requester"
* กล่องข้อความแจ้งเตือนสี Pale Green: *"This is for Lab 2 testing only and is not a real login screen."*
* Dropdown เลือก Requester (แสดงเฉพาะผู้ใช้ Active)
* ปุ่ม "Continue" (Primary Button) สำหรับบันทึก Context และนำทางเข้าสู่หน้ารายการตั๋ว
* รองรับ Loading State (ขณะดึง API) และ Empty State (กรณีไม่มี Active Requester)

---

### 4.3. Create Ticket Screen (`/tickets/create`)
* โครงสร้างแบบ 2 คอลัมน์บน Desktop (แบ่งเป็นส่วนฟอร์มหลัก 65% และส่วนแนบไฟล์ 35%)
* **ส่วนข้อมูลระบบ (System-generated / Read-only):**
  * Ticket Number: แสดงข้อความ `[Generated on Submission]`
  * Ticket Date: วันที่และเวลาปัจจุบัน (Read-only)
  * Requester Name: ชื่อผู้ใช้จำลองปัจจุบัน (Read-only)
* **ส่วนข้อมูลการแจ้งปัญหา (Editable Fields):**
  * Category: Dropdown รายการหมวดหมู่ (Required `*`)
  * Related System: Dropdown รายการระบบที่เกี่ยวข้อง (Required `*`)
  * Requested Priority: Dropdown หรือ Radio Button Badge (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) (Required `*`)
  * Ticket Summary: Text Input 5–200 ตัวอักษร (Required `*`)
  * Description: Multiline Textarea 10–2,000 ตัวอักษร (Required `*`)
* **ส่วนการแนบไฟล์ (Attachment Dropzone):**
  * กล่อง Dropzone ลากวางไฟล์หรือกดเลือกไฟล์ (JPG, JPEG, PNG, WEBP, PDF ขนาด $\le 5\text{MB}$)
  * แสดงรายการไฟล์ที่เลือกพร้อมขนาดไฟล์ และปุ่มลบไฟล์ก่อนส่ง
  * ปิดการเลือกไฟล์และแจ้งเตือนเมื่อเลือกครบโควตา 5 ไฟล์
* **ปุ่มดำเนินการ:**
  * ปุ่ม "Submit Ticket" (Primary Button พร้อม Busy State)
  * ปุ่ม "Cancel" (Secondary Button นำทางกลับไป My Tickets)

---

### 4.4. My Tickets Screen (`/tickets`)
* **ส่วนหัวและแถบเครื่องมือ (Header & Toolbar):**
  * ชื่อหน้า "My Tickets" พร้อมจำนวนตั๋วทั้งหมด
  * ปุ่ม "+ Create Ticket" สีเขียวมุมขวาบน
  * ช่อง Search Box ค้นหาหมายเลขตั๋วหรือ Summary
  * ตัวกรอง Dropdown: Category, Requested Priority, IT Priority, และ Current Status
  * ปุ่ม "Clear Filters" สำหรับล้างค่าค้นหาและตัวกรองทั้งหมด
* **ตารางแสดงผลบน Desktop (Table Layout):**
  * คอลัมน์: `Ticket No.` | `Created Date` | `Summary` | `Category` | `Requested Priority` | `IT Priority` | `Current Status` | `Last Updated`
  * **Interactive Table Headers (Sorting):** ผู้ใช้สามารถคลิกที่หัวตาราง (Table Headers ได้แก่ `Ticket No.`, `Created Date`, และ `Last Updated`) เพื่อสลับการจัดเรียงข้อมูล (สลับระหว่าง Ascending `asc` และ Descending `desc`) ได้ โดยมีไอคอนลูกศรชี้ขึ้น/ลง (`▲`/`▼`) กำกับสถานะการจัดเรียงคอลัมน์ที่กำลังใช้งาน
  * เมื่อนำเมาส์ไปชี้ที่แถว (Row Hover) พื้นหลังจะเปลี่ยนเป็น Pale Green (`#EAF6EF`)
  * คลิกที่แถวหรือหมายเลขตั๋วเพื่อเปิดหน้า Ticket Detail
* **การแสดงผลบน Mobile (Card Layout):**
  * ตารางปรับเปลี่ยนเป็นการ์ดข้อมูล (Ticket Cards) เรียงในแนวตั้ง
  * แต่ละการ์ดแสดง Ticket No., Summary, Badges ของ Priority และ Status ชัดเจน
* **Pagination Bar:**
  * แสดงข้อความสรุปผลลัพธ์ เช่น *"Showing 1 to 8 of 24 tickets"*
  * ปุ่ม `< Previous`, ตัวเลขหน้า `1`, `2`, `3`, ปุ่ม `Next >`
* **Empty State vs No-Results State:**
  * *Empty State (ยังไม่มีตั๋ว):* แสดงไอคอนกล่องเปล่า ข้อความ "No support tickets found" และปุ่ม "+ Create Ticket"
  * *No-Results State (กรองไม่พบ):* แสดงข้อความ "No tickets match your search filters" พร้อมปุ่ม "Clear Filters"

---

### 4.5. Requester Ticket Detail Screen (`/tickets/:id`)
* **Navigation Bar:** ปุ่มย้อนกลับ `← Back to My Tickets`
* **Ticket Info Card (Read-only):**
  * จัดกลุ่มแสดงข้อมูลทั้งหมดในกล่องพื้นหลัง Soft Gray-Green (`#F1F5F3`)
  * แสดง Ticket No., Created Date, Category, Related System, Requester Name, Requested Priority, IT Priority, Status, Summary, Description อย่างเป็นระเบียบ ห้ามมีช่อง Editable
* **Attachments Section & UI States:**
  1. **Active State:** ไฟล์ปกติที่พร้อมใช้งาน แสดงไอคอนชนิดไฟล์, ชื่อไฟล์เดิม, ขนาดไฟล์ (MB/KB), วันที่อัปโหลด พร้อมปุ่ม "Download" และปุ่ม "Remove" (ถังขยะ)
  2. **Uploading State:** ขณะที่กำลังอัปโหลดไฟล์ แสดง Progress Bar / Spinner พร้อมข้อความบอกสถานะ เช่น *"Uploading 45%..."* โดยปุ่มดำเนินการอื่นจะถูก Disable ชั่วคราว
  3. **Invalid State:** ไฟล์ที่ไม่ผ่านเกณฑ์ (ขนาดเกิน 5MB หรือนามสกุลไม่ใช่ JPG/PNG/WEBP/PDF) แสดงแถบขอบสีแดง (`#DC2626`) พร้อมข้อความแจ้งเตือนสีแดงใต้รายการไฟล์นั้นทันที
  4. **Removed State (Soft-removed):** ไฟล์ที่ถูกลบแบบ Soft Removal แสดงแถบพื้นหลังสีเทาอ่อน (`#F8FAFC`), มีป้าย `[Removed]`, แสดง Metadata เช่น ชื่อไฟล์, เหตุผลที่ลบ (Removal Reason), วันที่ลบ โดยปุ่ม Download และ Preview จะถูกปิดกั้นถาวร (`disabled`)
  5. **Unavailable State:** กรณีไฟล์ในพื้นที่จัดเก็บสูญหายหรือไม่สามารถเข้าถึงได้ แสดงไอคอนเตือนสีเทาพร้อมป้าย `[Unavailable]` และปิดปุ่มดาวน์โหลด
* **Soft Removal Confirmation Modal:**
  * กล่อง Pop-up Modal ยืนยันการลบไฟล์
  * บังคับกรอกช่อง "Reason for removal" (Required)
  * ปุ่ม "Confirm Removal" (Destructive Red) และปุ่ม "Cancel"

---

## 5. Responsive Layout Rules & Breakpoints

```
  Mobile (< 768px)          Tablet (768px - 991px)          Desktop (>= 992px)
+-------------------+     +-------------------------+     +-------------------------------+
| Header (Compact)  |     | Header (Full Nav)       |     | Header (Full Nav + Requester) |
| Vertical Stack    |     | 2-Column Grid           |     | Multi-Column (Max 1200px)     |
| Ticket Cards      |     | Responsive Table        |     | Full Data Table               |
| Touch >= 44px     |     | Optimized Spacing       |     | Side-by-Side Form & Files     |
+-------------------+     +-------------------------+     +-------------------------------+
```

### 5.1. Breakpoint Breakdown

| Viewport | Screen Width | Layout Strategy & Component Behavior |
| :--- | :--- | :--- |
| **Desktop** | $\ge 992\text{px}$ | • Multi-column layout จัดกึ่งกลางหน้าจอ ความกว้างสูงสุด $1200\text{px}$<br>• Create Ticket จัดวางแบบ 2 คอลัมน์ (Form 65%, Attachments 35%)<br>• My Tickets แสดงตาราง Data Table ครบทุกคอลัมน์ |
| **Tablet** | $768\text{px} - 991\text{px}$ | • Two-column layout ที่ปรับระยะ Padding ให้กระชับขึ้น<br>• Summary และ Description ได้รับความกว้างเต็มพื้นที่<br>• ตาราง My Tickets ซ่อนคอลัมน์ที่ไม่จำเป็นและปรับขนาดฟอนต์ |
| **Mobile** | $< 768\text{px}$ | • Single-column vertical stack ทุกคอมโพเนนต์เรียงแถวเดี่ยว<br>• ปุ่มและการควบคุมมีขนาดสัมผัสขั้นต่ำ $\ge 44\text{px}$ touch target<br>• ตาราง My Tickets แปลงเป็นการ์ด (Ticket Cards) เพื่อป้องกันการเลื่อนแนวนอน (No horizontal scroll) |

---

## 6. Accessibility & Usability (A11y)

1. **Color Contrast:** อัตราส่วน Contrast ระหว่างข้อความและพื้นหลังต้องได้มาตรฐาน WCAG 2.1 AA ($\ge 4.5:1$ สำหรับข้อความปกติ และ $\ge 3:1$ สำหรับข้อความขนาดใหญ่หรือ Badge)
2. **Keyboard Navigation:** ทุกปุ่ม Dropdown และช่องกรอกข้อมูลสามารถใช้งานผ่านปุ่ม `Tab`, `Enter`, และ `Spacebar` ได้ พร้อมแสดง Focus Ring ชัดเจนเสมอ
3. **Form Accessibility:** ทุก Input ต้องมี `<label>` ผูกกับ `id` ของฟิลด์อย่างถูกต้อง และมี `aria-required="true"` สำหรับฟิลด์ที่บังคับ
4. **Icon Controls:** ปุ่มที่มีเฉพาะไอคอน (เช่น ปุ่มลบไฟล์) ต้องมี `aria-label` และ Tooltip อธิบายหน้าที่ของปุ่มเสมอ

---

## 7. Screenshot Paths Reference

สำหรับการบันทึกภาพหลักฐานการทดสอบ UI ตามข้อกำหนดการส่งมอบงาน (Submission Artifacts):

* **Create Ticket Screenshots:** `artifacts/lab-02/screenshots/create-ticket/`
  * ภาพหน้าจอ Initial State, Validation Failure, Busy Submitting State, Success State, และ Invalid Attachment State
* **My Tickets Screenshots:** `artifacts/lab-02/screenshots/my-tickets/`
  * ภาพหน้าจอ Desktop Table, Search & Filtered, Multi-Requester Isolation, Pagination, Empty State, และ No-Results State
* **Ticket Detail & Attachments Screenshots:** `artifacts/lab-02/screenshots/ticket-detail/`
  * ภาพหน้าจอ Read-only Info Card, Download Active File, Post-Creation Upload, Soft Removal Modal with Reason, และ Blocked Removed Download State
* **Responsive Layouts Screenshots:** `artifacts/lab-02/screenshots/` (Desktop, Tablet, Mobile)
