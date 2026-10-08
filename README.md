# TokTickIT - IT Service Ticketing System

**Lab 4: TokTickIT Actions Taken, Ticket Resolution Workflow, and Role-Based Dashboards**

TokTickIT เป็นระบบจัดการและรับเรื่องแจ้งปัญหาบริการเทคโนโลยีสารสนเทศ (IT Service Desk) สำหรับองค์กร พัฒนาโดยมุ่งเน้นสถาปัตยกรรมที่สะอาด ปลอดภัย ยึดหลัก **Zen Green Design Language** และผ่านเกณฑ์การเข้าถึง **WCAG 2.1 AA**

---

## ฟีเจอร์หลักใน Lab 4 (Key Features)

1. **Actions Taken Lifecycle:**
   - บันทึกการดำเนินการแก้ไขปัญหาของ IT Staff พร้อมระบุวันที่/เวลา, ผู้บันทึก, ประเภทการกระทำ, รายละเอียด และสถานะ Follow-up Needed พร้อมเหตุผล
   - ระบบตรวจสอบความถูกต้อง (Validation): หากติ๊ก Follow-up Needed ต้องระบุเหตุผลไม่ต่ำกว่า 5 ตัวอักษร
   - IT Staff สามารถแก้ไข Action ล่าสุดได้ (Edit Action)
   - หน้าจอตั๋วของผู้ใช้ (Requester) แสดงตาราง Actions Taken เป็นแบบอ่านอย่างเดียว (Read-only) โดยซ่อนปุ่มเพิ่ม/แก้ไข
2. **Ticket Resolution Lifecycle & Guardrails:**
   - ผู้แจ้ง (Requester) สามารถกดปุ่ม *"Problem Appears Resolved"* เพื่อส่งสัญญาณแจ้งเตือน (Advisory Indication) โดยสถานะตั๋วจะยังไม่เปลี่ยนเป็น RESOLVED โดยอัตโนมัติ
   - IT Staff จะเห็นแบนเนอร์แจ้งเตือนคำขอปิดงานของ Requester บนหน้าจอ Staff Ticket Detail
   - การเปลี่ยนสถานะตั๋วเป็น `RESOLVED` มีเงื่อนไขบังคับ (Pre-requisites): ตั๋วต้องอยู่ในสถานะ `ASSIGNED` หรือ `IN_PROGRESS` และต้องมีการบันทึก Actions Taken อย่างน้อย 1 รายการ
   - สถานะ `CLOSED` เป็นสถานะสิ้นสุด (Terminal State): เมื่อตั๋วปิดแล้ว ฟอร์มบันทึก Action และปุ่มควบคุมการเปลี่ยนสถานะจะถูกปิดการทำงาน (Disabled)
3. **Role-Tailored Operational Dashboards:**
   - **Requester Dashboard (`/dashboard`):** แสดงตัวชี้วัด 5 การ์ด (My Open Tickets, Awaiting Staff, Resolved, Closed, Total Tickets) พร้อมปุ่ม Quick Ticket Creation, รายการตั๋วที่กำลังดำเนินการ และ Drill-down filters ไปยัง My Tickets
   - **IT Staff Dashboard (`/dashboard`):** แสดงตัวชี้วัด 6 การ์ด (Unassigned, In Progress, Pending User, Resolved Today, High/Urgent, Total Active Queue), กราฟแนวโน้มการแก้ไขปัญหา 14 วัน (14-day Resolution Trend), แผนภูมิการกระจายตัวตามความเร่งด่วน (Priority Distribution), ตาราง Recent Active Tickets และ Interactive Drill-down filters ไปยัง Queue
   - **Administrator Summary:** แสดงข้อมูลสรุปสถิติผู้ใช้งานและระบบ
4. **Responsive Visual Integrity & Accessibility:**
   - รองรับการแสดงผลสมบูรณ์แบบบน Desktop (1280px), Tablet (820px) และ Mobile (375px) โดยไม่มีปัญหา Horizontal Scrollbar (Zero horizontal overflow)

---

## ข้อกำหนดเบื้องต้น (Prerequisites)

- **Node.js:** v18 หรือใหม่กว่า (แนะนำ Node.js LTS)
- **Docker Desktop:** สำหรับรันฐานข้อมูล PostgreSQL
- **Git**

---

## ขั้นตอนการติดตั้งและเตรียมระบบ (Setup & Migration)

### 1. Database Setup (PostgreSQL)
เริ่มต้นรัน PostgreSQL container หรือใช้งาน PostgreSQL instance ที่พร้อมใช้งาน

