import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUtilsService } from './auth-utils.service';
import {
  AuthAttemptTypes,
  CreateUserGoogleRegisterType,
  JwtTypes,
} from '../../types/auth.types';
import { AuthHelperService, LoginUserPayload } from './auth-helper.service';
import { VerifyOtp } from './dto/otp.dto';
import { ResetPasswordDto } from './dto/reset.dto';
import { UsersService } from '../users/users.service';
import {
  Platform,
  NotificationSlug,
  CurrentRoles,
} from '../../../generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';
import { CreateUserRegisterType } from '../../types/auth.types';
import { EmailService } from '../email/email.service';
import { GoogleAuthService } from '../../integrations/google-auth/google-auth.service';
import { AuthLoginDto, GoogleLoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly authHelperService: AuthHelperService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async register(role: CurrentRoles, dto: CreateUserRegisterType) {
    const { password, ...restData } = dto;

    console.log(dto);

    const passwordHash = await this.authUtilsService.hashPassword(password);

    const data = await this.userService.create({
      ...restData,
      passwordHash,
      role,
    });

    return data;
  }

  async googleRegister(role: CurrentRoles, dto: CreateUserGoogleRegisterType) {
    // verify and get google user data
    const googleUser = await this.googleAuthService.verifyGoogleToken(
      dto.googleToken,
    );

    const user = await this.userService.findOneByEmail(googleUser.email);
    if (!user) {
      const data = await this.userService.create({
        role,
        fullName: `${googleUser.firstName} ${googleUser.lastName}`,
        phone: dto.phone,
        email: googleUser.email,
        googleId: googleUser.googleId,
        isVerified: true,
        ...(dto.role === CurrentRoles.DRIVER && {
          age: dto.age,
          bloodType: dto.bloodType,
        }),
        ...(dto.role === CurrentRoles.PARAMEDIC && {
          employeeId: dto.employeeId,
        }),
      });

      return data;
    } else {
      if (!user.googleId)
        await this.userService.setGoogleId(user.id, googleUser.googleId);
      throw new BadRequestException('auth.USER_ALREADY_REGISTERED');
    }
  }

  async sendVerification(email: string) {
    const user = await this.userService.findOrThrow(
      { email },
      { id: true, isVerified: true, fullName: true },
    );

    if (user.isVerified) {
      throw new BadRequestException('auth.USER_ALREADY_VERIFIED');
    }

    // TODO: validate send verification attempts
    // await this.authUtilsService.validateSendVerificationAttempts(user.id);

    const verificationToken = await this.authUtilsService.generateToken(
      { sub: user.id },
      JwtTypes.VERIFICATION,
    );

    // add mail to the queue to send
    await this.emailService.sendVerifyTokenMail({
      fullName: user.fullName,
      email,
      verificationToken,
    });

    return { success: true };
  }

  async verify(verificationToken: string) {
    let userId: string;
    try {
      const { sub } = await this.authUtilsService.verifyToken(
        verificationToken,
        JwtTypes.VERIFICATION,
      );
      userId = sub;
    } catch {
      // to be handled by ejs
      return { success: false, message: 'invalid or expired token' };
    }

    const user = await this.userService.findOrThrow({ id: userId });
    if (user.isVerified) {
      // to be handled by ejs
      return { success: false, message: 'user already verified' };
    }
    await this.userService.confirmVerification(userId);

    return { success: true };
  }

  async login(
    dto: AuthLoginDto,
    ipAddress: string,
    userAgent: string,
    platform: Platform,
  ) {
    // validate and return user in case of invalid password to increment login attempt
    const { user, isValid } =
      await this.authHelperService.validateUserCredentials(
        dto.email,
        dto.password,
      );

    if (user) {
      // chick user is active
      if (!user.isActive) {
        throw new ForbiddenException('auth.USER_NOT_ACTIVE');
      }

      // chick role access
      if (
        !user.role.isActive ||
        (platform === Platform.WEB && !user.role.canAccessWeb)
      ) {
        throw new ForbiddenException('auth.FORBIDDEN_ROLE');
      }

      // increment or delete auth attempts
      await this.authHelperService.validateAuthAttempts(
        user.id,
        AuthAttemptTypes.LOGIN,
        isValid,
      );
    }

    if (!user || !isValid) {
      throw new UnauthorizedException('auth.INVALID_CREDENTIALS');
    }

    // generate new tokens
    const [accessToken, refreshToken] =
      await this.authUtilsService.generateAuthTokens({
        sub: user.id,
        ur: user.role.name,
        did: dto.deviceId,
      });

    // create or update user session
    const { deviceId, deviceToken } = dto;
    await this.authHelperService.createOrUpdateUserSession({
      userId: user.id,
      refreshToken,
      deviceId,
      deviceToken,
      platform,
      ipAddress,
      userAgent,
    });

    // notify user of new login detected
    await this.notificationService.queueNotification({
      recipientId: user.id,
      typeSlug: NotificationSlug.NEW_LOGIN_DETECTED,
      referenceId: user.id,
      referenceTable: 'users',
      variables: {
        time: new Date().toLocaleString('en-EG', {
          timeZone: 'Africa/Cairo',
        }),
        platform,
        ip_address: ipAddress,
      },
    });

    // exclude password hash from user data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userData } = user;

    return {
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    };
  }

  async googleLogin(
    dto: GoogleLoginDto,
    ipAddress: string,
    userAgent: string,
    platform: Platform,
  ) {
    // verify and get google user data
    const googleUser = await this.googleAuthService.verifyGoogleToken(
      dto.googleToken,
    );

    const user = await this.userService.findOneByEmail(
      googleUser.email,
      LoginUserPayload,
    );
    if (!user) {
      throw new BadRequestException('auth.USER_NOT_REGISTERED');
    }

    // set google id if not exists
    if (!user.googleId)
      await this.userService.setGoogleId(user.id, googleUser.googleId);

    // generate new tokens
    const [accessToken, refreshToken] =
      await this.authUtilsService.generateAuthTokens({
        sub: user.id,
        ur: user.role.name,
        did: dto.deviceId,
      });

    // create or update user session
    const { deviceId, deviceToken } = dto;
    await this.authHelperService.createOrUpdateUserSession({
      userId: user.id,
      refreshToken,
      deviceId,
      deviceToken,
      platform,
      ipAddress,
      userAgent,
    });

    // notify user of new login detected
    await this.notificationService.queueNotification({
      recipientId: user.id,
      typeSlug: NotificationSlug.NEW_LOGIN_DETECTED,
      referenceId: user.id,
      referenceTable: 'users',
      variables: {
        time: new Date().toLocaleString('en-EG', {
          timeZone: 'Africa/Cairo',
        }),
        platform,
        ip_address: ipAddress,
      },
    });

    // exclude password hash from user data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userData } = user;

    return {
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(
    oldRefreshToken: string,
    ipAddress: string,
    userAgent: string,
    platform: Platform,
  ) {
    // verify refresh token
    const oldPayload = await this.authUtilsService.verifyToken(
      oldRefreshToken,
      JwtTypes.REFRESH,
    );

    // to avoid iat and exp issues, create new payload
    const payload = {
      sub: oldPayload.sub,
      ur: oldPayload.ur,
      did: oldPayload.did,
    };

    // validate user session
    await this.authHelperService.validateUserSession(
      payload,
      oldRefreshToken,
      platform,
    );

    // generate new tokens
    const [accessToken, refreshToken] =
      await this.authUtilsService.generateAuthTokens(payload);

    // update user session with new refresh token
    await this.authHelperService.createOrUpdateUserSession({
      userId: payload.sub,
      deviceId: payload.did!,
      refreshToken,
      ipAddress,
      userAgent,
      platform,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  async sendOtp(email: string) {
    // find user by email
    const user = await this.userService.findOneByEmail(email, {
      id: true,
      fullName: true,
      isActive: true,
      email: true,
    });

    if (user && user.isActive) {
      // validate send otp attempts
      await this.authHelperService.validateSendOtpAttempts(user.id);

      // generate otp record and save to db
      const code = await this.authHelperService.generateOtp(user.id);

      // add mail to the queue to send
      await this.emailService.sendResetOtpMail({
        fullName: user.fullName,
        email: user.email,
        code,
      });
    }

    // for more security
    return {
      success: true,
    };
  }

  async verifyOtp(dto: VerifyOtp) {
    // find user by email
    const user = await this.userService.findOrThrow(
      {
        email: dto.email,
        isActive: true,
      },
      {
        id: true,
        email: true,
        isActive: true,
      },
    );

    // validate otp code
    const isValid = await this.authHelperService.validateOtp(user.id, dto.code);

    // increment or delete reset attempts
    await this.authHelperService.validateAuthAttempts(
      user.id,
      AuthAttemptTypes.RESET,
      isValid,
    );

    if (!isValid) {
      throw new UnauthorizedException('auth.INVALID_OR_EXPIRED_OTP');
    }

    // generate reset token
    const resetToken = await this.authUtilsService.generateToken(
      {
        sub: user.id,
      },
      JwtTypes.RESET,
    );

    // set reset token to user record
    await this.userService.setResetToken(user.id, resetToken);

    return {
      success: true,
      data: { resetToken },
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // verify reset token
    const { sub: userId } = await this.authUtilsService.verifyToken(
      dto.resetToken,
      JwtTypes.RESET,
    );

    // find user or throw
    const user = await this.userService.findOrThrow(
      {
        id: userId,
        isActive: true,
      },
      {
        id: true,
        resetToken: true,
        isActive: true,
      },
    );

    // check reset token matches the one saved in db
    if (user.resetToken !== dto.resetToken) {
      throw new UnauthorizedException('auth.INVALID_OR_EXPIRED_RESET_TOKEN');
    }

    // hash and set new password to user
    await this.userService.setPassword(userId, dto.password);

    // clear reset token from user record
    await this.userService.clearResetToken(userId);

    // notify user of password change
    await this.notificationService.queueNotification({
      recipientId: userId,
      typeSlug: NotificationSlug.PASSWORD_CHANGED,
      referenceId: userId,
      referenceTable: 'users',
    });

    return {
      success: true,
    };
  }

  async logout(userId: string, deviceId: string) {
    // delete user session
    await this.authHelperService.revokeUserSessions(userId, deviceId);
    return {
      success: true,
    };
  }
}
