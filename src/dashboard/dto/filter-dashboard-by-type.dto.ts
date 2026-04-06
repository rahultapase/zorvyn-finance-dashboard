import { RecordType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterDashboardByTypeDto {
  @ApiPropertyOptional({
    description: 'Record type: income or expense',
    enum: RecordType,
    example: 'income',
  })
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType;
}
