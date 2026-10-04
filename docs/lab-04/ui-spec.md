# TokTickIT UI Specification (Zen Green Theme)
**Lab 4 Actions Taken, Dashboards, and UI Hardening**

---

## 1. Design System & Zen Green Theme Continuity

ระบบส่วนต่อประสานผู้ใช้ใน Sprint 4 ต่อยอดจากระบบดีไซน์ **Zen Green Design Language** ที่พัฒนาขึ้นใน Lab 2 และ 3 โดยเน้นความสะอาด สบายตา เรียบหรู ชัดเจน และสอดคล้องกันทั่วทั้งระบบ

### 1.1. Color Tokens Palette

| Token Name | CSS Variable | Hex Code | Purpose & Usage Description |
| :--- | :--- | :--- | :--- |
| **Primary Green** | `--color-primary-green` | `#006B3C` | แถบ Header หลัก, ปุ่มบันทึกหลัก, Active navigation indicator |
| **Secondary Green** | `--color-secondary-green` | `#0B7A46` | ปุ่ม Hover state, Checkmark สำเร็จ, ลิงก์ที่คลิกได้ |
| **Pale Green** | `--color-pale-green` | `#EAF6EF` | แถบไฮไลต์แถวที่เลือก, พื้นหลัง Badge สถานะบางประเภท |
| **Page Background** | `--color-page-bg` | `#F5F7F6` | พื้นหลังของทุกหน้าจอ (Quiet near-white canvas) |
| **Surface / Card** | `--color-surface` | `#FFFFFF` | การ์ด Dashboard, กล่องฟอร์ม, ตาราง มีขอบมน `border-radius: 8px` |
| **Text Primary** | `--color-text-primary` | `#1A2E26` | ตัวอักษรหลัก Dark charcoal-green เพื่อความคมชัดและสบายตา |
| **Text Muted** | `--color-text-muted` | `#5F756B` | ตัวอักษรคำอธิบายย่อย, Timestamp, หน่วยนับ |
| **Border Neutral** | `--color-border-neutral` | `#CBD5E1` | เส้นขอบ Input และเส้นแบ่งคอลัมน์ตาราง |
| **Field Editable** | `--color-field-editable` | `#FFFFFF` | พื้นหลังช่องกรอกข้อมูลที่แก้ไขได้ |
| **Field Read-Only** | `--color-field-readonly` | `#F1F5F3` | พื้นหลังช่องอ่านอย่างเดียว เฉด Soft Gray-Green ป้องกันความสับสน |
| **Follow-up Amber** | `--color-followup-bg` | `#FEF3C7` | พื้นหลังป้ายเตือน "Follow-up Required" |
| **Follow-up Text** | `--color-followup-text` | `#B45309` | ตัวอักษรป้ายเตือน "Follow-up Required" |
| **Advisory Banner** | `--color-advisory-bg` | `#EFF6FF` | พื้นหลังกล่องแจ้งเตือน Requester Indicated Resolution |
| **Advisory Text** | `--color-advisory-text` | `#1E40AF` | ตัวอักษรกล่องแจ้งเตือน Requester Indicated Resolution |

---

## 2. Application Shell & Navigation

แถบ Navigation Bar ด้านบนของแอปพลิเคชันจะแสดงเมนูตามบทบาทจริงของผู้ใช้ พร้อม **Active Indicator** ใต้เมนูที่กำลังเปิดอยู่:

* **Requester:** `[Dashboard]` | `[My Tickets]` | `[Create Ticket]` | `[Profile Menu]`
* **IT Staff:** `[Dashboard]` | `[My Queue]` | `[Profile Menu]`
* **Administrator:** `[Dashboard]` | `[My Queue]` | `[Admin]` | `[Profile Menu]`

---

## 3. Screen Specifications

### 3.1. Screen 1: IT Staff Dashboard
* **Business Time Zone:** `Asia/Bangkok (UTC+7)` (รอบการคำนวณวัน 00:00:00 - 23:59:59)

