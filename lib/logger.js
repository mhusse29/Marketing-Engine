/**
 * Logging utilities for Vercel functions
 * Logs go to Vercel's logging system
 */

export const logger = {
  log(level, message, context = {}) {
    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    console.log(JSON.stringify(payload));
  },
  
  info(message, context) {
    this.log('info', message, context);
  },
  
  warn(message, context) {
    this.log('warn', message, context);
  },
  
  error(message, context) {
    this.log('error', message, context);
  },
};
