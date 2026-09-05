# Lab 2 — AI Use and Reflection

**LLM/agent used:** Google Gemini 3.7 Flash with a thinking 
level of High.  (via Antigravity IDE)

## Selected key prompts (6–10)

### 1. การสร้างระบบ Global Error Handling สำหรับตรวจจับข้อผิดพลาด Network (Issue 3)
**Prompt:** "เราต้องการปรับแก้รูปแบบ API ให้ตรงกับ Lab 1 เดิม และต้องการเพิ่มฟีเจอร์ 'Global Server Connection Error Warning' (แจ้งเตือนเมื่อเชื่อมต่อ Server ไม่ได้) ในทุกหน้าจอ ขอให้ทำตามขั้นตอนต่อไปนี้อย่างเคร่งครัด: 1. ตรวจสอบไฟล์เทสต์ว่ามีการจำลองสถานการณ์ Network Error ถูกต้องหรือไม่ 2. สร้าง Custom Fetch Wrapper / Interceptor สำหรับดักจับ TypeError / Server Down 3. แสดงแถบเตือนสีแดง GlobalErrorBanner ด้านบนสุดของหน้าจอ 4. พัฒนาด้วยกระบวนการ TDD ให้เทสต์ผ่าน 100%"
**My Reflection:** AI สามารถสร้างระบบดักจับ Error แบบรวมศูนย์ผ่าน Custom Fetch Wrapper ได้ถูกต้องตั้งแต่ครั้งแรก เพราะใน Prompt มีการระบุให้ใช้แนวทาง TDD และกำหนดสถานการณ์จำลอง Network Error ไว้อย่างชัดเจน

### 2. การวางโครงสร้างและควบคุม Scope ใน Issue 4 ตามหลัก Spec-Driven Development
**Prompt:** "เรากำลังจะเริ่มพัฒนาโปรเจกต์ TokTickIT ในส่วนของ 'Issue 4: My Tickets, Ticket Detail & Attachments Management' โดยใช้กระบวนการ TDD และ Spec-Driven Development (SDD) ขอให้ทำงานตามขั้นตอนต่อไปนี้อย่างเคร่งครัด: 1. อ่านและทำความเข้าใจเอกสาร Contract ทั้ง 4 ไฟล์ (specification.md, api-spec.md, ui-spec.md, tests.md) 2. สรุป Scope สิ่งที่ต้องทำ และสิ่งที่เป็น Non-Goals (ห้ามทำเด็ดขาด) 3. เขียน Unit/API Tests ล่วงหน้า 4. พัฒนา Backend และ Frontend ตามลำดับ"
**My Reflection:** Prompt นี้ให้ผลลัพธ์ที่ตรงตาม Business Rules ครบถ้วนในรอบเดียว เพราะมีการป้อนเอกสารสัญญาทั้ง 4 ฉบับและระบุข้อห้าม Non-Goals ล่วงหน้าอย่างรัดกุม ทำให้ AI ไม่สร้างฟีเจอร์ส่วนเกิน

### 3. การตรวจสอบความสอดคล้องของโค้ดเทียบกับสัญญา (Mid-Sprint QA Audit)
**Prompt:** "จากผลการ Audit ของ Senior QA Engineer ใน Issue 4 พบว่ามีจุดที่โค้ดทำงานไม่ตรงตามเอกสาร specification.md, api-spec.md และ ui-spec.md จำนวน 8 จุด กรุณาดำเนินการแก้ไข (Fixing) ตาม Checklist ด้านล่างนี้ทีละข้ออย่างเคร่งครัด โดยยังคงใช้หลักการ TDD: 1. [MyTickets.tsx] ขาดตัวกรอง IT Priority 2. [RequesterTicketDetail.tsx] ขาด Date Submitted 3. บังคับเหตุผล Soft-removal ขั้นต่ำ 3 ตัวอักษร 4. เพิ่มปุ่ม Download ไฟล์แนบ 5. เขียน Test ดัก 403 Forbidden เมื่อเปิดตั๋วคนอื่น..."
**My Reflection:** AI สามารถไล่แก้ไขโค้ดและปรับปรุง Automated Test Suite ให้ผ่านครบทุกข้อได้สำเร็จในรอบเดียว เนื่องจากการแปลงปัญหาเป็น Checklist พร้อมระบุชื่อไฟล์ช่วยให้ AI โฟกัสแก้ได้ตรงจุด

### 4. การตรวจสอบเชิงลึกเรื่องข้อกำหนดสัญญา (Deep-Dive Spec Investigation: File Upload Limits)
**Prompt:** "คุณช่วยตรวจสอบให้หน่อยได้รึป่าว จากไฟล์ specification.md api-spec.md ui-spec.md tests.md มีการกำหนดในเรื่องการอัปโหลดไฟล์ ในเรื่องอัปโหลดได้ครั้งละกี่ไฟล์"
**My Reflection:** Prompt นี้ให้คำตอบที่ถูกต้องแม่นยำได้ทันทีในครั้งเดียว โดย AI สามารถสืบค้นและ Cross-reference ข้ามเอกสารสัญญาเพื่อยืนยันโควตาการแนบไฟล์ 5 ไฟล์ตามกฎ BR-16 ได้อย่างรวดเร็ว

