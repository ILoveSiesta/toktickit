# Lab 4 — AI Use and Reflection

**LLM/agent used:** Google Gemini 3.8 Flash with a thinking level of High. (via Antigravity IDE)

## Selected key prompts (6–10)

### 1. การวิเคราะห์ข้อกำหนดจาก SE Lab 4.pdf และการแตก Issue ทางวิศวกรรม (Issue 1: Spec DD)
**Prompt:** "ศึกษาไฟล์ SE+Lab+4.pdf ที่ผมแนบมาอย่างละเอียด จากนั้นแบ่งการทำงานออกเป็น 5-6 issue ให้ครอบคลุม ถูกต้อง ไม่ขาด และไม่เกิน ตอบผมกลับมาเป็น issue แต่ละ issue และเขียนสรุปสิ่งที่ต้องทำใน issue นั้นๆ มาให้ผมได้อ่านก่อน และทำการสร้างโฟลเดอร์ docs/lab-04 สำหรับ specification.md, tests.md, ui-spec.md, api-spec.md"
**My Reflection:** ตอนแรกที่อ่านไฟล์แล็บ 4 รู้สึกว่ารายละเอียดเยอะและฟีเจอร์เกี่ยวพันกันหลายส่วนมากครับ ทั้งเรื่อง Actions Taken, การกดยืนยันแก้ปัญหา และหน้าแดชบอร์ดของแต่ละโรล พอให้ AI ช่วยสรุปและแบ่งงานออกเป็น 6 Issues ตามแนวคิด Spec-Driven กับ TDD ทำให้ผมเห็นลำดับการทำงานที่ชัดเจนขึ้นมากว่าต้องเริ่มจากเขียนสเปก ทำฐานข้อมูล ทำหน้าบ้าน แล้วค่อยทำเทสต์ ช่วยให้วางแผนทำแล็บนี้ได้เป็นขั้นเป็นตอนและไม่หลุดข้อกำหนดครับ

### 2. การปรับปรุงเอกสารวิศวกรรมตามผลการตรวจประเมินแบบ Cross-check จาก Peer Reviewer (PR #40)
**Prompt:** "https://github.com/ILoveSiesta/toktickit/pull/40#pullrequestreview-5406331871 นี่คือการคอมเม้นตอบกลับจากของเพื่อน โปรดตรวจสอบกับไฟล์ spec ที่เราได้ทำ และไฟล์ SE+Lab+4.pdf หากที่เพื่อนตรวจเป็นเรื่องจริงทำการแก้ไข และอัปเดตสิ่งที่ปรับลงไปในรายละเอียดที่ได้ทำใน issue1 ใน agents.md จากนั้นสรุปสิ่งที่แก้มาให้ผม หากไม่เห็นด้วยโปรดแจ้งรายละเอียด"
**My Reflection:** ตอนเพื่อนส่งคอมเมนต์รีวิว PR สเปกกลับมา มีหลายจุดที่ผมอ่านข้ามไปจริงๆ ครับ เช่น การ์ด Unassigned Tickets บนหน้าแดชบอร์ดไอที หรือเงื่อนไขที่ต้องมีเจ้าหน้าที่รับเรื่องและมี Action Taken อย่างน้อย 1 ครั้งก่อนจะกดแก้ปัญหาได้ พอเอาคอมเมนต์เพื่อนให้ AI ช่วยไล่เทียบกับไฟล์แล็บและสเปกที่เราเขียน ก็ช่วยให้เราแก้เอกสารให้ครบถ้วนและถูกต้องตรงกันตั้งแต่แรก ดีกว่าไปเจอตอนเขียนโค้ดแล้วต้องมารื้อใหม่ครับ

### 3. การออกแบบ Prisma Schema, Database Migration, Seed และ REST APIs สำหรับ Actions Taken (Issue 2: Actions Taken Foundation)
**Prompt:** "ช่วยพัฒนา Backend สำหรับระบบ Actions Taken ในส่วนของ Issue 2 ให้หน่อยครับ มีขอบเขตงานดังนี้:
1. สร้าง Prisma Model ActionTaken โดยผูกความสัมพันธ์กับ Ticket (แบบ CASCADE เมื่อตั๋วถูกลบ) และ User ที่เป็นคนปฏิบัติงาน (แบบ RESTRICT) พร้อมกำหนดฟิลด์: actionDateTime, actionDescription, result, followUpRequired, followUpNote, attachmentNotes
2. รัน Migration และเขียน Seed Data ตัวอย่างการบันทึก Actions Taken ที่สมจริงลงใน database
3. สร้าง REST APIs ใน server/src/routes/tickets.ts:
   - GET /api/tickets/:id/actions-taken: ดึงประวัติการปฏิบัติงาน เรียงลำดับ actionDateTime จากใหม่ไปเก่า (Stable Ordering)
   - POST /api/tickets/:id/actions-taken: บันทึกข้อมูลใหม่ โดยบังคับกรอก actionDescription และ result ถ้าเลือก followUpRequired=true ต้องบังคับกรอก followUpNote ทันที นอกจากนี้ต้องดักไม่ให้ User ที่ Inactive บันทึกงาน และเซ็ต performedById เป็นคนที่ล็อกอินอยู่โดยอัตโนมัติ
   - PATCH /api/tickets/:id/actions-taken/:actionId: แก้ไขข้อมูล พร้อมทำ Optimistic Concurrency Control โดยรับค่า expectedUpdatedAt ถ้าเวลาไม่ตรงกับในฐานข้อมูลให้ตอบกลับ 409 Conflict ทันที
