import { Module } from '@nestjs/common';
import { AccidentResponsesService } from './accident-responses.service';
import { AccidentResponsesController } from './accident-responses.controller';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [AccidentResponsesController],
  providers: [AccidentResponsesService],
})
export class AccidentResponsesModule {}
