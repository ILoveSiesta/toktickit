# TokTickIT - IT Service Ticketing System

**Lab 3: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens**

TokTickIT เป็นระบบจัดการและรับเรื่องแจ้งปัญหาบริการเทคโนโลยีสารสนเทศ (IT Service Desk) สำหรับองค์กร พัฒนาโดยมุ่งเน้นสถาปัตยกรรมที่สะอาด ปลอดภัย และยึดหลัก **Zen Green Design Language**

---

## Prerequisites

- **Node.js:** v18 หรือใหม่กว่า (แนะนำ Node.js LTS)
- **Docker Desktop:** สำหรับรันฐานข้อมูล PostgreSQL
- **Git**

---

## Setup Instructions

### 1. Database Setup (PostgreSQL)
เริ่มต้นรัน PostgreSQL container ผ่าน Docker หรือใช้ PostgreSQL instance ในเครื่องของคุณ

### Environment Variables Configuration (`.env`)

#### Server Configuration
สร้างไฟล์ `server/.env` โดยคัดลอกและปรับแก้จากไฟล์ `server/.env.example` (ห้าม Commit ไฟล์ .env ขึ้น Git เด็ดขาด)

#### Client Configuration
สร้างไฟล์ `client/.env` โดยคัดลอกและปรับแก้จากไฟล์ `client/.env.example`

### Database Migration & Idempotent Seeding
รันคำสั่ง Migration และ Seed ข้อมูลตั้งต้นสำหรับ Lab 3 (Categories, Related Systems, และบัญชีผู้ใช้จริงสำหรับ Requester, IT Staff, และ Administrator ทั้งแบบ Active/Inactive):
```bash
# ติดตั้ง Dependencies และรัน Prisma Migration & Seed
npm install
npm install --prefix server
npm install --prefix client
npm run prisma:deploy --prefix server
npm run prisma:seed --prefix server
```

*(สามารถเปิดตรวจสอบข้อมูลในฐานข้อมูลได้ด้วยคำสั่ง `npx prisma studio --schema server/prisma/schema.prisma`)*

---

## Running the Application

### Start Backend Server (Port 3000)
```bash
npm run dev --prefix server
```
*API Base URL: `http://localhost:3000/api`*

### Start Frontend Client (Port 5173)
```bash
npm run dev --prefix client
```
*Web Application URL: `http://localhost:5173`*

---

## Default User Accounts (บัญชีผู้ใช้สำหรับการทดสอบ)

ข้อมูลบัญชีผู้ใช้ตั้งต้น (Seed Data) สำหรับการเข้าสู่ระบบและทดสอบแต่ละสิทธิ์ (Role):

| Role | ชื่อ (Name) | Email | Password | สถานะ (Status) | หมายเหตุ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator** | John Smith | `admin@toktickit.com` | `TokTickIT2026!` | Active | ผู้ดูแลระบบ จัดการผู้ใช้และระบบทั้งหมด |
| **IT Staff** | Alex Thompson | `alex.staff@toktickit.com` | `TokTickIT2026!` | Active | เจ้าหน้าที่ IT รับเรื่องและจัดการตั๋ว |
| **IT Staff** | Lisa Martinez | `lisa.staff@toktickit.com` | `TokTickIT2026!` | Active | เจ้าหน้าที่ IT รับเรื่องและจัดการตั๋ว |
| **IT Staff** | Kevin Patel | `kevin.staff@toktickit.com` | `TokTickIT2026!` | Active | **ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก** (`mustChangePassword: true`) |
| **IT Staff** | Robert Wilson | `robert.inactive@toktickit.com` | `TokTickIT2026!` | Inactive | บัญชีถูกปิดการใช้งาน (สำหรับทดสอบปฏิเสธการล็อกอิน) |
| **Requester** | Jennifer Anderson | `jennifer@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป แจ้งเรื่องและติดตามสถานะตั๋ว |
| **Requester** | Michael Brown | `michael@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป แจ้งเรื่องและติดตามสถานะตั๋ว |
| **Requester** | Sarah Johnson | `sarah@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป แจ้งเรื่องและติดตามสถานะตั๋ว |
| **Requester** | David Lee | `david@toktick.it` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป แจ้งเรื่องและติดตามสถานะตั๋ว |
| **Requester** | Amanda Clark | `amanda.clark@toktickit.com` | `TokTickIT2026!` | Active | ผู้ใช้งานทั่วไป แจ้งเรื่องและติดตามสถานะตั๋ว |
| **Requester** | Alex Inactive | `alex.inactive@toktick.it` | `TokTickIT2026!` | Inactive | บัญชีถูกปิดการใช้งาน (สำหรับทดสอบปฏิเสธการล็อกอิน) |

> **หมายเหตุเพิ่มเติมเกี่ยวกับการเปลี่ยนรหัสผ่าน:**
> - สำหรับบัญชี **Kevin Patel** (`kevin.staff@toktickit.com`) ระบบได้ตั้งค่า `mustChangePassword: true` ไว้ ทำให้เมื่อเข้าสู่ระบบสำเร็จ จะถูกบังคับเปลี่ยนรหัสผ่านทันทีก่อนเข้าใช้งานส่วนอื่น


---

## Testing Suites

โปรเจกต์รองรับการทดสอบครบ 5 ระดับ (Unit, API Integration, UI Component, Responsive Visual, และ E2E):

### 1. Run Unit & Component Tests
```bash
npm test
```

### 2. Run End-to-End & Responsive Visual Tests (Playwright)
```bash
npm run test:e2e
```