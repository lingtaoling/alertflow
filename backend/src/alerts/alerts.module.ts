import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { TenantGuard } from '../common/guards/tenant.guard';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, TenantGuard],
})
export class AlertsModule {}
