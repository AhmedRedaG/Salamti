import { Module } from '@nestjs/common';
import { AccidentResponsesService } from './accident-responses.service';
import { AccidentResponsesController } from './accident-responses.controller';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, NotificationModule, EmailModule],
  controllers: [AccidentResponsesController],
  providers: [AccidentResponsesService],
})
export class AccidentResponsesModule {}
