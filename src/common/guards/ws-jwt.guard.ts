import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthUtilsService } from '../../modules/auth/auth-utils.service';
import { JwtTypes } from '../../types/auth.types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly authUtilsService: AuthUtilsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    try {
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('auth.PROVIDE_TOKEN');
      }

      // verify token and attach user to socket client
      const payload = await this.authUtilsService.verifyToken(
        token,
        JwtTypes.ACCESS,
      );

      client.data.user = payload;

      return true;
    } catch (error) {
      this.logger.warn(`ws jwt guard failed: ${(error as Error).message}`);
      throw new WsException('auth.INVALID_OR_EXPIRED_TOKEN');
    }
  }

  private extractToken(client: Socket): string | undefined {
    return (client.handshake.auth?.token as string) || undefined;
  }
}
