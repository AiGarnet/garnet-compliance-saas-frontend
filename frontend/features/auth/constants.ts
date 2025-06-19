export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  AUDITOR: 'auditor',
  VIEWER: 'viewer',
} as const;

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  REMEMBER_ME: 'remember_me',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  UNAUTHORIZED: 'Unauthorized access',
  ACCOUNT_LOCKED: 'Account locked',
  EMAIL_NOT_VERIFIED: 'Email not verified',
} as const;

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
} as const; 
