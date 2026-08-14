# Lab 1 — AI Use and Reflection  (fill this in)

**LLM/agent used:** Google Gemini 3.1 Pro with a thinking 
level of Low.  (via Antigravity IDE)

## Selected key prompts (6–10)

### 1. คำสั่ง Git พื้นฐาน (Push & Pull)
**Prompt:** "คุณช่วยอธิบาย และบอกคำสั่งในการส่งโค้ดชุดใหม่ขึ้น github และดึงโค้ดชุดใหม่ มาลงที่เครื่องของเรา"
**My reflection:** ผมได้เรียนรู้ถึงขั้นตอนที่ถูกต้องในการ push และ pull โค้ดขึ้น github

### 2. Project Setup
**Prompt:** "จากโครงสร้างโปรเจกต์ React+Express ไฟล์ไหนที่ต้อง import bootstrap บ้าง และฝั่ง server ต้องตั้งค่า .env สำหรับต่อ PostgreSQL อย่างไร"
**My reflection:** การให้ AI ช่วยวิเคราะห์โครงสร้างโปรเจกต์ ทำให้ผมได้เรียนรู้วิธีการวางโครงสร้างไฟล์ที่ถูกต้อง และประหยัดเวลาในการเริ่มงานตั้งต้นได้มาก

### 3. สร้าง API เบื้องต้น
**Prompt:** "จะเขียน API route `GET /api/health` ให้คืนค่า HTTP 200 พร้อมกับ JSON { status: 'ok', service: 'TokTickIT API' } ต้องใส่โค้ดในไฟล์ app.ts อย่างไร"
**My reflection:** ผมได้เรียนรู้ว่า AI สามารถสร้างโค้ดพื้นฐานได้อย่างรวดเร็วและแม่นยำ ซึ่งช่วยลดข้อผิดพลาดจาก human error ได้ แต่ก็ต้องมีการตรวจสอบความถูกต้องเสมอ

### 4. การแก้ปัญหาและตรวจสอบบั๊ก
**Prompt:** "หน้า React กด checkSystem() แล้วขึ้น Unable to connect to TokTickIT API คุณลองเช็คให้หน่อยว่ามีบั๊กเกิดขึ้นตรงไหน"
**My reflection:** ผมได้เรียนรู้ว่าเราต้องตรวจสอบงานของเราทุกครั้ง เนื่องจาก AI มีโอกาสที่จะวิเคราะห์ผิดพลาดได้

### 5. การจัดการฐานข้อมูล (Prisma Upsert)
**Prompt:** "ใน Prisma จะเขียนคำสั่งใน `seed.ts` ด้วย `upsert` เพื่อแทรกข้อมูล Category 4 อย่าง (Account, Hardware, Software, Network) โดยไม่ให้เกิดข้อมูลซ้ำได้อย่างไร"
**My reflection:** ผมได้เรียนรู้เทคนิคการเขียนโค้ดให้สั้นและอ่านง่ายขึ้น โดยนำ Loop มาประยุกต์ใช้กับคำสั่ง upsert ตามคำแนะนำของ AI แทนการเขียนโค้ดซ้ำๆ กัน

### 6. การแสดงผลข้อมูลลงหน้าเว็บ (React Render List)
**Prompt:** "เราจะเอา Response JSON (Array ของ Categories) ที่ได้จาก API ไปวนลูปแสดงผลเป็น `<li>` บนหน้าจอ React (`App.tsx`) อย่างไร"
**My reflection:** การถามแบบเจาะจงปัญหาส่วนเดียว ทำให้ผมได้เรียนรู้วิธีประยุกต์ใช้ฟังก์ชัน `.map()` ในการนำข้อมูลจาก API มาแสดงผลบน React ได้ดียิ่งขึ้น
