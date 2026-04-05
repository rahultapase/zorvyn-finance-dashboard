import { RecordType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterDashboardByTypeDto {
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType;
}
