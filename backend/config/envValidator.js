/**
 * Environment Variable Validator
 * Validates required and optional environment variables
 */

const { logger } = require('../middleware/errorHandler');
class EnvironmentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

class EnvValidator {
  constructor() {
    this.requiredVars = this.getRequiredVars();
    this.optionalVars = this.getOptionalVars();
  }

  getRequiredVars() {
    return [
      {
        name: 'NODE_ENV',
        description: 'Application environment (development/production)',
        validator: (value) => ['development', 'production', 'test'].includes(value),
        defaultValue: 'development'
      },
      {
        name: 'PORT',
        description: 'Server port number',
        validator: (value) => !isNaN(value) && value > 0 && value < 65536,
        defaultValue: '3001'
      },
      {
        name: 'JWT_ACCESS_SECRET',
        description: 'JWT access token secret (min 32 characters)',
        validator: (value) => typeof value === 'string' && value.length >= 32,
        errorMessage: 'JWT_ACCESS_SECRET must be at least 32 characters long'
      },
      {
        name: 'JWT_REFRESH_SECRET',
        description: 'JWT refresh token secret (min 32 characters)',
        validator: (value) => typeof value === 'string' && value.length >= 32,
        errorMessage: 'JWT_REFRESH_SECRET must be at least 32 characters long'
      },
      {
        name: 'MONGODB_URI',
        description: 'MongoDB connection string',
        validator: (value) => typeof value === 'string' && value.length > 0,
        defaultValue: 'mongodb://localhost:27017/social-media-automation'
      }
    ];
  }

  getOptionalVars() {
    return [
      {
        name: 'TZ',
        description: 'Timezone for the application',
        defaultValue: 'UTC'
      },
      {
        name: 'LOG_LEVEL',
        description: 'Logging level',
        defaultValue: 'info'
      },
      {
        name: 'LOG_FORMAT',
        description: 'Log format',
        defaultValue: 'json'
      },
      {
        name: 'FRONTEND_URL',
        description: 'Frontend application URL',
        defaultValue: 'http://localhost:3000'
      },
      {
        name: 'JWT_ACCESS_EXPIRY',
        description: 'JWT access token expiry',
        defaultValue: '15m'
      },
      {
        name: 'JWT_REFRESH_EXPIRY',
        description: 'JWT refresh token expiry',
        defaultValue: '7d'
      },
      {
        name: 'BCRYPT_ROUNDS',
        description: 'Bcrypt hashing rounds',
        defaultValue: '12'
      },
      {
        name: 'RATE_LIMIT_WINDOW_MS',
        description: 'Rate limiting window duration',
        defaultValue: '900000'
      },
      {
        name: 'RATE_LIMIT_MAX_REQUESTS',
        description: 'Maximum requests per window',
        defaultValue: '100'
      },
      {
        name: 'SCHEDULER_ENABLED',
        description: 'Enable scheduler service',
        defaultValue: 'true'
      },
      {
        name: 'SCHEDULER_CONCURRENCY_LIMIT',
        description: 'Maximum concurrent scheduler jobs',
        defaultValue: '5'
      },
      {
        name: 'SCHEDULER_TIMEZONE',
        description: 'Scheduler timezone',
        defaultValue: 'UTC'
      }
    ];
  }

  validateProductionSecurity() {
    const errors = [];

    // Check for default secrets
    const defaultSecrets = [
      'your-super-secret-access-key-change-this-in-production-min-32-chars',
      'your-super-secret-refresh-key-change-this-in-production-min-32-chars',
      'your-session-secret-change-this-in-production'
    ];

    if (defaultSecrets.includes(process.env.JWT_ACCESS_SECRET)) {
      errors.push('JWT_ACCESS_SECRET is using default value - change it in production!');
    }

    if (defaultSecrets.includes(process.env.JWT_REFRESH_SECRET)) {
      errors.push('JWT_REFRESH_SECRET is using default value - change it in production!');
    }

    if (process.env.JWT_ACCESS_SECRET.length < 64) {
      errors.push('JWT_ACCESS_SECRET should be at least 64 characters in production');
    }

    if (process.env.JWT_REFRESH_SECRET.length < 64) {
      errors.push('JWT_REFRESH_SECRET should be at least 64 characters in production');
    }

    // Check for development URLs
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
      errors.push('FRONTEND_URL should not be localhost in production');
    }

    // Check for weak bcrypt rounds
    if (parseInt(process.env.BCRYPT_ROUNDS) < 12) {
      errors.push('BCRYPT_ROUNDS should be at least 12 in production');
    }

    return errors;
  }

  validateEnvironment() {
    const errors = [];
    const warnings = [];
    const missingVars = [];
    const invalidVars = [];

    logger.info('🔍 Validating environment variables...');

    // Check for required environment variables
    for (const config of this.requiredVars) {
      const envName = config.name;
      const value = process.env[envName];
      
      if (!value && !config.optional) {
        missingVars.push({
          variable: config.name,
          description: config.description,
          critical: config.critical
        });
      }
      
      if (value && config.validator && !config.validator(value)) {
        invalidVars.push({
          variable: config.name,
          value: value,
          description: config.description,
          issue: config.issue || 'Invalid format'
        });
      }
    }

    // Validate optional variables and set defaults
    for (const variable of this.optionalVars) {
      const envName = variable.name;
      const value = process.env[envName];

      if (!value) {
        if (variable.defaultValue) {
          process.env[variable.name] = variable.defaultValue;
          warnings.push(`Using default value for ${variable.name}: ${variable.defaultValue}`);
        }
        continue;
      }

      if (variable.validator && !variable.validator(value)) {
        const message = variable.errorMessage || `Invalid value for ${variable.name}: ${value}`;
        warnings.push(message);
      }
    }

    // Security checks for production
    if (process.env.NODE_ENV === 'production') {
      const securityErrors = this.validateProductionSecurity();
      errors.push(...securityErrors);
    }

    // Log validation results
    if (errors.length > 0) {
      logger.error('Environment validation failed', new Error('Validation failed'), { errors });
      process.exit(1);
    }

    if (warnings.length > 0) {
      logger.warn('Environment warnings', { warnings });
    }

    if (errors.length === 0 && warnings.length === 0) {
      logger.info('Environment validation passed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getConfig() {
    return {
      env: process.env.NODE_ENV,
      port: parseInt(process.env.PORT),
      frontendUrl: process.env.FRONTEND_URL,
      mongodb: {
        uri: process.env.MONGODB_URI
      },
      jwt: {
        accessExpiry: process.env.JWT_ACCESS_EXPIRY,
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY
      },
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS)
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
      },
      scheduler: {
        enabled: process.env.SCHEDULER_ENABLED === 'true',
        concurrencyLimit: parseInt(process.env.SCHEDULER_CONCURRENCY_LIMIT),
        timezone: process.env.SCHEDULER_TIMEZONE
      },
      logging: {
        level: process.env.LOG_LEVEL,
        format: process.env.LOG_FORMAT || 'json'
      }
    };
  }
}

// Singleton instance
const envValidator = new EnvValidator();

module.exports = {
  envValidator,
  EnvironmentValidationError
};
