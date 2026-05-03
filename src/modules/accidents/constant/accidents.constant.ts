import { Prisma } from '../../../../generated/prisma/client';

export const accidentFindOneInclude: Prisma.AccidentInclude = {
  driver: {
    select: {
      id: true,
      age: true,
      bloodType: true,
      medicalConditions: true,
      user: {
        select: {
          fullName: true,
          phone: true,
          image: true,
        },
      },
      emergencyContacts: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          relationship: true,
        },
      },
    },
  },
  vehicle: true,
  obu: {
    select: {
      id: true,
      name: true,
      instNumber: true,
      status: true,
    },
  },
  sensorData: true,
  accidentResponses: {
    include: {
      paramedic: {
        select: {
          id: true,
          employeeId: true,
          user: {
            select: {
              fullName: true,
              phone: true,
              image: true,
            },
          },
        },
      },
    },
  },
};
