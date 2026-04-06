import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Admin User',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Registered user email address',
    example: 'admin@finance.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User account password (minimum 8 characters)',
    example: 'Admin123!',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: 'Role assigned to the user',
    enum: Role,
    example: 'analyst',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
