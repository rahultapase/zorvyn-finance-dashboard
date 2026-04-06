import { RecordType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({
    description: 'Monetary amount for the financial record',
    example: 75000,
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'Record type: income or expense',
    enum: RecordType,
    example: 'income',
  })
  @IsEnum(RecordType)
  type!: RecordType;

  @ApiProperty({
    description: 'Category name for this financial record',
    example: 'Salary',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: 'Record date in ISO format (YYYY-MM-DD)',
    example: '2025-10-01',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    description: 'Optional note for the financial record',
    example: 'October salary payout',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
