import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentWsUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const { user } = ctx.switchToWs().getClient().data;

    return data ? user?.[data] : user;
  },
);
