import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@safetyquest/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safetyquest.com' },
    update: {},
    create: {
      email: 'admin@safetyquest.com',
      name: 'Admin User',
      passwordHash: await hashPassword('admin123'),
      role: 'ADMIN' // Now it's just a string
    }
  });

  console.log('Created admin user:', admin.email);
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });