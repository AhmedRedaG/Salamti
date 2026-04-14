import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [forwardRef(() => AuthModule), NotificationModule, RolesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
