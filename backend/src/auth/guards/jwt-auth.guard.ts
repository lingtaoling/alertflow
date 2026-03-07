import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard validates the JWT and attaches userId/orgId to the request.
 * Use with @UseGuards(JwtAuthGuard) on protected routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    if (result) {
      const request = context.switchToHttp().getRequest();
      const user = request.user as { userId: string; orgId: string; email: string } | undefined;
      if (user) {
        request.orgId = user.orgId;
        request.userId = user.userId;
      }
    }
    return result as boolean;
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
