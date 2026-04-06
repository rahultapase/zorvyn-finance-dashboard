import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@ApiConsumes('application/json')
@ApiProduces('application/json')
@Controller()
export class AppController {
  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and reachable',
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
    status: 500,
    description: 'Unexpected server error while checking health status',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  getHealth(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
