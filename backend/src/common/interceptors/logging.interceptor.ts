import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { userId: string; orgId: string | null };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name) private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.info(
          {
            method: req.method,
            path: req.url,
            userId: req.user?.userId,
            orgId: req.user?.orgId,
            duration: `${duration}ms`,
          },
          'request completed',
        );
      }),
    );
  }
}
