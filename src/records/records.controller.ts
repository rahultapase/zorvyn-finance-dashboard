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
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateRecordDto } from './dto/create-record.dto';
import { FilterRecordDto } from './dto/filter-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import {
  RecordResponse,
  RecordsPaginationResponse,
  RecordsService,
} from './records.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @Roles(Role.admin)
  async create(
    @Body() createRecordDto: CreateRecordDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RecordResponse> {
    return this.recordsService.create(createRecordDto, req.user.id);
  }

  @Get()
  @Roles(Role.analyst, Role.admin)
  async findAll(
    @Query() filterRecordDto: FilterRecordDto,
  ): Promise<RecordsPaginationResponse> {
    return this.recordsService.findAll(filterRecordDto);
  }

  @Get(':id')
  @Roles(Role.analyst, Role.admin)
  async findOne(@Param('id') id: string): Promise<RecordResponse> {
    return this.recordsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.admin)
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
  ): Promise<RecordResponse> {
    return this.recordsService.update(id, updateRecordDto);
  }

  @Delete(':id')
  @Roles(Role.admin)
  async remove(@Param('id') id: string): Promise<{ id: string; isDeleted: boolean }> {
    return this.recordsService.remove(id);
  }
}