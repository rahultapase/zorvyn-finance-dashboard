import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
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
}
