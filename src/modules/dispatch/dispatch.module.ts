import { Module } from '@nestjs/common';
import { DispatchGateway } from './dispatch.gateway';
import { DispatchService } from './dispatch.service';
import { AuthModule } from '../auth/auth.module';
import { ParamedicsModule } from '../paramedics/paramedics.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AuthModule, ParamedicsModule, NotificationModule],
  providers: [DispatchGateway, DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