### 2. Environment Variables Configuration (`.env`)
- **Server:** ตรวจสอบและกำหนดค่าใน `server/.env` (คัดลอกตัวอย่างจาก `server/.env.example`)
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit?schema=public"
  JWT_SECRET="toktickit_super_secret_jwt_key_2026"
  PORT=3000
  ```
- **Client:** ตรวจสอบค่าใน `client/.env` (คัดลอกตัวอย่างจาก `client/.env.example`)
  ```env
  VITE_API_URL="http://localhost:3000/api"
  ```

### 3. Database Migration & Idempotent Seeding
รันคำสั่งติดตั้ง Dependencies, Migration Schema และ Seed ข้อมูลตั้งต้นสำหรับ Lab 4:
```bash
# ติดตั้ง Dependencies
npm install
npm install --prefix server
npm install --prefix client

# รัน Migration และ Idempotent Seed
npm run prisma:deploy --prefix server
npm run prisma:seed --prefix server
```
*(สามารถเปิดตรวจสอบข้อมูลผ่าน Prisma Studio: `npx prisma studio --schema server/prisma/schema.prisma`)*

---

## การเปิดรันระบบ (Running the Application)

### รัน Backend Server (Port 3000)
```bash
npm run dev --prefix server
```
*API Base URL: `http://localhost:3000/api`*

### รัน Frontend Client (Port 5173)
```bash
npm run dev --prefix client
```
*Web Application URL: `http://localhost:5173`*

---

## บัญชีผู้ใช้สำหรับการทดสอบ (Default Seed Accounts)

