import {
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  ExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    const isWsError = exception instanceof WsException;
    const isHttpError = exception instanceof HttpException;
    const isAppError = isWsError || isHttpError;

    let message: any = 'system.INTERNAL_SERVER_ERROR';
    let status = 500;
    let errorName = 'ServerError';

    if (!isAppError) {
      this.logger.error(exception);
    } else {
      if (isWsError) {
        const wsError = exception as WsException;
        const errorResponse = wsError.getError();
        message =
          typeof errorResponse === 'string'
            ? errorResponse
            : (errorResponse as any).message;
        errorName = wsError.name;
        status = 400;
      } else if (isHttpError) {
        const httpError = exception as HttpException;
        const response = httpError.getResponse();
        message =
          typeof response === 'string' ? response : (response as any).message;
        errorName = httpError.name;
        status = httpError.getStatus();
      }
      this.logger.warn(
        `websocket client ${client.id} threw an error: ${errorName} S{message} ${status}`,
      );
    }

    const errorPayload = {
      success: false,
      data: {
        errorCode: status,
        errorName,
        message,
      },
    };

    client.emit('exception', errorPayload);
  }
}
