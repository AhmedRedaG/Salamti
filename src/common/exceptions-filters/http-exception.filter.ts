import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const isAppError = exception instanceof HttpException;

    let response: any;
    if (!isAppError) {
      this.logger.error(exception);
      response = {
        message: 'system.INTERNAL_SERVER_ERROR',
      };
    } else {
      response = (exception as any).getResponse();
    }

    const errorName = isAppError ? exception.name : 'ServerError';
    const status = isAppError ? exception.getStatus() : 500;
    const message = response.message;

    res['errorMessage'] = message;

    res.status(status).json({
      success: false,
      data: {
        errorCode: status,
        errorName,
        message,
      },
    });
  }
}
