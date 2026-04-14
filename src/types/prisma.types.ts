import { PrismaClient } from '@prisma/client/extension';

export type PrismaTransactionClient = Omit<
  PrismaClient,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$use'
  | '$queryRaw'
  | '$executeRaw'
>;
