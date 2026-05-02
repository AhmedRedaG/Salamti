import { Module } from '@nestjs/common';
import { DispatchGateway } from './dispatch.gateway';
import { DispatchService } from './dispatch.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DispatchGateway, DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
