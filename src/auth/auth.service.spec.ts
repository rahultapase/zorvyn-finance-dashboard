import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const compareMock = bcrypt.compare as unknown as jest.Mock<
    Promise<boolean>,
    [string, string]
  >;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('login returns accessToken and user for valid credentials', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@finance.com',
      role: Role.admin,
      isActive: true,
      password: 'hashed-password',
    });
    compareMock.mockResolvedValue(true);
    mockJwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login({
      email: 'admin@finance.com',
      password: 'Admin123!',
    });

    expect(result).toEqual({
      accessToken: 'jwt-token',
      user: {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@finance.com',
        role: Role.admin,
      },
    });
    expect(compareMock).toHaveBeenCalledWith('Admin123!', 'hashed-password');
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: 'admin-id',
      email: 'admin@finance.com',
      role: Role.admin,
    });
  });

  it('login throws UnauthorizedException for wrong password', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@finance.com',
      role: Role.admin,
      isActive: true,
      password: 'hashed-password',
    });
    compareMock.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'admin@finance.com',
        password: 'WrongPassword123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });

  it('login throws UnauthorizedException for unknown email', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'unknown@finance.com',
        password: 'Admin123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compareMock).not.toHaveBeenCalled();
    expect(mockJwtService.signAsync).not.toHaveBeenCalled();
  });
});
