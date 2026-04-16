import { Prisma } from '../../../../generated/prisma/client';

export const roleFindOneSelect: Prisma.RoleSelect = {
  id: true,
  name: true,
  canAccessWeb: true,
  description: true,
  isActive: true,
  createdAt: true,
  users: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      image: true,
    },
  },
};
