import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gopass.desk';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'System Administrator';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    // eslint-disable-next-line no-console
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

seed()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
