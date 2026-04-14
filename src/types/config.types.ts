export interface OtpConfig {
  min: number;
  max: number;
  withoutLimitCount: number;
  expiresInMS: number;
  maxAttempts: number;
  coolDown: number;
  maxCoolDown: number;
}

export interface AuthAttemptConfig {
  maxAttempts: number;
  maxErrorMessage: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: number;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}
