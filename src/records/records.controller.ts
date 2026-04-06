import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateRecordDto } from './dto/create-record.dto';
import {
  FilterRecordDto,
  RecordSortBy,
  RecordSortOrder,
} from './dto/filter-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import {
  RecordResponse,
  RecordsPaginationResponse,
  RecordsService,
} from './records.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Records')
@ApiBearerAuth()
@ApiConsumes('application/json')
@ApiProduces('application/json')
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new financial record (Admin only)' })
  @ApiBody({ type: CreateRecordDto })
  @ApiResponse({
    status: 201,
    description: 'Financial record created successfully',
    schema: {
      example: {
        data: {
          message: 'Resource created successfully',
        },
        statusCode: 201,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — check request body or query params',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bad Request',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — Admin only',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  async create(
    @Body() createRecordDto: CreateRecordDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RecordResponse> {
    return this.recordsService.create(createRecordDto, req.user.id);
  }

  @Get()
  @Roles(Role.analyst, Role.admin)
  @ApiOperation({
    summary: 'List financial records with filters and pagination (Analyst, Admin)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['income', 'expense'],
    description: 'Filter by record type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'Salary',
    description: 'Filter by exact category',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-01-01',
    description: 'Filter records from this ISO date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-12-31',
    description: 'Filter records until this ISO date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'rent',
    description: 'Case-insensitive search across category and notes',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: RecordSortBy,
    example: RecordSortBy.date,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: RecordSortOrder,
    example: RecordSortOrder.desc,
    description: 'Sort direction',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of records per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial records returned with pagination and filters',
    schema: {
      example: {
        data: {
          message: 'Request successful',
        },
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — check request body or query params',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bad Request',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — Analyst and Admin only',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  async findAll(
    @Query() filterRecordDto: FilterRecordDto,
  ): Promise<RecordsPaginationResponse> {
    return this.recordsService.findAll(filterRecordDto);
  }

  @Get(':id')
  @Roles(Role.analyst, Role.admin)
  @ApiOperation({ summary: 'Get a single financial record by ID (Analyst, Admin)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '3a44b7b4-4df4-4fcd-bf95-81d094b3e63f',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial record returned successfully',
    schema: {
      example: {
        data: {
          message: 'Request successful',
        },
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — Analyst and Admin only',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found or has been soft-deleted',
    schema: {
      example: {
        statusCode: 404,
        message: 'Resource not found',
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<RecordResponse> {
    return this.recordsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Update a financial record (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '3a44b7b4-4df4-4fcd-bf95-81d094b3e63f',
  })
  @ApiBody({ type: UpdateRecordDto })
  @ApiResponse({
    status: 200,
    description: 'Financial record updated successfully',
    schema: {
      example: {
        data: {
          message: 'Request successful',
        },
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — check request body or query params',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bad Request',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — Admin only',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found or has been soft-deleted',
    schema: {
      example: {
        statusCode: 404,
        message: 'Resource not found',
        error: 'Not Found',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
  ): Promise<RecordResponse> {
    return this.recordsService.update(id, updateRecordDto);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Soft-delete a financial record (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '3a44b7b4-4df4-4fcd-bf95-81d094b3e63f',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial record soft-deleted successfully',
    schema: {
      example: {
        data: {
          message: 'Request successful',
        },
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — Admin only',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Resource not found or has been soft-deleted',
    schema: {
      example: {
        statusCode: 404,
        message: 'Resource not found',
        error: 'Not Found',
      },
    },
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ id: string; isDeleted: boolean }> {
    return this.recordsService.remove(id);
  }
}
