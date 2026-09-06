/**
 * Generates a unique Ticket Number in the format: TKT-YYYY-XXXXXX
 * @param sequenceId Unique integer ID for the sequence
 * @param date Optional date instance (defaults to current date)
 */
export function generateTicketNumber(sequenceId: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const paddedId = String(sequenceId).padStart(6, "0");
  return `TKT-${year}-${paddedId}`;
}
