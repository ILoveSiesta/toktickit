# Lab 3 — AI Use and Reflection

**LLM/agent used:** Google Gemini 3.8 Flash with a thinking level of High. (via Antigravity IDE)

## Selected key prompts (6–10)

### 1. การแก้ไขปัญหา Database Sequence บน Fresh Database ตาม PR Review (Issue 2)
**Prompt:** "เราได้รับ Request Changes จาก PR Review ของ Issue 2 ขอให้คุณช่วยแก้ไขโค้ดตามคำแนะนำด้านล่างนี้ เพื่อให้การรันบน Fresh Database ทำงานได้ถูกต้อง และ Server Tests กลับมาผ่านทั้งหมด
ปัญหาที่พบ: การทำงานของ migration.sql ในส่วนของการตั้งค่า Sequence ของตาราง users มีปัญหา หากรันบนฐานข้อมูลเปล่า User คนแรกที่ถูกสร้างจาก Seed จะได้รับ ID เป็น 2 ทำให้เทสต์ฝั่งเซิร์ฟเวอร์แบบ Hardcode ที่คาดหวังค่า requesterId = 1 ทำงานล้มเหลว (Failed)
สิ่งที่ต้องแก้ไข (Action Items):
1. Update Migration Script: ไปที่ไฟล์ server/prisma/migrations/..._lab3_users_and_models/migration.sql แก้ไขบล็อก setval ให้เช็คจำนวนข้อมูลก่อน หากไม่มีข้อมูลให้ตั้งค่าเป็น false (เริ่ม ID ถัดไปที่ 1)
2. Fix Authorization Tests: ไปที่ไฟล์ server/tests/lab-03/authorization.api.test.ts ให้เปลี่ยนวิธีตรวจสอบ (Assertion) จากการกำหนดค่าคงที่ toBe(1) ให้เปลี่ยนเป็นการดึงค่า User ID ของผู้ทดสอบออกมาเทียบแทน เพื่อให้เทสต์มีความยืดหยุ่น
3. Verify Fix: หลังจากแก้โค้ดเสร็จแล้ว ให้คุณลองทำกระบวนการ Database Reset เพื่อจำลองสถานการณ์ Fresh Database และรัน Server Tests ดูว่าไฟล์ที่เคยตกกลับมาผ่านครบ 100% หรือยัง"
**My Reflection:** การแก้ปัญหาเรื่อง Database Sequence ยากกว่าที่คิดตอนแรกครับ แต่พอเขียน Prompt แบ่งเป็นข้อๆ ให้ชัดเจนว่าต้องแก้ไฟล์ Migration ตรงไหน และแก้โค้ดเทสต์ตรงไหนบ้าง AI ก็เข้าใจและแก้ให้ตรงจุดได้เลย พอสั่งรัน `prisma migrate reset` ทดสอบดูอีกรอบ เทสต์ก็กลับมาเขียว 100% ทำให้รู้ว่าการสั่งงาน AI ต้องระบุไฟล์และจุดที่พังให้ชัดเจนครับ

### 2. การแก้ไขชุดข้อผิดพลาดร้ายแรงด้าน State Reactivity และ UI ของระบบยืนยันตัวตน (Issue 2)
**Prompt:** "ฉันพบข้อผิดพลาดร้ายแรง (Bugs) หลายจุดในการทำงานของ Issue 2 ในโค้ดปัจจุบัน ขอให้คุณตรวจสอบและแก้ไขทั้งหมดให้ถูกต้อง:
1. Login State Reactivity: หลังจากล็อกอินสำเร็จ หน้าเว็บค้างอยู่ที่สถานะ Loading ฉันต้องกดรีเฟรชเบราว์เซอร์เองข้อมูลตั๋วถึงจะโหลดขึ้นมา
2. Leftover Lab 2 Component: ในขั้นตอน Logout เมื่อฉันกด Sign Out สำเร็จ หน้าเว็บไม่ได้นำทางไปหน้า Login แต่กลับแสดงปุ่ม 'Change Requester' ขึ้นมาบนหน้าจอ ซึ่งปุ่มนี้เป็นของตกค้างมาจาก Lab 2 (ตามเอกสาร Section 8.2 ระบุชัดเจนว่าต้องไม่มี Requester selector หรือปุ่มนี้อยู่ในระบบ Lab 3 อีกต่อไป ขอให้กำจัดออกให้หมดสิ้น)
3. Logout State Reactivity: เมื่อกดปุ่ม Sign Out จาก Header หน้าเว็บควรจะ Redirect กลับไปหน้า Login ทันที
4. Missing Mandatory Password Change Route: สำหรับบัญชีที่มีสถานะ mustChangePassword = true เมื่อล็อกอินแล้วต้องถูกนำทางไปยังหน้าจอเปลี่ยนรหัสผ่านทันที"
**My Reflection:** บั๊กหน้าเว็บค้างตอนล็อกอินกับปุ่มเก่าของ Lab 2 ที่ยังโผล่มาเป็นปัญหาจุกจิกมากครับ ผมเลยลองเขียนอ้างอิง Spec ข้อ 8.2 ไปใน Prompt ด้วย พอ AI เห็นว่ากฎห้ามไว้แบบนี้ มันก็รีบไปลบโค้ดปุ่มเก่าทิ้ง และแก้เรื่องหน้าจอค้าง (Infinite Loop) ให้ด้วย การเอาเอกสารสเปกมากำกับ AI เป็นวิธีที่ช่วยให้การทำงานมีข้อผิดพลาดน้อยลง

