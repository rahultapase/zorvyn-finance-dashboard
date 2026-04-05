import { RecordType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRecordDto {
  @IsNumber()
  amount!: number;

  @IsEnum(RecordType)
  type!: RecordType;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
