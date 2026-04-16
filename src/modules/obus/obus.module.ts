import { Module } from '@nestjs/common';
import { ObusService } from './obus.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ObusController } from './obus.controller';

@Module({
  imports: [VehiclesModule],
  controllers: [ObusController],
  providers: [ObusService],
})
export class ObusModule {}
