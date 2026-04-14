import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentRoles } from '../../../generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    // get user from request
    const userRole = context.switchToHttp().getRequest()?.user
      ?.ur as CurrentRoles;

    // must have the required role
    const allowed = required.includes(userRole);

    if (!allowed) {
      throw new ForbiddenException('auth.FORBIDDEN_ROLE');
    }

    return true;
  }
}