4. เขียนชุดทดสอบ server/tests/lab-04/actions-taken.api.test.ts ให้ครอบคลุมทุกเงื่อนไขทั้ง 20 ข้อ"
**My Reflection:** ตอนเริ่มทำ Issue 2 สิ่งที่ผมคิดว่าง่ายอย่างการเก็บประวัติการทำงาน กลายเป็นมีรายละเอียดเยอะกว่าที่คิดครับ ทั้งเรื่องการผูก Foreign Key ใน Prisma ให้ถูกประเภท และกฎเรื่อง Concurrency ที่ต้องคอยเช็ค expectedUpdatedAt เพื่อกันคนแก้ข้อมูลทับกัน พอเขียนพรอมต์สั่งให้ AI ช่วยร่าง Schema และเขียน Controller ให้รองรับ Validation ทั้งเรื่องบัญชี Inactive และเงื่อนไข Follow-up ก็ช่วยลดเวลาเขียนโค้ดเช็คเงื่อนไขไปได้เยอะมากครับ พอลองรันเทสต์ API ทั้ง 20 ข้อแล้วผ่านเขียวหมด ทำให้ผมเข้าใจเรื่องการออกแบบ API ที่ปลอดภัยและการทำ Concurrency Control ชัดเจนขึ้นมากครับ

### 4. การพัฒนาคอมโพเนนต์ Actions Taken บนหน้า Ticket Detail, Form Validation และการแก้ปัญหาตาม Peer Review (Issue 3: Actions Taken UI)
**Prompt:** "ช่วยพัฒนาส่วนแสดงผล Actions Taken ในหน้า Ticket Detail (ฝั่ง Client) สำหรับ Issue 3 ให้หน่อยครับ:
1. สร้างคอมโพเนนต์ ActionsTakenSection แสดงตารางบันทึกการทำงาน เรียงลำดับจากใหม่ไปเก่า โดยถ้าผู้ใช้เป็น Requester ให้แสดงแบบ Read-Only เท่านั้น (ซ่อนปุ่มเพิ่มและแก้ไข) แต่ถ้าเป็น IT Staff หรือ Admin ให้แสดงปุ่ม [+ Add Action Taken] และปุ่ม Edit ประจำแถว
2. สร้าง ActionTakenModal รองรับทั้งสร้างและแก้ไข โดยช่อง Performed By ให้ดึงชื่อและ Role ของผู้ใช้ปัจจุบันมาแสดงแบบ Read-only และถ้าติ๊กถูกที่ Follow-up Required ต้องบังคับกรอก Follow-up Note ทันทีพร้อมแสดงข้อความเตือนสีแดง
3. เพิ่มระบบ Safe Failure หากส่งข้อมูลแล้ว Server เกิด Error ข้อมูลที่พิมพ์ค้างไว้ในฟอร์มต้องไม่หาย และปิดการกดปุ่ม Submit ซ้ำ (Double Submit) ขณะกำลังบันทึก
4. ปรับแต่งดีไซน์ตามธีม Zen Green และทำ Responsive ให้สลับจากตารางเป็น Card Stack บนหน้าจอมือถือ (กว้างไม่เกิน 768px) เพื่อป้องกันปัญหาหน้าจอเลื่อนแนวนอน
5. เขียน Component Test ใน client/tests/lab-04/ActionsTaken.test.tsx ให้ผ่านครบทุกเคส
6. ช่วยตรวจและแก้ปัญหา build error TS2322 ใน ActionTakenModal.tsx ที่ตัวแปร isUserInactive มีโอกาสเป็น null จนปุ่ม Submit แจ้ง type error ตามที่เพื่อนแจ้งใน PR Review ด้วยครับ"
**My Reflection:** ใน Issue 3 งานส่วนใหญ่เป็นเรื่องของ UI/UX และการคุมสิทธิ์บนหน้าเว็บครับ ตอนแรกผมกังวลเรื่องการทำ Responsive เพราะตารางที่มีข้อมูลหลายคอลัมน์พอดูในมือถือแล้วมักจะล้นจอ แต่พอให้ AI ช่วยเขียน CSS เปลี่ยนตารางเป็น Card Stack บนจอมือถือ หน้าจอก็ดูสะอาดตาและไม่มีแถบเลื่อนแนวนอนเลยครับ นอกจากนี้ยังมีเคสที่เพื่อนตรวจ PR #42 แล้วเจอบั๊ก TypeScript บรรทัด disabled ของปุ่ม Submit ที่ค่าอาจกลายเป็น null จนทำให้สั่ง build ไม่ผ่าน พอส่งให้ AI ช่วยดูและแก้ด้วย Boolean(...) ก็ทำให้คำสั่ง npm run build กลับมาผ่านฉลุย ทำให้รู้สึกว่า AI ช่วยแก้ปัญหา Type ของ TypeScript ที่เราอาจจะมองข้ามได้เร็วและตรงจุดมากครับ

### 5. การบังคับใช้วงจรชีวิตตั๋ว (Ticket Lifecycle), กฎ Resolution Gate และ Concurrency Guardrail (Issue 4: Ticket Workflow & Resolution)
**Prompt:** "ช่วยพัฒนาระบบควบคุมสถานะตั๋ว (Ticket Lifecycle) และกฎ Resolution Gate ใน Issue 4 ให้สมบูรณ์ทั้งฝั่ง Backend และ Frontend ตามเงื่อนไขดังนี้ครับ:
1. กำหนด Permitted Transition Matrix ทั้ง 8 สถานะใน server/src/routes/tickets.ts หากมีการขอเปลี่ยนสถานะที่ไม่ถูกต้องให้ตอบกลับ 400 Bad Request
2. บังคับใช้กฎ Resolution Gate:
   - เมื่อ Requester กดระบุว่าปัญหาได้รับการแก้ไขแล้ว (Problem Appears Resolved) ให้ถือเป็นแค่ข้อความแจ้งเตือน (Advisory Alert) เท่านั้น ระบบต้องไม่เปลี่ยนสถานะตั๋วเป็น RESOLVED อัตโนมัติ
   - ตั๋วจะเปลี่ยนเป็น RESOLVED ได้ก็ต่อเมื่อ IT Staff หรือ Admin เป็นผู้กดยืนยัน โดยตั๋วนั้นต้องมีผู้รับผิดชอบ (Assigned Owner) และมีประวัติบันทึก Actions Taken อย่างน้อย 1 รายการแล้วเท่านั้น
3. ป้องกันปัญหา Stale State ด้วย Concurrency Guardrail ตรวจสอบ updatedAt หรือ version หากข้อมูลบนหน้าจอไม่เป็นปัจจุบันให้ตอบกลับ 409 Conflict
4. ปรับหน้า RequesterTicketDetail และ StaffTicketDetail ให้แสดงปุ่มเปลี่ยนสถานะและกล่องแจ้งเตือน Advisory ตามสิทธิ์ของผู้ใช้
5. เขียน API Tests (server/tests/lab-04/ticket-workflow.api.test.ts) และ Component Tests (client/tests/lab-04/TicketWorkflow.test.tsx) ให้ครอบคลุมทุก Transition"
**My Reflection:** Issue 4 ถือเป็นหัวใจสำคัญของกระบวนการทำงานในแล็บนี้เลยครับ โดยเฉพาะกฎ Resolution Gate ที่ Requester กดแจ้งได้แค่แนะนำ (Advisory) แต่คนที่จะปิดหรือ Resolve ตั๋วได้จริงต้องเป็นเจ้าหน้าที่ไอทีเท่านั้น และต้องมีงานที่บันทึกไว้ใน Actions Taken แล้วด้วย ตอนเขียนโค้ดถ้าต้องมานั่งเขียน if-else เช็คเงื่อนไขและ State Matrix เองทั้งหมดคงปวดหัวมากครับ การใช้ AI ช่วยวางโครงสร้าง Transition Matrix และดักตรวจ Concurrency ทำให้โค้ดหลังบ้านเป็นระเบียบและปลอดภัยมาก พอลองทดสอบเปลี่ยนสถานะข้ามขั้น หรือลองกดยืนยันตอนที่ยังไม่มีคนรับผิดชอบ ระบบก็ดักจับและส่ง Error ออกมาได้ถูกต้องตามที่สเปกระบุไว้เป๊ะๆ เลยครับ

