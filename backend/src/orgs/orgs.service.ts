import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';

@Injectable()
export class OrgsService {
  private readonly logger = new Logger(OrgsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrgDto) {
    this.logger.log(`Creating organization: ${dto.name}`);

    const existing = await this.prisma.organization.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Organization with name "${dto.name}" already exists`);
    }

    const org = await this.prisma.organization.create({
      data: { name: dto.name },
    });

    this.logger.log(`Organization created: ${org.id} (${org.name})`);
    return org;
  }

  async findAll() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true, alerts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true, alerts: true } },
      },
    });
  }
}
