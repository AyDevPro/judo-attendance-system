import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  console.log("Seeded (no-op).");
}
main().finally(async () => prisma.$disconnect());
