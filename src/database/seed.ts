import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const seedUsers: SeedUser[] = [
  {
    name: 'Admin User',
    email: 'admin@finance.com',
    password: 'Admin123!',
    role: Role.admin,
  },
  {
    name: 'Analyst User',
    email: 'analyst@finance.com',
    password: 'Analyst123!',
    role: Role.analyst,
  },
  {
    name: 'Viewer User',
    email: 'viewer@finance.com',
    password: 'Viewer123!',
    role: Role.viewer,
  },
];

async function main(): Promise<void> {
  const targetEmails = seedUsers.map((user) => user.email);
  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        in: targetEmails,
      },
    },
    select: {
      email: true,
    },
  });

  if (existingUsers.length === seedUsers.length) {
    console.log('Seed already applied. Skipping.');
    return;
  }

  const existingEmailSet = new Set(existingUsers.map((user) => user.email));
  let createdCount = 0;

  for (const user of seedUsers) {
    if (existingEmailSet.has(user.email)) {
      continue;
    }

    const password = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password,
        role: user.role,
      },
    });
    createdCount += 1;
  }

  console.log(`Seed completed. Created ${createdCount} user(s).`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
