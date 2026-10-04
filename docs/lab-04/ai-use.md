# Lab 4 — AI Use and Reflection

**LLM/agent used:** Google Gemini 3.8 Flash with a thinking level of High. (via Antigravity IDE)

## Selected key prompts (6–10)

### 1. การวิเคราะห์ข้อกำหนดจาก SE Lab 4.pdf และการแตก Issue ทางวิศวกรรม (Issue 1: Spec DD)
**Prompt:** "ศึกษาไฟล์ SE+Lab+4.pdf ที่ผมแนบมาอย่างละเอียด จากนั้นแบ่งการทำงานออกเป็น 5-6 issue ให้ครอบคลุม ถูกต้อง ไม่ขาด และไม่เกิน ตอบผมกลับมาเป็น issue แต่ละ issue และเขียนสรุปสิ่งที่ต้องทำใน issue นั้นๆ มาให้ผมได้อ่านก่อน และทำการสร้างโฟลเดอร์ docs/lab-04 สำหรับ specification.md, tests.md, ui-spec.md, api-spec.md"
**My Reflection:** การให้ AI วิเคราะห์ข้อกำหนดจาก `SE+Lab+4.pdf` ช่วยให้แตก Sprint ออกเป็น 6 Issues ได้อย่างสอดคล้องกับระเบียบวิธี Spec-Driven Development และ Test-Driven Development (TDD) โดยกำหนดขอบเขตตั้งแต่การวางสเปก, Prisma Migration, Actions Taken CRUD, Ticket Workflow Resolution Gate, บทบาท Dashboard, ไปจนถึง Regression ทำให้มองเห็นภาพรวมของงานทั้งหมดและช่วยลดข้อผิดพลาดในการพัฒนาระบบ

### 2. การปรับปรุงเอกสารวิศวกรรมตามผลการตรวจประเมินแบบ Cross-check จาก Peer Reviewer (PR #40)
**Prompt:** "https://github.com/ILoveSiesta/toktickit/pull/40#pullrequestreview-5406331871 นี่คือการคอมเม้นตอบกลับจากของเพื่อน โปรดตรวจสอบกับไฟล์ spec ที่เราได้ทำ และไฟล์ SE+Lab+4.pdf หากที่เพื่อนตรวจเป็นเรื่องจริงทำการแก้ไข และอัปเดตสิ่งที่ปรับลงไปในรายละเอียดที่ได้ทำใน issue1 ใน agents.md จากนั้นสรุปสิ่งที่แก้มาให้ผม หากไม่เห็นด้วยโปรดแจ้งรายละเอียด"
**My Reflection:** การนำความคิดเห็นของ Peer Reviewer มาตรวจสอบกับเอกสารทางการช่วยให้ตรวจพบจุดตกหล่นสำคัญ เช่น การระบุประเภทการทดสอบ 10 ประเภทใน `tests.md`, การ์ด Unassigned Tickets บน IT Staff Dashboard, และการบังคับใช้เงื่อนไข Resolution Gate (ต้องมี Owner และอย่างน้อย 1 Action Taken ก่อนปิดงาน) ซึ่งการแก้ไขจุดเหล่านี้ตั้งแต่ในขั้นตอนสเปกทำให้ Contract ระหว่างหน้าบ้านและหลังบ้านมีความรัดกุม 100% ก่อนเริ่มเขียนโค้ดจริง

### 3. *(Reserved for Issue 2 — Prisma Migration, Model, Seed & Actions Taken REST APIs)*
**Prompt:** *(จะบันทึกพร้อมการดำเนินงาน Issue 2)*
**My Reflection:** *(จะบันทึกพร้อมการดำเนินงาน Issue 2)*

### 4. *(Reserved for Issue 3 — Actions Taken Ticket Detail UI & Form Validation)*
**Prompt:** *(จะบันทึกพร้อมการดำเนินงาน Issue 3)*
**My Reflection:** *(จะบันทึกพร้อมการดำเนินงาน Issue 3)*

### 5. *(Reserved for Issue 4 — Ticket Workflow State Machine & Resolution Gate Controls)*
**Prompt:** *(จะบันทึกพร้อมการดำเนินงาน Issue 4)*
**My Reflection:** *(จะบันทึกพร้อมการดำเนินงาน Issue 4)*

### 6. *(Reserved for Issue 5 — Role-based Dashboards & Metric Aggregations)*
**Prompt:** *(จะบันทึกพร้อมการดำเนินงาน Issue 5)*
**My Reflection:** *(จะบันทึกพร้อมการดำเนินงาน Issue 5)*

### 7. *(Reserved for Issue 6 — Full Regression Suite & Zero-loss Verification)*
**Prompt:** *(จะบันทึกพร้อมการดำเนินงาน Issue 6)*
**My Reflection:** *(จะบันทึกพร้อมการดำเนินงาน Issue 6)*

### 8. *(Reserved for Issue 6 — WCAG 2.1 AA Accessibility & Responsive Inspection)*
**Prompt:** *(จะบันทึกพร้อมการดำเนินงาน Issue 6)*
**My Reflection:** *(จะบันทึกพร้อมการดำเนินงาน Issue 6)*
