/**
 * Application Constants and Configuration
 * Centralized configuration for themes, limits, categories, and app settings
 */

export enum ColorTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface EventCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface FreeTierLimits {
  maxProjects: number;
  maxTeamMembers: number;
  maxApiCalls: number;
  maxStorageGB: number;
  maxExports: number;
  features: string[];
}

export interface AppConfiguration {
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export const THEME_COLORS: Record<ColorTheme, ThemeColors> = {
  [ColorTheme.LIGHT]: {
    primary: '#2563EB',
    secondary: '#64748B',
    accent: '#EC4899',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    error: '#DC2626',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#0EA5E9',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0'
  },
  [ColorTheme.DARK]: {
    primary: '#60A5FA',
    secondary: '#94A3B8',
    accent: '#F472B6',
    background: '#0F172A',
    surface: '#1E293B',
    error: '#EF4444',
    warning: '#FBBF24',
    success: '#4ADE80',
    info: '#38BDF8',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    border: '#334155'
  },
  [ColorTheme.AUTO]: {
    primary: '#2563EB',
    secondary: '#64748B',
    accent: '#EC4899',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    error: '#DC2626',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#0EA5E9',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0'
  }
};

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'user_signup',
    name: 'User Signup',
    description: 'User registration event',
    icon: 'user-plus',
    color: '#10B981'
  },
  {
    id: 'user_login',
    name: 'User Login',
    description: 'User login event',
    icon: 'login',
    color: '#0EA5E9'
  },
  {
    id: 'user_logout',
    name: 'User Logout',
    description: 'User logout event',
    icon: 'logout',
    color: '#64748B'
  },
  {
    id: 'data_export',
    name: 'Data Export',
    description: 'User data export event',
    icon: 'download',
    color: '#F59E0B'
  },
  {
    id: 'data_import',
    name: 'Data Import',
    description: 'User data import event',
    icon: 'upload',
    color: '#8B5CF6'
  },
  {
    id: 'error_occurred',
    name: 'Error',
    description: 'System error event',
    icon: 'alert-circle',
    color: '#DC2626'
  },
  {
    id: 'payment_processed',
    name: 'Payment',
    description: 'Payment processing event',
    icon: 'credit-card',
    color: '#EC4899'
  },
  {
    id: 'settings_changed',
    name: 'Settings Update',
    description: 'User settings changed',
    icon: 'settings',
    color: '#6366F1'
  }
];

export const FREE_TIER_LIMITS: FreeTierLimits = {
  maxProjects: 1,
  maxTeamMembers: 1,
  maxApiCalls: 1000,
  maxStorageGB: 1,
  maxExports: 5,
  features: [
    'basic_dashboard',
    'read_only_access',
    'community_support',
    'basic_analytics'
  ]
};

export const PRO_TIER_LIMITS: FreeTierLimits = {
  maxProjects: 10,
  maxTeamMembers: 5,
  maxApiCalls: 100000,
  maxStorageGB: 100,
  maxExports: 500,
  features: [
    'advanced_dashboard',
    'read_write_access',
    'priority_support',
    'advanced_analytics',
    'api_access',
    'custom_integrations'
  ]
};

export const ENTERPRISE_TIER_LIMITS: FreeTierLimits = {
  maxProjects: -1, // Unlimited
  maxTeamMembers: -1, // Unlimited
  maxApiCalls: -1, // Unlimited
  maxStorageGB: -1, // Unlimited
  maxExports: -1, // Unlimited
  features: [
    'full_dashboard',
    'full_access',
    'dedicated_support',
    'enterprise_analytics',
    'api_access',
    'custom_integrations',
    'sso',
    'audit_logs',
    'custom_branding',
    'compliance_tools'
  ]
};

export const APP_CONFIG: AppConfiguration = {
  appName: 'MICA',
  version: '1.0.0',
  environment: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.mica.app',
  timeoutMs: 30000,
  maxRetries: 3,
  logLevel: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh'
  },
  USERS: {
    GET_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    DELETE_ACCOUNT: '/users/account'
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: '/projects/:id',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id'
  },
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    EXPORT: '/events/export'
  }
};

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
};

export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PROJECT_NAME_MIN_LENGTH: 1,
  PROJECT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  API_KEY_LENGTH: 32
};

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 900000, // 15 minutes
  API_REQUESTS_PER_MINUTE: 60,
  API_REQUESTS_PER_HOUR: 1000,
  EXPORT_REQUESTS_PER_DAY: 10
};
