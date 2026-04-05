import { Injectable } from '@nestjs/common';
import { Prisma, RecordType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilterDashboardByTypeDto } from './dto/filter-dashboard-by-type.dto';

const RECENT_RECORD_SELECT: Prisma.FinancialRecordSelect = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
};

type RecentRecordEntity = Prisma.FinancialRecordGetPayload<{
  select: typeof RECENT_RECORD_SELECT;
}>;

export interface DashboardSummaryResponse {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface DashboardByCategoryItem {
  category: string;
  type: RecordType;
  total: number;
}

export interface DashboardTrendItem {
  month: string;
  income: number;
  expenses: number;
}

export interface DashboardWeeklyResponse {
  income: number;
  expenses: number;
  netBalance: number;
}

interface DashboardRecordCreator {
  id: string;
  name: string;
}

export interface DashboardRecentRecordResponse {
  id: string;
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: DashboardRecordCreator;
}

interface TrendBucket extends DashboardTrendItem {
  key: string;
}

@Injectable()
export class DashboardService {
  private readonly monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryResponse> {
    const [incomeAggregate, expenseAggregate] = await this.prisma.$transaction([
      this.prisma.financialRecord.aggregate({
        where: this.buildBaseWhere(RecordType.income),
        _sum: { amount: true },
      }),
      this.prisma.financialRecord.aggregate({
        where: this.buildBaseWhere(RecordType.expense),
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = this.decimalToNumber(incomeAggregate._sum.amount);
    const totalExpenses = this.decimalToNumber(expenseAggregate._sum.amount);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  }

  async getByCategory(
    filterDashboardByTypeDto: FilterDashboardByTypeDto,
  ): Promise<DashboardByCategoryItem[]> {
    const groupedRecords = await this.prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: this.buildBaseWhere(filterDashboardByTypeDto.type),
      _sum: {
        amount: true,
      },
      orderBy: [{ category: 'asc' }, { type: 'asc' }],
    });

    return groupedRecords.map((group) => ({
      category: group.category,
      type: group.type,
      total: this.decimalToNumber(group._sum.amount),
    }));
  }

  async getTrends(): Promise<DashboardTrendItem[]> {
    const endDate = new Date();
    const { startDate, buckets } = this.buildLastSixMonthTimeline(endDate);

    const groupedRecords = await this.prisma.financialRecord.groupBy({
      by: ['date', 'type'],
      where: this.buildWhereByDateRange(startDate, endDate),
      _sum: {
        amount: true,
      },
    });

    const bucketByKey = new Map<string, TrendBucket>();
    for (const bucket of buckets) {
      bucketByKey.set(bucket.key, bucket);
    }

    for (const group of groupedRecords) {
      const monthKey = this.toMonthKey(group.date);
      const bucket = bucketByKey.get(monthKey);

      if (!bucket) {
        continue;
      }

      const amount = this.decimalToNumber(group._sum.amount);
      if (group.type === RecordType.income) {
        bucket.income += amount;
      } else {
        bucket.expenses += amount;
      }
    }

    return buckets.map((bucket) => ({
      month: bucket.month,
      income: bucket.income,
      expenses: bucket.expenses,
    }));
  }

  async getWeekly(): Promise<DashboardWeeklyResponse> {
    const endDate = new Date();
    const startDate = this.getUtcStartOfDay(
      new Date(
        Date.UTC(
          endDate.getUTCFullYear(),
          endDate.getUTCMonth(),
          endDate.getUTCDate() - 6,
        ),
      ),
    );

    const [incomeAggregate, expenseAggregate] = await this.prisma.$transaction([
      this.prisma.financialRecord.aggregate({
        where: this.buildWhereByDateRange(
          startDate,
          endDate,
          RecordType.income,
        ),
        _sum: { amount: true },
      }),
      this.prisma.financialRecord.aggregate({
        where: this.buildWhereByDateRange(
          startDate,
          endDate,
          RecordType.expense,
        ),
        _sum: { amount: true },
      }),
    ]);

    const income = this.decimalToNumber(incomeAggregate._sum.amount);
    const expenses = this.decimalToNumber(expenseAggregate._sum.amount);

    return {
      income,
      expenses,
      netBalance: income - expenses,
    };
  }

  async getRecent(): Promise<DashboardRecentRecordResponse[]> {
    const records = await this.prisma.financialRecord.findMany({
      where: this.buildBaseWhere(),
      orderBy: {
        date: 'desc',
      },
      take: 10,
      select: RECENT_RECORD_SELECT,
    });

    return records.map((record) => this.mapRecentRecord(record));
  }

  private buildBaseWhere(type?: RecordType): Prisma.FinancialRecordWhereInput {
    return {
      isDeleted: false,
      ...(type ? { type } : {}),
    };
  }

  private buildWhereByDateRange(
    startDate: Date,
    endDate: Date,
    type?: RecordType,
  ): Prisma.FinancialRecordWhereInput {
    return {
      ...this.buildBaseWhere(type),
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  private buildLastSixMonthTimeline(referenceDate: Date): {
    startDate: Date;
    buckets: TrendBucket[];
  } {
    const currentMonthStart = this.getUtcMonthStart(referenceDate);
    const buckets: TrendBucket[] = [];

    for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
      const monthStart = new Date(
        Date.UTC(
          currentMonthStart.getUTCFullYear(),
          currentMonthStart.getUTCMonth() - monthOffset,
          1,
        ),
      );

      buckets.push({
        key: this.toMonthKey(monthStart),
        month: this.monthFormatter.format(monthStart),
        income: 0,
        expenses: 0,
      });
    }

    return {
      startDate: new Date(
        Date.UTC(
          currentMonthStart.getUTCFullYear(),
          currentMonthStart.getUTCMonth() - 5,
          1,
        ),
      ),
      buckets,
    };
  }

  private getUtcMonthStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private getUtcStartOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toMonthKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private decimalToNumber(
    value: Prisma.Decimal | number | null | undefined,
  ): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    return Number(value.toString());
  }

  private mapRecentRecord(
    record: RecentRecordEntity,
  ): DashboardRecentRecordResponse {
    return {
      id: record.id,
      amount: this.decimalToNumber(record.amount),
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: {
        id: record.createdBy.id,
        name: record.createdBy.name,
      },
    };
  }
}
