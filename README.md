# TokTickIT - IT Service Ticketing System

**Lab 2: Requester Ticketing MVP with UI Foundation & Zen Green Theme**

TokTickIT เป็นระบบจัดการและรับเรื่องแจ้งปัญหาบริการเทคโนโลยีสารสนเทศ (IT Service Desk) สำหรับองค์กร พัฒนาโดยมุ่งเน้นสถาปัตยกรรมที่สะอาด ปลอดภัย และยึดหลัก **Zen Green Design Language**

---

## Prerequisites

- **Node.js:** v18 หรือใหม่กว่า (แนะนำ Node.js LTS)
- **Docker Desktop:** สำหรับรันฐานข้อมูล PostgreSQL
- **Git**

---

## Setup Instructions

### 1. Database Setup (PostgreSQL)
เริ่มต้นรัน PostgreSQL container ผ่าน Docker หรือใช้ PostgreSQL instance ในเครื่องของคุณ:
```bash
docker run --name toktickit-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=toktickit -p 5432:5432 -d postgres:16-alpine
```

### Environment Variables Configuration (`.env`)

#### Server Configuration
สร้างไฟล์ `server/.env` โดยคัดลอกและปรับแก้จากไฟล์ `server/.env.example` (ห้าม Commit ไฟล์ .env ขึ้น Git เด็ดขาด)

#### Client Configuration
สร้างไฟล์ `client/.env` โดยคัดลอกและปรับแก้จากไฟล์ `client/.env.example`

### Database Migration & Idempotent Seeding
รันคำสั่ง Migration และ Seed ข้อมูลตั้งต้นสำหรับ Lab 2 (Categories, Related Systems, Development Requesters ทั้ง Active และ Inactive):
```bash
# ติดตั้ง Dependencies และรัน Prisma Migration & Seed
npm install --prefix server
npm run prisma:migrate --prefix server
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

## Testing Suites

โปรเจกต์รองรับการทดสอบครบ 5 ระดับ (Unit, API Integration, UI Component, Responsive Visual, และ E2E):

### 1. Run Unit & Component Tests
```bash
# รัน Unit Tests และ API Tests ของ Server ทั้งหมด
npm run test --prefix server

# รัน Component & UI Tests ของ Client ทั้งหมด
npm run test --prefix client

# หรือรันทั้ง Server และ Client พร้อมกันจาก Root
npm test
```
**หมายเหตุ:** เทสต์ของ Lab 1 (tests/lab-01/App.test.tsx) จะแสดงผล Failed 2 ข้อ เนื่องจากหน้าจอของ Lab 2 ได้ถูกพัฒนาเป็นระบบ Ticketing Portal จึงไม่มีปุ่ม Check System เก่าแล้ว

### 2. Run End-to-End & Responsive Visual Tests (Playwright)
```bash
# รัน E2E Tests และถ่ายภาพ Responsive Screenshots ทั้งหมด
npm run test:e2e

# รัน E2E Tests พร้อมเปิด Playwright Interactive UI
npm run test:e2e:ui

# รันการทดสอบทั้งหมดของระบบแบบครบวงจร (Server + Client + Playwright E2E)
npm run test:all
```