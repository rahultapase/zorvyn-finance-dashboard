import { Prisma, PrismaClient, RecordType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedCategory =
  | 'Salary'
  | 'Rent'
  | 'Utilities'
  | 'Sales'
  | 'Marketing'
  | 'Consulting';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface SeedCategoryPlan {
  type: RecordType;
  monthlyAmounts: readonly string[];
  baseNote: string;
}

const SEED_RECORD_DAYS: readonly number[] = [3, 8, 13, 18, 24];

const SEED_CATEGORY_ORDER: readonly SeedCategory[] = [
  'Salary',
  'Rent',
  'Utilities',
  'Sales',
  'Marketing',
  'Consulting',
];

const SEED_CATEGORY_PLAN: Record<SeedCategory, SeedCategoryPlan> = {
  Salary: {
    type: RecordType.income,
    monthlyAmounts: [
      '61000.00',
      '63500.00',
      '66000.00',
      '68500.00',
      '71000.00',
      '73500.00',
    ],
    baseNote: 'Monthly salary payout',
  },
  Rent: {
    type: RecordType.expense,
    monthlyAmounts: [
      '18000.00',
      '18250.00',
      '18500.00',
      '18750.00',
      '19000.00',
      '19250.00',
    ],
    baseNote: 'Office rent payment',
  },
  Utilities: {
    type: RecordType.expense,
    monthlyAmounts: [
      '2800.00',
      '2950.00',
      '3100.00',
      '3250.00',
      '3400.00',
      '3550.00',
    ],
    baseNote: 'Utilities and maintenance charges',
  },
  Sales: {
    type: RecordType.income,
    monthlyAmounts: [
      '42000.00',
      '45000.00',
      '48000.00',
      '51000.00',
      '54000.00',
      '57000.00',
    ],
    baseNote: 'Product sales revenue',
  },
  Marketing: {
    type: RecordType.expense,
    monthlyAmounts: [
      '7000.00',
      '7500.00',
      '8000.00',
      '8500.00',
      '9000.00',
      '9500.00',
    ],
    baseNote: 'Campaign and advertising spend',
  },
  Consulting: {
    type: RecordType.income,
    monthlyAmounts: [
      '16000.00',
      '18000.00',
      '20000.00',
      '22000.00',
      '24000.00',
      '26000.00',
    ],
    baseNote: 'External consulting engagement income',
  },
};

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

function buildSeedRecords(
  createdById: string,
  referenceDate: Date = new Date(),
): Prisma.FinancialRecordCreateManyInput[] {
  const records: Prisma.FinancialRecordCreateManyInput[] = [];
  const currentMonthStart = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
  );

  for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
    const monthStart = new Date(
      Date.UTC(
        currentMonthStart.getUTCFullYear(),
        currentMonthStart.getUTCMonth() - (5 - monthIndex),
        1,
      ),
    );

    const skippedCategory =
      SEED_CATEGORY_ORDER[monthIndex % SEED_CATEGORY_ORDER.length];
    const categoriesForMonth = SEED_CATEGORY_ORDER.filter(
      (category) => category !== skippedCategory,
    );

    categoriesForMonth.forEach((category, dayIndex) => {
      const plan = SEED_CATEGORY_PLAN[category];
      const day =
        SEED_RECORD_DAYS[dayIndex] ??
        SEED_RECORD_DAYS[SEED_RECORD_DAYS.length - 1];

      records.push({
        amount: new Prisma.Decimal(plan.monthlyAmounts[monthIndex]),
        type: plan.type,
        category,
        date: new Date(
          Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day),
        ),
        notes: `${plan.baseNote} (month ${monthIndex + 1})`,
        createdById,
      });
    });
  }

  if (records.length !== 30) {
    throw new Error(`Expected 30 seeded records, received ${records.length}.`);
  }

  return records;
}

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

  const adminUser = await prisma.user.findUnique({
    where: {
      email: 'admin@finance.com',
    },
    select: {
      id: true,
    },
  });

  if (!adminUser) {
    throw new Error('Seed failed: admin user was not found after user seeding.');
  }

  const recordInputs = buildSeedRecords(adminUser.id);
  const createdRecords = await prisma.financialRecord.createMany({
    data: recordInputs,
  });

  const softDeleteCandidate = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal('8500.00'),
      type: RecordType.expense,
      category: 'Marketing',
      date: new Date(),
      notes: 'Soft-delete verification record created by seed script.',
      createdById: adminUser.id,
    },
    select: {
      id: true,
    },
  });

  await prisma.financialRecord.update({
    where: {
      id: softDeleteCandidate.id,
    },
    data: {
      isDeleted: true,
    },
  });

  console.log(`Seed completed. Created ${createdCount} user(s).`);
  console.log(`Seeded ${createdRecords.count} financial record(s).`);
  console.log('Seeded 1 soft-deleted record for verification.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
