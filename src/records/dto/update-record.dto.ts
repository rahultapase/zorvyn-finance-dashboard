import { RecordType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateRecordDto {
  @ApiPropertyOptional({
    description: 'Monetary amount for the financial record',
    example: 75000,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Record type: income or expense',
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
    description: 'Record date in ISO format (YYYY-MM-DD)',
    example: '2025-10-01',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Optional note for the financial record',
    nullable: true,
    example: 'October salary payout',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
