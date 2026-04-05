import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_PUBLIC_SELECT: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersPaginationResponse {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          password: hashedPassword,
          ...(createUserDto.role ? { role: createUserDto.role } : {}),
        },
        select: USER_PUBLIC_SELECT,
      });

      return user;
    } catch (error: unknown) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async findAll(page: number, limit: number): Promise<UsersPaginationResponse> {
    this.validatePagination(page, limit);

    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: USER_PUBLIC_SELECT,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorUserId: string,
  ): Promise<UserResponse> {
    this.ensureNotSelfModification(id, actorUserId);
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: USER_PUBLIC_SELECT,
    });

    return user;
  }

  async deactivate(id: string, actorUserId: string): Promise<UserResponse> {
    this.ensureNotSelfModification(id, actorUserId);
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_PUBLIC_SELECT,
    });

    return user;
  }

  private validatePagination(page: number, limit: number): void {
    if (page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    if (limit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }
  }

  private ensureNotSelfModification(
    targetUserId: string,
    actorUserId: string,
  ): void {
    if (targetUserId === actorUserId) {
      throw new ForbiddenException('You cannot modify your own account');
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;
    if (Array.isArray(target)) {
      return target.includes('email');
    }

    if (typeof target === 'string') {
      return target.includes('email');
    }

    return false;
  }
}
