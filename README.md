# TokTickIT

## Prerequisites
- Node.js
- Docker Desktop (for PostgreSQL)

## Setup Instructions

### 1. Database Setup
สร้างฐานข้อมูล PostgreSQL ของคุณ

### 2. สร้าง .env
client
- ก็อปปี้ไฟล์ .env.example แล้วเปลี่ยนชื่อเป็น .env

server
- ก็อปปี้ไฟล์ .env.example แล้วเปลี่ยนชื่อเป็น .env
- แล้วแก้ค่า DATABASE_URL ให้เป็นของคุณ

### 3. เตรียมฐานข้อมูล (Database Migration & Seeding)
เปิด terminal ใหม่ เข้าไปที่โฟลเดอร์ server
```bash
cd server
npm install
npx prisma migrate dev
npx prisma db seed
```
*(จะทำการสร้างตาราง Category และใส่ข้อมูลเริ่มต้น 4 รายการ)*

สามารถดูข้อมูลได้โดย
```bash
npx prisma studio
```
แล้วจะเข้าหน้าเว็บให้ทันที

### 4. การรัน Backend (Server)
เปิด terminal ใหม่
```bash
cd server
npm install
npm run dev
```

สำหรับทดสอบ backend
```bash
cd server
npm install
npm test
```
### 5. การรัน Frontend (Client)
เปิด terminal ใหม่
```bash
cd client
npm install
npm run dev
```

### 6. เข้าใช้งาน
เข้าใช้งานผ่าน http://localhost:5173/