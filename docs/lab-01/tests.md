# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | Pass |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | Pass |
| 3 | Vitest | Heading renders | Pass |
| 4 | Vitest | Success state shows Online + category list | Pass |
| 5 | Vitest | Error state shows Offline + message | Pass |

Paste your passing terminal output / screenshot below.

## npm test(server)

PS D:\เรียน\CPE334-SoftEng\Me-TickTokIt\toktickit\server> npm test

> toktickit-server@1.0.0 test
> vitest run


 RUN  v2.1.9 D:/เรียน/CPE334-SoftEng/Me-TickTokIt/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  22:55:08
   Duration  1.03s (transform 79ms, setup 0ms, collect 670ms, tests 199ms, environment 0ms, prepare 364ms)

## npm test (client)

PS D:\เรียน\CPE334-SoftEng\Me-TickTokIt\toktickit\client> npm test

> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 D:/เรียน/CPE334-SoftEng/Me-TickTokIt/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  22:57:17
   Duration  2.49s (transform 170ms, setup 383ms, collect 360ms, tests 207ms, environment 1.01s, prepare 208ms)