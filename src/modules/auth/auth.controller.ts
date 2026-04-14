import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Res,
  Get,
  Param,
  Render,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtp, VerifyOtp } from './dto/otp.dto';
import { ResetPasswordDto } from './dto/reset.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Private } from '../../common/decorators/private.decorator';
import { CurrentRoles, Platform } from '../../../generated/prisma/enums';
import type { Response } from 'express';
import { Cookie } from '../../common/decorators/cookie.decorator';
import { CookieUtils } from '../../common/utils/cookie.utils';
import { ParseEmailPipe } from '../../common/pipes/email.pipe';
import {
  AuthRegisterDriverDto,
  AuthRegisterParamedicDto,
  GoogleRegisterDriverDto,
  GoogleRegisterParamedicDto,
} from './dto/register.dto';
import { AuthLoginDto, GoogleLoginDto } from './dto/login.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieUtils: CookieUtils,
  ) {}

  @Post('register/driver')
  registerDriver(@Body() dto: AuthRegisterDriverDto) {
    return this.authService.register(CurrentRoles.DRIVER, dto);
  }

  @Post('register/paramedic')
  registerParamedic(@Body() dto: AuthRegisterParamedicDto) {
    return this.authService.register(CurrentRoles.PARAMEDIC, dto);
  }

  @Get('verify-mail/:email')
  sendVerification(@Param('email', ParseEmailPipe) email: string) {
    return this.authService.sendVerification(email);
  }

  @Get('verify/:verificationToken')
  @Render('verify-result')
  verify(@Param('verificationToken') verificationToken: string) {
    return this.authService.verify(verificationToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: AuthLoginDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
  ) {
    return this.authService.login(dto, ipAddress, userAgent, Platform.MOBILE);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login-web')
  async loginWeb(
    @Body() dto: AuthLoginDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { success, data } = await this.authService.login(
      dto,
      ipAddress,
      userAgent,
      Platform.WEB,
    );

    this.cookieUtils.createRefreshTokenCookie(data.refreshToken, res);

    // remove refreshToken from response for web
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refreshToken, ...rest } = data;

    return { success, data: rest };
  }

  @Post('google/register/driver')
  registerGoogleDriver(@Body() dto: GoogleRegisterDriverDto) {
    return this.authService.googleRegister(CurrentRoles.DRIVER, dto);
  }

  @Post('google/register/paramedic')
  registerGoogleParamedic(@Body() dto: GoogleRegisterParamedicDto) {
    return this.authService.googleRegister(CurrentRoles.PARAMEDIC, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google/login')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
  ) {
    return this.authService.googleLogin(
      dto,
      ipAddress,
      userAgent,
      Platform.MOBILE,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refreshToken(
    @Body() dto: RefreshDto,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
      ipAddress,
      userAgent,
      Platform.MOBILE,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-web')
  async refreshTokenWeb(
    @Cookie('refreshToken') oldRefreshToken: string,
    @Ip() ipAddress: string,
    @Headers('User-Agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { success, data } = await this.authService.refresh(
      oldRefreshToken,
      ipAddress,
      userAgent,
      Platform.WEB,
    );

    this.cookieUtils.createRefreshTokenCookie(data.refreshToken, res);

    return { success, data: { accessToken: data.accessToken } };
  }

  @HttpCode(HttpStatus.OK)
  @Post('request-otp')
  sendOtp(@Body() dto: SendOtp) {
    return this.authService.sendOtp(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtp) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Private()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @CurrentUser('sub') userId: string,
    @CurrentUser('did') deviceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.cookieUtils.clearRefreshTokenCookie(res);

    return this.authService.logout(userId, deviceId);
  }
}
