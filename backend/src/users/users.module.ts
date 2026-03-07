import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TenantGuard } from '../common/guards/tenant.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, TenantGuard],
  exports: [UsersService],
})
export class UsersModule {}
