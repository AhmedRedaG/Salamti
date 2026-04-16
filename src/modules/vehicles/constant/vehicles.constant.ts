import { Prisma } from '../../../../generated/prisma/client';

export const vehicleFindOneInclude: Prisma.VehicleInclude = {
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
  obus: {
    select: {
      id: true,
      name: true,
      version: true,
      instNumber: true,
      simCardNumber: true,
      status: true,
      isValid: true,
    },
  },
};
