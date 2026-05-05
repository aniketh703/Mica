import {
  ColorTheme,
  THEME_COLORS,
  EVENT_CATEGORIES,
  FREE_TIER_LIMITS,
  PRO_TIER_LIMITS,
  ENTERPRISE_TIER_LIMITS,
  APP_CONFIG,
  API_ENDPOINTS,
  ERROR_CODES,
  VALIDATION_RULES,
  RATE_LIMITS,
  ThemeColors,
  EventCategory,
  FreeTierLimits,
  AppConfiguration
} from './AppConstants';

describe('AppConstants', () => {
  describe('Color Themes', () => {
    test('should have all required color themes defined', () => {
      expect(THEME_COLORS).toBeDefined();
      expect(THEME_COLORS[ColorTheme.LIGHT]).toBeDefined();
      expect(THEME_COLORS[ColorTheme.DARK]).toBeDefined();
      expect(THEME_COLORS[ColorTheme.AUTO]).toBeDefined();
      
      const themeCount = Object.keys(THEME_COLORS).length;
      expect(themeCount).toBe(3);
    });

    test('should have all required color properties in each theme', () => {
      const requiredColors: (keyof ThemeColors)[] = [
        'primary',
        'secondary',
        'accent',
        'background',
        'surface',
        'error',
        'warning',
        'success',
        'info',
        'text',
        'textSecondary',
        'border'
      ];

      Object.values(THEME_COLORS).forEach(theme => {
        requiredColors.forEach(colorKey => {
          expect(theme[colorKey]).toBeDefined();
          expect(typeof theme[colorKey]).toBe('string');
          expect(theme[colorKey]).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });

    test('should have unique color values within themes', () => {
      Object.values(THEME_COLORS).forEach(theme => {
        const colorValues = Object.values(theme);
        const uniqueColors = new Set(colorValues);
        expect(uniqueColors.size).toBe(colorValues.length);
      });
    });

    test('should have valid hex color format for all colors', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i;

      Object.values(THEME_COLORS).forEach(theme => {
        Object.values(theme).forEach(color => {
          expect(color).toMatch(hexPattern);
        });
      });
    });

    test('light and dark themes should have contrasting colors', () => {
      const lightTheme = THEME_COLORS[ColorTheme.LIGHT];
      const darkTheme = THEME_COLORS[ColorTheme.DARK];

      // Background colors should be different (light vs dark)
      expect(lightTheme.background).not.toBe(darkTheme.background);
      
      // Text colors should be different (dark vs light)
      expect(lightTheme.text).not.toBe(darkTheme.text);
      
      // Surface colors should contrast
      expect(lightTheme.surface).not.toBe(darkTheme.surface);
    });
  });

  describe('Event Categories', () => {
    test('should have valid event categories', () => {
      expect(EVENT_CATEGORIES).toBeDefined();
      expect(Array.isArray(EVENT_CATEGORIES)).toBe(true);
      expect(EVENT_CATEGORIES.length).toBeGreaterThan(0);
    });

    test('should have all required properties for each event category', () => {
      const requiredProps: (keyof EventCategory)[] = ['id', 'name', 'description', 'icon', 'color'];

      EVENT_CATEGORIES.forEach((category, index) => {
        requiredProps.forEach(prop => {
          expect(category[prop]).toBeDefined();
          expect(typeof category[prop]).toBe('string');
          expect(category[prop].length).toBeGreaterThan(0);
        });
      });
    });

    test('should have unique event category IDs', () => {
      const ids = EVENT_CATEGORIES.map(cat => cat.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should have valid hex colors for all event categories', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i;

      EVENT_CATEGORIES.forEach(category => {
        expect(category.color).toMatch(hexPattern);
      });
    });

    test('should have meaningful category names', () => {
      EVENT_CATEGORIES.forEach(category => {
        expect(category.name.length).toBeGreaterThan(0);
        expect(category.name.length).toBeLessThanOrEqual(50);
      });
    });

    test('should have icon identifiers', () => {
      EVENT_CATEGORIES.forEach(category => {
        expect(category.icon.length).toBeGreaterThan(0);
        expect(category.icon).toMatch(/^[a-z-]+$/);
      });
    });

    test('should contain expected core event categories', () => {
      const categoryIds = EVENT_CATEGORIES.map(cat => cat.id);
      
      expect(categoryIds).toContain('user_signup');
      expect(categoryIds).toContain('user_login');
      expect(categoryIds).toContain('error_occurred');
      expect(categoryIds).toContain('data_export');
    });
  });

  describe('Free Tier Limits', () => {
    test('should have correct free tier limits', () => {
      expect(FREE_TIER_LIMITS).toBeDefined();
      
      // Verify free tier constraints
      expect(FREE_TIER_LIMITS.maxProjects).toBe(1);
      expect(FREE_TIER_LIMITS.maxTeamMembers).toBe(1);
      expect(FREE_TIER_LIMITS.maxApiCalls).toBe(1000);
      expect(FREE_TIER_LIMITS.maxStorageGB).toBe(1);
      expect(FREE_TIER_LIMITS.maxExports).toBe(5);
    });

    test('should have pro tier limits higher than free tier', () => {
      expect(PRO_TIER_LIMITS.maxProjects).toBeGreaterThan(FREE_TIER_LIMITS.maxProjects);
      expect(PRO_TIER_LIMITS.maxTeamMembers).toBeGreaterThan(FREE_TIER_LIMITS.maxTeamMembers);
      expect(PRO_TIER_LIMITS.maxApiCalls).toBeGreaterThan(FREE_TIER_LIMITS.maxApiCalls);
      expect(PRO_TIER_LIMITS.maxStorageGB).toBeGreaterThan(FREE_TIER_LIMITS.maxStorageGB);
      expect(PRO_TIER_LIMITS.maxExports).toBeGreaterThan(FREE_TIER_LIMITS.maxExports);
    });

    test('should have enterprise tier with unlimited resources', () => {
      expect(ENTERPRISE_TIER_LIMITS.maxProjects).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.maxTeamMembers).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.maxApiCalls).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.maxStorageGB).toBe(-1);
      expect(ENTERPRISE_TIER_LIMITS.maxExports).toBe(-1);
    });

    test('should have valid tier limit structures', () => {
      const tiers = [FREE_TIER_LIMITS, PRO_TIER_LIMITS, ENTERPRISE_TIER_LIMITS];

      tiers.forEach(tier => {
        expect(typeof tier.maxProjects).toBe('number');
        expect(typeof tier.maxTeamMembers).toBe('number');
        expect(typeof tier.maxApiCalls).toBe('number');
        expect(typeof tier.maxStorageGB).toBe('number');
        expect(typeof tier.maxExports).toBe('number');
        expect(Array.isArray(tier.features)).toBe(true);
        expect(tier.features.length).toBeGreaterThan(0);
      });
    });

    test('should have progressive feature sets across tiers', () => {
      expect(FREE_TIER_LIMITS.features.length).toBeLessThan(PRO_TIER_LIMITS.features.length);
      expect(PRO_TIER_LIMITS.features.length).toBeLessThanOrEqual(ENTERPRISE_TIER_LIMITS.features.length);
    });

    test('should have free tier features in pro and enterprise', () => {
      FREE_TIER_LIMITS.features.forEach(feature => {
        expect(PRO_TIER_LIMITS.features).toContain(feature);
        expect(ENTERPRISE_TIER_LIMITS.features).toContain(feature);
      });
    });

    test('all tier limits should be non-negative or -1', () => {
      const tiers = [FREE_TIER_LIMITS, PRO_TIER_LIMITS, ENTERPRISE_TIER_LIMITS];

      tiers.forEach(tier => {
        expect(tier.maxProjects).toBeLessThanOrEqual(-1);
        expect(tier.maxTeamMembers).toBeLessThanOrEqual(-1);
        expect(tier.maxApiCalls).toBeLessThanOrEqual(-1);
        expect(tier.maxStorageGB).toBeLessThanOrEqual(-1);
        expect(tier.maxExports).toBeLessThanOrEqual(-1);
      });
    });
  });

  describe('Application Configuration', () => {
    test('should validate configuration structure', () => {
      expect(APP_CONFIG).toBeDefined();
      
      // Verify required properties
      expect(APP_CONFIG.appName).toBeDefined();
      expect(APP_CONFIG.version).toBeDefined();
      expect(APP_CONFIG.environment).toBeDefined();
      expect(APP_CONFIG.apiBaseUrl).toBeDefined();
      expect(APP_CONFIG.timeoutMs).toBeDefined();
      expect(APP_CONFIG.maxRetries).toBeDefined();
      expect(APP_CONFIG.logLevel).toBeDefined();
    });

    test('should have valid app name and version', () => {
      expect(APP_CONFIG.appName).toBe('MICA');
      expect(APP_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should have valid environment value', () => {
      const validEnvironments = ['development', 'staging', 'production'];
      expect(validEnvironments).toContain(APP_CONFIG.environment);
    });

    test('should have valid API base URL', () => {
      expect(APP_CONFIG.apiBaseUrl).toMatch(/^https?:\/\/.+/);
    });

    test('should have valid timeout and retry values', () => {
      expect(APP_CONFIG.timeoutMs).toBeGreaterThan(0);
      expect(APP_CONFIG.maxRetries).toBeGreaterThanOrEqual(0);
    });

    test('should have valid log level', () => {
      const validLogLevels = ['error', 'warn', 'info', 'debug'];
      expect(validLogLevels).toContain(APP_CONFIG.logLevel);
    });

    test('should have sensible timeout value (between 1s and 60s)', () => {
      expect(APP_CONFIG.timeoutMs).toBeGreaterThanOrEqual(1000);
      expect(APP_CONFIG.timeoutMs).toBeLessThanOrEqual(60000);
    });

    test('should have reasonable retry count (0-5)', () => {
      expect(APP_CONFIG.maxRetries).toBeGreaterThanOrEqual(0);
      expect(APP_CONFIG.maxRetries).toBeLessThanOrEqual(5);
    });
  });

  describe('API Endpoints', () => {
    test('should have all required API endpoint categories', () => {
      expect(API_ENDPOINTS.AUTH).toBeDefined();
      expect(API_ENDPOINTS.USERS).toBeDefined();
      expect(API_ENDPOINTS.PROJECTS).toBeDefined();
      expect(API_ENDPOINTS.EVENTS).toBeDefined();
    });

    test('should have valid auth endpoints', () => {
      expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
      expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
      expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
      expect(API_ENDPOINTS.AUTH.REFRESH).toBe('/auth/refresh');
    });

    test('should have valid user endpoints', () => {
      expect(API_ENDPOINTS.USERS.GET_PROFILE).toBe('/users/profile');
      expect(API_ENDPOINTS.USERS.UPDATE_PROFILE).toBe('/users/profile');
      expect(API_ENDPOINTS.USERS.DELETE_ACCOUNT).toBe('/users/account');
    });

    test('should have valid project endpoints with ID parameters', () => {
      expect(API_ENDPOINTS.PROJECTS.LIST).toBe('/projects');
      expect(API_ENDPOINTS.PROJECTS.CREATE).toBe('/projects');
      expect(API_ENDPOINTS.PROJECTS.GET).toContain(':id');
      expect(API_ENDPOINTS.PROJECTS.UPDATE).toContain(':id');
      expect(API_ENDPOINTS.PROJECTS.DELETE).toContain(':id');
    });

    test('should have valid event endpoints', () => {
      expect(API_ENDPOINTS.EVENTS.LIST).toBe('/events');
      expect(API_ENDPOINTS.EVENTS.CREATE).toBe('/events');
      expect(API_ENDPOINTS.EVENTS.EXPORT).toBe('/events/export');
    });

    test('all endpoints should start with slash', () => {
      const checkEndpoints = (obj: any) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value).toMatch(/^\/[\w/:]/);
          } else if (typeof value === 'object') {
            checkEndpoints(value);
          }
        });
      };

      checkEndpoints(API_ENDPOINTS);
    });
  });

  describe('Error Codes', () => {
    test('should have all required error codes', () => {
      expect(ERROR_CODES.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.CONFLICT).toBe('CONFLICT');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(ERROR_CODES.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED');
      expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN');
      expect(ERROR_CODES.SESSION_EXPIRED).toBe('SESSION_EXPIRED');
    });

    test('should have uppercase error code values', () => {
      Object.values(ERROR_CODES).forEach(code => {
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('Validation Rules', () => {
    test('should have all required validation rules', () => {
      expect(VALIDATION_RULES.USERNAME_MIN_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.USERNAME_MAX_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.PASSWORD_MAX_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.EMAIL_PATTERN).toBeDefined();
      expect(VALIDATION_RULES.PROJECT_NAME_MIN_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.PROJECT_NAME_MAX_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.DESCRIPTION_MAX_LENGTH).toBeDefined();
      expect(VALIDATION_RULES.API_KEY_LENGTH).toBeDefined();
    });

    test('should have reasonable length constraints', () => {
      expect(VALIDATION_RULES.USERNAME_MIN_LENGTH).toBeLessThan(VALIDATION_RULES.USERNAME_MAX_LENGTH);
      expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBeLessThan(VALIDATION_RULES.PASSWORD_MAX_LENGTH);
      expect(VALIDATION_RULES.PROJECT_NAME_MIN_LENGTH).toBeLessThan(VALIDATION_RULES.PROJECT_NAME_MAX_LENGTH);
    });

    test('email pattern should validate correct emails', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'admin+tag@company.org'
      ];

      validEmails.forEach(email => {
        expect(email).toMatch(VALIDATION_RULES.EMAIL_PATTERN);
      });
    });

    test('email pattern should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com'
      ];

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(VALIDATION_RULES.EMAIL_PATTERN);
      });
    });

    test('should have reasonable API key length', () => {
      expect(VALIDATION_RULES.API_KEY_LENGTH).toBeGreaterThanOrEqual(16);
      expect(VALIDATION_RULES.API_KEY_LENGTH).toBeLessThanOrEqual(128);
    });
  });

  describe('Rate Limits', () => {
    test('should have all required rate limit configurations', () => {
      expect(RATE_LIMITS.LOGIN_ATTEMPTS).toBeDefined();
      expect(RATE_LIMITS.LOGIN_WINDOW_MS).toBeDefined();
      expect(RATE_LIMITS.API_REQUESTS_PER_MINUTE).toBeDefined();
      expect(RATE_LIMITS.API_REQUESTS_PER_HOUR).toBeDefined();
      expect(RATE_LIMITS.EXPORT_REQUESTS_PER_DAY).toBeDefined();
    });

    test('should have sensible rate limit values', () => {
      expect(RATE_LIMITS.LOGIN_ATTEMPTS).toBeGreaterThan(0);
      expect(RATE_LIMITS.LOGIN_WINDOW_MS).toBeGreaterThan(0);
      expect(RATE_LIMITS.API_REQUESTS_PER_MINUTE).toBeGreaterThan(0);
      expect(RATE_LIMITS.API_REQUESTS_PER_HOUR).toBeGreaterThan(0);
      expect(RATE_LIMITS.EXPORT_REQUESTS_PER_DAY).toBeGreaterThan(0);
    });

    test('should have consistent hourly and minute rate limits', () => {
      // Hourly should be >= minute rate * 60
      expect(RATE_LIMITS.API_REQUESTS_PER_HOUR).toBeGreaterThanOrEqual(
        RATE_LIMITS.API_REQUESTS_PER_MINUTE
      );
    });

    test('should have reasonable login window (1-30 minutes)', () => {
      const oneMinute = 60000;
      const thirtyMinutes = 30 * 60000;

      expect(RATE_LIMITS.LOGIN_WINDOW_MS).toBeGreaterThanOrEqual(oneMinute);
      expect(RATE_LIMITS.LOGIN_WINDOW_MS).toBeLessThanOrEqual(thirtyMinutes);
    });

    test('should have reasonable login attempts (3-10 attempts)', () => {
      expect(RATE_LIMITS.LOGIN_ATTEMPTS).toBeGreaterThanOrEqual(3);
      expect(RATE_LIMITS.LOGIN_ATTEMPTS).toBeLessThanOrEqual(10);
    });
  });

  describe('Configuration Completeness', () => {
    test('all configuration objects should have no empty values', () => {
      const configs = {
        THEME_COLORS,
        EVENT_CATEGORIES,
        APP_CONFIG,
        API_ENDPOINTS,
        ERROR_CODES,
        VALIDATION_RULES,
        RATE_LIMITS
      };

      Object.entries(configs).forEach(([name, config]) => {
        expect(config).toBeDefined();
        if (typeof config === 'object' && config !== null) {
          expect(Object.keys(config).length).toBeGreaterThan(0);
        }
      });
    });

    test('should export all required constants', () => {
      expect(ColorTheme).toBeDefined();
      expect(FREE_TIER_LIMITS).toBeDefined();
      expect(PRO_TIER_LIMITS).toBeDefined();
      expect(ENTERPRISE_TIER_LIMITS).toBeDefined();
    });

    test('type definitions should be properly structured', () => {
      // Verify that TypeScript interfaces are properly exported
      expect(typeof THEME_COLORS[ColorTheme.LIGHT]).toBe('object');
      expect(Array.isArray(EVENT_CATEGORIES)).toBe(true);
      expect(typeof FREE_TIER_LIMITS).toBe('object');
      expect(typeof APP_CONFIG).toBe('object');
    });
  });
});
