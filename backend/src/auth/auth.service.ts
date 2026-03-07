import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
      include: { org: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.org) {
      this.logger.warn(`User ${user.email} has no organization (org_id is null)`);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.password !== dto.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _, org: _org, ...userFields } = user;
    const org = user.org!;

    this.logger.log(`User ${user.email} logged in (org: ${org.name})`);
    return {
      user: {
        ...userFields,
        organization: { id: org.id, name: org.name },
      },
      org: { id: org.id, name: org.name, createdAt: org.createdAt },
    };
  }
}
