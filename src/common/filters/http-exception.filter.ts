import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[] = exception.message;
    let error = HttpStatus[status] ?? 'Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const payload = exceptionResponse as ErrorPayload;
      if (payload.message !== undefined) {
        message = payload.message;
      }
      if (payload.error !== undefined) {
        error = payload.error;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}