```text
+---------------------------------------------------------------------------------------------------+
| [TikTokIT]    [Dashboard (Active)]    [My Queue]                                 [Michael (Staff) v] |
+---------------------------------------------------------------------------------------------------+
| Welcome back, Michael!                                                           [ Refresh Data ] |
| Here is what is happening with your queue today.                                                  |
|                                                                                                   |
| +-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+               |
| | Unassigned| | New       | | Open      | |In Progress| |Waiting Req| |My Assigned|               |
| | 12        | | 14        | | 23        | | 18        | | 7         | | 16        |  Metric Cards |
| | +3 yest   | | +2 yest   | | -1 yest   | | +4 yest   | | = yest    | | +1 yest   |               |
| +-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+               |
|                                                                                                   |
| +---------------------------------------------------------+ +-----------------------------------+ |
| | My Recent Tickets                              View all | | Quick Actions                     | |
| |---------------------------------------------------------| |-----------------------------------| |
| | TKT-2026-001234  Laptop battery drain  [In Prog]  09:14 | | [+] Create Ticket                 | |
| | TKT-2026-001230  Printer offline       [Open]     08:12 | | [Q] Search Tickets                | |
| | TKT-2026-001228  Outlook freezing      [Open]     May 6 | | [=] My Queue                      | |
| | TKT-2026-001223  Phone not ringing     [Open]     May 5 | |-----------------------------------| |
| | TKT-2026-001115  VPN disconnects       [Resolv]   May 4 | | Priority Distribution             | |
| |                                                         | | Critical: 3  High: 8              | |
| |                                                         | | Medium: 25   Low: 19              | |
| +---------------------------------------------------------+ +-----------------------------------+ |
+---------------------------------------------------------------------------------------------------+
```

* **Interactive Drill-down:**
  - คลิกการ์ด `Unassigned` $\to$ นำทางไปยัง `/tickets?assigned=unassigned` (แสดงเฉพาะตั๋วที่ยังไม่มีผู้รับผิดชอบ)
  - คลิกการ์ด `New` $\to$ นำทางไปยัง `/tickets?status=NEW`
  - คลิกการ์ด `Open` $\to$ นำทางไปยัง `/tickets?status=OPEN`
  - คลิกการ์ด `In Progress` $\to$ นำทางไปยัง `/tickets?status=IN_PROGRESS`
  - คลิกการ์ด `Waiting Req` $\to$ นำทางไปยัง `/tickets?status=WAITING_FOR_REQUESTER`
  - คลิกการ์ด `My Assigned` $\to$ นำทางไปยัง `/tickets?assigned=me`

---

### 3.2. Screen 2: Requester Dashboard
* **Business Time Zone:** `Asia/Bangkok (UTC+7)` (รอบการคำนวณวัน 00:00:00 - 23:59:59)

```text
+---------------------------------------------------------------------------------------------------+
| [TikTokIT]    [Dashboard (Active)]    [My Tickets]    [Create Ticket]           [Jennifer (Req) v] |
+---------------------------------------------------------------------------------------------------+
| Welcome, Jennifer!                                                                                |
| Here is the latest on your support requests.                                                      |
|                                                                                                   |
| +---------------+ +---------------+ +---------------+ +---------------+ +---------------+         |
| |My Open Tickets| |In Progress    | |Waiting for You| |Recent Resolved| |Closed         |         |
| | 3             | | 2             | | 1             | | 5 (Last 30d)  | | 12            |  Cards  |
| | [View all ->] | | [View all ->] | | [View all ->] | | [View all ->] | | [View all ->] |         |
| +---------------+ +---------------+ +---------------+ +---------------+ +---------------+         |
|                                                                                                   |
| +---------------------------------------------------------+ +-----------------------------------+ |
| | My Recent Tickets                              View all | | Quick Actions                     | |
| |---------------------------------------------------------| |-----------------------------------| |
| | TKT-2026-001234  Laptop battery drain  [In Prog]  09:14 | | [+] Create Ticket                 | |
| | TKT-2026-001222  Request Figma access  [Resolv]   May 11| |     Submit a new request          | |
| | TKT-2026-001213  Need new monitor      [Open]     May 9 | |-----------------------------------| |
| | TKT-2026-001005  Email not syncing     [Resolv]   May 7 | | [=] View My Tickets               | |
| | TKT-2026-000850  Password reset req    [Closed]   Apr 30| |     Track existing                | |
| +---------------------------------------------------------+ +-----------------------------------+ |
+---------------------------------------------------------------------------------------------------+
```

