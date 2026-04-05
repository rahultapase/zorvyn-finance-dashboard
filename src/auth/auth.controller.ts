import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }
}