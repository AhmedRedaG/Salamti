import { Module } from '@nestjs/common';
import { ObusService } from './obus.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ObusController } from './obus.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [VehiclesModule, UsersModule],
  controllers: [ObusController],
  providers: [ObusService],
})
export class ObusModule {}
