import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload, JwtTypes } from '../../types/auth.types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig, OtpConfig } from '../../types/config.types';
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

@Injectable()
export class AuthUtilsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async generateAuthTokens(payload: JwtPayload) {
    return await Promise.all([
      this.generateToken(payload, JwtTypes.ACCESS),
      this.generateToken(payload, JwtTypes.REFRESH),
    ]);
  }

  async generateToken(payload: JwtPayload, tokenType: JwtTypes) {
    const { secret, expiresIn } = this.configService.get<JwtConfig>(
      `jwt.${tokenType}`,
    )!;

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    return token;
  }

  async verifyToken(token: string, tokenType: JwtTypes): Promise<JwtPayload> {
    const secret = this.configService.get(`jwt.${tokenType}.secret`) as string;
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('auth.INVALID_OR_EXPIRED_TOKEN');
    }

    return payload;
  }

  // get refresh token expiry date
  getRefreshTokenExpiryDate(): Date {
    const expiresIn = this.configService.get<number>(
      'jwt.refresh.expiresInMS',
    )!;
    // subtract 10 seconds to avoid edge cases
    const expiryDate = new Date(Date.now() + expiresIn - 10000);
    return expiryDate;
  }

  async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<string>('bcrypt.rounds')!;
    return await bcrypt.hash(password, rounds);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // generate random otp code within configured range
  generateOtpCode(): number {
    const { min, max } = this.configService.get<OtpConfig>('otp')!;
    return randomInt(min, +max);
  }
}
