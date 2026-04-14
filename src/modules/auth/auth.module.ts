import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthUtilsService } from './auth-utils.service';
import { AuthHelperService } from './auth-helper.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';
import { CookieUtils } from '../../common/utils/cookie.utils';
import { GoogleAuthModule } from '../../integrations/google-auth/google-auth.module';
import { EmailModule } from '../email/email.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
    NotificationModule,
    GoogleAuthModule,
    EmailModule,
    RolesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthUtilsService, AuthHelperService, CookieUtils],
  exports: [AuthUtilsService, AuthHelperService],
})
export class AuthModule {}