### 6. การแก้ปัญหา Role-Based Dashboards, Metric Aggregation และการแก้ไขปัญหา Routing & Layout (Issue 5: Dashboards & Metrics)
**Prompt:** "ในฝั่งของ admin และ it staff พบว่าเมื่อกด My Assigned จะไปหน้า queue ที่แสดง Assigned filter must be 'all', 'unassigned', 'mine', or a valid numeric User ID และในส่วนของ ตาราง Recent Tickets พบว่าข้อความที่ assigned ไปให้ใคร อยู่ไม่ตรงกัน ช่วยย้ายไปชิดขวาบนๆ แล้วขยับ status วัน ให้ลงมาเล็กน้อย เพื่อไม่ให้ซ้อนกัน และอย่าให้เกินกรอบเมื่อปรับเป็น tablet หรือ mobile"
**My Reflection:** ตอนทดสอบกดการ์ด My Assigned บนหน้าแดชบอร์ดไอทีจริง ผมเจอบั๊กหน้าคิวพังขึ้น Error เตือนว่ารับเฉพาะ 'mine' แต่หน้าบ้านส่งค่า 'me' ไป แถมตาราง Recent Tickets พอย่อจอเป็น Tablet หรือมือถือแล้วตัวหนังสือซ้อนกันเละมากครับ ผมเลยสั่งให้ AI แก้หลังบ้านให้รองรับทั้ง 'me' และ 'mine' เป็นตัวเดียวกัน พร้อมกับให้แก้ CSS จัดตำแหน่งแท็กสถานะกับคนรับผิดชอบใหม่ให้อยู่ชิดขวาบน พอแก้แล้วพอลองกด Drill-down ดูก็ไม่เจอ Error อีกเลย แถมหน้าจอก็เรียบร้อยไม่ล้นขอบจอแล้วครับ

### 7. การพัฒนาชุดทดสอบ End-to-End (Playwright) และการแก้ปัญหา Regression & Test Idempotency (Issue 6: Final Hardening & E2E)
**Prompt:** "พัฒนาชุดทดสอบ Playwright E2E Tests ครบทุก Scenario ของ Lab 4, รับประกัน Zero Regression จาก Lab 1-3 และสรุปผลการทดสอบทั้งหมด"
**My Reflection:** ตอนแรกที่รันเทสต์ E2E ทั้งหมดเพื่อตรวจ Regression ปรากฏว่าเทสต์เก่าของแล็บ 3 ตกครับ เพราะฝั่ง Backend ในแล็บ 4 มีการปรับ Endpoint เปลี่ยนสถานะตั๋วใหม่ ทำให้ตัวดักจับ Network ในเทสต์เก่าจับไม่เจอ แถมเวลาเทสต์ E2E รันเสร็จ ค่าในฐานข้อมูลก็ค้างว่ามีคนกดแจ้งแก้ปัญหาแล้ว ทำให้รันเทสต์รอบสองไม่ผ่าน ผมเลยให้ AI ช่วยปรับสคริปต์เทสต์เก่าให้ดักจับ URL ให้ถูก และแก้ไฟล์ Seed ให้รีเซ็ตค่าสถานะทุกครั้งที่รัน พอทำเสร็จทั้งเทสต์เก่าและเทสต์ใหม่ 269 ข้อก็รันผ่านเขียว 100% หมดเลยครับ

### 8. การตรวจสอบ Accessibility (WCAG 2.1 AA) และการการันตี Zero Horizontal Overflow ด้วย Automated Assertions (Issue 6: Responsive & A11y)
**Prompt:** "พัฒนา e2e/lab-04/responsive-visual.spec.ts ทดสอบความถูกต้องของ UI บน Desktop (1280px), Tablet (820px) และ Mobile (375px) ไม่ล้นขอบจอ ไม่เกิด horizontal scroll และตรวจสอบ Accessibility (WCAG 2.1 AA) รวมถึงเก็บภาพ Screenshots สำหรับส่งงาน"
**My Reflection:** การตรวจเรื่องหน้าจอไม่ให้ล้นขอบกับ Accessibility ถ้ามานั่งเล็งด้วยตาเปล่าทีละหน้าคงเสียเวลาและอาจจะพลาดได้ครับ ผมเลยให้ AI เขียนสคริปต์ Playwright ช่วยเช็คความกว้างหน้าจอ (scrollWidth <= innerWidth) บนความละเอียด 1280px, 820px และ 375px แบบอัตโนมัติเลย และให้คอยตรวจพวกแท็ก ARIA กับการกดคีย์บอร์ด Tab บนปุ่มต่างๆ ด้วย ทำให้มั่นใจได้จริงๆ ว่างานเราเปิดบนมือถือแล้วไม่มีแถบเลื่อนแนวนอนโผล่มากวนใจ และตรงตามเกณฑ์เรื่องการเข้าถึง (A11y) ครบถ้วนครับ

