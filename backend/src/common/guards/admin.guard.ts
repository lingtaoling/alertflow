import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * AdminGuard ensures the authenticated user has the 'admin' role.
 * Must be used AFTER JwtAuthGuard so request.role is already populated.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const role = (request as any).role;

    if (role !== 'admin') {
      throw new ForbiddenException(
        'Admin role required to perform this action.',
      );
    }

    return true;
  }
}
