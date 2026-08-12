import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const users = [
  {
    name: "Admin",
    email: "admin@example.com",
    password: "admin123",
    role: Role.ADMIN,
  },
  {
    name: "Sales User",
    email: "sales1@example.com",
    password: "sales123",
    role: Role.SALES,
  },
  {
    name: "Warehouse User",
    email: "warehouse2@example.com",
    password: "warehouse123",
    role: Role.WAREHOUSE,
  },
  {
    name: "Accounts User",
    email: "accounts2@example.com",
    password: "accounts123",
    role: Role.ACCOUNTS,
  },
];

async function main() {
  console.log("Creating demo users...");

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const createdUser = await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });

    console.log(
      `Created/updated: ${createdUser.email} (${createdUser.role})`
    );
  }

  console.log("All demo users are ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });