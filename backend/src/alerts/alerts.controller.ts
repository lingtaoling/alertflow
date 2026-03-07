import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, UpdateAlertStatusDto, ListAlertsQueryDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRequiredGuard } from '../common/guards/org-required.guard';
import { OrgId, UserId } from '../common/decorators/tenant.decorator';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, OrgRequiredGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new alert (scoped to authenticated org)' })
  @ApiResponse({ status: 201, description: 'Alert created' })
  async create(
    @OrgId() orgId: string | null,
    @UserId() userId: string,
    @Body() dto: CreateAlertDto,
  ) {
    if (!orgId) {
      throw new BadRequestException('Organization required to create alerts');
    }
    return this.alertsService.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List alerts for the authenticated org (with optional status filter)' })
  @ApiQuery({ name: 'status', required: false, enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(
    @OrgId() orgId: string | null,
    @Query() query: ListAlertsQueryDto,
  ) {
    return this.alertsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single alert (org-scoped)' })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @OrgId() orgId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!orgId) {
      throw new BadRequestException('Organization required to view alert');
    }
    return this.alertsService.findOne(orgId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update alert status (NEW → ACKNOWLEDGED → RESOLVED)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Status updated, audit event created' })
  @ApiResponse({ status: 400, description: 'Invalid workflow transition' })
  async updateStatus(
    @OrgId() orgId: string | null,
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlertStatusDto,
  ) {
    if (!orgId) {
      throw new BadRequestException('Organization required to update alert');
    }
    return this.alertsService.updateStatus(orgId, userId, id, dto);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get audit trail for an alert' })
  @ApiParam({ name: 'id', type: String })
  async getEvents(
    @OrgId() orgId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!orgId) {
      throw new BadRequestException('Organization required to view alert events');
    }
    return this.alertsService.getEvents(orgId, id);
  }
}
