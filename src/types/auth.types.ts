import { CurrentRoles, Platform } from '../../generated/prisma/enums';
import {
  AuthRegisterDriverDto,
  AuthRegisterParamedicDto,
  GoogleRegisterDriverDto,
  GoogleRegisterParamedicDto,
} from '../modules/auth/dto/register.dto';

export enum AuthAttemptTypes {
  LOGIN = 'login',
  RESET = 'reset',
}

export interface JwtPayload {
  sub: string;
  ur?: CurrentRoles;
  did?: string;
}

export enum JwtTypes {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET = 'reset',
  VERIFICATION = 'verification',
}

export interface UserSessionPayload {
  userId: string;
  refreshToken: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceToken?: string;
  platform?: Platform;
  language?: string;
}

export type CreateUserRegisterType =
  | AuthRegisterDriverDto
  | AuthRegisterParamedicDto;

export type CreateUserGoogleRegisterType =
  | GoogleRegisterDriverDto
  | GoogleRegisterParamedicDto;