### 3. การควบคุมขอบเขตและรักษาความเข้ากันได้ย้อนหลังของชุดทดสอบ Lab 2 (Backward Compatibility)
**Prompt:** "คุณช่วยตรวจสอบหน่อย ทำไมต้องมีการปรับแก้ไฟล์ test ของ lab2 ที่ไม่ใช่ตัวที่เกิด error อ่ะ... กู้คืนไฟล์เทสต์ของ Lab 2 กลับมาก่อน เดี๋ยวผมจะไปถามพี่อีกครั้ง ส่วนไอตัวที่เกิด warning ก็ปรับไปเลย"
**My Reflection:** ตอนแรก AI พยายามจะลบเทสต์ของ Lab 2 ทิ้งไปเลยเพราะมันรันไม่ผ่านกับโค้ดใหม่ ผมเลยเบรกแล้วสั่งให้กู้คืนมา ห้ามลบทิ้ง ทำให้ได้เรียนรู้ว่าเราปล่อย AI ทำงานเอง 100% ไม่ได้ เราต้องคอยตรวจและดึงสติมันกลับมาครับ สุดท้าย AI เลยต้องใช้วิธีปรับคอมโพเนนต์ให้รองรับทั้งเทสต์เก่าและโค้ดใหม่แทน ซึ่งเป็นผลลัพธ์ที่ดีกว่ามาก

### 4. การรื้อถอนสิทธิ์สร้างตั๋ว (Role-Based Access Control) ตาม Requirement Matrix ล่าสุด (Issue 4)
**Prompt:** "ฉันได้รับการยืนยัน Requirement Matrix ล่าสุดจากผู้ประเมิน (TA) ซึ่งระบุไว้อย่างชัดเจนว่า สิทธิ์ในการ 'สร้างตั๋ว (Create Ticket)' ถูกสงวนไว้สำหรับผู้ใช้ที่มีบทบาท REQUESTER เท่านั้น! ห้ามมิให้ IT_STAFF และ ADMINISTRATOR สร้างตั๋วได้เด็ดขาด ขอให้คุณทำการรื้อถอนสิทธิ์นี้ออกจากระบบทั้งฝั่งหน้าบ้าน หลังบ้าน และเอกสาร Specification:
1. อัปเดต UI Code (client/src/components/AppHeader.tsx): ลบปุ่ม Create Ticket ออกจากเงื่อนไขของ IT Staff และ Admin
2. อัปเดต Backend Authorization: เสริมการตรวจสิทธิ์ใน POST /api/tickets ให้ปฏิเสธ IT Staff และ Admin ด้วยรหัส 403 Forbidden
3. อัปเดต Automated Tests และเอกสาร Spec: เพิ่มเคสทดสอบการปฏิเสธสิทธิ์ใน authorization.api.test.ts และอัปเดต specification.md รวมถึง api-spec.md ให้ถูกต้องตรงกันทั้งหมด"
**My Reflection:** เมื่อทราบว่า ห้ามแอดมินกับไอทีสร้างตั๋วเด็ดขาด ผมเลยต้องเขียนสั่ง AI ให้ไปรื้อระบบใหม่ทั้งหมดครับ ทั้งหน้าเว็บและ API ผมเน้นย้ำให้มันดักสิทธิ์ที่ฝั่งหลังบ้าน (Backend) ด้วย ไม่ใช่แค่ซ่อนปุ่มเฉยๆ ถือเป็นบทเรียนว่าเรื่อง Security ต้องสั่ง AI ให้ชัดเจนว่าจะให้บล็อกสิทธิ์ตรงไหนบ้าง ไม่งั้นมันอาจจะทำแค่ซ่อนปุ่มให้เราผ่านๆ ไป

