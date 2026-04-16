import { Prisma } from '../../../../generated/prisma/client';

export const emergencyContactFindOneInclude: Prisma.EmergencyContactInclude = {
  driver: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          image: true,
          isActive: true,
        },
      },
    },
  },
};
