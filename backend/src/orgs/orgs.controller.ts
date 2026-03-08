import { Controller, Post, Get, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Organizations')
@Controller('orgs')
export class OrgsController {
  private readonly logger = new Logger(OrgsController.name);

  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization (admin only)' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 409, description: 'Organization name already exists' })
  async create(@Body() dto: CreateOrgDto) {
    return this.orgsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  async findAll() {
    return this.orgsService.findAll();
  }
}
