import { Prisma } from '../../../../generated/prisma/client';

export const userFindAllSelect: Prisma.UserSelect = {
  id: true,
  fullName: true,
  image: true,
  isActive: true,
  isVerified: true,
  phone: true,
  email: true,
  createdAt: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
};
