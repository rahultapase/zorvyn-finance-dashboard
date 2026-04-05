import { RecordType } from '@prisma/client';
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
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @IsOptional()
  @IsEnum(RecordSortBy)
  sortBy?: RecordSortBy;

  @IsOptional()
  @IsEnum(RecordSortOrder)
  order?: RecordSortOrder;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