### 5. การแก้ไขข้อบกพร่องจากการทดสอบด้วยมือ (Manual QA Bug Fixing: URL Routing & Direct Links)
**Prompt:** "จากการทดสอบด้วย Manual Test พบว่ามีบั๊กและ UX ที่ต้องปรับปรุง 3 จุด กรุณาแก้ไขโค้ดตามรายละเอียดต่อไปนี้: 1. Fix URL Routing (Ticket Detail Navigation) ให้ติดตั้งและใช้งาน react-router-dom กำหนด Path /tickets และ /tickets/:id เพื่อให้รองรับ Direct URL และ Browser Refresh 2. ปรับปรุงการแสดงผล Empty State และ No-Results State 3. ปรับขนาดช่องค้นหาให้พอดีกับการใช้งาน"
**My Reflection:** ในตอนแรกระบบยังมีปัญหาเรื่องเปิด Direct URL ไม่ได้ แต่เมื่อสั่งติดตั้งและปรับโครงสร้าง react-router-dom เพิ่มเติม AI ก็สามารถแก้ปัญหาการนำทางและ UX ให้ทำงานสมบูรณ์ได้ในทันที

### 6. การสร้างชุดทดสอบ End-to-End (E2E) และ Responsive Visual Inspection ใน Issue 5
**Prompt:** "เรากำลังจะดำเนินการ 'Issue 5: E2E Testing, Visual Inspection & Release to Main' ขอให้คุณทำงานตามขั้นตอนต่อไปนี้อย่างเคร่งครัด: 1. อ่าน tests.md ทบทวน Test Plan ส่วน E2E (E2E-01, E2E-02) 2. อ่าน ui-spec.md ทบทวน Responsive Checklist (RESP-01, RESP-02, RESP-03) 3. เขียนสคริปต์ Playwright ทดสอบ Full Journey และบันทึก Screenshot หน้าจอทุก Viewport"
**My Reflection:** AI สามารถสร้างสคริปต์ Playwright และรันบันทึกภาพหน้าจอทุกขนาด Viewport ได้ถูกต้องตั้งแต่รอบแรก เพราะมีการอ้างอิงรหัส Acceptance Criteria (AC) และ Test Plan ไว้อย่างชัดเจน

### 7. การคัดกรองรายงาน Free-Roam Audit ตามหลัก Spec-Driven Development (Valid vs Invalid)
**Prompt:** "คุณทำงานด้วยหลัก Spec-Driven Development (SDD) อย่างเคร่งครัด ไฟล์ที่แนบไปด้วยนี้คือ 'รายงานการ Audit' ที่สร้างขึ้นโดย QA Agent แบบไม่ได้จำกัดขอบเขต ซึ่งอาจมีทั้งข้อบกพร่องจริงและข้อเสนอแนะที่เกินขอบเขต ให้นำรายการทั้งหมดมาตรวจสอบเทียบกับ Contract ทั้ง 4 ไฟล์ แล้วแบ่งกลุ่มเป็น: 1. Valid (ต้องแก้) 2. Invalid/Out of Scope (ห้ามทำเด็ดขาด เช่น ระบบ Login จริง หรือ Hard Delete) และลงมือแก้เฉพาะข้อที่ Valid"
**My Reflection:** AI ทำหน้าที่เป็น Gatekeeper ได้อย่างสมบูรณ์ในรอบเดียว โดยสามารถแยกแยะและปฏิเสธข้อเสนอแนะที่ผิดกติกา พร้อมทั้งเลือกแก้ไขเฉพาะจุดที่ถูกต้องตามสัญญาได้อย่างแม่นยำ

### 8. การรักษาความเข้ากันได้ย้อนหลังและการแยกส่วนของ Lab 1 (Backward Compatibility)
**Prompt:** "ทำ prompt ก่อนหน้าอีกครั้ง แต่สิ่งที่เกี่ยวข้องกับ lab1 อย่าไปยุ่ง ปล่อยไป และช่วยตรวจสอบให้ npm test ใน client ทำไมไม่มี failed ของ lab1 ที่เป็นตัว checksystem เอากลับมาหน่อย ปล่อยไว้เลย"
**My Reflection:** ตอนแรก AI พยายามปรับการตั้งค่าเทสต์เพื่อหลบ Error แต่เมื่อสั่งย้ำห้ามแตะต้องโค้ดของ Lab 1 เพิ่มเติม AI ก็สามารถกู้คืนความเข้ากันได้ย้อนหลังและรักษาสถานะเดิมไว้ได้อย่างถูกต้อง
