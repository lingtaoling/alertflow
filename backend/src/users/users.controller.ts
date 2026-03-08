import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { OrgRequiredGuard } from '../common/guards/org-required.guard';
import { OrgId } from '../common/decorators/tenant.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrgRequiredGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users in the current org (admin: all users)' })
  async findByOrg(@OrgId() orgId: string | null) {
    return this.usersService.findByOrg(orgId);
  }
}