### 5. การปรับปรุงความกลมกลืนของ UI/UX และระบบแบ่งหน้าตาราง (Design Consistency & Unified Pagination) (Issue 4)
**Prompt:** "ทำไมในส่วนของหน้าคิว ด้านล่างที่เป็นส่วนของการเลื่อนหน้า เราไม่ทำให้เหมือนของหน้า My Tickets ไปเลย ลองไปเช็คในไฟล์ spec ที... ดำเนินการปรับโค้ดและอัปเดตไฟล์ Spec ให้เหมือนกับหน้า My Tickets เลย นอกจากนี้ตรวจสอบที่อื่นๆด้วย หากเจอให้แจ้งมาก่อน"
**My Reflection:** ตอนแรกหน้าตาตารางคิวงานมันดูแปลกๆ ปุ่มเปลี่ยนหน้าลอยๆ ไม่ค่อยเข้ากับธีมหลัก ผมเลยสั่งให้มันไปดูดีไซน์ของ Lab 2 มาเทียบ AI ก็เลยแก้ปรับปุ่มเปลี่ยนหน้าให้แนบไปกับขอบล่างของตารางเหมือนกับที่เคยทำ ทำให้หน้าเว็บดูสวยและเป็นสไตล์เดียวกันหมดครับ

### 6. การปรับแต่ง State และ Ergonomics ของปุ่ม "Problem Appears Resolved" จากการทดสอบหน้าเว็บจริง (Issue 4)
**Prompt:** "ตัวอย่างเช่น http://localhost:5173/tickets/81 ได้ทำการทดสอบ ด้วยการเข้าบัญชี alex.staff@toktickit.com แล้วไปปรับ Ticket Owner เป็นตัวเองแล้ว แต่พอมาเช็คหน้า jennifer ยังพบเป็น Unassigned แล้วตัวปุ่ม Problem Appears Resolved ทำไมไปอยู่ใกล้กับฝั่ง status ต่างๆ ย้ายมาอยู่ฝั่งเดียวกับปุ่ม back ได้มั้ย เพราะถ้าอยู่ฝั่งนั้น มันดูไม่ค่อยออกว่าเป็นปุ่ม ถ้า spec กำหนด ก็ไปปรับในไฟล์ spec ด้วย และปุ่มตอนที่ยังไม่กด เอาติ๊กถูกออกไปก่อน ค่อยแสดงติ๊กถูก ตอนกดปุ่มไปแล้ว"
**My Reflection:** ผมลองใช้งานจริงแล้วรู้สึกว่าปุ่มแก้ปัญหามันดูเนียนไปกับป้ายสถานะตั๋วเกินไปจนหาไม่เจอ แถมมีติ๊กถูกหลอกตาอีก ผมเลยสั่งให้ AI ย้ายปุ่มไปไว้ใกล้ๆ ปุ่ม Back แทน และซ่อนเครื่องหมายติ๊กถูกไว้จนกว่าจะกด ทำให้เห็นชัดเลยว่าแค่เราลองเล่นเว็บเองแล้วเจอจุดขัดใจ ก็สามารถสั่งให้ AI ปรับแก้ UX/UI ให้ใช้งานง่ายขึ้นได้เยอะเลยครับ

