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

export const userLoginSelect: Prisma.UserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  isActive: true,
  isVerified: true,
  passwordHash: true,
  googleId: true,
  image: true,
  role: {
    select: {
      id: true,
      name: true,
      canAccessWeb: true,
      description: true,
      isActive: true,
    },
  },
};
