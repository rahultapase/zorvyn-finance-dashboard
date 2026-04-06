import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    example: [],
    description: 'Paginated collection data',
  })
  data!: Record<string, unknown>[];

  @ApiProperty({ example: 30, description: 'Total number of records' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Page size' })
  limit!: number;

  @ApiProperty({ example: 2, description: 'Total number of pages' })
  totalPages!: number;
}