### 7. การอัปเกรด E2E Regression Test ของ Lab 2 ให้ทำงานบน Real Authentication และตรวจจับ Asynchronous Navigation โดยไม่แตะต้อง Application Code
**Prompt:** "คุณคือ Coding Agent เป้าหมายของคุณคืออัปเดตสคริปต์ E2E Test ของ Lab 2 (`e2e/lab-02/*.spec.ts`) ให้สามารถรันผ่าน 100% ภายใต้ระบบของ Lab 3 โดยมีเงื่อนไขสำคัญดังนี้:
1. กฎเหล็ก (Strict Rule): ห้ามแก้ไขไฟล์โค้ดแอปพลิเคชันใดๆ ใน `client/src/` หรือ `server/src/` เด็ดขาด อนุญาตให้แก้ไขเฉพาะไฟล์ในโฟลเดอร์ `e2e/lab-02/` เท่านั้น
2. Real Authentication Flow: นำ Mock Development Requester selector ออกทั้งหมด และเปลี่ยนวิธีเริ่มต้นของแต่ละ Test Case เป็นการ Login จริงที่ `/login` กรอก Email/Password ของ Requester จาก Seed Data (`jennifer@toktick.it`, `michael@toktick.it` รหัส `TokTickIT2026!`) และกด Sign In ให้สำเร็จก่อนเริ่มเทสต์
3. Handle React Router Navigation Asynchrony: เนื่องจากใน Lab 3 มีการนำทางอัตโนมัติด้วย `onTicketCreated={() => navigate('/tickets')}` หลังสร้างตั๋ว ทำให้หน้าจอไม่ค้างที่ Success Screen แบบเดิม ให้สคริปต์ดักฟัง Response `POST /api/tickets` เพื่อดึง `ticketNumber` ออกมา และทำ Dual Assertion (รองรับทั้ง Success Screen เดิม หรือการ Redirect ไปหน้า My Tickets ทันที)
4. รักษา Assertion เดิมของ Lab 2 ไว้อย่างครบถ้วน: ตรวจสอบ Ticket Number Format `^TKT-\\d{4}-\\d{6}$`, การเลือก Category/Related System, การแนบไฟล์, การดาวน์โหลด, การทำ Soft Removal (PATCH `/attachments/:id/remove`), การดักจับ HTTP 404 เมื่อดาวน์โหลดไฟล์ที่ถูกลบ, และการสลับ User เพื่อยืนยัน Data Ownership Isolation 403 Forbidden"
**My Reflection:** การเอา E2E เทสต์ของ Lab 2 มาแก้ให้รันผ่านกับระบบ Login ใหม่ อาจจะทำให้ AI ไปแก้โค้ดส่วนอื่นๆ เพื่อให้เทสต์ผ่าน ผมเลยสั่งกฎเหล็กไปเลยว่าห้ามแก้โค้ดแอปพลิเคชัน ให้แก้เฉพาะสคริปต์เทสต์เท่านั้น ซึ่ง AI ก็ดักจังหวะการเปลี่ยนหน้าจอหลังจากล็อกอินได้ ทำให้เทสต์เก่าสามารถกด Login ด้วยข้อมูลจริงและรันผ่านได้ 100% 

### 8. การออกแบบ Finite State Machine สำหรับ Ticket Status Transitions และการบังคับใช้ Terminal State Guardrail (Issue 3 & BR-14)
**Prompt:** "สร้าง REST Endpoints สำหรับจัดการการเปลี่ยนสถานะตั๋วและมอบหมายงานใน `server/src/routes/staff.ts` พร้อมทั้งออกแบบกลไก Finite State Machine ตาม Business Rule BR-14:
1. Permitted Status Transition Matrix: กำหนด Matrix การเปลี่ยนสถานะที่ถูกต้อง เช่น `NEW` -> `[OPEN, IN_PROGRESS, CANCELLED]`, `OPEN` -> `[IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED]`, `RESOLVED` -> `[CLOSED, REOPENED]` และกำหนดให้ `CLOSED` กับ `CANCELLED` เป็น Terminal States (ไม่อนุญาตให้เปลี่ยนสถานะใดๆ ต่อไปอีก)
2. Transition Guardrail: หาก Client ส่งคำขอเปลี่ยนสถานะที่ไม่ได้รับอนุญาต (เช่น กระโดดจาก `NEW` ไป `RESOLVED` หรือพยายามเปลี่ยนสถานะตั๋วที่ `CLOSED` แล้ว) Backend ต้องปฏิเสธด้วยสถานะ `400 Bad Request` พร้อมส่ง Error Code `INVALID_STATUS_TRANSITION` และระบุ Permitted Transitions ที่เป็นไปได้ใน Message
3. Staff Assignment Boundaries: สร้าง Endpoint `PATCH /api/staff/tickets/:id/assignment` (และ Alias `/owner`) ตรวจสอบว่าผู้รับมอบหมายต้องมี Role เป็น `IT_STAFF` หรือ `ADMINISTRATOR` เท่านั้น และต้องมีสถานะ `isActive: true` หากส่ง ID ของ Requester หรือ User ที่ Inactive ต้องปฏิเสธด้วย `400 Bad Request` (`INVALID_TICKET_OWNER`)
4. Data Integrity & Dual Aliasing: รองรับทั้ง Path `/priority` และ `/it-priority` โดยแก้ไขเฉพาะฟิลด์ `itPriority` ของระบบ และต้องไม่กระทบต่อค่า `requestedPriority` ดั้งเดิมของ Requester"
**My Reflection:** เรื่องการเปลี่ยนสถานะตั๋วถ้าปล่อยให้ AI เขียนโค้ดเช็ค if-else เองเดี๋ยวบั๊กจะบานปลายครับ ผมเลยสั่งให้มันสร้างกฎตายตัว (Matrix) ไปเลยว่าสถานะไหนเปลี่ยนไปเป็นสถานะไหนได้บ้าง รวมถึงบล็อกไม่ให้มอบหมายงานให้ Requester ด้วย พอสั่งงานละเอียดแบบนี้ Backend ก็ป้องกันการส่งข้อมูลผิดๆ ได้ดีมากครับ


