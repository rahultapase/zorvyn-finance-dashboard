import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RecordType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import {
  FilterRecordDto,
  RecordSortBy,
  RecordSortOrder,
} from './dto/filter-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

const RECORD_PUBLIC_SELECT: Prisma.FinancialRecordSelect = {
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

interface RecordCreator {
  id: string;
  name: string;
}

export interface RecordResponse {
  id: string;
  amount: Prisma.Decimal;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: RecordCreator;
}

export interface RecordsPaginationResponse {
  data: RecordResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createRecordDto: CreateRecordDto,
    actorUserId: string,
  ): Promise<RecordResponse> {
    const record = await this.prisma.financialRecord.create({
      data: {
        amount: createRecordDto.amount,
        type: createRecordDto.type,
        category: createRecordDto.category,
        date: new Date(createRecordDto.date),
        ...(createRecordDto.notes !== undefined
          ? { notes: createRecordDto.notes }
          : {}),
        createdById: actorUserId,
      },
      select: RECORD_PUBLIC_SELECT,
    });

    return record;
  }

  async findAll(
    filterRecordDto: FilterRecordDto,
  ): Promise<RecordsPaginationResponse> {
    const page = filterRecordDto.page ?? 1;
    const limit = filterRecordDto.limit ?? 20;
    const sortBy = filterRecordDto.sortBy ?? RecordSortBy.date;
    const order: Prisma.SortOrder =
      (filterRecordDto.order as Prisma.SortOrder | undefined) ??
      RecordSortOrder.desc;

    this.validatePagination(page, limit);

    const where = this.buildWhereInput(filterRecordDto);
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortBy, order);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: RECORD_PUBLIC_SELECT,
      }),
      this.prisma.financialRecord.count({ where }),
    ]);

    return {
      data: records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<RecordResponse> {
    const record = await this.prisma.financialRecord.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: RECORD_PUBLIC_SELECT,
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    return record;
  }

  async update(
    id: string,
    updateRecordDto: UpdateRecordDto,
  ): Promise<RecordResponse> {
    await this.ensureActiveRecordExists(id);

    const data: Prisma.FinancialRecordUpdateManyMutationInput = {
      ...(updateRecordDto.amount !== undefined
        ? { amount: updateRecordDto.amount }
        : {}),
      ...(updateRecordDto.type !== undefined
        ? { type: updateRecordDto.type }
        : {}),
      ...(updateRecordDto.category !== undefined
        ? { category: updateRecordDto.category }
        : {}),
      ...(updateRecordDto.date !== undefined
        ? { date: new Date(updateRecordDto.date) }
        : {}),
      ...(updateRecordDto.notes !== undefined
        ? { notes: updateRecordDto.notes }
        : {}),
    };

    await this.prisma.financialRecord.updateMany({
      where: {
        id,
        isDeleted: false,
      },
      data,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ id: string; isDeleted: boolean }> {
    const result = await this.prisma.financialRecord.updateMany({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Record not found');
    }

    return {
      id,
      isDeleted: true,
    };
  }

  private buildWhereInput(
    filterRecordDto: FilterRecordDto,
  ): Prisma.FinancialRecordWhereInput {
    const where: Prisma.FinancialRecordWhereInput = {
      isDeleted: false,
    };

    if (filterRecordDto.type) {
      where.type = filterRecordDto.type;
    }

    if (filterRecordDto.category) {
      where.category = filterRecordDto.category;
    }

    if (filterRecordDto.startDate || filterRecordDto.endDate) {
      where.date = {
        ...(filterRecordDto.startDate
          ? { gte: new Date(filterRecordDto.startDate) }
          : {}),
        ...(filterRecordDto.endDate
          ? { lte: new Date(filterRecordDto.endDate) }
          : {}),
      };
    }

    if (filterRecordDto.search) {
      where.OR = [
        {
          category: {
            contains: filterRecordDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          notes: {
            contains: filterRecordDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sortBy: RecordSortBy,
    order: Prisma.SortOrder,
  ): Prisma.FinancialRecordOrderByWithRelationInput {
    return {
      [sortBy]: order,
    };
  }

  private async ensureActiveRecordExists(id: string): Promise<void> {
    const record = await this.prisma.financialRecord.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }
  }

  private validatePagination(page: number, limit: number): void {
    if (page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    if (limit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }
  }
}
