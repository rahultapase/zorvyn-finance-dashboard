import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RecordsService } from './records.service';

interface RecordWhereInput {
  id?: string;
  isDeleted?: boolean;
}

interface RecordQueryArgs {
  where?: RecordWhereInput;
}

interface UpdateManyArgs {
  where: {
    id: string;
    isDeleted: boolean;
  };
  data: {
    isDeleted: boolean;
  };
}

describe('RecordsService', () => {
  let service: RecordsService;

  const mockPrismaService = {
    financialRecord: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  const getFirstCallArg = (mockFn: jest.Mock): unknown => {
    const firstCallUnknown: unknown = mockFn.mock.calls.at(0);
    expect(firstCallUnknown).toBeDefined();

    if (!Array.isArray(firstCallUnknown)) {
      throw new Error('Expected Prisma method to be called at least once');
    }

    return firstCallUnknown[0];
  };

  it('findAll always excludes soft-deleted records', async () => {
    mockPrismaService.financialRecord.findMany.mockResolvedValue([]);
    mockPrismaService.financialRecord.count.mockResolvedValue(0);

    await service.findAll({ search: 'rent' });

    const findManyArg = getFirstCallArg(
      mockPrismaService.financialRecord.findMany,
    ) as RecordQueryArgs;
    const countArg = getFirstCallArg(
      mockPrismaService.financialRecord.count,
    ) as RecordQueryArgs;

    expect(findManyArg.where?.isDeleted).toBe(false);
    expect(countArg.where?.isDeleted).toBe(false);
  });

  it('findOne throws NotFoundException when record is soft-deleted or missing', async () => {
    mockPrismaService.financialRecord.findFirst.mockResolvedValue(null);

    await expect(service.findOne('record-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const findFirstArg = getFirstCallArg(
      mockPrismaService.financialRecord.findFirst,
    ) as RecordQueryArgs;

    expect(findFirstArg.where).toEqual({
      id: 'record-id',
      isDeleted: false,
    });
  });

  it('remove soft-deletes a record by setting isDeleted to true', async () => {
    mockPrismaService.financialRecord.updateMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.remove('record-id');

    const updateManyArg = getFirstCallArg(
      mockPrismaService.financialRecord.updateMany,
    ) as UpdateManyArgs;

    expect(updateManyArg).toEqual({
      where: {
        id: 'record-id',
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });
    expect(mockPrismaService.financialRecord.delete).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'record-id', isDeleted: true });
  });
});
