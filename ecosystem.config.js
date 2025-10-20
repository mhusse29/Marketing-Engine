/**
 * PM2 Process Manager Configuration
 * 
 * This file manages all SINAIQ services independently
 * Each service runs in its own process with auto-restart
 * 
 * Usage:
 *   pm2 start ecosystem.config.js     # Start all services
 *   pm2 status                         # Check status
 *   pm2 logs                           # View logs
 *   pm2 restart analytics-dashboard    # Restart one service
 *   pm2 stop all                       # Stop all
 *   pm2 delete all                     # Remove all
 */

module.exports = {
  apps: [
    {
      name: 'marketing-engine',
      script: 'npm',
      args: 'run web:dev',
      cwd: '/Users/mohamedhussein/Desktop/Marketing Engine',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      error_file: './logs/marketing-engine-error.log',
      out_file: './logs/marketing-engine-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        PORT: 5173
      }
    },
    {
      name: 'analytics-dashboard',
      script: 'npm',
      args: 'run analytics:dev',
      cwd: '/Users/mohamedhussein/Desktop/Marketing Engine',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      error_file: './logs/analytics-dashboard-error.log',
      out_file: './logs/analytics-dashboard-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        PORT: 5176
      }
    },
    {
      name: 'analytics-gateway',
      script: 'npm',
      args: 'run gateway:dev',
      cwd: '/Users/mohamedhussein/Desktop/Marketing Engine',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      error_file: './logs/analytics-gateway-error.log',
      out_file: './logs/analytics-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        ANALYTICS_GATEWAY_PORT: 8788
      }
    },
    {
      name: 'ai-gateway',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/mohamedhussein/Desktop/Marketing Engine',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      error_file: './logs/ai-gateway-error.log',
      out_file: './logs/ai-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        PORT: 8787
      }
    }
  ]
};
