import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      success: true,
      data: {
        message: 'server is running...',
      },
    };
  }
}