| Role | ชื่อ (Name) | Email | Password | สถานะ (Status) | หน้าที่และความรับผิดชอบ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator** | John Smith | `admin@toktickit.com` | `TokTickIT2026!` | Active | ผู้ดูแลระบบ จัดการบัญชีผู้ใช้และตรวจสอบภาพรวม |
| **IT Staff** | Alex Thompson | `alex.staff@toktickit.com` | `TokTickIT2026!` | Active | เจ้าหน้าที่ IT จัดการคิวงาน บันทึกการแก้ไข และเปลี่ยนสถานะตั๋ว |
| **IT Staff** | Lisa Martinez | `lisa.staff@toktickit.com` | `TokTickIT2026!` | Active | เจ้าหน้าที่ IT ประจำทีม |
| **IT Staff** | Kevin Patel | `kevin.staff@toktickit.com` | `TokTickIT2026!` | Active | บัญชีทดสอบการบังคับเปลี่ยนรหัสผ่านครั้งแรก (`mustChangePassword: true`) |
| **Requester** | Jennifer Anderson | `jennifer@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป แจ้งเรื่อง ดู Dashboard และส่งสัญญาณแจ้งปัญหาคลี่คลาย |
| **Requester** | Michael Brown | `michael@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป |
| **Requester** | Sarah Johnson | `sarah@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป |

---

## ขั้นตอนการทดสอบฟีเจอร์ Lab 4 (Step-by-Step Feature Demonstration)

### Demo 1: Actions Taken Lifecycle & Validation
1. เข้าสู่ระบบด้วยบัญชี IT Staff (`alex.staff@toktickit.com` / `TokTickIT2026!`)
2. เข้าเมนู **Ticket Queue** เลือกตั๋ว `TKT-2026-000101`
3. เลื่อนลงไปที่ส่วน **Actions Taken** คลิกปุ่ม **"Add Action"**
4. ทดสอบ Validation: ติ๊กเช็คถูก *"Follow-up needed"* แต่เว้นช่องรายละเอียดไว้ -> กดบันทึก -> ระบบจะแจ้งเตือนว่าต้องระบุเหตุผลอย่างน้อย 5 ตัวอักษร
5. กรอกรายละเอียดการดำเนินการและเหตุผล follow-up ให้ครบถ้วน -> กดบันทึก -> รายการจะปรากฏบนตารางทันที
6. คลิกปุ่ม **"Edit"** ที่ Action เพื่อแก้ไขรายละเอียด -> กดบันทึก
7. สลับเข้าสู่ระบบด้วยบัญชี Requester (`jennifer@toktick.it`) แล้วเปิดตั๋วเดียวกัน -> สังเกตว่าตาราง Actions Taken จะแสดงเฉพาะข้อมูลและซ่อนปุ่ม Add/Edit โดยสิ้นเชิง (Read-only)

### Demo 2: Ticket Resolution Workflow & Guardrails
1. เข้าสู่ระบบด้วยบัญชี Requester (`jennifer@toktick.it`) เปิดตั๋วของตนเองที่ยังไม่ปิด
2. คลิกปุ่ม **"Problem Appears Resolved"** -> สังเกตว่าระบบแสดงข้อความยืนยัน แต่สถานะตั๋วจะยังไม่เปลี่ยนเป็น `RESOLVED` (เพื่อรอให้ Staff ตรวจสอบ)
3. เข้าสู่ระบบด้วยบัญชี IT Staff (`alex.staff@toktickit.com`) เปิดตั๋วใบเดียวกัน
4. สังเกตเห็นแถบแจ้งเตือนสีเขียว (Advisory Banner) ระบุว่า *"Requester indicated the problem appears resolved"*
5. เปลี่ยนสถานะตั๋วเป็น **RESOLVED** (ระบบตรวจสอบว่าตั๋วถูก Assigned และมี Actions Taken บันทึกแล้ว จึงอนุญาตให้เปลี่ยนสถานะได้)
6. เปลี่ยนสถานะตั๋วต่อไปเป็น **CLOSED** -> สังเกตว่าสถานะกลายเป็น Terminal State: แถบฟอร์มบันทึก Action และตัวเลือกสถานะจะถูกปิดการใช้งาน (Disabled) ป้องกันการแก้ไขย้อนหลัง

### Demo 3: Role-Appropriate Operational Dashboards
1. **Requester Dashboard:** เข้าสู่ระบบด้วย Requester -> เมนู **Dashboard**
   - ตรวจสอบการ์ดสถิติ 5 ใบ (My Open Tickets, Awaiting Staff, Resolved, Closed, Total)
   - ทดสอบคลิกการ์ด *"My Open Tickets"* -> ระบบจะพาไปหน้า My Tickets พร้อมฟิลเตอร์สถานะที่เกี่ยวข้องโดยอัตโนมัติ
2. **IT Staff Dashboard:** เข้าสู่ระบบด้วย IT Staff -> เมนู **Dashboard**
   - ตรวจสอบการ์ด 6 ใบ (Unassigned, In Progress, Pending User, Resolved Today, High/Urgent, Total Active Queue)
   - ตรวจสอบกราฟ 14-day Resolution Trend และชาร์ตการกระจายตามระดับความสำคัญ (Priority Distribution)
   - ทดสอบคลิกการ์ด *"Unassigned"* หรือ *"My Assigned"* -> ระบบจะเชื่อมต่อไปยังหน้า Ticket Queue พร้อมฟิลเตอร์งานทันทีโดยไม่มีข้อผิดพลาด

---

## ชุดคำสั่งทดสอบระบบ (Testing Suites)

โปรเจกต์รองรับการทดสอบแบบ Automated ครอบคลุมทั้ง Unit, Integration, Responsive Visual และ End-to-End รวมกว่า **269+ Automated Tests** (100% Green Pass Rate):

```bash
# 1. รันการทดสอบ Unit & Integration ทั้งหมด (Server & Client Vitest)
npm test

# 2. รันการทดสอบ E2E และ Responsive Visual ทั้งหมด (Playwright)
npm run test:e2e

# 3. รันเฉพาะชุดการทดสอบ E2E ของ Lab 4
npx playwright test e2e/lab-04/

# 4. รันการทดสอบทั้งหมดของทั้งโปรเจกต์แบบครบวงจร
npm run test:all
```

---

## ภาพหลักฐานการทำงาน (Screenshot Evidence)

หลักฐานรูปภาพการทดสอบสำหรับ Lab 4 ครบถ้วนตาม Part 1 ถึง Part 9 ถูกจัดเก็บไว้ในไดเรกทอรี `artifacts/lab-04/screenshots/`:
- `artifacts/lab-04/screenshots/actions-taken/`: บันทึกการเพิ่ม, ตรวจสอบ validation, การแก้ไข และหน้าต่าง read-only ของ Requester
- `artifacts/lab-04/screenshots/ticket-resolution/`: บันทึกปุ่ม advisory, แบนเนอร์ staff, การเปลี่ยนสถานะ RESOLVED และ CLOSED terminal state
- `artifacts/lab-04/screenshots/dashboards/`: ภาพ Requester Dashboard, Staff Dashboard, Trends, Distribution, Drilldown และ Admin Summary
- `artifacts/lab-04/screenshots/responsive/`: ภาพการแสดงผล Desktop (1280px), Tablet (820px) และ Mobile (375px) แบบ Zero-overflow