// Direct gateway starter - bypasses import.meta check
import { startServer, logger } from './server/analyticsGateway.mjs';

console.log('Starting analytics gateway...');

startServer().catch((error) => {
  logger.error('gateway_start_failed', { error: error.message });
  console.error('Failed to start gateway:', error);
  process.exit(1);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nShutting down gateway...');
  process.exit(0);
});
