import { RecordType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum RecordSortBy {
  date = 'date',
  amount = 'amount',
  category = 'category',
  createdAt = 'createdAt',
}

export enum RecordSortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class FilterRecordDto {
  @ApiPropertyOptional({
    description: 'Filter by record type: income or expense',
    enum: RecordType,
    example: 'income',
  })
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType;

  @ApiPropertyOptional({
    description: 'Category name for this financial record',
    example: 'Salary',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter start date in ISO format (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter end date in ISO format (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive search across category and notes',
    example: 'rent',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field for records list',
    enum: RecordSortBy,
    example: RecordSortBy.date,
  })
  @IsOptional()
  @IsEnum(RecordSortBy)
  sortBy?: RecordSortBy;

  @ApiPropertyOptional({
    description: 'Sort direction for records list',
    enum: RecordSortOrder,
    example: RecordSortOrder.desc,
  })
  @IsOptional()
  @IsEnum(RecordSortOrder)
  order?: RecordSortOrder;

  @ApiPropertyOptional({
    description: 'Page number for paginated records',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
