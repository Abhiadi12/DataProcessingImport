import { PrismaClient, Role } from "@prisma/client";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";

async function main(): Promise<void> {
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env first");
  }

  const email = env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({ where: { email }, data: { role: Role.ADMIN, isActive: true } });
      console.log(`Seed: existing user ${email} is now an active ADMIN`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        name: "Administrator",
        passwordHash: await hashPassword(env.SEED_ADMIN_PASSWORD),
        role: Role.ADMIN,
      },
    });
    console.log(`Seed: created ADMIN ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
