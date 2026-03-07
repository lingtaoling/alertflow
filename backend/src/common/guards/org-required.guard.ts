import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * OrgRequiredGuard ensures the user has an org (orgId is not null) for normal users.
 * Admin users (role === 'admin') bypass the org check and can access get-all routes.
 * Use after JwtAuthGuard for routes that require tenant context.
 */
@Injectable()
export class OrgRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const orgId = (request as any).orgId;
    const role = (request as any).role;

    // Admin: no org check needed for get-all alerts/users
    if (role === 'admin') {
      return true;
    }

    // Normal user: must have org
    if (!orgId) {
      throw new ForbiddenException(
        'Organization required. Please select or create an organization.',
      );
    }

    return true;
  }
}
