import { Prisma } from '../../../../generated/prisma/client';

export const obuFindOneInclude: Prisma.ObuInclude = {
  driver: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          image: true,
          isActive: true,
        },
      },
    },
  },
  vehicle: true,
};
