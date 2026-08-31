import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  console.log("Seeding Lab 2 data...");

  // 1. Seed Categories (4 categories)
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 2. Seed Related Systems (at least 6-7 systems)
  const relatedSystems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 3. Seed Development Requesters (4 active, 1 inactive)
  const requesters = [
    {
      name: "Jennifer Anderson",
      email: "jennifer@toktick.it",
      department: "Marketing",
      isActive: true,
    },
    {
      name: "Michael Brown",
      email: "michael@toktick.it",
      department: "Finance",
      isActive: true,
    },
    {
      name: "Sarah Johnson",
      email: "sarah@toktick.it",
      department: "Human Resources",
      isActive: true,
    },
    {
      name: "David Lee",
      email: "david@toktick.it",
      department: "Academic Affairs",
      isActive: true,
    },
    {
      name: "Alex Inactive",
      email: "alex.inactive@toktick.it",
      department: "Contractor",
      isActive: false,
    },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {
        name: req.name,
        department: req.department,
        isActive: req.isActive,
      },
      create: {
        name: req.name,
        email: req.email,
        department: req.department,
        isActive: req.isActive,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });

