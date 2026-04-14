export default () => ({
  auth: {
    path: '/api/v1/auth',
    defaultPasswordPrefix: 'New#',
    login: {
      maxAttempts: 10,
      maxErrorMessage: 'reset your password',
    },
    reset: {
      maxAttempts: 10,
      maxErrorMessage: 'try again later',
    },
    rateLimit: {
      short: {
        windowMs: 1000 * 60 * 5, // 5m
        maxRequests: 100,
      },
      medium: {
        windowMs: 1000 * 60 * 15, // 15m
        maxRequests: 200,
      },
      long: {
        windowMs: 1000 * 60 * 60, // 1h
        maxRequests: 1000,
      },
    },
  },

  googleOAuth: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  },

  otp: {
    min: 100_000,
    max: 999_999,
    withoutLimitCount: 3,
    expiresInMS: 1000 * 60 * 5, // 5 minutes
    maxAttempts: 10,
    coolDown: 1000 * 60 * 15, // 15m
    maxCoolDown: 1000 * 60 * 60 * 24, // 24h
  },

  client: { baseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:8000' },
  api: {
    baseUrl:
      process.env.NODE_ENV === 'production'
        ? process.env.API_BASE_URL
        : 'http://localhost:3000',
  },

  company: { name: 'Salamti' },

  bcrypt: {
    rounds: +process.env.BCRYPT_ROUNDS!,
  },

  jwt: {
    access: {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    },
    refresh: {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      expiresInMS: +process.env.REFRESH_TOKEN_EXPIRES_IN_MS!,
    },
    verification: {
      secret: process.env.VERIFICATION_TOKEN_SECRET,
      expiresIn: process.env.VERIFICATION_TOKEN_EXPIRES_IN,
    },
    reset: {
      secret: process.env.RESET_TOKEN_SECRET,
      expiresIn: process.env.RESET_TOKEN_EXPIRES_IN,
    },
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },

  upload: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  redis: {
    username: process.env.REDIS_USERNAME,
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT!,
    password: process.env.REDIS_PASSWORD,
    attempts: 5,
    delay: 5000,
    removeOnComplete: 50,
    removeOnFail: 100,
  },

  email: {
    brevoApiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.SENDER_MAIL || process.env.SERVER_MAIL,
    supportEmail: process.env.SUPPORT_MAIL || process.env.SERVER_MAIL,
  },
});
