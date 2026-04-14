import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthService {
  private googleClientId!: string;
  private googleClient!: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.googleClientId = this.configService.get<string>(
      'googleOAuth.clientId',
    )!;
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async verifyGoogleToken(googleToken: string): Promise<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
  }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: this.googleClientId,
      });

      const payload = ticket.getPayload()!;

      if (!payload.email_verified)
        throw new UnauthorizedException('auth.GOOGLE_EMAIL_NOT_VERIFIED');

      return {
        googleId: payload.sub!,
        email: payload.email!,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        isVerified: true,
      };
    } catch {
      throw new UnauthorizedException('auth.INVALID_GOOGLE_TOKEN');
    }
  }
}
