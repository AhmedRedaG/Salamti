import { Module } from '@nestjs/common';
import { DispatchGateway } from './dispatch.gateway';
import { DispatchService } from './dispatch.service';
import { AuthModule } from '../auth/auth.module';
import { ParamedicsModule } from '../paramedics/paramedics.module';

@Module({
  imports: [AuthModule, ParamedicsModule],
  providers: [DispatchGateway, DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
