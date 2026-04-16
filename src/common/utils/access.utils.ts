import { UnauthorizedException } from '@nestjs/common';
import { CurrentRoles } from '../../../generated/prisma/enums';
import { JwtPayload } from '../../types/auth.types';

export function checkUserCanAccess(
  userPayload: JwtPayload,
  targetUserId: string,
  canAccessRoles: CurrentRoles | CurrentRoles[] = CurrentRoles.ADMIN,
) {
  if (userPayload.sub !== targetUserId) {
    // only users with the specified roles can access the content if they are not the owner
    // by default only admins can access the content
    if (!canAccessRoles.includes(userPayload.ur!)) {
      throw new UnauthorizedException('auth.UNAUTHORIZED_ACCESS');
    }
  }
}
