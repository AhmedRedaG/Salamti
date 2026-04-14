import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookie = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const { cookies } = ctx.switchToHttp().getRequest();

    return data ? cookies?.[data] : cookies;
  },
);
