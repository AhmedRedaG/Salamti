import { Module } from '@nestjs/common';
import { ObusService } from './obus.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ObusController } from './obus.controller';
import { UsersModule } from '../users/users.module';
import { ObuMqttModule } from '../obu-mqtt/obu-mqtt.module';

@Module({
  imports: [VehiclesModule, UsersModule, ObuMqttModule],
  controllers: [ObusController],
  providers: [ObusService],
  exports: [ObusService],
})
export class ObusModule {}