* **Interactive Drill-down:**
  - คลิกการ์ด `My Open Tickets` $\to$ นำทางไปยัง `/my-tickets?status=OPEN_GROUP`
  - คลิกการ์ด `In Progress` $\to$ นำทางไปยัง `/my-tickets?status=IN_PROGRESS`
  - คลิกการ์ด `Waiting for You` $\to$ นำทางไปยัง `/my-tickets?status=WAITING_FOR_REQUESTER`
  - คลิกการ์ด `Recent Resolved` $\to$ นำทางไปยัง `/my-tickets?status=RESOLVED&recent=true`
  - คลิกการ์ด `Closed` $\to$ นำทางไปยัง `/my-tickets?status=CLOSED`

---

### 3.3. Screen 3: Actions Taken Section บน Ticket Detail

เพิ่มส่วน **Actions Taken** ในหน้า Ticket Detail ต่อจากส่วนรายละเอียดตั๋วหลัก:

```text
+-----------------------------------------------------------------------------------------+
| Actions Taken                                                   [ + Add Action Taken ]  |
+-----------------------------------------------------------------------------------------+
| Date / Time         Performed By    Description        Result          Follow-up   Notes|
|-----------------------------------------------------------------------------------------|
| Oct 4, 2026 10:30   Michael Chang   Replaced PSU cap   System booted   [Follow-up] [Img]|
|                     (IT Staff)      and stress tested  normally        Note: Check      |
|                                                                        temp in 24h      |
|-----------------------------------------------------------------------------------------|
| Oct 4, 2026 09:15   David Miller    Diagnosed motherboard Power drop   [None]      --   |
|                     (IT Staff)      voltage rails      on rail 12V                      |
+-----------------------------------------------------------------------------------------+
```

* **Modal / Inline Create & Edit Form:**
  - **Action Date / Time:** Default เป็นเวลาปัจจุบัน สามารถปรับเลือกได้
  - **Performed By:** Auto-filled ด้วยชื่อและบทบาทของผู้ใช้ที่ล็อกอินอยู่ (Disabled/Read-only)
  - **Action Description (Required):** Textarea อธิบายรายละเอียดสิ่งที่ได้ทำลงไป
  - **Result (Required):** Textarea อธิบายผลลัพธ์ที่ได้รับ
  - **Follow-up Required (Checkbox):** สวิตช์/กล่องติ๊กเลือก
  - **Follow-up Note (Conditional Required):** แสดงเมื่อติ๊กถูก และบังคับกรอก (มีเครื่องหมายดอกจันสีแดง `*`)
  - **Attachment Notes (Optional):** ช่องกรอกระบุชื่อไฟล์ ภาพ หรือเอกสารอ้างอิง
  - **Buttons:** `[Cancel]` และ `[Save Action Taken]` (มี Debounce ป้องกัน Double Submit)
* **Requester View:**
  - แสดงตารางข้อมูล Actions Taken ครบทุกแถวเหมือนกัน
  - ซ่อนปุ่ม `[+ Add Action Taken]` และปุ่ม `[Edit]` โดยสิ้นเชิง

---

### 3.4. Screen 4: Ticket Workflow Controls & Resolution Advisory

* **Resolution Advisory Notice:**
  - เมื่อ Requester กด "Problem Appears Resolved" จะแสดงกล่องข้อความเด่นชัดสีฟ้าอ่อนด้านบนของส่วนควบคุมสถานะ:
  > ℹ️ **Requester indicated this issue appears resolved.**
  > *Jennifer Anderson reported that the issue seems solved on Oct 4, 2026 at 11:00 AM. Please verify the recorded Actions Taken and formally transition status to Resolved.*
