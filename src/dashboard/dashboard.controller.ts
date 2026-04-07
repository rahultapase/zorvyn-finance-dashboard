import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { FilterDashboardByTypeDto } from './dto/filter-dashboard-by-type.dto';
import { DashboardService } from './dashboard.service';
import type {
  DashboardByCategoryItem,
  DashboardRecentRecordResponse,
  DashboardSummaryResponse,
  DashboardTrendItem,
  DashboardWeeklyResponse,
} from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiConsumes('application/json')
@ApiProduces('application/json')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(Role.viewer, Role.analyst, Role.admin)
  @ApiOperation({
    summary: 'Get total income, expenses, and net balance (All roles)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary returned successfully',
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
  getSummary(): Promise<DashboardSummaryResponse> {
    return this.dashboardService.getSummary();
  }

  @Get('by-category')
  @Roles(Role.analyst, Role.admin)
  @ApiOperation({
    summary: 'Get totals grouped by category and type (Analyst, Admin)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['income', 'expense'],
    description: 'Optional type filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Category and type totals returned successfully',
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
  getByCategory(
    @Query() filterDashboardByTypeDto: FilterDashboardByTypeDto,
  ): Promise<DashboardByCategoryItem[]> {
    return this.dashboardService.getByCategory(filterDashboardByTypeDto);
  }

  @Get('trends')
  @Roles(Role.analyst, Role.admin)
  @ApiOperation({
    summary:
      'Get monthly income and expense trends for the last 6 months (Analyst, Admin)',
  })
  @ApiResponse({
    status: 200,
    description: '6-month trend data returned successfully',
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
  getTrends(): Promise<DashboardTrendItem[]> {
    return this.dashboardService.getTrends();
  }

  @Get('weekly')
  @Roles(Role.viewer, Role.analyst, Role.admin)
  @ApiOperation({
    summary:
      'Get income, expenses, and net balance for last 7 days (All roles)',
  })
  @ApiResponse({
    status: 200,
    description: '7-day dashboard totals returned successfully',
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
  getWeekly(): Promise<DashboardWeeklyResponse> {
    return this.dashboardService.getWeekly();
  }

  @Get('recent')
  @Roles(Role.viewer, Role.analyst, Role.admin)
  @ApiOperation({
    summary: 'Get 10 most recent financial records (All roles)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent records returned successfully',
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
  getRecent(): Promise<DashboardRecentRecordResponse[]> {
    return this.dashboardService.getRecent();
  }
}
