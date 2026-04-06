import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserResponse,
  UsersPaginationResponse,
  UsersService,
} from './users.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Users')
@ApiBearerAuth()
@ApiConsumes('application/json')
@ApiProduces('application/json')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
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
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
    schema: {
      example: {
        statusCode: 409,
        message: 'Conflict',
        error: 'Conflict',
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'List all users with pagination (Admin only)' })
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
    description: 'Number of users per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated users returned successfully',
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
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<UsersPaginationResponse> {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Get a single user by ID (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '3a44b7b4-4df4-4fcd-bf95-81d094b3e63f',
  })
  @ApiResponse({
    status: 200,
    description: 'User returned successfully',
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
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Update a user by ID (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '3a44b7b4-4df4-4fcd-bf95-81d094b3e63f',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
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
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.update(id, updateUserDto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Deactivate a user (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the resource',
    example: '3a44b7b4-4df4-4fcd-bf95-81d094b3e63f',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
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
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    return this.usersService.deactivate(id, req.user.id);
  }
}
