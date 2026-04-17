import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthAttempt, Platform } from '../../../generated/prisma/browser';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AuthUtilsService } from './auth-utils.service';
import {
  AuthAttemptTypes,
  JwtPayload,
  UserSessionPayload,
} from '../../types/auth.types';
import { AuthAttemptConfig, OtpConfig } from '../../types/config.types';
import { UsersService } from '../users/users.service';
import { Prisma } from '../../../generated/prisma/client';
import { RolesService } from '../roles/roles.service';
import { userLoginSelect } from '../users/constant/users.constant';

@Injectable()
export class AuthHelperService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly roleService: RolesService,
  ) {}

  // return user in case of invalid password to increment login attempt
  async validateUserCredentials(email: string, password: string) {
    // check user exists and is active
    const user = await this.userService.findOneByEmail(email, userLoginSelect);
    if (!user || !user.isActive) {
      return { user: null, isValid: false };
    }

    // check if google account
    if (!user.passwordHash) {
      throw new ForbiddenException('auth.GOOGLE_ACCOUNT');
    }

    // validate password
    const isValidPassword = await this.authUtilsService.validatePassword(
      password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      return { user, isValid: false };
    }

    return { user, isValid: true };
  }

  // increment or delete auth attempts
  async validateAuthAttempts(
    userId: string,
    authType: AuthAttemptTypes,
    isValid: boolean,
  ) {
    // get auth attempt records
    const authAttempt = (await this.prismaService.authAttempt.findUnique({
      where: { userId },
    })) as AuthAttempt;

    // check if limit already exceeded and deactivate the user
    const { maxAttempts } = this.configService.get<AuthAttemptConfig>(
      `auth.${authType}`,
    )!;
    if (authAttempt[authType] >= maxAttempts) {
      await this.userService.deactivate(userId);
      throw new ForbiddenException('auth.TOO_MANY_ATTEMPTS');
    }

    // reset attempts on valid login or increment on invalid login
    if (isValid) {
      await this.prismaService.authAttempt.update({
        where: { id: authAttempt.id },
        data: {
          login: 0,
          reset: 0,
          sendOtp: 0,
        },
      });
    } else {
      await this.prismaService.authAttempt.update({
        where: { id: authAttempt.id },
        data: {
          [authType]: {
            increment: 1,
          },
        },
      });
    }
  }

  async validateUserSession(
    payload: JwtPayload,
    refreshToken: string,
    platform: Platform,
  ) {
    const session = await this.prismaService.userSession.findFirst({
      where: { userId: payload.sub, refreshToken },
    });
    // reuse detection
    if (!session) {
      await this.prismaService.userSession.updateMany({
        where: { userId: payload.sub },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('auth.SESSION_REUSE_DETECTED');
    }

    // check if session is revoked
    if (session.isRevoked) {
      throw new UnauthorizedException('auth.SESSION_REVOKED');
    }

    // validate user role
    const userRole = await this.roleService.findOrThrow({ name: payload.ur });
    if (
      !userRole.isActive ||
      (platform === Platform.WEB && !userRole.canAccessWeb)
    ) {
      throw new ForbiddenException('auth.FORBIDDEN_ROLE');
    }
  }

  async createOrUpdateUserSession(data: UserSessionPayload) {
    // create or update user session
    const expiresAt = this.authUtilsService.getRefreshTokenExpiryDate();
    try {
      await this.prismaService.userSession.upsert({
        where: {
          userId_deviceId: {
            userId: data.userId,
            deviceId: data.deviceId,
          },
        },
        update: {
          refreshToken: data.refreshToken,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          deviceToken: data.deviceToken,
          platform: data.platform,
          isRevoked: false,
          expiresAt,
        },
        create: {
          userId: data.userId,
          refreshToken: data.refreshToken,
          deviceId: data.deviceId,
          deviceToken: data.deviceToken,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          platform: data.platform,
          expiresAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('auth.DEVICE_ALREADY_LOGGED_IN');
      }
      throw error;
    }
  }

  // revoke one or all user sessions depending on deviceId presence
  async revokeUserSessions(userId: string, deviceId: string | undefined) {
    if (deviceId) {
      await this.prismaService.userSession.update({
        where: { userId_deviceId: { userId, deviceId } },
        data: { isRevoked: true },
      });
    } else {
      await this.prismaService.userSession.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }

  // clean expired user sessions
  async cleanExpiredUsersSessions() {
    await this.prismaService.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // validate send ability to send new otp
  async validateSendOtpAttempts(userId: string) {
    // get auth attempt records
    const authAttempt = (await this.prismaService.authAttempt.findUnique({
      where: { userId },
    })) as AuthAttempt;

    // send up to (number) of otps without limit
    const withoutLimitCount = this.configService.get<number>(
      'otp.withoutLimitCount',
    )!;
    if (authAttempt.sendOtp <= withoutLimitCount) {
      return;
    }

    // validate send otp attempts limit
    this.validateSendOtpAttemptsLimit(
      authAttempt.sendOtp,
      authAttempt.updatedAt,
    );
  }

  // validate send new otp limit time
  private validateSendOtpAttemptsLimit(
    attemptsCount: number,
    lastAttemptAt: Date,
  ): void {
    const { maxAttempts, coolDown, maxCoolDown, withoutLimitCount } =
      this.configService.get<OtpConfig>('otp')!;
    const now = new Date();

    // check if limit already exceeded
    if (attemptsCount >= maxAttempts) {
      throw new ForbiddenException('auth.TOO_MANY_ATTEMPTS');
    }

    // calculate lock until time based on exponential backoff
    const lockUntil = new Date(
      lastAttemptAt.getTime() +
        Math.min(
          coolDown * 2 ** (attemptsCount - withoutLimitCount - 1),
          maxCoolDown,
        ),
    );
    if (lockUntil > now) {
      throw new ForbiddenException('auth.TOO_MANY_ATTEMPTS_WITH_RETRY');
    }
  }

  // generate otp record and save to db
  async generateOtp(userId: string) {
    const expiresInMS = this.configService.get<number>('otp.expiresInMS')!;
    const expiresAt = new Date(Date.now() + expiresInMS);
    const code = this.authUtilsService.generateOtpCode();

    await this.prismaService.otp.create({
      data: {
        code,
        userId,
        expiresAt,
      },
    });
    await this.prismaService.authAttempt.update({
      where: { userId },
      data: {
        sendOtp: {
          increment: 1,
        },
      },
    });

    return code;
  }

  // validate otp code
  async validateOtp(userId: string, code: number): Promise<boolean> {
    // find otp record
    const otpRecord = await this.prismaService.otp.findFirst({
      where: {
        code,
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return false;
    }

    // delete all otp records after successful validation
    await this.prismaService.otp.deleteMany({
      where: { userId },
    });
    return true;
  }

  async cleanExpiredOtps() {
    await this.prismaService.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
