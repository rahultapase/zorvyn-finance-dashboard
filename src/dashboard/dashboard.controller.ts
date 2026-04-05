import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
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

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(Role.viewer, Role.analyst, Role.admin)
  getSummary(): Promise<DashboardSummaryResponse> {
    return this.dashboardService.getSummary();
  }

  @Get('by-category')
  @Roles(Role.analyst, Role.admin)
  getByCategory(
    @Query() filterDashboardByTypeDto: FilterDashboardByTypeDto,
  ): Promise<DashboardByCategoryItem[]> {
    return this.dashboardService.getByCategory(filterDashboardByTypeDto);
  }

  @Get('trends')
  @Roles(Role.analyst, Role.admin)
  getTrends(): Promise<DashboardTrendItem[]> {
    return this.dashboardService.getTrends();
  }

  @Get('weekly')
  @Roles(Role.viewer, Role.analyst, Role.admin)
  getWeekly(): Promise<DashboardWeeklyResponse> {
    return this.dashboardService.getWeekly();
  }

  @Get('recent')
  @Roles(Role.viewer, Role.analyst, Role.admin)
  getRecent(): Promise<DashboardRecentRecordResponse[]> {
    return this.dashboardService.getRecent();
  }
}
