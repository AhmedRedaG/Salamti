import { Prisma } from '../../../../generated/prisma/client';

export const accidentResponseFindOneInclude: Prisma.AccidentResponseInclude = {
  accident: {
    include: {
      sensorData: true,
      vehicle: true,
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
              email: true,
              voiceCall: true,
              relationship: true,
            },
          },
        },
      },
    },
  },
  paramedic: {
    select: {
      user: {
        select: {
          fullName: true,
          phone: true,
          image: true,
        },
      },
    },
  },
};

export const accidentResponseFindAllSelect: Prisma.AccidentResponseSelect = {
  id: true,
  accidentId: true,
  responseStatus: true,
  patientStatus: true,
  dispatchedAt: true,
  arrivedAt: true,
  completedAt: true,
  paramedic: {
    select: {
      user: {
        select: {
          fullName: true,
          phone: true,
          image: true,
        },
      },
    },
  },
};