* **Status Dropdown / Actions:**
  - แสดงเฉพาะสถานะปลายทางที่อนุญาตตามบทบาท (เช่น จาก `IN_PROGRESS` จะแสดงเฉพาะ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`)
  - ปุ่ม Confirm เปลี่ยนสถานะจะปิดการทำงาน (Disable) ชั่วคราวขณะกำลังส่งคำขอไปยัง API เพื่อป้องกันการส่งซ้ำ

---

## 4. UI States & Safe Failure Specifications

1. **Loading State:** แสดง Skeleton Placeholder ในตำแหน่งของการ์ด Metric และแถวในตาราง Actions Taken พร้อมตัวหมุน Spinner สีเขียว
2. **Empty State:**
   - เมื่อ Metric Count เป็น 0: แสดงตัวเลข `0` สีเทา พร้อมข้อความกำกับ
   - เมื่อ Recent Tickets ว่างเปล่า: แสดงกล่องข้อความสีจาง *"No recent tickets to display."*
   - เมื่อตั๋วยังไม่มี Actions Taken: แสดงแถวว่างในตาราง *"No actions taken recorded yet. Click '+ Add Action Taken' to log work."* (สำหรับ Requester แสดง *"No actions taken recorded yet."*)
3. **Forbidden State (403):** แสดง Callout สีแดงอ่อน *"You do not have permission to view or modify this resource."*
4. **Safe Failure:**
   - หากเซิร์ฟเวอร์ตอบกลับ Error ในการบันทึก Action Taken ฟอร์มจะแสดง Error Banner ด้านบน และ**คงข้อมูลที่ผู้ใช้พิมพ์ไว้ทั้งหมด**ในช่อง Input/Textarea โดยไม่รีเซ็ตฟอร์ม

---

## 5. Responsive Design Breakpoints

| Breakpoint | Window Width | Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop** | $\ge 1024\text{px}$ | Dashboard Metric Cards เรียง 4-5 คอลัมน์แนวนอน, Recent Tickets และ Quick Actions แบ่งสัดส่วน 70:30, ตาราง Actions Taken แสดงครบทุกคอลัมน์ |
| **Tablet** | $768\text{px} - 1023\text{px}$ | Dashboard Metric Cards เรียงเป็นตาราง 2 คอลัมน์, Recent Tickets และ Quick Actions ซ้อนกันแนวตั้ง, ตาราง Actions Taken ตัดคอลัมน์ที่ไม่จำเป็นและอนุญาต Scroll แนวนอนเฉพาะตาราง |
| **Mobile** | $< 768\text{px}$ (min 375px) | Dashboard Metric Cards เรียงแถวละ 1 ใบ, การ์ดมีขนาดเต็มหน้าจอ (Full width), ตาราง Actions Taken เปลี่ยนรูปแบบเป็น Card Stack List เพื่อให้อ่านง่ายโดยไม่ต้องเลื่อนหน้าจอแนวนอน |

---

## 6. Accessibility & Usability Checklist (WCAG 2.1 AA)

- [x] **Keyboard Navigation:** สามารถกด `Tab` วนผ่านการ์ด Metric, ปุ่ม Quick Action, ปุ่ม Add Action, และฟอร์มได้อย่างราบรื่น
- [x] **Visible Focus Indicator:** ทุก Interactive Element มีกรอบ Focus Outline สีเขียว `--color-primary-green` ชัดเจน (`outline: 2px solid #006B3C; outline-offset: 2px;`)
- [x] **Color Contrast Ratio:** อัตราส่วนความคมชัดระหว่างตัวอักษรกับพื้นหลังมากกว่า $4.5:1$ สำหรับข้อความปกติ และ $3:1$ สำหรับข้อความขนาดใหญ่
- [x] **Non-Color Status Cues:** ทุกสถานะและระดับ Priority มีข้อความกำกับ (Text label) และไอคอนร่วมเสมอ ไม่พึ่งพาการสื่อความหมายด้วยสีเพียงอย่างเดียว
- [x] **ARIA Labels:** ใส่ `aria-label`, `aria-expanded`, และ `aria-required` ใน Input, Modal, และปุ่มกดอย่างครบถ้วน
- [x] **No Horizontal Overflow:** รับประกันว่าจะไม่เกิด Horizontal Scrollbar บนหน้าจอมือถือความกว้าง 375px ขึ้นไป
