import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  { data: T; statusCode: number }
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ data: T; statusCode: number }> {
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode: response.statusCode,
      })),
    );
  }
}
