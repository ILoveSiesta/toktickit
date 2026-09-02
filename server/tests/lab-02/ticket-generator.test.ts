import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../src/utils/ticketGenerator.js";

describe("UNIT-01: Ticket Number Generator", () => {
  it("should generate a ticket number in the format TKT-YYYY-XXXXXX", () => {
    const ticketNumber = generateTicketNumber(101);
    const currentYear = new Date().getFullYear();
    const expectedPrefix = `TKT-${currentYear}-`;

    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(ticketNumber.startsWith(expectedPrefix)).toBe(true);
    expect(ticketNumber).toBe(`TKT-${currentYear}-000101`);
  });

  it("should generate unique ticket numbers for different sequence IDs", () => {
    const tkt1 = generateTicketNumber(1);
    const tkt2 = generateTicketNumber(2);

    expect(tkt1).not.toBe(tkt2);
    expect(tkt1.endsWith("000001")).toBe(true);
    expect(tkt2.endsWith("000002")).toBe(true);
  });
});
