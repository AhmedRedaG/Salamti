import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class CookieUtils {
  constructor(private configService: ConfigService) {}

  createRefreshTokenCookie(refreshToken: string, res: Response) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite:
        this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      path: this.configService.get('auth.path'),
      maxAge: this.configService.get('jwt.refresh.expiresInMS'),
    });
  }

  clearRefreshTokenCookie = (res: Response) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      path: this.configService.get('auth.path'),
    });
  };
}
