import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    this.logger.log(`Creating user: ${dto.email} in org: ${dto.orgId}`);

    // Verify org exists
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.orgId },
    });
    if (!org) {
      throw new NotFoundException(`Organization ${dto.orgId} not found`);
    }

    // Check email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: dto.password,
        org: { connect: { id: dto.orgId } },
      },
      select: {
        id: true,
        email: true,
        name: true,
        orgId: true,
        createdAt: true,
        org: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`User created: ${user.id} (${user.email})`);
    return user;
  }

  async findByOrg(orgId: string | null) {
    const users = await this.prisma.user.findMany({
      where: orgId ? { orgId } : {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
        createdAt: true,
        org: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ org, ...u }) => ({ ...u, organization: org ?? undefined }));
  }
}
