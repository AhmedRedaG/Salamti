import { Module } from '@nestjs/common';
import { ParamedicsService } from './paramedics.service';
import { ParamedicsController } from './paramedics.controller';

@Module({
  controllers: [ParamedicsController],
  providers: [ParamedicsService],
  exports: [ParamedicsService],
})
export class ParamedicsModule {}
