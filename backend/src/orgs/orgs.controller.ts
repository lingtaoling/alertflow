import { Controller, Post, Get, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';

@ApiTags('Organizations')
@Controller('orgs')
export class OrgsController {
  private readonly logger = new Logger(OrgsController.name);

  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization (tenant)' })
  @ApiResponse({ status: 201, description: 'Organization created' })
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
