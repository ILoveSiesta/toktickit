import { getPrisma } from "../src/prisma.js";
import { Role, PriorityLevel, TicketStatus } from "@prisma/client";

// Standard development hashed password for 'TokTickIT2026!'
const DEFAULT_PASSWORD_HASH = "$2b$10$TYOxRqRTTQWjtHd9/n0SFeW/a0BHPBcXxE6yF35stYJUbsKDBghIK";

async function main() {
  const prisma = getPrisma();

  console.log("Seeding Lab 3 data...");

  // 1. Seed Categories (idempotent upsert)
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  const categoryMap = new Map<string, number>();
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    categoryMap.set(name, cat.id);
  }

  // 2. Seed Related Systems (idempotent upsert)
  const relatedSystems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  const systemMap = new Map<string, number>();
  for (const name of relatedSystems) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    systemMap.set(name, sys.id);
  }

  // 3. Seed Users (Requesters, IT Staff, Admin)
  // Lab 3 Section 5.3:
  // - >= 4 active requesters, >= 1 inactive requester
  // - >= 3 active IT staff, >= 1 inactive IT staff
  // - >= 1 active administrator
  const users = [
    // Requesters (preserving Lab 2 emails for test continuity)
    {
      name: "Jennifer Anderson",
      email: "jennifer@toktick.it",
      department: "Marketing",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Michael Brown",
      email: "michael@toktick.it",
      department: "Finance",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Sarah Johnson",
      email: "sarah@toktick.it",
      department: "Human Resources",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "David Lee",
      email: "david@toktick.it",
      department: "Academic Affairs",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Alex Inactive",
      email: "alex.inactive@toktick.it",
      department: "Contractor",
      role: Role.REQUESTER,
      isActive: false,
      mustChangePassword: false,
    },
    // Additional domain-styled requesters
    {
      name: "Amanda Clark",
      email: "amanda.clark@toktickit.com",
      department: "Product",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    // IT Staff (Active & Inactive)
    {
      name: "Alex Thompson",
      email: "alex.staff@toktickit.com",
      department: "IT Infrastructure",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Lisa Martinez",
      email: "lisa.staff@toktickit.com",
      department: "IT Support",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Kevin Patel",
      email: "kevin.staff@toktickit.com",
      department: "IT Support",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: true, // test case for first login change
    },
    {
      name: "Robert Wilson",
      email: "robert.inactive@toktickit.com",
      department: "IT Systems",
      role: Role.IT_STAFF,
      isActive: false,
      mustChangePassword: false,
    },
    // Administrator
    {
      name: "John Smith",
      email: "admin@toktickit.com",
      department: "IT Administration",
      role: Role.ADMINISTRATOR,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  const userMap = new Map<string, number>();
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        department: u.department,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: DEFAULT_PASSWORD_HASH,
      },
      create: {
        name: u.name,
        email: u.email,
        department: u.department,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: DEFAULT_PASSWORD_HASH,
      },
    });
    userMap.set(u.email, user.id);
  }

  // 4. Seed Realistic Tickets with distribution
  const jenniferId = userMap.get("jennifer@toktick.it")!;
  const michaelReqId = userMap.get("michael@toktick.it")!;
  const sarahReqId = userMap.get("sarah@toktick.it")!;
  const staffAlexId = userMap.get("alex.staff@toktickit.com")!;
  const staffLisaId = userMap.get("lisa.staff@toktickit.com")!;

  const tickets = [
    {
      ticketNumber: "TKT-2026-000101",
      summary: "Laptop battery drains quickly after Windows update",
      description: "My laptop battery is draining within 1 hour even when idle. Started after recent OS patch.",
      requestedPriority: PriorityLevel.HIGH,
      itPriority: PriorityLevel.HIGH,
      currentStatus: TicketStatus.IN_PROGRESS,
      requesterId: jenniferId,
      ticketOwnerId: staffAlexId,
      categoryId: categoryMap.get("Hardware")!,
      relatedSystemId: systemMap.get("Corporate Laptop")!,
    },
    {
      ticketNumber: "TKT-2026-000102",
      summary: "Cannot connect to VPN from home network",
      description: "Error 800: The remote connection was not made because the attempted VPN tunnels failed.",
      requestedPriority: PriorityLevel.CRITICAL,
      itPriority: PriorityLevel.CRITICAL,
      currentStatus: TicketStatus.OPEN,
      requesterId: jenniferId,
      ticketOwnerId: staffLisaId,
      categoryId: categoryMap.get("Network")!,
      relatedSystemId: systemMap.get("VPN")!,
    },
    {
      ticketNumber: "TKT-2026-000103",
      summary: "Request access to Sharepoint Finance folder",
      description: "Need read/write permission to 2026 Q3 Budget folder.",
      requestedPriority: PriorityLevel.LOW,
      itPriority: PriorityLevel.LOW,
      currentStatus: TicketStatus.NEW,
      requesterId: michaelReqId,
      ticketOwnerId: null, // Unassigned
      categoryId: categoryMap.get("Account and Access")!,
      relatedSystemId: systemMap.get("Email")!,
    },
    {
      ticketNumber: "TKT-2026-000104",
      summary: "Printer keeps showing offline on 3rd floor",
      description: "Department printer HP LaserJet is unreachable from all workstations on 3rd floor.",
      requestedPriority: PriorityLevel.MEDIUM,
      itPriority: PriorityLevel.MEDIUM,
      currentStatus: TicketStatus.RESOLVED,
      requesterId: sarahReqId,
      ticketOwnerId: staffAlexId,
      categoryId: categoryMap.get("Hardware")!,
      relatedSystemId: systemMap.get("Printer")!,
    },
  ];

  for (const t of tickets) {
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        requesterId: t.requesterId,
        ticketOwnerId: t.ticketOwnerId,
        categoryId: t.categoryId,
        relatedSystemId: t.relatedSystemId,
      },
      create: {
        ticketNumber: t.ticketNumber,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        requesterId: t.requesterId,
        ticketOwnerId: t.ticketOwnerId,
        categoryId: t.categoryId,
        relatedSystemId: t.relatedSystemId,
      },
    });

    // 5. Seed Comments & Internal Notes for ticket 101
    if (t.ticketNumber === "TKT-2026-000101") {
      const existingComments = await prisma.comment.count({ where: { ticketId: ticket.id } });
      if (existingComments === 0) {
        await prisma.comment.createMany({
          data: [
            {
              ticketId: ticket.id,
              authorId: jenniferId,
              content: "Thank you for looking into this. It happens mostly when unplugged.",
            },
            {
              ticketId: ticket.id,
              authorId: staffAlexId,
              content: "We received your report and are diagnosing battery driver configurations.",
            },
          ],
        });
      }

      const existingNotes = await prisma.internalNote.count({ where: { ticketId: ticket.id } });
      if (existingNotes === 0) {
        await prisma.internalNote.createMany({
          data: [
            {
              ticketId: ticket.id,
              authorId: staffAlexId,
              content: "Checked battery health logs: capacity 82%. Testing OEM driver rollback.",
            },
          ],
        });
      }
    }
  }

  console.log("Lab 3 Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
